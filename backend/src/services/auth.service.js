const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const PasswordResetToken = require('../models/PasswordResetToken');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const logger = require('../config/logger');
const tokenService = require('./token.service');

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

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

async function forgotPassword(email) {
  const user = await User.findOne({ email: email.toLowerCase() });

  // Always resolve successfully, whether or not the account exists, so a
  // caller can't use this endpoint to enumerate registered emails.
  if (!user || !user.isActive) {
    return { sent: false };
  }

  await PasswordResetToken.deleteMany({ user: user._id });

  const rawToken = crypto.randomBytes(32).toString('hex');
  await PasswordResetToken.create({
    user: user._id,
    tokenHash: hashResetToken(rawToken),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  });

  // No transactional email provider is wired up yet (planned for a later
  // phase), so the sandbox behavior is to log the reset link and, outside
  // of production, hand the raw token back to the caller so the mobile
  // app can drive the reset flow end-to-end during development/testing.
  logger.info(`[sandbox email] Password reset requested for ${user.email}: token=${rawToken}`);

  return { sent: true, rawToken: env.nodeEnv === 'production' ? undefined : rawToken };
}

async function resetPassword(token, newPassword) {
  const record = await PasswordResetToken.findOne({ tokenHash: hashResetToken(token) });
  if (!record || record.expiresAt < new Date()) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  const user = await User.findById(record.user);
  if (!user || !user.isActive) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  user.passwordHash = await User.hashPassword(newPassword);
  await user.save();

  await PasswordResetToken.deleteOne({ _id: record._id });
  await RefreshToken.updateMany(
    { user: user._id, revokedAt: null },
    { revokedAt: new Date() },
  );
}

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword };
