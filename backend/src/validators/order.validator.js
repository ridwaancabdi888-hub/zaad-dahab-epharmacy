const { body, param, query } = require('express-validator');
const { PAYMENT_METHODS, ORDER_STATUSES } = require('../models/Order');

const checkoutValidator = [
  body('deliveryAddress.label').optional({ values: 'falsy' }).trim(),
  body('deliveryAddress.street').trim().notEmpty().withMessage('Delivery street is required'),
  body('deliveryAddress.city').trim().notEmpty().withMessage('Delivery city is required'),
  body('deliveryAddress.lat').optional().isFloat().toFloat(),
  body('deliveryAddress.lng').optional().isFloat().toFloat(),
  body('paymentMethod')
    .isIn(PAYMENT_METHODS)
    .withMessage(`paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}`),
  body('prescriptionImage').optional({ values: 'falsy' }).trim().isString(),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid order id')];

const updateStatusValidator = [
  param('id').isMongoId().withMessage('Invalid order id'),
  body('status')
    .isIn(ORDER_STATUSES)
    .withMessage(`status must be one of: ${ORDER_STATUSES.join(', ')}`),
];

const listOrderValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(ORDER_STATUSES),
];

module.exports = { checkoutValidator, idParamValidator, updateStatusValidator, listOrderValidator };
