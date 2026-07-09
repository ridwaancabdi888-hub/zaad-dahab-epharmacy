const mongoose = require('mongoose');

const COUPON_TYPES = ['percentage', 'fixed'];

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: COUPON_TYPES,
      required: true,
    },
    value: {
      type: Number,
      required: [true, 'Coupon value is required'],
      min: [0, 'Value cannot be negative'],
      validate: {
        validator: function isValidPercentage(value) {
          return this.type !== 'percentage' || value <= 100;
        },
        message: 'A percentage coupon cannot exceed 100',
      },
    },
    minSubtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscount: {
      type: Number,
      default: null,
      min: 0,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    usageLimit: {
      type: Number,
      default: null,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
module.exports.COUPON_TYPES = COUPON_TYPES;
