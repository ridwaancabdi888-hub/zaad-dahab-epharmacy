const { Router } = require('express');
const medicineController = require('../controllers/medicine.controller');
const validate = require('../middleware/validate.middleware');
const auditLog = require('../middleware/audit.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  createMedicineValidator,
  updateMedicineValidator,
  idParamValidator,
  listMedicineValidator,
} = require('../validators/medicine.validator');

const router = Router();

router.get('/', listMedicineValidator, validate, medicineController.list);
router.get('/:id', idParamValidator, validate, medicineController.getById);

router.post(
  '/',
  authenticate,
  authorize('pharmacist', 'admin'),
  createMedicineValidator,
  validate,
  auditLog('medicine.create', 'Medicine'),
  medicineController.create,
);
router.patch(
  '/:id',
  authenticate,
  authorize('pharmacist', 'admin'),
  updateMedicineValidator,
  validate,
  auditLog('medicine.update', 'Medicine'),
  medicineController.update,
);
router.delete(
  '/:id',
  authenticate,
  authorize('pharmacist', 'admin'),
  idParamValidator,
  validate,
  auditLog('medicine.delete', 'Medicine'),
  medicineController.remove,
);

module.exports = router;
