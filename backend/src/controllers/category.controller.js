const categoryService = require('../services/category.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

const create = catchAsync(async (req, res) => {
  const category = await categoryService.create(req.body);
  return new ApiResponse(201, category, 'Category created successfully').send(res);
});

const list = catchAsync(async (req, res) => {
  const includeInactive = req.user && req.user.role === 'admin' && req.query.all === 'true';
  const categories = await categoryService.list({ includeInactive, parent: req.query.parent });
  return new ApiResponse(200, categories, 'Categories retrieved').send(res);
});

const getById = catchAsync(async (req, res) => {
  const category = await categoryService.getById(req.params.id);
  return new ApiResponse(200, category, 'Category retrieved').send(res);
});

const update = catchAsync(async (req, res) => {
  const category = await categoryService.update(req.params.id, req.body);
  return new ApiResponse(200, category, 'Category updated successfully').send(res);
});

const remove = catchAsync(async (req, res) => {
  await categoryService.remove(req.params.id);
  return new ApiResponse(200, null, 'Category deleted successfully').send(res);
});

module.exports = { create, list, getById, update, remove };
