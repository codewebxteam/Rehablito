const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.post('/order', protect, authorize('parent'), paymentController.createOrder);
router.post('/verify', protect, authorize('parent'), paymentController.verifyPayment);

module.exports = router;
