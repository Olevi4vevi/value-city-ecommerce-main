const router = require('express').Router();
const ctrl = require('../controllers/reportsController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/key-metrics', ctrl.getKeyMetrics);
router.get('/sales-trend', ctrl.getSalesTrend);
router.get('/order-stats', ctrl.getOrderStats);

module.exports = router;
