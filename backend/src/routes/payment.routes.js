const { Router } = require('express');
const paymentController = require('../controllers/payment.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  idParamValidator,
  orderIdParamValidator,
  providerParamValidator,
  listMineValidator,
} = require('../validators/payment.validator');

const router = Router();

// Public: a real Zaad/e-Dahab provider calls this directly (no user
// session), authenticated instead by an HMAC signature over the raw body.
router.post(
  '/webhook/:provider',
  providerParamValidator,
  validate,
  paymentController.webhook,
);

router.use(authenticate);

router.get('/', authorize('admin'), paymentController.list);
router.get('/me', listMineValidator, validate, paymentController.listMine);
router.get('/order/:orderId', orderIdParamValidator, validate, paymentController.getByOrderId);
router.get('/:id', idParamValidator, validate, paymentController.getById);
router.post(
  '/:id/confirm',
  authorize('admin'),
  idParamValidator,
  validate,
  paymentController.confirm,
);
router.post('/:id/verify', idParamValidator, validate, paymentController.verify);
router.post('/:id/retry', idParamValidator, validate, paymentController.retry);

module.exports = router;
