const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Delivery = require('../models/Delivery');
const Medicine = require('../models/Medicine');
const cartService = require('./cart.service');
const paymentGateway = require('./paymentGateway.service');
const ApiError = require('../utils/ApiError');
const generateOrderNumber = require('../utils/generateOrderNumber');
const { parsePagination, buildMeta } = require('../utils/pagination');

const DELIVERY_FEE = 2;
const FREE_DELIVERY_THRESHOLD = 50;
const TAX_RATE = 0.02;

const MANUAL_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['cancelled'],
};

async function createUniqueOrderNumber() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateOrderNumber();
    const exists = await Order.exists({ orderNumber: candidate });
    if (!exists) {
      return candidate;
    }
  }
  throw new Error('Failed to generate a unique order number');
}

async function checkout(userId, { deliveryAddress, paymentMethod, prescriptionImage }) {
  const cart = await cartService.getOrCreateCart(userId);
  const populatedCart = await cartService.getCart(userId);

  if (populatedCart.items.length === 0) {
    throw ApiError.badRequest('Your cart is empty');
  }

  const medicines = await Medicine.find({
    _id: { $in: populatedCart.items.map((item) => item.medicine._id) },
  });
  const medicineMap = new Map(medicines.map((m) => [String(m._id), m]));

  const items = [];
  let prescriptionRequired = false;

  for (const cartItem of populatedCart.items) {
    const medicine = medicineMap.get(String(cartItem.medicine._id));
    if (!medicine || !medicine.isActive) {
      throw ApiError.badRequest(`${cartItem.medicine.name} is no longer available`);
    }
    if (cartItem.quantity > medicine.stock) {
      throw ApiError.badRequest(`Only ${medicine.stock} unit(s) of ${medicine.name} available`);
    }
    if (medicine.requiresPrescription) {
      prescriptionRequired = true;
    }

    items.push({
      medicine: medicine._id,
      pharmacy: medicine.pharmacy,
      name: medicine.name,
      unit: medicine.unit,
      price: cartItem.unitPrice,
      quantity: cartItem.quantity,
      lineTotal: cartItem.lineTotal,
    });
  }

  if (prescriptionRequired && !prescriptionImage) {
    throw ApiError.badRequest(
      'One or more items require a prescription. Please attach a prescription image.',
    );
  }

  const subtotal = Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const tax = Number((subtotal * TAX_RATE).toFixed(2));
  const total = Number((subtotal + deliveryFee + tax).toFixed(2));

  await Promise.all(
    items.map((item) => Medicine.findByIdAndUpdate(item.medicine, { $inc: { stock: -item.quantity } })),
  );

  const orderNumber = await createUniqueOrderNumber();

  const order = await Order.create({
    orderNumber,
    user: userId,
    items,
    subtotal,
    deliveryFee,
    tax,
    total,
    deliveryAddress,
    paymentMethod,
    prescriptionRequired,
    prescriptionImage: prescriptionImage || '',
  });

  const gateway = paymentGateway.getGateway(paymentMethod);
  const gatewayResult = await gateway.initiate({
    amount: total,
    currency: 'USD',
    reference: order.orderNumber,
  });

  const payment = await Payment.create({
    order: order._id,
    user: userId,
    method: paymentMethod,
    amount: total,
    status: gatewayResult.status,
    providerReference: gatewayResult.providerReference,
    rawResponse: gatewayResult.rawResponse,
  });

  const delivery = await Delivery.create({
    order: order._id,
    address: deliveryAddress,
  });

  cart.items = [];
  await cart.save();

  return { order, payment, delivery };
}

function userCanAccessOrder(order, actingUser) {
  if (actingUser.role === 'admin') return true;
  if (String(order.user._id || order.user) === String(actingUser._id)) return true;
  if (actingUser.pharmacy) {
    return order.items.some((item) => String(item.pharmacy) === String(actingUser.pharmacy));
  }
  return false;
}

async function list(actingUser, query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (actingUser.role === 'customer') {
    filter.user = actingUser._id;
  } else if (actingUser.role === 'pharmacist') {
    if (!actingUser.pharmacy) {
      return { items: [], meta: buildMeta({ page, limit, total: 0 }) };
    }
    filter['items.pharmacy'] = actingUser.pharmacy;
  }
  // admin: no filter, sees everything

  if (query.status) {
    filter.status = query.status;
  }

  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  return { items, meta: buildMeta({ page, limit, total }) };
}

async function getById(id, actingUser) {
  const order = await Order.findById(id).populate('user', 'name email phone');
  if (!order) {
    throw ApiError.notFound('Order not found');
  }
  if (!userCanAccessOrder(order, actingUser)) {
    throw ApiError.forbidden('You do not have permission to view this order');
  }
  return order;
}

async function updateStatus(id, targetStatus, actingUser) {
  const order = await Order.findById(id);
  if (!order) {
    throw ApiError.notFound('Order not found');
  }
  if (!userCanAccessOrder(order, actingUser) || actingUser.role === 'customer') {
    throw ApiError.forbidden('You do not have permission to update this order');
  }

  const allowed = MANUAL_TRANSITIONS[order.status] || [];
  if (!allowed.includes(targetStatus)) {
    throw ApiError.badRequest(`Cannot transition order from "${order.status}" to "${targetStatus}"`);
  }

  if (targetStatus === 'cancelled') {
    return cancel(id, actingUser);
  }

  order.status = targetStatus;
  order.statusHistory.push({ status: targetStatus });
  await order.save();
  return order;
}

async function cancel(id, actingUser) {
  const order = await Order.findById(id);
  if (!order) {
    throw ApiError.notFound('Order not found');
  }
  if (!userCanAccessOrder(order, actingUser)) {
    throw ApiError.forbidden('You do not have permission to cancel this order');
  }
  if (!['pending', 'confirmed', 'preparing'].includes(order.status)) {
    throw ApiError.badRequest(`Order in status "${order.status}" can no longer be cancelled`);
  }

  await Promise.all(
    order.items.map((item) =>
      item.medicine
        ? Medicine.findByIdAndUpdate(item.medicine, { $inc: { stock: item.quantity } })
        : Promise.resolve(),
    ),
  );

  order.status = 'cancelled';
  order.cancelledAt = new Date();
  order.statusHistory.push({ status: 'cancelled' });
  await order.save();

  const payment = await Payment.findOne({ order: order._id });
  if (payment) {
    payment.status = payment.status === 'completed' ? 'refunded' : 'cancelled';
    await payment.save();
  }

  const delivery = await Delivery.findOne({ order: order._id });
  if (delivery && delivery.status !== 'delivered') {
    delivery.status = 'cancelled';
    delivery.statusHistory.push({ status: 'cancelled' });
    await delivery.save();
  }

  return order;
}

async function markDelivered(orderId) {
  const order = await Order.findById(orderId);
  if (!order) return null;
  order.status = 'delivered';
  order.deliveredAt = new Date();
  order.statusHistory.push({ status: 'delivered' });
  await order.save();
  return order;
}

async function markOutForDelivery(orderId) {
  const order = await Order.findById(orderId);
  if (!order || ['delivered', 'cancelled'].includes(order.status)) return order;
  order.status = 'out_for_delivery';
  order.statusHistory.push({ status: 'out_for_delivery' });
  await order.save();
  return order;
}

module.exports = {
  checkout,
  list,
  getById,
  updateStatus,
  cancel,
  markDelivered,
  markOutForDelivery,
  userCanAccessOrder,
};
