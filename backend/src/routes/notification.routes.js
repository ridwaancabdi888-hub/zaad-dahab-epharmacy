const { Router } = require('express');
const notificationController = require('../controllers/notification.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { idParamValidator, listMineValidator } = require('../validators/notification.validator');

const router = Router();

router.use(authenticate);

router.get('/me', listMineValidator, validate, notificationController.listMine);
router.get('/me/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', idParamValidator, validate, notificationController.markRead);

module.exports = router;
