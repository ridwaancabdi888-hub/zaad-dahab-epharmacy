const { body, param, query } = require('express-validator');
const { ROLES } = require('../models/User');

const updateProfileValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^\+?[0-9]{7,15}$/)
    .withMessage('Phone number must be 7-15 digits, optionally starting with +'),
];

const addressValidator = [
  body('label').optional({ values: 'falsy' }).trim(),
  body('street').trim().notEmpty().withMessage('Street is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('lat').optional().isFloat().toFloat(),
  body('lng').optional().isFloat().toFloat(),
  body('isDefault').optional().isBoolean().toBoolean(),
];

const updateAddressValidator = [
  param('addressId').isMongoId().withMessage('Invalid address id'),
  body('label').optional({ values: 'falsy' }).trim(),
  body('street').optional().trim().notEmpty(),
  body('city').optional().trim().notEmpty(),
  body('lat').optional().isFloat().toFloat(),
  body('lng').optional().isFloat().toFloat(),
  body('isDefault').optional().isBoolean().toBoolean(),
];

const addressIdParamValidator = [
  param('addressId').isMongoId().withMessage('Invalid address id'),
];

const medicineIdParamValidator = [
  param('medicineId').isMongoId().withMessage('Invalid medicine id'),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid user id')];

const listUsersValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('role').optional().isIn(ROLES),
];

const adminUpdateValidator = [
  param('id').isMongoId().withMessage('Invalid user id'),
  body('role').optional().isIn(ROLES),
  body('isActive').optional().isBoolean().toBoolean(),
];

const adminCreateValidator = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^\+?[0-9]{7,15}$/)
    .withMessage('Phone number must be 7-15 digits, optionally starting with +'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain at least one letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  body('role').optional().isIn(ROLES).withMessage(`role must be one of: ${ROLES.join(', ')}`),
];

module.exports = {
  updateProfileValidator,
  addressValidator,
  updateAddressValidator,
  addressIdParamValidator,
  medicineIdParamValidator,
  idParamValidator,
  listUsersValidator,
  adminUpdateValidator,
  adminCreateValidator,
};
