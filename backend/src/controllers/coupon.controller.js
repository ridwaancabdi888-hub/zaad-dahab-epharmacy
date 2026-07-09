const couponService = require('../services/coupon.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

const create = catchAsync(async (req, res) => {
  const coupon = await couponService.create(req.body);
  return new ApiResponse(201, coupon, 'Coupon created successfully').send(res);
});

const list = catchAsync(async (req, res) => {
  const { items, meta } = await couponService.list(req.query);
  return new ApiResponse(200, { items, meta }, 'Coupons retrieved').send(res);
});

const getById = catchAsync(async (req, res) => {
  const coupon = await couponService.getById(req.params.id);
  return new ApiResponse(200, coupon, 'Coupon retrieved').send(res);
});

const update = catchAsync(async (req, res) => {
  const coupon = await couponService.update(req.params.id, req.body);
  return new ApiResponse(200, coupon, 'Coupon updated successfully').send(res);
});

const remove = catchAsync(async (req, res) => {
  await couponService.remove(req.params.id);
  return new ApiResponse(200, null, 'Coupon deleted successfully').send(res);
});

module.exports = { create, list, getById, update, remove };
