const router = require('express').Router();
const ctrl = require('../controllers/categoryController');
const authMiddleware = require('../middleware/auth');

router.get('/', ctrl.getAll);

router.post('/', authMiddleware, ctrl.create);
router.put('/:id', authMiddleware, ctrl.update);
router.delete('/:id', authMiddleware, ctrl.remove);

module.exports = router;