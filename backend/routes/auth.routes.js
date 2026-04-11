const express = require('express');
const router = express.Router();
const { register, login, getMe, requestOtp, verifyOtp } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);

module.exports = router;
