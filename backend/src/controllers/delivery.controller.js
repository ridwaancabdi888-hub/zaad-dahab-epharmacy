const deliveryService = require('../services/delivery.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

const getById = catchAsync(async (req, res) => {
  const delivery = await deliveryService.getById(req.params.id, req.user);
  return new ApiResponse(200, delivery, 'Delivery retrieved').send(res);
});

const getByOrderId = catchAsync(async (req, res) => {
  const delivery = await deliveryService.getByOrderId(req.params.orderId, req.user);
  return new ApiResponse(200, delivery, 'Delivery retrieved').send(res);
});

const list = catchAsync(async (req, res) => {
  const { items, meta } = await deliveryService.list(req.user, req.query);
  return new ApiResponse(200, { items, meta }, 'Deliveries retrieved').send(res);
});

const assignRider = catchAsync(async (req, res) => {
  const delivery = await deliveryService.assignRider(req.params.id, req.body.riderId);
  return new ApiResponse(200, delivery, 'Rider assigned successfully').send(res);
});

const updateStatus = catchAsync(async (req, res) => {
  const delivery = await deliveryService.updateStatus(req.params.id, req.body.status, req.user);
  return new ApiResponse(200, delivery, 'Delivery status updated').send(res);
});

const updateLocation = catchAsync(async (req, res) => {
  const delivery = await deliveryService.updateLocation(
    req.params.id,
    { lat: req.body.lat, lng: req.body.lng },
    req.user,
  );
  return new ApiResponse(200, delivery, 'Delivery location updated').send(res);
});

module.exports = { getById, getByOrderId, list, assignRider, updateStatus, updateLocation };
