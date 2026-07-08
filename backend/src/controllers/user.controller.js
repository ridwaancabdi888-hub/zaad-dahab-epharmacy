const userService = require('../services/user.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

const getMe = (req, res) => {
  return new ApiResponse(200, req.user, 'Current user retrieved').send(res);
};

const updateMe = catchAsync(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  return new ApiResponse(200, user, 'Profile updated successfully').send(res);
});

const addAddress = catchAsync(async (req, res) => {
  const user = await userService.addAddress(req.user._id, req.body);
  return new ApiResponse(201, user, 'Address added successfully').send(res);
});

const updateAddress = catchAsync(async (req, res) => {
  const user = await userService.updateAddress(req.user._id, req.params.addressId, req.body);
  return new ApiResponse(200, user, 'Address updated successfully').send(res);
});

const removeAddress = catchAsync(async (req, res) => {
  const user = await userService.removeAddress(req.user._id, req.params.addressId);
  return new ApiResponse(200, user, 'Address removed successfully').send(res);
});

const getWishlist = catchAsync(async (req, res) => {
  const wishlist = await userService.getWishlist(req.user._id);
  return new ApiResponse(200, wishlist, 'Wishlist retrieved').send(res);
});

const addToWishlist = catchAsync(async (req, res) => {
  const wishlist = await userService.addToWishlist(req.user._id, req.params.medicineId);
  return new ApiResponse(201, wishlist, 'Added to wishlist').send(res);
});

const removeFromWishlist = catchAsync(async (req, res) => {
  const wishlist = await userService.removeFromWishlist(req.user._id, req.params.medicineId);
  return new ApiResponse(200, wishlist, 'Removed from wishlist').send(res);
});

const list = catchAsync(async (req, res) => {
  const { items, meta } = await userService.list(req.query);
  return new ApiResponse(200, { items, meta }, 'Users retrieved').send(res);
});

const getById = catchAsync(async (req, res) => {
  const user = await userService.getById(req.params.id);
  return new ApiResponse(200, user, 'User retrieved').send(res);
});

const adminUpdate = catchAsync(async (req, res) => {
  const user = await userService.adminUpdate(req.params.id, req.body);
  return new ApiResponse(200, user, 'User updated successfully').send(res);
});

module.exports = {
  getMe,
  updateMe,
  addAddress,
  updateAddress,
  removeAddress,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  list,
  getById,
  adminUpdate,
};
