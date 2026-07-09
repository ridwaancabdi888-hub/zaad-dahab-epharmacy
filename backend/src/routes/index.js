const { Router } = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const healthRoutes = require('./health.routes');
const categoryRoutes = require('./category.routes');
const pharmacyRoutes = require('./pharmacy.routes');
const medicineRoutes = require('./medicine.routes');
const cartRoutes = require('./cart.routes');
const orderRoutes = require('./order.routes');
const paymentRoutes = require('./payment.routes');
const deliveryRoutes = require('./delivery.routes');
const couponRoutes = require('./coupon.routes');
const notificationRoutes = require('./notification.routes');
const reportRoutes = require('./report.routes');
const auditRoutes = require('./audit.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/pharmacies', pharmacyRoutes);
router.use('/medicines', medicineRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/deliveries', deliveryRoutes);
router.use('/coupons', couponRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/audit-logs', auditRoutes);

module.exports = router;
