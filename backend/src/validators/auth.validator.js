const { body } = require('express-validator');

const registerValidator = [
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
];

const loginValidator = [
  body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const refreshValidator = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

module.exports = { registerValidator, loginValidator, refreshValidator };
