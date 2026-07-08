const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { authRateLimiter } = require('../middleware/rateLimiter.middleware');
const {
  registerValidator,
  loginValidator,
  refreshValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/auth.validator');

const router = Router();

router.use(authRateLimiter);

router.post('/register', registerValidator, validate, authController.register);
router.post('/login', loginValidator, validate, authController.login);
router.post('/refresh-token', refreshValidator, validate, authController.refresh);
router.post('/logout', authController.logout);
router.post(
  '/forgot-password',
  forgotPasswordValidator,
  validate,
  authController.forgotPassword,
);
router.post('/reset-password', resetPasswordValidator, validate, authController.resetPassword);

module.exports = router;
