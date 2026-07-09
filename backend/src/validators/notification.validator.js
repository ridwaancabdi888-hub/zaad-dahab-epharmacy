const { param, query } = require('express-validator');

const idParamValidator = [param('id').isMongoId().withMessage('Invalid notification id')];

const listMineValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('isRead').optional().isBoolean().toBoolean(),
];

module.exports = { idParamValidator, listMineValidator };
