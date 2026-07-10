const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const User = require('../models/User');
const Payment = require('../models/Payment');
const ApiError = require('../utils/ApiError');
const orderService = require('./order.service');
const notificationService = require('./notification.service');
const { parsePagination, buildMeta } = require('../utils/pagination');
const { estimateDeliveryWindow } = require('../utils/geo');

/**
 * Recomputes the estimated delivery window from wherever the rider
 * currently is to the delivery address, if both are known. Called after
 * every location update and every in-flight status change, so the ETA
 * only ever reflects the rider's most recent known position.
 */
async function refreshEta(delivery) {
  const { lat, lng } = delivery.currentLocation || {};
  const destination = delivery.address;
  if (lat == null || lng == null || destination?.lat == null || destination?.lng == null) {
    return;
  }

  const { start, end } = estimateDeliveryWindow({ lat, lng }, { lat: destination.lat, lng: destination.lng });
  delivery.estimatedDeliveryStart = start;
  delivery.estimatedDeliveryEnd = end;
}

const RIDER_POPULATE = { path: 'rider', select: 'name phone' };

/**
 * Rider- and tracking-facing delivery responses need enough order context
 * (order number, total, customer contact) to be useful on their own,
 * without the client having to separately call `GET /orders/:id` — which
 * a rider isn't authorized to do, since order-level access control never
 * considered the delivery assignment (only owner/pharmacist/admin).
 * Populating it here instead keeps the delivery's own `assertCanAccess`
 * as the single authorization boundary for this data. Works on both
 * Query and Document `.populate()`, which both accept this array form.
 */
const ORDER_POPULATE = {
  path: 'order',
  select: 'orderNumber total paymentMethod status user items',
  populate: { path: 'user', select: 'name phone' },
};
const FULL_POPULATE = [RIDER_POPULATE, ORDER_POPULATE];

const RIDER_TRANSITIONS = {
  pending: ['assigned', 'cancelled'],
  assigned: ['picked_up', 'cancelled'],
  picked_up: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
};

/** Works whether `delivery.rider` is a bare ObjectId or a populated document. */
function riderIdOf(delivery) {
  if (!delivery.rider) return null;
  return delivery.rider._id ? delivery.rider._id : delivery.rider;
}

function assertCanAccess(delivery, order, actingUser) {
  if (actingUser.role === 'admin') return;
  const riderId = riderIdOf(delivery);
  if (riderId && String(riderId) === String(actingUser._id)) return;
  if (order && orderService.userCanAccessOrder(order, actingUser)) return;
  throw ApiError.forbidden('You do not have permission to view this delivery');
}

async function getById(id, actingUser) {
  const delivery = await Delivery.findById(id).populate(FULL_POPULATE);
  if (!delivery) {
    throw ApiError.notFound('Delivery not found');
  }
  assertCanAccess(delivery, delivery.order, actingUser);
  return delivery;
}

async function getByOrderId(orderId, actingUser) {
  const delivery = await Delivery.findOne({ order: orderId }).populate(FULL_POPULATE);
  if (delivery) {
    assertCanAccess(delivery, delivery.order, actingUser);
    return delivery;
  }

  // No delivery record yet — fall back to the order itself so a caller who
  // can see the order gets a clear 404 (delivery not created yet) rather
  // than a misleading 403.
  const order = await Order.findById(orderId);
  if (!order) {
    throw ApiError.notFound('Order not found');
  }
  if (!orderService.userCanAccessOrder(order, actingUser)) {
    throw ApiError.forbidden('You do not have permission to view this delivery');
  }
  throw ApiError.notFound('Delivery not found for this order');
}

async function list(actingUser, query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (actingUser.role === 'rider') {
    filter.rider = actingUser._id;
  }
  if (query.status) {
    filter.status = query.status;
  }

  const [items, total] = await Promise.all([
    Delivery.find(filter)
      .populate(FULL_POPULATE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Delivery.countDocuments(filter),
  ]);

  return { items, meta: buildMeta({ page, limit, total }) };
}

async function assignRider(id, riderId) {
  const delivery = await Delivery.findById(id);
  if (!delivery) {
    throw ApiError.notFound('Delivery not found');
  }
  if (['delivered', 'cancelled'].includes(delivery.status)) {
    throw ApiError.badRequest(`Cannot assign a rider to a delivery in status "${delivery.status}"`);
  }

  const rider = await User.findById(riderId);
  if (!rider || rider.role !== 'rider' || !rider.isActive) {
    throw ApiError.badRequest('Invalid or inactive rider');
  }

  delivery.rider = rider._id;
  delivery.status = 'assigned';
  delivery.statusHistory.push({ status: 'assigned' });
  await delivery.save();
  await delivery.populate(FULL_POPULATE);

  await notificationService.notifyDeliveryStatus(delivery.order, delivery, 'assigned');
  await notificationService.notifyRiderAssigned(rider, delivery.order, delivery);

  return delivery;
}

async function updateStatus(id, targetStatus, actingUser) {
  const delivery = await Delivery.findById(id);
  if (!delivery) {
    throw ApiError.notFound('Delivery not found');
  }
  if (actingUser.role !== 'admin' && String(delivery.rider) !== String(actingUser._id)) {
    throw ApiError.forbidden('You do not have permission to update this delivery');
  }

  const allowed = RIDER_TRANSITIONS[delivery.status] || [];
  if (!allowed.includes(targetStatus)) {
    throw ApiError.badRequest(
      `Cannot transition delivery from "${delivery.status}" to "${targetStatus}"`,
    );
  }

  delivery.status = targetStatus;
  delivery.statusHistory.push({ status: targetStatus });

  if (targetStatus === 'picked_up' || targetStatus === 'in_transit') {
    await orderService.markOutForDelivery(delivery.order);
    await refreshEta(delivery);
  }

  if (targetStatus === 'delivered') {
    delivery.deliveredAt = new Date();
    delivery.estimatedDeliveryStart = null;
    delivery.estimatedDeliveryEnd = null;
    await orderService.markDelivered(delivery.order);

    const payment = await Payment.findOne({ order: delivery.order });
    if (payment && payment.method === 'cod' && payment.status !== 'completed') {
      payment.status = 'completed';
      payment.paidAt = new Date();
      await payment.save();
    }
  }

  await delivery.save();
  await delivery.populate(FULL_POPULATE);

  await notificationService.notifyDeliveryStatus(delivery.order, delivery, targetStatus);

  return delivery;
}

async function updateLocation(id, { lat, lng }, actingUser) {
  const delivery = await Delivery.findById(id);
  if (!delivery) {
    throw ApiError.notFound('Delivery not found');
  }
  if (actingUser.role !== 'admin' && String(delivery.rider) !== String(actingUser._id)) {
    throw ApiError.forbidden('You do not have permission to update this delivery');
  }

  delivery.currentLocation = { lat, lng, updatedAt: new Date() };
  if (['picked_up', 'in_transit'].includes(delivery.status)) {
    await refreshEta(delivery);
  }
  await delivery.save();
  await delivery.populate(FULL_POPULATE);
  return delivery;
}

module.exports = { getById, getByOrderId, list, assignRider, updateStatus, updateLocation };
