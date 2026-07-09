const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const YAML = require('yaml');
const swaggerUi = require('swagger-ui-express');

const env = require('./config/env');
const logger = require('./config/logger');
const routes = require('./routes');
const sanitizeBody = require('./middleware/sanitizeBody.middleware');
const { apiRateLimiter } = require('./middleware/rateLimiter.middleware');
const notFound = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/error.middleware');

const app = express();

app.disable('x-powered-by');
// CSP is a browser-page protection; this is a JSON-only API with a single
// HTML page (the Swagger UI docs below), whose inline styles/scripts CSP's
// defaults would otherwise block. Helmet's other headers (X-Frame-Options,
// X-Content-Type-Options, HSTS, ...) stay on.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(compression());
app.use(apiRateLimiter);
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

const openapiDocument = YAML.parse(fs.readFileSync(path.join(__dirname, '..', 'openapi.yaml'), 'utf8'));
app.get('/api-docs.json', (_req, res) => res.json(openapiDocument));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

app.use(env.apiPrefix, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
