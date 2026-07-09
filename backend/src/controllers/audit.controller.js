const auditService = require('../services/audit.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

const list = catchAsync(async (req, res) => {
  const { items, meta } = await auditService.list(req.query);
  return new ApiResponse(200, { items, meta }, 'Audit logs retrieved').send(res);
});

module.exports = { list };
