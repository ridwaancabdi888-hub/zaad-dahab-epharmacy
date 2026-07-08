const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

function validate(req, _res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const details = errors.array().map((err) => ({ field: err.path, message: err.msg }));
  return next(ApiError.badRequest('Validation failed', details));
}

module.exports = validate;
