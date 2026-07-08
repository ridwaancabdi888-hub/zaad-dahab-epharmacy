const { Router } = require('express');
const orderController = require('../controllers/order.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const {
  checkoutValidator,
  idParamValidator,
  updateStatusValidator,
  listOrderValidator,
} = require('../validators/order.validator');

const router = Router();

router.use(authenticate);

router.post('/', checkoutValidator, validate, orderController.checkout);
router.get('/', listOrderValidator, validate, orderController.list);
router.get('/:id', idParamValidator, validate, orderController.getById);
router.patch('/:id/status', updateStatusValidator, validate, orderController.updateStatus);
router.patch('/:id/cancel', idParamValidator, validate, orderController.cancel);

module.exports = router;
