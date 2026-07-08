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
  const payments = await paymentService.list(req.query);
  return new ApiResponse(200, payments, 'Payments retrieved').send(res);
});

const confirm = catchAsync(async (req, res) => {
  const payment = await paymentService.confirm(req.params.id);
  return new ApiResponse(200, payment, 'Payment confirmed').send(res);
});

module.exports = { getById, getByOrderId, list, confirm };
