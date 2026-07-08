const dotenv = require('dotenv');

dotenv.config({ quiet: true });

const required = [
  'MONGO_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

// Tests provide their own in-memory Mongo URI and throwaway secrets via
// tests/setup.js, so the hard failure below only applies outside of Jest.
if (process.env.NODE_ENV !== 'test') {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  mongoUri: process.env.MONGO_URI,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  corsOrigin: process.env.CORS_ORIGIN || '*',
  authRateLimit: {
    windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  },
};

module.exports = env;
