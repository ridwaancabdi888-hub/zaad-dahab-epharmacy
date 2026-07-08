const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const { connectDB } = require('./config/db');

async function start() {
  await connectDB();

  const server = app.listen(env.port, () => {
    logger.info(`Zaad/e-Dahab API listening on port ${env.port} [${env.nodeEnv}]`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  logger.error(`Failed to start server: ${err.stack || err.message}`);
  process.exit(1);
});
