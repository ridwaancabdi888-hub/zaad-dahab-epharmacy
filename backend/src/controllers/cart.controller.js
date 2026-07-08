const cartService = require('../services/cart.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

const getCart = catchAsync(async (req, res) => {
  const cart = await cartService.getCart(req.user._id);
  return new ApiResponse(200, cart, 'Cart retrieved').send(res);
});

const addItem = catchAsync(async (req, res) => {
  const { medicineId, quantity } = req.body;
  const cart = await cartService.addItem(req.user._id, medicineId, quantity || 1);
  return new ApiResponse(200, cart, 'Item added to cart').send(res);
});

const updateItem = catchAsync(async (req, res) => {
  const cart = await cartService.updateItemQuantity(
    req.user._id,
    req.params.medicineId,
    req.body.quantity,
  );
  return new ApiResponse(200, cart, 'Cart item updated').send(res);
});

const removeItem = catchAsync(async (req, res) => {
  const cart = await cartService.removeItem(req.user._id, req.params.medicineId);
  return new ApiResponse(200, cart, 'Item removed from cart').send(res);
});

const clear = catchAsync(async (req, res) => {
  const cart = await cartService.clear(req.user._id);
  return new ApiResponse(200, cart, 'Cart cleared').send(res);
});

module.exports = { getCart, addItem, updateItem, removeItem, clear };
