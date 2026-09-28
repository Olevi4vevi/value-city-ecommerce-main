const router = require('express').Router();
const ctrl = require('../controllers/stockController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', ctrl.getStockLevels);
router.patch('/:id/add', ctrl.addStock);
router.patch('/:id/remove', ctrl.removeStock);
router.patch('/:id/set', ctrl.setStock);

module.exports = router;