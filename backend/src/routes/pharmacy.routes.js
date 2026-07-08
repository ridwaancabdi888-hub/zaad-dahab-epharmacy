const { Router } = require('express');
const pharmacyController = require('../controllers/pharmacy.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate, optionalAuthenticate, authorize } = require('../middleware/auth.middleware');
const {
  createPharmacyValidator,
  updatePharmacyValidator,
  idParamValidator,
  verifyPharmacyValidator,
} = require('../validators/pharmacy.validator');

const router = Router();

router.get('/', optionalAuthenticate, pharmacyController.list);
router.get('/:id', idParamValidator, validate, pharmacyController.getById);

router.post(
  '/',
  authenticate,
  authorize('pharmacist', 'admin'),
  createPharmacyValidator,
  validate,
  pharmacyController.create,
);
router.patch(
  '/:id',
  authenticate,
  authorize('pharmacist', 'admin'),
  updatePharmacyValidator,
  validate,
  pharmacyController.update,
);
router.patch(
  '/:id/verify',
  authenticate,
  authorize('admin'),
  verifyPharmacyValidator,
  validate,
  pharmacyController.verify,
);
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  idParamValidator,
  validate,
  pharmacyController.remove,
);

module.exports = router;
