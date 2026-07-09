const mongoose = require('mongoose');

const PAYMENT_STATUSES = ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'];

const attemptHistorySchema = new mongoose.Schema(
  {
    providerReference: { type: String, required: true },
    status: { type: String, enum: PAYMENT_STATUSES, required: true },
    failureReason: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    method: {
      type: String,
      enum: ['zaad', 'edahab', 'cod'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'pending',
    },
    providerReference: {
      type: String,
      default: '',
    },
    payerPhone: {
      type: String,
      default: '',
    },
    failureReason: {
      type: String,
      default: '',
    },
    attempts: {
      type: Number,
      default: 1,
      min: 1,
    },
    attemptHistory: {
      type: [attemptHistorySchema],
      default: [],
    },
    rawResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
module.exports.PAYMENT_STATUSES = PAYMENT_STATUSES;
