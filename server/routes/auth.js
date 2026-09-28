const router = require('express').Router();
const { login, changePassword } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/login', login);
router.patch('/change-password', authMiddleware, changePassword);

module.exports = router;