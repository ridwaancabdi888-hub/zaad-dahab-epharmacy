const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['customer', 'pharmacist', 'rider', 'admin'];

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: 'Home' },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    lat: { type: Number },
    lng: { type: Number },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'customer',
    },
    pharmacy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      default: null,
    },
    addresses: {
      type: [addressSchema],
      default: [],
    },
    wishlist: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' }],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
module.exports.ROLES = ROLES;
