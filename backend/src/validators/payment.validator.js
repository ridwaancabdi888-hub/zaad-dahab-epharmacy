const { param, query } = require('express-validator');
const { PAYMENT_STATUSES } = require('../models/Payment');

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

module.exports = {
  idParamValidator,
  orderIdParamValidator,
  providerParamValidator,
  listMineValidator,
};
