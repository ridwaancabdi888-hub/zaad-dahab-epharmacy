const { body, param, query } = require('express-validator');
const { DELIVERY_STATUSES } = require('../models/Delivery');

const idParamValidator = [param('id').isMongoId().withMessage('Invalid delivery id')];
const orderIdParamValidator = [param('orderId').isMongoId().withMessage('Invalid order id')];

const assignRiderValidator = [
  param('id').isMongoId().withMessage('Invalid delivery id'),
  body('riderId').isMongoId().withMessage('A valid riderId is required'),
];

const updateStatusValidator = [
  param('id').isMongoId().withMessage('Invalid delivery id'),
  body('status').isIn(DELIVERY_STATUSES).withMessage(`Status must be one of: ${DELIVERY_STATUSES.join(', ')}`),
];

const updateLocationValidator = [
  param('id').isMongoId().withMessage('Invalid delivery id'),
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('lat must be between -90 and 90').toFloat(),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('lng must be between -180 and 180').toFloat(),
];

const listDeliveryValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(DELIVERY_STATUSES),
];

module.exports = {
  idParamValidator,
  orderIdParamValidator,
  assignRiderValidator,
  updateStatusValidator,
  updateLocationValidator,
  listDeliveryValidator,
};
