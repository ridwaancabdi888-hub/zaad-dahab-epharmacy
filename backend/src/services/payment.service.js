const Payment = require('../models/Payment');
const Order = require('../models/Order');
const paymentGateway = require('./paymentGateway.service');
const ApiError = require('../utils/ApiError');
const orderService = require('./order.service');

async function getById(id, actingUser) {
  const payment = await Payment.findById(id);
  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }

  if (actingUser.role !== 'admin' && String(payment.user) !== String(actingUser._id)) {
    throw ApiError.forbidden('You do not have permission to view this payment');
  }

  return payment;
}

async function getByOrderId(orderId, actingUser) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw ApiError.notFound('Order not found');
  }
  if (!orderService.userCanAccessOrder(order, actingUser)) {
    throw ApiError.forbidden('You do not have permission to view this payment');
  }

  const payment = await Payment.findOne({ order: orderId });
  if (!payment) {
    throw ApiError.notFound('Payment not found for this order');
  }
  return payment;
}

async function list(query) {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.method) filter.method = query.method;
  return Payment.find(filter).sort({ createdAt: -1 });
}

async function confirm(id) {
  const payment = await Payment.findById(id);
  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }
  if (payment.status === 'completed') {
    return payment;
  }

  const gateway = paymentGateway.getGateway(payment.method);
  const result = await gateway.confirm(payment.providerReference);

  payment.status = result.status;
  payment.rawResponse = result.rawResponse;
  if (result.status === 'completed') {
    payment.paidAt = new Date();
  }
  await payment.save();
  return payment;
}

module.exports = { getById, getByOrderId, list, confirm };
