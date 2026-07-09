const reportService = require('../services/report.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

const dashboard = catchAsync(async (req, res) => {
  const data = await reportService.dashboard();
  return new ApiResponse(200, data, 'Dashboard report retrieved').send(res);
});

module.exports = { dashboard };
