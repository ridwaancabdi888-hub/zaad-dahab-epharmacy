const Medicine = require('../models/Medicine');
const Category = require('../models/Category');
const Pharmacy = require('../models/Pharmacy');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildMeta } = require('../utils/pagination');

async function resolvePharmacyForActor(payload, actingUser) {
  if (actingUser.role === 'admin') {
    if (!payload.pharmacy) {
      throw ApiError.badRequest('pharmacy is required when creating a medicine as admin');
    }
    return payload.pharmacy;
  }

  if (!actingUser.pharmacy) {
    throw ApiError.forbidden('You must register a pharmacy before adding medicines');
  }
  return actingUser.pharmacy;
}

async function create(payload, actingUser) {
  const pharmacyId = await resolvePharmacyForActor(payload, actingUser);

  const [pharmacy, category] = await Promise.all([
    Pharmacy.findById(pharmacyId),
    Category.findById(payload.category),
  ]);
  if (!pharmacy) {
    throw ApiError.badRequest('Pharmacy not found');
  }
  if (!category) {
    throw ApiError.badRequest('Category not found');
  }

  return Medicine.create({ ...payload, pharmacy: pharmacyId });
}

async function list(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { isActive: true };

  if (query.category) filter.category = query.category;
  if (query.pharmacy) filter.pharmacy = query.pharmacy;
  if (query.requiresPrescription !== undefined) {
    filter.requiresPrescription = query.requiresPrescription;
  }
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = query.minPrice;
    if (query.maxPrice) filter.price.$lte = query.maxPrice;
  }
  if (query.search) {
    filter.$text = { $search: query.search };
  }

  const [items, total] = await Promise.all([
    Medicine.find(filter)
      .populate('category', 'name slug')
      .populate('pharmacy', 'name isVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Medicine.countDocuments(filter),
  ]);

  return { items, meta: buildMeta({ page, limit, total }) };
}

async function getById(id) {
  const medicine = await Medicine.findById(id)
    .populate('category', 'name slug')
    .populate('pharmacy', 'name isVerified address');
  if (!medicine) {
    throw ApiError.notFound('Medicine not found');
  }
  return medicine;
}

function assertCanManage(medicine, actingUser) {
  const isOwner =
    actingUser.pharmacy && String(medicine.pharmacy._id || medicine.pharmacy) === String(actingUser.pharmacy);
  if (!isOwner && actingUser.role !== 'admin') {
    throw ApiError.forbidden('You do not have permission to manage this medicine');
  }
}

async function update(id, payload, actingUser) {
  const medicine = await Medicine.findById(id);
  if (!medicine) {
    throw ApiError.notFound('Medicine not found');
  }
  assertCanManage(medicine, actingUser);

  if (payload.category) {
    const category = await Category.findById(payload.category);
    if (!category) {
      throw ApiError.badRequest('Category not found');
    }
  }

  Object.assign(medicine, payload);
  await medicine.save();
  return medicine;
}

async function remove(id, actingUser) {
  const medicine = await Medicine.findById(id);
  if (!medicine) {
    throw ApiError.notFound('Medicine not found');
  }
  assertCanManage(medicine, actingUser);
  await medicine.deleteOne();
}

module.exports = { create, list, getById, update, remove, assertCanManage };
