const router = require('express').Router();
const ctrl = require('../controllers/usersController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/', ctrl.listUsers);

module.exports = router;
