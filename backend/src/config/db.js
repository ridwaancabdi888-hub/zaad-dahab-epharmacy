const mongoose = require('mongoose');
const env = require('./env');
const logger = require('./logger');

mongoose.set('strictQuery', true);

async function connectDB(uri = env.mongoUri) {
  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB connection error: ${err.message}`);
  });

  await mongoose.connect(uri);
  logger.info(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
