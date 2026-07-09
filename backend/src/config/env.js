const dotenv = require('dotenv');
const { findProductionConfigProblems } = require('./validateProductionEnv');

dotenv.config({ quiet: true });

const required = [
  'MONGO_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

const isTest = process.env.NODE_ENV === 'test';
const isProduction = process.env.NODE_ENV === 'production';

// Tests provide their own in-memory Mongo URI and throwaway secrets via
// tests/setup.js, so the hard failures below only apply outside of Jest.
if (!isTest) {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Fail fast in production rather than silently running with a
// misconfiguration that would otherwise only surface as a security
// incident — see `validateProductionEnv.js` for what's checked.
if (isProduction) {
  const problems = findProductionConfigProblems(process.env);
  if (problems.length > 0) {
    throw new Error(`Refusing to start in production with insecure configuration:\n- ${problems.join('\n- ')}`);
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
  apiRateLimit: {
    windowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.API_RATE_LIMIT_MAX) || 300,
  },
  payments: {
    // Real merchant credentials for Zaad/e-Dahab are not available in this
    // environment; when unset, the gateway service runs in sandbox mode
    // (see `paymentGateway.service.js`). Webhook secrets are still required
    // so the sandbox webhook endpoint can demonstrate real HMAC signature
    // verification end to end.
    zaadWebhookSecret: process.env.ZAAD_WEBHOOK_SECRET || 'dev-zaad-webhook-secret',
    edahabWebhookSecret: process.env.EDAHAB_WEBHOOK_SECRET || 'dev-edahab-webhook-secret',
  },
};

module.exports = env;
