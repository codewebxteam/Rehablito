const User = require('../models/User');
const Attendance = require('../models/Attendance');
const mongoose = require('mongoose');

// Helper: Get manager's branch ID
const getManagerBranchId = (req) => {
    if (req.user.role === 'super_admin' && req.query.branch) {
        return req.query.branch;
    }
    return req.user.branchId;
};

// GET /api/manager/staff
// List all staff in the manager's branch
const getStaff = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);
        const filter = {
            branchId,
            role: { $in: ['staff', 'branch_manager'] },
        };

        if (req.query.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { staffId: { $regex: req.query.search, $options: 'i' } },
            ];
        }

        const staff = await User.find(filter)
            .select('-password -otp -otpExpires')
            .populate('branchId', 'name')
            .sort({ name: 1 });

        // For each staff member, get attendance summary
        const staffWithAttendance = await Promise.all(
            staff.map(async (member) => {
                const memberObj = member.toObject();

                // Get current month attendance counts
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

                const [present, absent, leave, halfDay] = await Promise.all([
                    Attendance.countDocuments({ userId: member._id, date: { $gte: startOfMonth, $lte: endOfMonth }, status: 'present' }),
                    Attendance.countDocuments({ userId: member._id, date: { $gte: startOfMonth, $lte: endOfMonth }, status: 'absent' }),
                    Attendance.countDocuments({ userId: member._id, date: { $gte: startOfMonth, $lte: endOfMonth }, status: 'leave' }),
                    Attendance.countDocuments({ userId: member._id, date: { $gte: startOfMonth, $lte: endOfMonth }, status: 'half_day' }),
                ]);

                // Check today's attendance
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                const todayRecord = await Attendance.findOne({
                    userId: member._id,
                    date: { $gte: today, $lt: tomorrow },
                });

                memberObj.attendanceSummary = {
                    month: `${now.toLocaleString('en', { month: 'long' })} ${now.getFullYear()}`,
                    present,
                    absent,
                    leave,
                    halfDay,
                    totalDays: present + absent + leave + halfDay,
                };
                memberObj.todayStatus = todayRecord ? todayRecord.status : 'not_marked';
                memberObj.isActive = true;

                return memberObj;
            })
        );

        res.json({
            success: true,
            count: staffWithAttendance.length,
            data: staffWithAttendance,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/manager/staff/:id
// Get single staff member details with full attendance
const getStaffDetail = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);

        const member = await User.findOne({
            _id: req.params.id,
            branchId,
            role: { $in: ['staff', 'branch_manager'] },
        })
            .select('-password -otp -otpExpires')
            .populate('branchId', 'name');

        if (!member) {
            return res.status(404).json({ success: false, message: 'Staff member not found in your branch' });
        }

        res.json({ success: true, data: member });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/manager/staff/:id/attendance
// Get attendance history for a specific staff member
const getStaffAttendanceHistory = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);

        // Verify staff belongs to manager's branch
        const member = await User.findOne({
            _id: req.params.id,
            branchId,
            role: { $in: ['staff', 'branch_manager'] },
        });

        if (!member) {
            return res.status(404).json({ success: false, message: 'Staff member not found in your branch' });
        }

        const filter = { userId: req.params.id, branchId };

        // Date range filter
        if (req.query.from) {
            filter.date = filter.date || {};
            filter.date.$gte = new Date(req.query.from);
        }
        if (req.query.to) {
            filter.date = filter.date || {};
            filter.date.$lte = new Date(req.query.to);
        }

        // Default: last 30 days
        if (!req.query.from && !req.query.to) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            filter.date = { $gte: thirtyDaysAgo };
        }

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 31;
        const skip = (page - 1) * limit;

        const [records, total] = await Promise.all([
            Attendance.find(filter)
                .populate('userId', 'name staffId')
                .populate('branchId', 'name')
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit),
            Attendance.countDocuments(filter),
        ]);

        res.json({
            success: true,
            count: records.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: records,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/manager/attendance
// Get today's attendance for the entire branch
const getBranchAttendance = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);
        const filter = { branchId };

        if (req.query.date) {
            const d = new Date(req.query.date);
            filter.date = {
                $gte: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
                $lt: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
            };
        } else {
            // Default: today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            filter.date = { $gte: today, $lt: tomorrow };
        }

        if (req.query.status) filter.status = req.query.status;

        const attendance = await Attendance.find(filter)
            .populate('userId', 'name staffId role')
            .populate('branchId', 'name')
            .sort({ date: -1 });

        res.json({
            success: true,
            count: attendance.length,
            data: attendance,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/manager/attendance
// Mark attendance for a staff member (branch-scoped)
const markAttendance = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);

        // Verify the user belongs to the branch
        const { userId, date, checkIn, checkOut, status } = req.body;

        const member = await User.findOne({
            _id: userId,
            branchId,
            role: { $in: ['staff', 'branch_manager'] },
        });

        if (!member) {
            return res.status(404).json({ success: false, message: 'Staff member not found in your branch' });
        }

        const attendanceData = {
            userId,
            branchId,
            date: date || new Date(),
            checkIn,
            checkOut,
            status: status || 'present',
        };

        const attendance = await Attendance.create(attendanceData);

        const populated = await Attendance.findById(attendance._id)
            .populate('userId', 'name staffId role')
            .populate('branchId', 'name');

        res.status(201).json({ success: true, data: populated });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Attendance already marked for this user on this date' });
        }
        res.status(400).json({ success: false, message: err.message });
    }
};

// GET /api/manager/attendance/stats
// Attendance stats for the branch
const getAttendanceStats = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);

        // Today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayFilter = { branchId, date: { $gte: today, $lt: tomorrow } };

        const [present, absent, leave, halfDay] = await Promise.all([
            Attendance.countDocuments({ ...todayFilter, status: 'present' }),
            Attendance.countDocuments({ ...todayFilter, status: 'absent' }),
            Attendance.countDocuments({ ...todayFilter, status: 'leave' }),
            Attendance.countDocuments({ ...todayFilter, status: 'half_day' }),
        ]);

        // Total staff in branch
        const totalStaff = await User.countDocuments({
            branchId,
            role: { $in: ['staff', 'branch_manager'] },
        });

        const notMarked = totalStaff - (present + absent + leave + halfDay);

        // Monthly overview (current month)
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthlyStats = await Attendance.aggregate([
            {
                $match: {
                    branchId: new mongoose.Types.ObjectId(branchId),
                    date: { $gte: startOfMonth, $lt: tomorrow },
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                }
            },
        ]);

        const monthlyMap = {};
        monthlyStats.forEach(s => { monthlyMap[s._id] = s.count; });

        res.json({
            success: true,
            data: {
                today: {
                    date: today,
                    present,
                    absent,
                    leave,
                    halfDay,
                    notMarked,
                    totalStaff,
                },
                monthly: {
                    month: `${today.toLocaleString('en', { month: 'long' })} ${today.getFullYear()}`,
                    present: monthlyMap.present || 0,
                    absent: monthlyMap.absent || 0,
                    leave: monthlyMap.leave || 0,
                    halfDay: monthlyMap.half_day || 0,
                },
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getStaff,
    getStaffDetail,
    getStaffAttendanceHistory,
    getBranchAttendance,
    markAttendance,
    getAttendanceStats,
};
