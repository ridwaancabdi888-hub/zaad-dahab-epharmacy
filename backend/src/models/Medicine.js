const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    pharmacy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pharmacy',
      required: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    manufacturer: {
      type: String,
      trim: true,
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
    unit: {
      type: String,
      trim: true,
      required: [true, 'Unit is required (e.g. "60 Capsules")'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      min: [0, 'Discount price cannot be negative'],
      default: null,
      validate: {
        validator: function isBelowPrice(value) {
          return value == null || value < this.price;
        },
        message: 'Discount price must be lower than the regular price',
      },
    },
    currency: {
      type: String,
      default: 'USD',
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    requiresPrescription: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

medicineSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Every catalog list query filters `isActive: true` first (see
// `medicine.service.js#list`), then usually narrows by category or
// pharmacy — a leading `isActive` keeps both compound indexes useful for
// the common "active medicines in category/pharmacy X" queries.
medicineSchema.index({ isActive: 1, category: 1 });
medicineSchema.index({ isActive: 1, pharmacy: 1 });

medicineSchema.virtual('inStock').get(function inStock() {
  return this.stock > 0;
});

medicineSchema.virtual('effectivePrice').get(function effectivePrice() {
  return this.discountPrice != null ? this.discountPrice : this.price;
});

medicineSchema.set('toJSON', { virtuals: true });

const Medicine = mongoose.model('Medicine', medicineSchema);

module.exports = Medicine;
