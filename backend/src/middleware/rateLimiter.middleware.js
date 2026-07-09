const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const authRateLimiter = rateLimit({
  windowMs: env.authRateLimit.windowMs,
  max: env.authRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.nodeEnv === 'test',
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
});

/**
 * A much more generous, app-wide backstop so no single client (or bug in
 * a client) can hammer expensive endpoints — search, report aggregation,
 * pagination — into a denial of service. `/auth` routes additionally get
 * the much stricter `authRateLimiter` above; this one covers everything
 * else, including public/unauthenticated GETs.
 */
const apiRateLimiter = rateLimit({
  windowMs: env.apiRateLimit.windowMs,
  max: env.apiRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.nodeEnv === 'test',
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
});

module.exports = { authRateLimiter, apiRateLimiter };
