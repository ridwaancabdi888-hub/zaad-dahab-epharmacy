const { Router } = require('express');
const categoryController = require('../controllers/category.controller');
const validate = require('../middleware/validate.middleware');
const auditLog = require('../middleware/audit.middleware');
const { authenticate, optionalAuthenticate, authorize } = require('../middleware/auth.middleware');
const {
  createCategoryValidator,
  updateCategoryValidator,
  idParamValidator,
} = require('../validators/category.validator');

const router = Router();

router.get('/', optionalAuthenticate, categoryController.list);
router.get('/:id', idParamValidator, validate, categoryController.getById);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  createCategoryValidator,
  validate,
  auditLog('category.create', 'Category'),
  categoryController.create,
);
router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  updateCategoryValidator,
  validate,
  auditLog('category.update', 'Category'),
  categoryController.update,
);
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  idParamValidator,
  validate,
  auditLog('category.delete', 'Category'),
  categoryController.remove,
);

module.exports = router;
