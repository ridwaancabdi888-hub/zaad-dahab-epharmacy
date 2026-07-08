const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const User = require('../models/User');
const Payment = require('../models/Payment');
const ApiError = require('../utils/ApiError');
const orderService = require('./order.service');
const { parsePagination, buildMeta } = require('../utils/pagination');

const RIDER_TRANSITIONS = {
  pending: ['assigned', 'cancelled'],
  assigned: ['picked_up', 'cancelled'],
  picked_up: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
};

function assertCanAccess(delivery, order, actingUser) {
  if (actingUser.role === 'admin') return;
  if (delivery.rider && String(delivery.rider) === String(actingUser._id)) return;
  if (order && orderService.userCanAccessOrder(order, actingUser)) return;
  throw ApiError.forbidden('You do not have permission to view this delivery');
}

async function getById(id, actingUser) {
  const delivery = await Delivery.findById(id).populate('rider', 'name phone');
  if (!delivery) {
    throw ApiError.notFound('Delivery not found');
  }
  const order = await Order.findById(delivery.order);
  assertCanAccess(delivery, order, actingUser);
  return delivery;
}

async function getByOrderId(orderId, actingUser) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw ApiError.notFound('Order not found');
  }
  if (!orderService.userCanAccessOrder(order, actingUser)) {
    throw ApiError.forbidden('You do not have permission to view this delivery');
  }
  const delivery = await Delivery.findOne({ order: orderId }).populate('rider', 'name phone');
  if (!delivery) {
    throw ApiError.notFound('Delivery not found for this order');
  }
  return delivery;
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
      .populate('rider', 'name phone')
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
  await delivery.populate('rider', 'name phone');
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
  }

  if (targetStatus === 'delivered') {
    delivery.deliveredAt = new Date();
    await orderService.markDelivered(delivery.order);

    const payment = await Payment.findOne({ order: delivery.order });
    if (payment && payment.method === 'cod' && payment.status !== 'completed') {
      payment.status = 'completed';
      payment.paidAt = new Date();
      await payment.save();
    }
  }

  await delivery.save();
  await delivery.populate('rider', 'name phone');
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
  await delivery.save();
  await delivery.populate('rider', 'name phone');
  return delivery;
}

module.exports = { getById, getByOrderId, list, assignRider, updateStatus, updateLocation };
