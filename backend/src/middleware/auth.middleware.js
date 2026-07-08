const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');

const authenticate = catchAsync(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Authentication token is required');
  }

  const token = header.slice('Bearer '.length);

  let payload;
  try {
    payload = jwt.verify(token, env.jwt.accessSecret);
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Invalid or expired access token');
  }

  req.user = user;
  next();
});

function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
