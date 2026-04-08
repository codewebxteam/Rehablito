const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const {
    getProfile,
    getGeofence,
    checkIn,
    checkOut,
    getDutyStatus,
    getAttendanceHistory,
    getAttendanceCalendar,
    getDashboard,
} = require('../controllers/staff.app.controller');

// All routes require authentication and staff role
router.use(protect, authorize('staff', 'branch_manager'));

// Profile
router.get('/profile', getProfile);

// Dashboard
router.get('/dashboard', getDashboard);

// Geofence config for client-side validation
router.get('/geofence', getGeofence);

// Attendance actions
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/duty-status', getDutyStatus);

// Attendance data
router.get('/attendance/history', getAttendanceHistory);
router.get('/attendance/calendar', getAttendanceCalendar);

module.exports = router;
