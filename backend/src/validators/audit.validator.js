const { query } = require('express-validator');

const listAuditLogValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('action').optional().trim(),
  query('resourceType').optional().trim(),
  query('actor').optional().isMongoId().withMessage('Invalid actor id'),
  query('from').optional().isISO8601().withMessage('from must be an ISO8601 date'),
  query('to').optional().isISO8601().withMessage('to must be an ISO8601 date'),
];

module.exports = { listAuditLogValidator };
