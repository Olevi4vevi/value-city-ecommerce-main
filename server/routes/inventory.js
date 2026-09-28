const router = require('express').Router();
const ctrl = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/summary', ctrl.getSummary);

module.exports = router;