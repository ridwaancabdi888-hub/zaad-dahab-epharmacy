const { body, param } = require('express-validator');

const createPharmacyValidator = [
  body('name').trim().isLength({ min: 2, max: 150 }).withMessage('Name must be 2-150 characters'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }),
  body('email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Invalid email address'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  body('licenseNumber').trim().notEmpty().withMessage('License number is required'),
  body('logo').optional({ values: 'falsy' }).trim(),
  body('coverImage').optional({ values: 'falsy' }).trim(),
  body('address.street').trim().notEmpty().withMessage('Address street is required'),
  body('address.city').trim().notEmpty().withMessage('Address city is required'),
  body('address.lat').optional().isFloat().toFloat(),
  body('address.lng').optional().isFloat().toFloat(),
  body('operatingHours.open').optional({ values: 'falsy' }).trim(),
  body('operatingHours.close').optional({ values: 'falsy' }).trim(),
  body('owner').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid owner id'),
];

const updatePharmacyValidator = [
  param('id').isMongoId().withMessage('Invalid pharmacy id'),
  body('name').optional().trim().isLength({ min: 2, max: 150 }),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }),
  body('email').optional({ values: 'falsy' }).trim().isEmail(),
  body('phone').optional().trim().notEmpty(),
  body('logo').optional({ values: 'falsy' }).trim(),
  body('coverImage').optional({ values: 'falsy' }).trim(),
  body('address.street').optional().trim().notEmpty(),
  body('address.city').optional().trim().notEmpty(),
  body('address.lat').optional().isFloat().toFloat(),
  body('address.lng').optional().isFloat().toFloat(),
  body('operatingHours.open').optional({ values: 'falsy' }).trim(),
  body('operatingHours.close').optional({ values: 'falsy' }).trim(),
  body('isActive').optional().isBoolean().toBoolean(),
  body('isVerified').optional().isBoolean().toBoolean(),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid pharmacy id')];

const verifyPharmacyValidator = [
  param('id').isMongoId().withMessage('Invalid pharmacy id'),
  body('isVerified').isBoolean().withMessage('isVerified must be a boolean').toBoolean(),
];

module.exports = {
  createPharmacyValidator,
  updatePharmacyValidator,
  idParamValidator,
  verifyPharmacyValidator,
};
