const { Router } = require('express');
const paymentController = require('../controllers/payment.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { idParamValidator, orderIdParamValidator } = require('../validators/payment.validator');

const router = Router();

router.use(authenticate);

router.get('/', authorize('admin'), paymentController.list);
router.get('/order/:orderId', orderIdParamValidator, validate, paymentController.getByOrderId);
router.get('/:id', idParamValidator, validate, paymentController.getById);
router.post(
  '/:id/confirm',
  authorize('admin'),
  idParamValidator,
  validate,
  paymentController.confirm,
);

module.exports = router;
