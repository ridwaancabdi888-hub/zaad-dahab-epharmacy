const { Router } = require('express');
const ApiResponse = require('../utils/ApiResponse');

const router = Router();

router.get('/', (_req, res) => {
  return new ApiResponse(
    200,
    { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() },
    'Service is healthy',
  ).send(res);
});

module.exports = router;
