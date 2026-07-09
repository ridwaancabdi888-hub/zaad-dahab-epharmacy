const { body, param, query } = require('express-validator');
const { COUPON_TYPES } = require('../models/Coupon');

const createCouponValidator = [
  body('code').trim().isLength({ min: 3, max: 30 }).withMessage('Code must be 3-30 characters'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 300 }),
  body('type').isIn(COUPON_TYPES).withMessage(`type must be one of: ${COUPON_TYPES.join(', ')}`),
  body('value').isFloat({ min: 0 }).withMessage('value must be a non-negative number').toFloat(),
  body('minSubtotal').optional().isFloat({ min: 0 }).toFloat(),
  body('maxDiscount').optional({ values: 'falsy' }).isFloat({ min: 0 }).toFloat(),
  body('expiresAt').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid date'),
  body('usageLimit').optional({ values: 'falsy' }).isInt({ min: 1 }).toInt(),
];

const updateCouponValidator = [
  param('id').isMongoId().withMessage('Invalid coupon id'),
  body('code').optional().trim().isLength({ min: 3, max: 30 }),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 300 }),
  body('type').optional().isIn(COUPON_TYPES),
  body('value').optional().isFloat({ min: 0 }).toFloat(),
  body('minSubtotal').optional().isFloat({ min: 0 }).toFloat(),
  body('maxDiscount').optional({ values: 'falsy' }).isFloat({ min: 0 }).toFloat(),
  body('expiresAt').optional({ values: 'falsy' }).isISO8601(),
  body('usageLimit').optional({ values: 'falsy' }).isInt({ min: 1 }).toInt(),
  body('isActive').optional().isBoolean().toBoolean(),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid coupon id')];

const listCouponValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('isActive').optional().isBoolean().toBoolean(),
];

module.exports = {
  createCouponValidator,
  updateCouponValidator,
  idParamValidator,
  listCouponValidator,
};
