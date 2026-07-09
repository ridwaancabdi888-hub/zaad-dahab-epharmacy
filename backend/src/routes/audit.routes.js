const { Router } = require('express');
const auditController = require('../controllers/audit.controller');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { listAuditLogValidator } = require('../validators/audit.validator');

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/', listAuditLogValidator, validate, auditController.list);

module.exports = router;
