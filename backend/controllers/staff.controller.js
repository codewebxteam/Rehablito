const User = require('../models/User');
const Attendance = require('../models/Attendance');

// GET /api/admin/staff?branch=ID&role=staff
const getStaff = async (req, res) => {
    try {
        const filter = { role: { $in: ['staff', 'branch_manager'] } };
        if (req.query.branch) filter.branchId = req.query.branch;
        if (req.query.role) filter.role = req.query.role;

        const staff = await User.find(filter)
            .select('-password -otp -otpExpires')
            .populate('branchId', 'name')
            .sort({ name: 1 });
        res.json({ success: true, count: staff.length, data: staff });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/admin/staff/:id/transfer
const transferStaff = async (req, res) => {
    try {
        const { branchId } = req.body;
        if (!branchId) return res.status(400).json({ success: false, message: 'New branchId is required' });

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'Staff not found' });
        if (!['staff', 'branch_manager'].includes(user.role)) {
            return res.status(400).json({ success: false, message: 'Only staff/managers can be transferred' });
        }

        user.branchId = branchId;
        await user.save();

        const updated = await User.findById(user._id).select('-password -otp -otpExpires').populate('branchId', 'name');
        res.json({ success: true, message: 'Staff transferred successfully', data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/admin/attendance?branch=ID&date=2026-03-29
const getAttendance = async (req, res) => {
    try {
        const filter = {};
        if (req.query.branch) filter.branchId = req.query.branch;
        if (req.query.date) {
            const d = new Date(req.query.date);
            filter.date = { $gte: new Date(d.setHours(0, 0, 0, 0)), $lt: new Date(d.setHours(23, 59, 59, 999)) };
        }
        if (req.query.userId) filter.userId = req.query.userId;

        const attendance = await Attendance.find(filter)
            .populate('userId', 'name staffId role')
            .populate('branchId', 'name')
            .sort({ date: -1 });
        res.json({ success: true, count: attendance.length, data: attendance });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/admin/attendance
const markAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.create(req.body);
        res.status(201).json({ success: true, data: attendance });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Attendance already marked for this user on this date' });
        }
        res.status(400).json({ success: false, message: err.message });
    }
};

// GET /api/admin/attendance/stats?branch=ID
const getAttendanceStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const filter = { date: { $gte: today, $lt: tomorrow } };
        if (req.query.branch) filter.branchId = req.query.branch;

        const [present, absent, leave, halfDay] = await Promise.all([
            Attendance.countDocuments({ ...filter, status: 'present' }),
            Attendance.countDocuments({ ...filter, status: 'absent' }),
            Attendance.countDocuments({ ...filter, status: 'leave' }),
            Attendance.countDocuments({ ...filter, status: 'half_day' }),
        ]);

        res.json({
            success: true,
            data: { date: today, present, absent, leave, halfDay, total: present + absent + leave + halfDay }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getStaff, transferStaff, getAttendance, markAttendance, getAttendanceStats };
