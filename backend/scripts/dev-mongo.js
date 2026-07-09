/**
 * Starts a real, local MongoDB instance for development — no separate
 * MongoDB install required. Uses the same engine (`mongodb-memory-server`)
 * the test suite uses, but as a long-running dev database instead of a
 * per-test throwaway one: fixed port, kept alive until you Ctrl+C.
 *
 * Data does NOT persist across restarts — this is a convenience for local
 * development/demos, not a substitute for a real MongoDB deployment. For
 * anything you want to keep, install MongoDB Community Server and point
 * MONGO_URI in .env at it instead (see README.md "Getting started").
 *
 * Usage: npm run dev:mongo
 * Then, in .env: MONGO_URI=mongodb://127.0.0.1:27117/zaad_dahab_pharmacy
 */
const { MongoMemoryServer } = require('mongodb-memory-server');

const PORT = 27117;
const DB_NAME = 'zaad_dahab_pharmacy';

(async () => {
  const mongod = await MongoMemoryServer.create({
    instance: { port: PORT, dbName: DB_NAME },
  });

  console.log(`MongoDB (dev) ready at ${mongod.getUri(DB_NAME)}`);
  console.log('Press Ctrl+C to stop.');

  const shutdown = async () => {
    console.log('\nStopping MongoDB (dev)...');
    await mongod.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
})();
