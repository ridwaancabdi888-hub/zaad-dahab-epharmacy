const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildMeta } = require('../utils/pagination');

/**
 * In-app notifications only — there is no Firebase project configured in
 * this environment, so real push delivery (FCM) is out of scope here.
 * This is still a fully real, persisted notification the client polls
 * for via `/notifications/me`, not a stand-in.
 */

const DELIVERY_STATUS_MESSAGES = {
  assigned: (orderNumber) => ({
    title: 'Rider assigned',
    message: `A rider has been assigned to order #${orderNumber} and will pick it up soon.`,
  }),
  picked_up: (orderNumber) => ({
    title: 'Order picked up',
    message: `Order #${orderNumber} has been picked up and is on its way to being delivered.`,
  }),
  in_transit: (orderNumber) => ({
    title: 'Order on the way',
    message: `Order #${orderNumber} is on its way to you.`,
  }),
  delivered: (orderNumber) => ({
    title: 'Order delivered',
    message: `Order #${orderNumber} has been delivered. Enjoy!`,
  }),
  cancelled: (orderNumber) => ({
    title: 'Delivery cancelled',
    message: `Delivery for order #${orderNumber} was cancelled.`,
  }),
};

async function notifyDeliveryStatus(order, delivery, status) {
  const build = DELIVERY_STATUS_MESSAGES[status];
  if (!order || !build) return null;

  const { title, message } = build(order.orderNumber);
  return Notification.create({
    user: order.user,
    order: order._id,
    delivery: delivery._id,
    type: 'delivery_status',
    title,
    message,
  });
}

/**
 * Alerts the assigned rider directly — separate from `notifyDeliveryStatus`,
 * which only ever notifies the customer. Without this, a rider had no way
 * to learn about a new assignment short of manually refreshing their
 * Active Deliveries list. Bakes the customer name and delivery address
 * into the message itself so the alert is useful without tapping through.
 */
async function notifyRiderAssigned(rider, order, delivery) {
  if (!rider || !order) return null;

  const customerName = order.user?.name || 'the customer';
  const address = delivery.address;
  const addressLine = address ? `${address.street}, ${address.city}` : 'the delivery address';

  return Notification.create({
    user: rider._id,
    order: order._id,
    delivery: delivery._id,
    type: 'rider_assigned',
    title: 'New delivery assigned',
    message: `Pick up order #${order.orderNumber} for ${customerName} — deliver to ${addressLine}.`,
  });
}

async function notifyOrderCancelled(order) {
  if (!order) return null;
  return Notification.create({
    user: order.user,
    order: order._id,
    type: 'order_cancelled',
    title: 'Order cancelled',
    message: `Order #${order.orderNumber} has been cancelled.`,
  });
}

async function listMine(userId, query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { user: userId };
  if (query.isRead !== undefined) filter.isRead = query.isRead;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);

  return { items, meta: buildMeta({ page, limit, total }), unreadCount };
}

async function unreadCount(userId) {
  return Notification.countDocuments({ user: userId, isRead: false });
}

async function markRead(id, userId) {
  const notification = await Notification.findById(id);
  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }
  if (String(notification.user) !== String(userId)) {
    throw ApiError.forbidden('You do not have permission to access this notification');
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }
  return notification;
}

async function markAllRead(userId) {
  await Notification.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() },
  );
}

module.exports = {
  notifyDeliveryStatus,
  notifyRiderAssigned,
  notifyOrderCancelled,
  listMine,
  unreadCount,
  markRead,
  markAllRead,
};
