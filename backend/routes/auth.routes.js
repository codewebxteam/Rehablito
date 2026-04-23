const express = require('express');
const router = express.Router();
const { register, login, adminLogin, managerLogin, getMe, requestOtp, verifyOtp, changePassword } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.post('/manager/login', managerLogin);
router.get('/me', protect, getMe);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/change-password', protect, changePassword);

module.exports = router;
