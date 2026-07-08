const env = require('../config/env');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

function toApiError(err) {
  if (err instanceof ApiError) {
    return err;
  }

  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return ApiError.badRequest('Validation failed', details);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return ApiError.conflict(`${field} is already in use`);
  }

  if (err.name === 'CastError') {
    return ApiError.badRequest(`Invalid value for ${err.path}`);
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Invalid or expired token');
  }

  return new ApiError(500, env.nodeEnv === 'production' ? 'Internal server error' : err.message);
}

function errorHandler(err, req, res, _next) {
  const apiError = toApiError(err);

  if (apiError.statusCode >= 500) {
    logger.error(err.stack || err.message);
  }

  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    ...(apiError.details ? { details: apiError.details } : {}),
    ...(env.nodeEnv === 'development' && apiError.statusCode >= 500 ? { stack: err.stack } : {}),
  });
}

module.exports = errorHandler;
