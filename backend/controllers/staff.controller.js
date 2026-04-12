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

// POST /api/admin/staff
const createStaff = async (req, res) => {
    try {
        const { name, email, password, role, branchId, staffId, mobileNumber } = req.body;

        if (!['staff', 'branch_manager'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Role must be staff or branch_manager' });
        }
        if (!branchId) {
            return res.status(400).json({ success: false, message: 'branchId is required' });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ success: false, message: 'User with this email already exists' });
        }

        const user = await User.create({ name, email, password, role, branchId, staffId, mobileNumber });
        const populated = await User.findById(user._id)
            .select('-password -otp -otpExpires')
            .populate('branchId', 'name');
        res.status(201).json({ success: true, data: populated });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// PUT /api/admin/staff/:id
const updateStaff = async (req, res) => {
    try {
        const { name, email, role, branchId, staffId, mobileNumber, password } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'Staff not found' });
        if (!['staff', 'branch_manager'].includes(user.role)) {
            return res.status(400).json({ success: false, message: 'Only staff/managers can be edited here' });
        }

        if (role && !['staff', 'branch_manager'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Role must be staff or branch_manager' });
        }

        if (email && email !== user.email) {
            const duplicate = await User.findOne({ email, _id: { $ne: user._id } });
            if (duplicate) return res.status(400).json({ success: false, message: 'Email already in use' });
            user.email = email;
        }

        if (name !== undefined) user.name = name;
        if (role !== undefined) user.role = role;
        if (branchId !== undefined) user.branchId = branchId;
        if (staffId !== undefined) user.staffId = staffId;
        if (mobileNumber !== undefined) user.mobileNumber = mobileNumber;
        if (password) user.password = password;

        await user.save();

        const updated = await User.findById(user._id)
            .select('-password -otp -otpExpires')
            .populate('branchId', 'name');
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// DELETE /api/admin/staff/:id
const deleteStaff = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'Staff not found' });
        if (!['staff', 'branch_manager'].includes(user.role)) {
            return res.status(400).json({ success: false, message: 'Only staff/managers can be deleted here' });
        }
        await user.deleteOne();
        res.json({ success: true, message: 'Staff deleted' });
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

// POST /api/admin/attendance (upsert by userId + date)
const markAttendance = async (req, res) => {
    try {
        const { userId, branchId, date, status, checkIn } = req.body;
        if (!userId || !branchId || !date) {
            return res.status(400).json({ success: false, message: 'userId, branchId and date are required' });
        }

        const day = new Date(date);
        const dayStart = new Date(day.setHours(0, 0, 0, 0));
        const dayEnd = new Date(day.setHours(23, 59, 59, 999));

        const update = { userId, branchId, status: status || 'present' };
        if (checkIn !== undefined) update.checkIn = checkIn;

        const attendance = await Attendance.findOneAndUpdate(
            { userId, date: { $gte: dayStart, $lte: dayEnd } },
            { $set: update, $setOnInsert: { date: dayStart } },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        )
            .populate('userId', 'name staffId role')
            .populate('branchId', 'name');

        res.status(201).json({ success: true, data: attendance });
    } catch (err) {
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

module.exports = { getStaff, createStaff, updateStaff, deleteStaff, transferStaff, getAttendance, markAttendance, getAttendanceStats };
