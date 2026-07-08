const Cart = require('../models/Cart');
const Medicine = require('../models/Medicine');
const ApiError = require('../utils/ApiError');

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}

async function toView(cart) {
  const populated = await cart.populate({
    path: 'items.medicine',
    populate: { path: 'pharmacy', select: 'name isVerified' },
  });

  const items = populated.items
    .filter((item) => item.medicine)
    .map((item) => {
      const medicine = item.medicine;
      const price = medicine.discountPrice != null ? medicine.discountPrice : medicine.price;
      return {
        medicine,
        quantity: item.quantity,
        unitPrice: price,
        lineTotal: Number((price * item.quantity).toFixed(2)),
      };
    });

  const subtotal = Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));

  return {
    _id: populated._id,
    user: populated.user,
    items,
    subtotal,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    updatedAt: populated.updatedAt,
  };
}

async function getCart(userId) {
  const cart = await getOrCreateCart(userId);
  return toView(cart);
}

async function addItem(userId, medicineId, quantity = 1) {
  const medicine = await Medicine.findById(medicineId);
  if (!medicine || !medicine.isActive) {
    throw ApiError.notFound('Medicine not found');
  }

  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find((item) => String(item.medicine) === String(medicineId));
  const nextQuantity = (existing ? existing.quantity : 0) + quantity;

  if (nextQuantity > medicine.stock) {
    throw ApiError.badRequest(`Only ${medicine.stock} unit(s) of ${medicine.name} available`);
  }

  if (existing) {
    existing.quantity = nextQuantity;
  } else {
    cart.items.push({ medicine: medicineId, quantity: nextQuantity });
  }

  await cart.save();
  return toView(cart);
}

async function updateItemQuantity(userId, medicineId, quantity) {
  const cart = await getOrCreateCart(userId);
  const existing = cart.items.find((item) => String(item.medicine) === String(medicineId));
  if (!existing) {
    throw ApiError.notFound('Item not found in cart');
  }

  if (quantity === 0) {
    cart.items = cart.items.filter((item) => String(item.medicine) !== String(medicineId));
  } else {
    const medicine = await Medicine.findById(medicineId);
    if (!medicine || !medicine.isActive) {
      throw ApiError.notFound('Medicine not found');
    }
    if (quantity > medicine.stock) {
      throw ApiError.badRequest(`Only ${medicine.stock} unit(s) of ${medicine.name} available`);
    }
    existing.quantity = quantity;
  }

  await cart.save();
  return toView(cart);
}

async function removeItem(userId, medicineId) {
  const cart = await getOrCreateCart(userId);
  cart.items = cart.items.filter((item) => String(item.medicine) !== String(medicineId));
  await cart.save();
  return toView(cart);
}

async function clear(userId) {
  const cart = await getOrCreateCart(userId);
  cart.items = [];
  await cart.save();
  return toView(cart);
}

module.exports = { getCart, addItem, updateItemQuantity, removeItem, clear, getOrCreateCart };
