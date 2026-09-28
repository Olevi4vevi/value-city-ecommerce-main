const router = require('express').Router();
const ctrl = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);

router.post('/', authMiddleware, ctrl.create);
router.put('/:id', authMiddleware, ctrl.update);
router.delete('/:id', authMiddleware, ctrl.remove);
router.patch('/:id/status', authMiddleware, ctrl.updateStatus);
router.patch('/:id/restore', authMiddleware, ctrl.restore);

module.exports = router;