const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildMeta } = require('../utils/pagination');

async function create(payload) {
  return Coupon.create(payload);
}

async function list(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.isActive !== undefined) filter.isActive = query.isActive;

  const [items, total] = await Promise.all([
    Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Coupon.countDocuments(filter),
  ]);

  return { items, meta: buildMeta({ page, limit, total }) };
}

async function getById(id) {
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    throw ApiError.notFound('Coupon not found');
  }
  return coupon;
}

async function update(id, payload) {
  const coupon = await getById(id);
  Object.assign(coupon, payload);
  await coupon.save();
  return coupon;
}

async function remove(id) {
  const coupon = await getById(id);
  await coupon.deleteOne();
}

/**
 * Computes the discount a coupon grants against a given subtotal, without
 * mutating anything. Percentage coupons are capped by `maxDiscount` (if
 * set); fixed coupons can never discount more than the subtotal itself.
 */
function computeDiscount(coupon, subtotal) {
  let discount = coupon.type === 'percentage' ? subtotal * (coupon.value / 100) : coupon.value;

  if (coupon.type === 'percentage' && coupon.maxDiscount != null) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  discount = Math.min(discount, subtotal);

  return Number(discount.toFixed(2));
}

/**
 * Validates a coupon code against the given subtotal and returns the
 * coupon plus the discount it grants. Throws a descriptive 400 for any
 * reason the coupon can't be applied (not found, expired, exhausted,
 * subtotal too low) rather than a generic failure.
 */
async function validate(code, subtotal) {
  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
  if (!coupon || !coupon.isActive) {
    throw ApiError.badRequest('Invalid coupon code');
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw ApiError.badRequest('This coupon has expired');
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw ApiError.badRequest('This coupon has reached its usage limit');
  }
  if (subtotal < coupon.minSubtotal) {
    throw ApiError.badRequest(
      `This coupon requires a subtotal of at least $${coupon.minSubtotal.toFixed(2)}`,
    );
  }

  return { coupon, discount: computeDiscount(coupon, subtotal) };
}

async function redeem(couponId) {
  await Coupon.updateOne({ _id: couponId }, { $inc: { usedCount: 1 } });
}

module.exports = { create, list, getById, update, remove, validate, redeem, computeDiscount };
