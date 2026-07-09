const { Router } = require('express');
const reportController = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/dashboard', reportController.dashboard);

module.exports = router;
