const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

const env = require('./config/env');
const logger = require('./config/logger');
const routes = require('./routes');
const sanitizeBody = require('./middleware/sanitizeBody.middleware');
const notFound = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/error.middleware');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(compression());
app.use(
  express.json({
    limit: '10kb',
    // Preserve the exact bytes for HMAC-signed webhook payloads (see
    // payment.controller.js#webhook) — verifying against a re-serialized
    // req.body could mismatch a real provider's signature over the
    // original bytes.
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(sanitizeBody);

if (env.nodeEnv !== 'test') {
  app.use(
    morgan(env.nodeEnv === 'production' ? 'combined' : 'dev', {
      stream: { write: (message) => logger.http(message.trim()) },
    }),
  );
}

app.use(env.apiPrefix, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
