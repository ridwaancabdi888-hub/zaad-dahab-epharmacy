const medicineService = require('../services/medicine.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

const create = catchAsync(async (req, res) => {
  const medicine = await medicineService.create(req.body, req.user);
  return new ApiResponse(201, medicine, 'Medicine created successfully').send(res);
});

const list = catchAsync(async (req, res) => {
  const { items, meta } = await medicineService.list(req.query);
  return new ApiResponse(200, { items, meta }, 'Medicines retrieved').send(res);
});

const getById = catchAsync(async (req, res) => {
  const medicine = await medicineService.getById(req.params.id);
  return new ApiResponse(200, medicine, 'Medicine retrieved').send(res);
});

const update = catchAsync(async (req, res) => {
  const medicine = await medicineService.update(req.params.id, req.body, req.user);
  return new ApiResponse(200, medicine, 'Medicine updated successfully').send(res);
});

const remove = catchAsync(async (req, res) => {
  await medicineService.remove(req.params.id, req.user);
  return new ApiResponse(200, null, 'Medicine deleted successfully').send(res);
});

module.exports = { create, list, getById, update, remove };
