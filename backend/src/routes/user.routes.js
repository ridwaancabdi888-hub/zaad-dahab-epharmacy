const { Router } = require('express');
const userController = require('../controllers/user.controller');
const validate = require('../middleware/validate.middleware');
const auditLog = require('../middleware/audit.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  updateProfileValidator,
  addressValidator,
  updateAddressValidator,
  addressIdParamValidator,
  medicineIdParamValidator,
  idParamValidator,
  listUsersValidator,
  adminUpdateValidator,
  adminCreateValidator,
} = require('../validators/user.validator');

const router = Router();

router.use(authenticate);

router.get('/me', userController.getMe);
router.patch('/me', updateProfileValidator, validate, userController.updateMe);
router.post('/me/addresses', addressValidator, validate, userController.addAddress);
router.patch(
  '/me/addresses/:addressId',
  updateAddressValidator,
  validate,
  userController.updateAddress,
);
router.delete(
  '/me/addresses/:addressId',
  addressIdParamValidator,
  validate,
  userController.removeAddress,
);

router.get('/me/wishlist', userController.getWishlist);
router.post(
  '/me/wishlist/:medicineId',
  medicineIdParamValidator,
  validate,
  userController.addToWishlist,
);
router.delete(
  '/me/wishlist/:medicineId',
  medicineIdParamValidator,
  validate,
  userController.removeFromWishlist,
);

router.get('/', authorize('admin', 'pharmacist'), listUsersValidator, validate, userController.list);
router.post(
  '/',
  authorize('admin', 'pharmacist'),
  adminCreateValidator,
  validate,
  auditLog('user.create', 'User'),
  userController.adminCreate,
);
router.get('/:id', authorize('admin', 'pharmacist'), idParamValidator, validate, userController.getById);
router.patch(
  '/:id',
  authorize('admin', 'pharmacist'),
  adminUpdateValidator,
  validate,
  auditLog('user.role_update', 'User'),
  userController.adminUpdate,
);

module.exports = router;
