const { Router } = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const healthRoutes = require('./health.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

module.exports = router;
