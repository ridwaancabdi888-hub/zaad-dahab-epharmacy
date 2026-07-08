const { Router } = require('express');
const cartController = require('../controllers/cart.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const {
  addItemValidator,
  updateItemValidator,
  medicineIdParamValidator,
} = require('../validators/cart.validator');

const router = Router();

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/items', addItemValidator, validate, cartController.addItem);
router.patch('/items/:medicineId', updateItemValidator, validate, cartController.updateItem);
router.delete(
  '/items/:medicineId',
  medicineIdParamValidator,
  validate,
  cartController.removeItem,
);
router.delete('/', cartController.clear);

module.exports = router;
