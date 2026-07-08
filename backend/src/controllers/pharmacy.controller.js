const pharmacyService = require('../services/pharmacy.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

const create = catchAsync(async (req, res) => {
  const pharmacy = await pharmacyService.create(req.body, req.user);
  return new ApiResponse(201, pharmacy, 'Pharmacy created successfully').send(res);
});

const list = catchAsync(async (req, res) => {
  const includeAll = req.user && req.user.role === 'admin' && req.query.all === 'true';
  const pharmacies = await pharmacyService.list({ includeAll, city: req.query.city });
  return new ApiResponse(200, pharmacies, 'Pharmacies retrieved').send(res);
});

const getById = catchAsync(async (req, res) => {
  const pharmacy = await pharmacyService.getById(req.params.id);
  return new ApiResponse(200, pharmacy, 'Pharmacy retrieved').send(res);
});

const update = catchAsync(async (req, res) => {
  const pharmacy = await pharmacyService.update(req.params.id, req.body, req.user);
  return new ApiResponse(200, pharmacy, 'Pharmacy updated successfully').send(res);
});

const verify = catchAsync(async (req, res) => {
  const pharmacy = await pharmacyService.setVerification(req.params.id, req.body.isVerified);
  return new ApiResponse(200, pharmacy, 'Pharmacy verification updated').send(res);
});

const remove = catchAsync(async (req, res) => {
  await pharmacyService.remove(req.params.id);
  return new ApiResponse(200, null, 'Pharmacy deleted successfully').send(res);
});

module.exports = { create, list, getById, update, verify, remove };
