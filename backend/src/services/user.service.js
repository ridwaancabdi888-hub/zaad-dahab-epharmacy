const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildMeta } = require('../utils/pagination');

async function updateProfile(userId, payload) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  if (payload.name !== undefined) user.name = payload.name;
  if (payload.phone !== undefined) user.phone = payload.phone;
  await user.save();
  return user;
}

async function addAddress(userId, address) {
  const user = await User.findById(userId);
  if (address.isDefault) {
    user.addresses.forEach((a) => {
      a.isDefault = false;
    });
  }
  if (user.addresses.length === 0) {
    address.isDefault = true;
  }
  user.addresses.push(address);
  await user.save();
  return user;
}

async function updateAddress(userId, addressId, payload) {
  const user = await User.findById(userId);
  const address = user.addresses.id(addressId);
  if (!address) {
    throw ApiError.notFound('Address not found');
  }

  if (payload.isDefault) {
    user.addresses.forEach((a) => {
      a.isDefault = false;
    });
  }

  Object.assign(address, payload);
  await user.save();
  return user;
}

async function removeAddress(userId, addressId) {
  const user = await User.findById(userId);
  const address = user.addresses.id(addressId);
  if (!address) {
    throw ApiError.notFound('Address not found');
  }
  address.deleteOne();
  await user.save();
  return user;
}

async function list(query) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.role) filter.role = query.role;

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return { items, meta: buildMeta({ page, limit, total }) };
}

async function getById(id) {
  const user = await User.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
}

async function adminUpdate(id, payload) {
  const user = await getById(id);
  if (payload.role !== undefined) user.role = payload.role;
  if (payload.isActive !== undefined) user.isActive = payload.isActive;
  await user.save();
  return user;
}

module.exports = {
  updateProfile,
  addAddress,
  updateAddress,
  removeAddress,
  list,
  getById,
  adminUpdate,
};
