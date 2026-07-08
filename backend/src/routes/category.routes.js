const { Router } = require('express');
const categoryController = require('../controllers/category.controller');
const validate = require('../middleware/validate.middleware');
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
  categoryController.create,
);
router.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  updateCategoryValidator,
  validate,
  categoryController.update,
);
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  idParamValidator,
  validate,
  categoryController.remove,
);

module.exports = router;
