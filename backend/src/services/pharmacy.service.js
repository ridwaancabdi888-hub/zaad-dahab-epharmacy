const Pharmacy = require('../models/Pharmacy');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

async function create(payload, actingUser) {
  const ownerId = actingUser.role === 'admin' && payload.owner ? payload.owner : actingUser._id;

  const existing = await Pharmacy.findOne({ owner: ownerId });
  if (existing && actingUser.role !== 'admin') {
    throw ApiError.conflict('This account already manages a pharmacy');
  }

  const pharmacy = await Pharmacy.create({ ...payload, owner: ownerId });

  if (actingUser.role === 'pharmacist' && String(actingUser._id) === String(ownerId)) {
    actingUser.pharmacy = pharmacy._id;
    await actingUser.save();
  } else {
    await User.findByIdAndUpdate(ownerId, { pharmacy: pharmacy._id });
  }

  return pharmacy;
}

async function list({ includeAll = false, city } = {}) {
  const filter = {};
  if (!includeAll) {
    filter.isVerified = true;
    filter.isActive = true;
  }
  if (city) {
    filter['address.city'] = new RegExp(`^${city}$`, 'i');
  }
  return Pharmacy.find(filter).sort({ ratingAverage: -1, name: 1 });
}

async function getById(id) {
  const pharmacy = await Pharmacy.findById(id);
  if (!pharmacy) {
    throw ApiError.notFound('Pharmacy not found');
  }
  return pharmacy;
}

function assertCanManage(pharmacy, actingUser) {
  const isOwner = String(pharmacy.owner) === String(actingUser._id);
  if (!isOwner && actingUser.role !== 'admin') {
    throw ApiError.forbidden('You do not have permission to manage this pharmacy');
  }
}

async function update(id, payload, actingUser) {
  const pharmacy = await getById(id);
  assertCanManage(pharmacy, actingUser);

  if (actingUser.role !== 'admin') {
    delete payload.isVerified;
    delete payload.isActive;
  }

  Object.assign(pharmacy, payload);
  await pharmacy.save();
  return pharmacy;
}

async function setVerification(id, isVerified) {
  const pharmacy = await getById(id);
  pharmacy.isVerified = isVerified;
  await pharmacy.save();
  return pharmacy;
}

async function remove(id) {
  const pharmacy = await getById(id);
  await User.updateMany({ pharmacy: pharmacy._id }, { pharmacy: null });
  await pharmacy.deleteOne();
}

module.exports = { create, list, getById, update, setVerification, remove, assertCanManage };
