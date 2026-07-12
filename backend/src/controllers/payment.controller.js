const paymentService = require('../services/payment.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

const getById = catchAsync(async (req, res) => {
  const payment = await paymentService.getById(req.params.id, req.user);
  return new ApiResponse(200, payment, 'Payment retrieved').send(res);
});

const getByOrderId = catchAsync(async (req, res) => {
  const payment = await paymentService.getByOrderId(req.params.orderId, req.user);
  return new ApiResponse(200, payment, 'Payment retrieved').send(res);
});

const list = catchAsync(async (req, res) => {
  const { items, meta } = await paymentService.list(req.query);
  return new ApiResponse(200, { items, meta }, 'Payments retrieved').send(res);
});

const listMine = catchAsync(async (req, res) => {
  const { items, meta } = await paymentService.listMine(req.user._id, req.query);
  return new ApiResponse(200, { items, meta }, 'Transaction history retrieved').send(res);
});

const confirm = catchAsync(async (req, res) => {
  const payment = await paymentService.confirm(req.params.id, req.user);
  return new ApiResponse(200, payment, 'Payment confirmed').send(res);
});

const verify = catchAsync(async (req, res) => {
  const payment = await paymentService.verifyStatus(req.params.id, req.user);
  return new ApiResponse(200, payment, 'Payment status verified').send(res);
});

const retry = catchAsync(async (req, res) => {
  const payment = await paymentService.retry(req.params.id, req.user);
  return new ApiResponse(200, payment, 'Payment retried').send(res);
});

const webhook = catchAsync(async (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payment = await paymentService.handleWebhook(req.params.provider, req.rawBody, signature);
  return new ApiResponse(200, { id: payment._id, status: payment.status }, 'Webhook processed').send(
    res,
  );
});

module.exports = { getById, getByOrderId, list, listMine, confirm, verify, retry, webhook };
