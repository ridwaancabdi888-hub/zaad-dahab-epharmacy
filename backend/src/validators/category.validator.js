const { body, param } = require('express-validator');

const createCategoryValidator = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  body('icon').optional({ values: 'falsy' }).trim(),
  body('image').optional({ values: 'falsy' }).trim(),
  body('parent').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid parent category id'),
  body('sortOrder').optional().isInt().toInt(),
];

const updateCategoryValidator = [
  param('id').isMongoId().withMessage('Invalid category id'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
  body('icon').optional({ values: 'falsy' }).trim(),
  body('image').optional({ values: 'falsy' }).trim(),
  body('parent').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid parent category id'),
  body('sortOrder').optional().isInt().toInt(),
  body('isActive').optional().isBoolean().toBoolean(),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid category id')];

module.exports = { createCategoryValidator, updateCategoryValidator, idParamValidator };
