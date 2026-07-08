const ApiResponse = require('../utils/ApiResponse');

const getMe = (req, res) => {
  return new ApiResponse(200, req.user, 'Current user retrieved').send(res);
};

module.exports = { getMe };
