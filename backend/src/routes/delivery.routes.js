const { Router } = require('express');
const deliveryController = require('../controllers/delivery.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  idParamValidator,
  orderIdParamValidator,
  assignRiderValidator,
  updateStatusValidator,
  updateLocationValidator,
  listDeliveryValidator,
} = require('../validators/delivery.validator');

const router = Router();

router.use(authenticate);

router.get('/', authorize('admin', 'rider'), listDeliveryValidator, validate, deliveryController.list);
router.get('/order/:orderId', orderIdParamValidator, validate, deliveryController.getByOrderId);
router.get('/:id', idParamValidator, validate, deliveryController.getById);

router.patch(
  '/:id/assign',
  authorize('admin', 'pharmacist'),
  assignRiderValidator,
  validate,
  deliveryController.assignRider,
);
router.patch(
  '/:id/status',
  authorize('admin', 'rider'),
  updateStatusValidator,
  validate,
  deliveryController.updateStatus,
);
router.patch(
  '/:id/location',
  authorize('admin', 'rider'),
  updateLocationValidator,
  validate,
  deliveryController.updateLocation,
);

module.exports = router;
