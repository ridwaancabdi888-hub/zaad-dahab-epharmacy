const crypto = require('crypto');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const env = require('../config/env');

class MongoRateLimitStore {
  constructor(prefix) {
    this.prefix = prefix;
    this.windowMs = 60_000;
    this.localKeys = false;
    this.indexPromise = null;
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  keyFor(key) {
    return crypto.createHash('sha256').update(`${this.prefix}:${key}`).digest('hex');
  }

  collection() {
    return mongoose.connection.collection('rate_limit_buckets');
  }

  async ensureExpiryIndex() {
    if (!this.indexPromise) {
      this.indexPromise = this.collection()
        .createIndex(
          { expiresAt: 1 },
          { expireAfterSeconds: 0, name: 'rate_limit_expiry' },
        )
        .catch((error) => {
          this.indexPromise = null;
          throw error;
        });
    }
    await this.indexPromise;
  }

  async increment(key) {
    await this.ensureExpiryIndex();
    const windowMs = this.windowMs;

    const result = await this.collection().findOneAndUpdate(
      { _id: this.keyFor(key) },
      [
        {
          $set: {
            expiresAt: {
              $cond: [
                {
                  $or: [
                    { $eq: [{ $type: '$expiresAt' }, 'missing'] },
                    { $lte: ['$expiresAt', '$$NOW'] },
                  ],
                },
                { $dateAdd: { startDate: '$$NOW', unit: 'millisecond', amount: windowMs } },
                '$expiresAt',
              ],
            },
            totalHits: {
              $cond: [
                {
                  $or: [
                    { $eq: [{ $type: '$expiresAt' }, 'missing'] },
                    { $lte: ['$expiresAt', '$$NOW'] },
                  ],
                },
                1,
                { $add: [{ $ifNull: ['$totalHits', 0] }, 1] },
              ],
            },
            updatedAt: '$$NOW',
          },
        },
      ],
      { upsert: true, returnDocument: 'after' },
    );

    // MongoDB driver versions before v6 wrapped the document in `value`;
    // supporting both shapes keeps this store compatible with test/dev tooling.
    const document = result && result.value ? result.value : result;
    if (!document) throw new Error('MongoDB rate limiter returned no counter');

    return {
      totalHits: Number(document.totalHits),
      resetTime: new Date(document.expiresAt),
    };
  }

  async decrement(key) {
    await this.collection().updateOne(
      { _id: this.keyFor(key) },
      [{ $set: { totalHits: { $max: [{ $subtract: ['$totalHits', 1] }, 0] } } }],
    );
  }

  async resetKey(key) {
    await this.collection().deleteOne({ _id: this.keyFor(key) });
  }
}

const authRateLimiter = rateLimit({
  windowMs: env.authRateLimit.windowMs,
  max: env.authRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  store: new MongoRateLimitStore('auth'),
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
  store: new MongoRateLimitStore('api'),
  skip: () => env.nodeEnv === 'test',
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
});

module.exports = { authRateLimiter, apiRateLimiter, MongoRateLimitStore };
