const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const ms = require('ms');
const env = require('../config/env');
const RefreshToken = require('../models/RefreshToken');

function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function issueRefreshToken(user) {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ sub: user._id.toString(), jti }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + ms(env.jwt.refreshExpiresIn)),
  });

  return token;
}

async function issueTokenPair(user) {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(user),
    issueRefreshToken(user),
  ]);
  return { accessToken, refreshToken };
}

async function rotateRefreshToken(oldToken) {
  let payload;
  try {
    payload = jwt.verify(oldToken, env.jwt.refreshSecret);
  } catch {
    return null;
  }

  const record = await RefreshToken.findOne({ tokenHash: hashToken(oldToken) });
  if (!record || !record.isActive() || record.user.toString() !== payload.sub) {
    return null;
  }

  record.revokedAt = new Date();
  await record.save();

  return payload.sub;
}

async function revokeRefreshToken(token) {
  const record = await RefreshToken.findOne({ tokenHash: hashToken(token) });
  if (record && record.isActive()) {
    record.revokedAt = new Date();
    await record.save();
  }
}

module.exports = {
  signAccessToken,
  issueRefreshToken,
  issueTokenPair,
  rotateRefreshToken,
  revokeRefreshToken,
  hashToken,
};
