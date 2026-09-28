const router = require('express').Router();
const ctrl = require('../controllers/settingsController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', ctrl.getSettings);
router.patch('/store', ctrl.updateStore);
router.patch('/thresholds', ctrl.updateThresholds);
router.patch('/profile', ctrl.updateProfile);
router.patch('/username', ctrl.updateUsername);

module.exports = router;