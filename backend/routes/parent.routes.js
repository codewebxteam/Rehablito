const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const {
    getDashboard,
    getAttendance,
    getTherapySchedule,
    getFeedbacks,
    createFeedback,
    getProfile,
    getBilling
} = require('../controllers/parent.controller');
const { getMessagesForParent } = require('../controllers/message.controller');

// All routes require authentication and 'parent' role
router.use(protect, authorize('parent'));

router.get('/dashboard', getDashboard);
router.get('/attendance', getAttendance);
router.get('/therapy', getTherapySchedule);
router.route('/feedbacks').get(getFeedbacks).post(createFeedback);
router.get('/profile', getProfile);
router.get('/billing', getBilling);
router.get('/messages', getMessagesForParent);

module.exports = router;
