const User = require('../models/User');
const Medicine = require('../models/Medicine');
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

async function getWishlist(userId) {
  const user = await User.findById(userId).populate({
    path: 'wishlist',
    populate: [
      { path: 'category', select: 'name slug' },
      { path: 'pharmacy', select: 'name isVerified' },
    ],
  });
  return user.wishlist.filter((medicine) => medicine != null);
}

async function addToWishlist(userId, medicineId) {
  const medicine = await Medicine.findById(medicineId);
  if (!medicine) {
    throw ApiError.notFound('Medicine not found');
  }

  await User.updateOne({ _id: userId }, { $addToSet: { wishlist: medicineId } });
  return getWishlist(userId);
}

async function removeFromWishlist(userId, medicineId) {
  await User.updateOne({ _id: userId }, { $pull: { wishlist: medicineId } });
  return getWishlist(userId);
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

/**
 * Admin-only user creation — the only way to create a non-customer
 * account directly (public `/auth/register` always defaults to
 * `customer`), so an admin can provision a pharmacist/rider/admin
 * account without the "register then promote" two-step.
 */
async function adminCreate({ name, email, phone, password, role }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await User.hashPassword(password);
  return User.create({ name, email, phone, passwordHash, role: role || 'customer' });
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
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  list,
  getById,
  adminUpdate,
  adminCreate,
};
