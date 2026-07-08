const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const tokenService = require('./token.service');

async function register({ name, email, phone, password }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, phone, passwordHash });

  const tokens = await tokenService.issueTokenPair(user);
  return { user, ...tokens };
}

async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const match = await user.comparePassword(password);
  if (!match) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const tokens = await tokenService.issueTokenPair(user);
  return { user, ...tokens };
}

async function refresh(refreshToken) {
  if (!refreshToken) {
    throw ApiError.unauthorized('Refresh token is required');
  }

  const userId = await tokenService.rotateRefreshToken(refreshToken);
  if (!userId) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const tokens = await tokenService.issueTokenPair(user);
  return { user, ...tokens };
}

async function logout(refreshToken) {
  if (refreshToken) {
    await tokenService.revokeRefreshToken(refreshToken);
  }
}

module.exports = { register, login, refresh, logout };
