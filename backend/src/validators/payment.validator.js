const { param } = require('express-validator');

const idParamValidator = [param('id').isMongoId().withMessage('Invalid payment id')];
const orderIdParamValidator = [param('orderId').isMongoId().withMessage('Invalid order id')];

module.exports = { idParamValidator, orderIdParamValidator };
