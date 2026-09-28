const router = require('express').Router();
const ctrl = require('../controllers/customerReportsController');
const verifyCustomerToken = require('../middleware/customerAuth');

router.use(verifyCustomerToken);
router.get('/spending-summary', ctrl.getSpendingSummary);

module.exports = router;
