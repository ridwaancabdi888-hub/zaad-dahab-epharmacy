const Payment = require('../models/Payment');
const Order = require('../models/Order');
const paymentGateway = require('./paymentGateway.service');
const ApiError = require('../utils/ApiError');
const orderService = require('./order.service');
const { parsePagination, buildMeta } = require('../utils/pagination');

function assertOwnerOrAdmin(payment, actingUser) {
  if (actingUser.role !== 'admin' && String(payment.user) !== String(actingUser._id)) {
    throw ApiError.forbidden('You do not have permission to access this payment');
  }
}

async function getById(id, actingUser) {
  const payment = await Payment.findById(id);
  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }
  assertOwnerOrAdmin(payment, actingUser);
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

/** Admin-only: every payment in the system, paginated and filterable. */
async function list(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.method) filter.method = query.method;

  const [items, total] = await Promise.all([
    Payment.find(filter)
      .populate('order', 'orderNumber')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(filter),
  ]);

  return { items, meta: buildMeta({ page, limit, total }) };
}

/** The current user's own transaction history, most recent first. */
async function listMine(userId, query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { user: userId };
  if (query.status) filter.status = query.status;

  const [items, total] = await Promise.all([
    Payment.find(filter)
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(filter),
  ]);

  return { items, meta: buildMeta({ page, limit, total }) };
}

/**
 * Manual override: mark a payment paid regardless of what the gateway
 * says. Admins can confirm any payment; a pharmacist may only confirm a
 * payment for an order containing at least one of their own pharmacy's
 * items (same boundary as viewing/cancelling the order or assigning its
 * delivery a rider).
 */
async function confirm(id, actingUser) {
  const payment = await Payment.findById(id);
  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }
  if (actingUser.role !== 'admin') {
    const order = await Order.findById(payment.order);
    if (!order || !orderService.userCanAccessOrder(order, actingUser)) {
      throw ApiError.forbidden('You do not have permission to confirm this payment');
    }
  }
  if (payment.status === 'completed') {
    return payment;
  }

  payment.status = 'completed';
  payment.failureReason = '';
  payment.paidAt = new Date();
  payment.attemptHistory.push({
    providerReference: payment.providerReference,
    status: 'completed',
    at: new Date(),
  });
  await payment.save();
  return payment;
}

/**
 * Asks the gateway what it currently thinks the payment's status is —
 * the realistic "check my payment" flow after a customer returns from
 * confirming (or not) a USSD prompt on their phone, as opposed to
 * `confirm`'s manual admin override.
 */
async function verifyStatus(id, actingUser) {
  const payment = await Payment.findById(id);
  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }
  assertOwnerOrAdmin(payment, actingUser);

  if (['completed', 'refunded', 'cancelled'].includes(payment.status)) {
    return payment;
  }

  const gateway = paymentGateway.getGateway(payment.method);
  const result = await gateway.checkStatus(payment.providerReference, {
    payerPhone: payment.payerPhone,
  });

  payment.status = result.status;
  payment.failureReason = result.failureReason || '';
  payment.rawResponse = result.rawResponse;
  if (result.status === 'completed') {
    payment.paidAt = new Date();
  }
  payment.attemptHistory.push({
    providerReference: payment.providerReference,
    status: result.status,
    failureReason: result.failureReason || '',
    at: new Date(),
  });
  await payment.save();
  return payment;
}

/** Re-initiates a fresh gateway attempt for a failed payment, on the same order. */
async function retry(id, actingUser) {
  const payment = await Payment.findById(id);
  if (!payment) {
    throw ApiError.notFound('Payment not found');
  }
  assertOwnerOrAdmin(payment, actingUser);

  if (payment.status !== 'failed') {
    throw ApiError.badRequest(`Only a failed payment can be retried (current status: "${payment.status}")`);
  }

  const gateway = paymentGateway.getGateway(payment.method);
  const result = await gateway.initiate({
    amount: payment.amount,
    currency: payment.currency,
    reference: `${payment._id}-retry-${payment.attempts + 1}`,
    payerPhone: payment.payerPhone,
  });

  payment.providerReference = result.providerReference;
  payment.status = result.status;
  payment.failureReason = '';
  payment.rawResponse = result.rawResponse;
  payment.attempts += 1;
  payment.attemptHistory.push({
    providerReference: result.providerReference,
    status: result.status,
    at: new Date(),
  });
  await payment.save();
  return payment;
}

/**
 * Handles a (simulated) asynchronous callback from the provider — the
 * same mechanism a real Zaad/e-Dahab integration would use instead of
 * requiring the app to poll. Signature-verified so only the provider (or,
 * in this sandbox, whoever holds the shared secret) can update a payment.
 */
async function handleWebhook(provider, rawBody, signature) {
  if (!paymentGateway.verifyWebhookSignature(provider, rawBody, signature)) {
    throw ApiError.unauthorized('Invalid webhook signature');
  }

  const payload = JSON.parse(rawBody);
  const { providerReference, status, failureReason } = payload;

  const payment = await Payment.findOne({ providerReference });
  if (!payment) {
    throw ApiError.notFound('No payment found for this provider reference');
  }
  if (['completed', 'refunded', 'cancelled'].includes(payment.status)) {
    return payment;
  }

  payment.status = status;
  payment.failureReason = failureReason || '';
  payment.rawResponse = payload;
  if (status === 'completed') {
    payment.paidAt = new Date();
  }
  payment.attemptHistory.push({
    providerReference,
    status,
    failureReason: failureReason || '',
    at: new Date(),
  });
  await payment.save();
  return payment;
}

module.exports = {
  getById,
  getByOrderId,
  list,
  listMine,
  confirm,
  verifyStatus,
  retry,
  handleWebhook,
};
