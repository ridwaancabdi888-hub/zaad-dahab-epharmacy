const { body, param, query } = require('express-validator');

const createMedicineValidator = [
  body('name').trim().isLength({ min: 2, max: 150 }).withMessage('Name must be 2-150 characters'),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }),
  body('category').isMongoId().withMessage('A valid category id is required'),
  body('pharmacy').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid pharmacy id'),
  body('manufacturer').optional({ values: 'falsy' }).trim(),
  body('images').optional().isArray().withMessage('Images must be an array of URLs'),
  body('images.*').optional().isString().trim(),
  body('unit').trim().notEmpty().withMessage('Unit is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number').toFloat(),
  body('discountPrice')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Discount price must be a non-negative number')
    .toFloat(),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer').toInt(),
  body('requiresPrescription').optional().isBoolean().toBoolean(),
  body('tags').optional().isArray(),
  body('tags.*').optional().isString().trim(),
];

const updateMedicineValidator = [
  param('id').isMongoId().withMessage('Invalid medicine id'),
  body('name').optional().trim().isLength({ min: 2, max: 150 }),
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }),
  body('category').optional().isMongoId().withMessage('Invalid category id'),
  body('manufacturer').optional({ values: 'falsy' }).trim(),
  body('images').optional().isArray(),
  body('images.*').optional().isString().trim(),
  body('unit').optional().trim().notEmpty(),
  body('price').optional().isFloat({ min: 0 }).toFloat(),
  body('discountPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }).toFloat(),
  body('stock').optional().isInt({ min: 0 }).toInt(),
  body('requiresPrescription').optional().isBoolean().toBoolean(),
  body('tags').optional().isArray(),
  body('tags.*').optional().isString().trim(),
  body('isActive').optional().isBoolean().toBoolean(),
];

const idParamValidator = [param('id').isMongoId().withMessage('Invalid medicine id')];

const listMedicineValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('category').optional().isMongoId(),
  query('pharmacy').optional().isMongoId(),
  query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('requiresPrescription').optional().isBoolean().toBoolean(),
];

module.exports = {
  createMedicineValidator,
  updateMedicineValidator,
  idParamValidator,
  listMedicineValidator,
};
