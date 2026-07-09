const { Router } = require('express');
const couponController = require('../controllers/coupon.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  createCouponValidator,
  updateCouponValidator,
  idParamValidator,
  listCouponValidator,
} = require('../validators/coupon.validator');

const router = Router();

router.use(authenticate, authorize('admin'));

router.post('/', createCouponValidator, validate, couponController.create);
router.get('/', listCouponValidator, validate, couponController.list);
router.get('/:id', idParamValidator, validate, couponController.getById);
router.patch('/:id', updateCouponValidator, validate, couponController.update);
router.delete('/:id', idParamValidator, validate, couponController.remove);

module.exports = router;
