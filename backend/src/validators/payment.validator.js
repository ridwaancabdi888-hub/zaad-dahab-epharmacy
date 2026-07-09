const { param, query } = require('express-validator');
const { PAYMENT_STATUSES, PAYMENT_METHODS } = require('../models/Payment');

const idParamValidator = [param('id').isMongoId().withMessage('Invalid payment id')];
const orderIdParamValidator = [param('orderId').isMongoId().withMessage('Invalid order id')];

const providerParamValidator = [
  param('provider').isIn(['zaad', 'edahab']).withMessage('provider must be zaad or edahab'),
];

const listMineValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(PAYMENT_STATUSES),
];

const listValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(PAYMENT_STATUSES),
  query('method').optional().isIn(PAYMENT_METHODS),
];

module.exports = {
  idParamValidator,
  orderIdParamValidator,
  providerParamValidator,
  listMineValidator,
  listValidator,
};
