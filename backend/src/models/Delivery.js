const mongoose = require('mongoose');

const DELIVERY_STATUSES = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'];

const addressSnapshotSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: 'Home' },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false },
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: DELIVERY_STATUSES, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const deliverySchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: DELIVERY_STATUSES,
      default: 'pending',
    },
    address: {
      type: addressSnapshotSchema,
      required: true,
    },
    currentLocation: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
    estimatedDeliveryStart: { type: Date, default: null },
    estimatedDeliveryEnd: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    statusHistory: {
      type: [statusHistorySchema],
      default: () => [{ status: 'pending' }],
    },
  },
  { timestamps: true },
);

// The rider app's "active" vs "completed" delivery lists filter by
// rider+status, sorted newest first (see `delivery.service.js#list`).
deliverySchema.index({ rider: 1, status: 1, createdAt: -1 });

const Delivery = mongoose.model('Delivery', deliverySchema);

module.exports = Delivery;
module.exports.DELIVERY_STATUSES = DELIVERY_STATUSES;
