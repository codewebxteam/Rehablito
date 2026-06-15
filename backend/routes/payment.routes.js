const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/order', protect, authorize('parent'), paymentController.createOrder);
router.post('/verify', protect, authorize('parent'), paymentController.verifyPayment);
router.post('/manual', protect, authorize('parent'), upload.single('screenshot'), paymentController.submitManualPayment);

module.exports = router;
