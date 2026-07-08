const { body, param } = require('express-validator');

const addItemValidator = [
  body('medicineId').isMongoId().withMessage('A valid medicineId is required'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1').toInt(),
];

const updateItemValidator = [
  param('medicineId').isMongoId().withMessage('Invalid medicine id'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be 0 or greater').toInt(),
];

const medicineIdParamValidator = [
  param('medicineId').isMongoId().withMessage('Invalid medicine id'),
];

module.exports = { addItemValidator, updateItemValidator, medicineIdParamValidator };
