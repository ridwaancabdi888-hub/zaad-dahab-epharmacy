const orderService = require('../services/order.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

const quote = catchAsync(async (req, res) => {
  const result = await orderService.quote(req.user._id, req.body);
  return new ApiResponse(200, result, 'Quote calculated').send(res);
});

const checkout = catchAsync(async (req, res) => {
  const result = await orderService.checkout(req.user._id, req.body);
  return new ApiResponse(201, result, 'Order placed successfully').send(res);
});

const list = catchAsync(async (req, res) => {
  const { items, meta } = await orderService.list(req.user, req.query);
  return new ApiResponse(200, { items, meta }, 'Orders retrieved').send(res);
});

const getById = catchAsync(async (req, res) => {
  const order = await orderService.getById(req.params.id, req.user);
  return new ApiResponse(200, order, 'Order retrieved').send(res);
});

const updateStatus = catchAsync(async (req, res) => {
  const order = await orderService.updateStatus(req.params.id, req.body.status, req.user);
  return new ApiResponse(200, order, 'Order status updated').send(res);
});

const cancel = catchAsync(async (req, res) => {
  const order = await orderService.cancel(req.params.id, req.user);
  return new ApiResponse(200, order, 'Order cancelled successfully').send(res);
});

module.exports = { quote, checkout, list, getById, updateStatus, cancel };
