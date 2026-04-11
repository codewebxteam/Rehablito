const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// Super Admin Route
router.get('/admin/dashboard', protect, authorize('super_admin'), (req, res) => {
    res.json({ success: true, message: 'Welcome to the Super Admin Dashboard', user: req.user });
});

// Branch Manager Route
router.get('/manager/dashboard', protect, authorize('super_admin', 'branch_manager'), (req, res) => {
    res.json({ success: true, message: 'Welcome to the Manager Dashboard', user: req.user });
});

// Staff/Therapist Route
router.get('/staff/dashboard', protect, authorize('super_admin', 'branch_manager', 'staff'), (req, res) => {
    res.json({ success: true, message: 'Welcome to the Staff Dashboard', user: req.user });
});

// Any Authenticated User
router.get('/profile', protect, (req, res) => {
    res.json({ success: true, message: 'Welcome to your Profile', user: req.user });
});

module.exports = router;
