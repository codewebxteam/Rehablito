const Attendance = require('../models/Attendance');
const Branch = require('../models/Branch');
const User = require('../models/User');

// Calculate distance between two coordinates in meters using Haversine formula
function getDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Get start of today as Date
function getToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

// Format time string from Date
function formatTime(date) {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// GET /api/staff/profile - Get staff profile and branch info
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password -otp -otpExpires')
            .populate('branchId', 'name address city phone location shiftStart shiftEnd');

        if (!user) {
            return res.status(404).json({ success: false, message: 'Staff not found' });
        }

        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/staff/geofence - Get branch geofence config for the client
const getGeofence = async (req, res) => {
    try {
        const branch = await Branch.findById(req.user.branchId)
            .select('name location shiftStart shiftEnd');

        if (!branch) {
            return res.status(404).json({ success: false, message: 'Branch not found' });
        }

        res.json({
            success: true,
            data: {
                branchName: branch.name,
                latitude: branch.location.latitude,
                longitude: branch.location.longitude,
                radiusMeters: branch.location.radiusMeters,
                shiftStart: branch.shiftStart,
                shiftEnd: branch.shiftEnd,
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/staff/check-in - Geofenced check-in
const checkIn = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({ success: false, message: 'Location coordinates are required' });
        }

        // Get branch geofence
        const branch = await Branch.findById(req.user.branchId);
        if (!branch) {
            return res.status(404).json({ success: false, message: 'Branch not found' });
        }

        // Validate location against geofence
        const distance = getDistanceMeters(
            latitude, longitude,
            branch.location.latitude, branch.location.longitude
        );

        const withinGeofence = distance <= branch.location.radiusMeters;

        if (!withinGeofence) {
            return res.status(403).json({
                success: false,
                message: 'You are outside the office geofence. Move closer to check in.',
                data: {
                    distanceMeters: Math.round(distance),
                    requiredRadius: branch.location.radiusMeters,
                }
            });
        }

        // Check if already checked in today
        const today = getToday();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existing = await Attendance.findOne({
            userId: req.user._id,
            date: { $gte: today, $lt: tomorrow },
        });

        if (existing) {
            if (existing.status === 'on_duty') {
                return res.status(400).json({ success: false, message: 'Already checked in and on duty' });
            }
            if (existing.checkOutTime) {
                return res.status(400).json({ success: false, message: 'Already completed duty for today' });
            }
        }

        const now = new Date();

        if (existing) {
            // Update existing record
            existing.checkIn = formatTime(now);
            existing.checkInTime = now;
            existing.checkInLocation = { latitude, longitude };
            existing.locationVerified = true;
            existing.status = 'on_duty';
            await existing.save();

            const populated = await Attendance.findById(existing._id)
                .populate('userId', 'name staffId')
                .populate('branchId', 'name');

            return res.json({ success: true, message: 'Checked in successfully', data: populated });
        }

        // Create new attendance record
        const attendance = await Attendance.create({
            userId: req.user._id,
            branchId: req.user.branchId,
            date: today,
            checkIn: formatTime(now),
            checkInTime: now,
            checkInLocation: { latitude, longitude },
            locationVerified: true,
            status: 'on_duty',
        });

        const populated = await Attendance.findById(attendance._id)
            .populate('userId', 'name staffId')
            .populate('branchId', 'name');

        res.status(201).json({ success: true, message: 'Checked in successfully', data: populated });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Attendance already exists for today' });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/staff/check-out - Manual check-out with optional location
const checkOut = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        const today = getToday();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const attendance = await Attendance.findOne({
            userId: req.user._id,
            date: { $gte: today, $lt: tomorrow },
            status: 'on_duty',
        });

        if (!attendance) {
            return res.status(400).json({ success: false, message: 'No active check-in found for today' });
        }

        const now = new Date();
        attendance.checkOut = formatTime(now);
        attendance.checkOutTime = now;

        if (latitude !== undefined && longitude !== undefined) {
            attendance.checkOutLocation = { latitude, longitude };
        }

        // Calculate duty hours
        const diffMs = now.getTime() - attendance.checkInTime.getTime();
        const hours = diffMs / (1000 * 60 * 60);
        attendance.dutyHours = parseFloat(hours.toFixed(2));

        // Set status based on hours worked
        if (hours >= 7) {
            attendance.status = 'present';
        } else if (hours >= 4) {
            attendance.status = 'half_day';
        } else {
            attendance.status = 'half_day';
        }

        await attendance.save();

        const populated = await Attendance.findById(attendance._id)
            .populate('userId', 'name staffId')
            .populate('branchId', 'name');

        res.json({
            success: true,
            message: 'Checked out successfully',
            data: populated,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/staff/duty-status - Current duty status and timer info
const getDutyStatus = async (req, res) => {
    try {
        const today = getToday();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const attendance = await Attendance.findOne({
            userId: req.user._id,
            date: { $gte: today, $lt: tomorrow },
        }).populate('branchId', 'name shiftStart shiftEnd');

        if (!attendance) {
            return res.json({
                success: true,
                data: {
                    isOnDuty: false,
                    hasCheckedIn: false,
                    hasCheckedOut: false,
                    checkInTime: null,
                    checkOutTime: null,
                    dutyHours: 0,
                    elapsedSeconds: 0,
                    status: 'not_checked_in',
                }
            });
        }

        const isOnDuty = attendance.status === 'on_duty';
        let elapsedSeconds = 0;

        if (isOnDuty && attendance.checkInTime) {
            elapsedSeconds = Math.floor((Date.now() - attendance.checkInTime.getTime()) / 1000);
        }

        res.json({
            success: true,
            data: {
                isOnDuty,
                hasCheckedIn: !!attendance.checkInTime,
                hasCheckedOut: !!attendance.checkOutTime,
                checkInTime: attendance.checkInTime,
                checkOutTime: attendance.checkOutTime,
                checkIn: attendance.checkIn,
                checkOut: attendance.checkOut,
                dutyHours: attendance.dutyHours,
                elapsedSeconds,
                status: attendance.status,
                locationVerified: attendance.locationVerified,
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/staff/attendance/history - Attendance history with pagination
const getAttendanceHistory = async (req, res) => {
    try {
        const filter = { userId: req.user._id };

        // Date range
        if (req.query.from) {
            filter.date = filter.date || {};
            filter.date.$gte = new Date(req.query.from);
        }
        if (req.query.to) {
            filter.date = filter.date || {};
            filter.date.$lte = new Date(req.query.to);
        }

        // Default to last 30 days
        if (!req.query.from && !req.query.to) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            filter.date = { $gte: thirtyDaysAgo };
        }

        if (req.query.status) {
            filter.status = req.query.status;
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 31;
        const skip = (page - 1) * limit;

        const [records, total] = await Promise.all([
            Attendance.find(filter)
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

// GET /api/staff/attendance/calendar - Monthly calendar data
const getAttendanceCalendar = async (req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const records = await Attendance.find({
            userId: req.user._id,
            date: { $gte: startDate, $lte: endDate },
        }).sort({ date: 1 });

        // Build calendar map: day -> record
        const calendar = {};
        const daysInMonth = endDate.getDate();

        for (let d = 1; d <= daysInMonth; d++) {
            calendar[d] = { day: d, status: null, dutyHours: 0, checkIn: null, checkOut: null };
        }

        records.forEach((rec) => {
            const day = rec.date.getDate();
            calendar[day] = {
                day,
                status: rec.status,
                dutyHours: rec.dutyHours,
                checkIn: rec.checkIn,
                checkOut: rec.checkOut,
                checkInTime: rec.checkInTime,
                checkOutTime: rec.checkOutTime,
                locationVerified: rec.locationVerified,
            };
        });

        // Monthly summary
        let totalHours = 0;
        let presentDays = 0;
        let absentDays = 0;
        let leaveDays = 0;
        let halfDays = 0;

        records.forEach((rec) => {
            totalHours += rec.dutyHours || 0;
            if (rec.status === 'present' || rec.status === 'on_duty') presentDays++;
            else if (rec.status === 'absent') absentDays++;
            else if (rec.status === 'leave') leaveDays++;
            else if (rec.status === 'half_day') halfDays++;
        });

        res.json({
            success: true,
            data: {
                year,
                month,
                monthName: startDate.toLocaleString('en', { month: 'long' }),
                daysInMonth,
                calendar: Object.values(calendar),
                summary: {
                    totalHours: parseFloat(totalHours.toFixed(2)),
                    averageHours: records.length > 0 ? parseFloat((totalHours / records.length).toFixed(2)) : 0,
                    presentDays,
                    absentDays,
                    leaveDays,
                    halfDays,
                    totalRecorded: records.length,
                }
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/staff/dashboard - Personal dashboard overview
const getDashboard = async (req, res) => {
    try {
        const today = getToday();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Today's attendance
        const todayRecord = await Attendance.findOne({
            userId: req.user._id,
            date: { $gte: today, $lt: tomorrow },
        }).populate('branchId', 'name shiftStart shiftEnd');

        // Current month stats
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const monthRecords = await Attendance.find({
            userId: req.user._id,
            date: { $gte: startOfMonth, $lte: endOfMonth },
        });

        let monthlyHours = 0;
        let presentDays = 0;
        let absentDays = 0;
        let leaveDays = 0;
        let halfDays = 0;

        monthRecords.forEach((rec) => {
            monthlyHours += rec.dutyHours || 0;
            if (rec.status === 'present' || rec.status === 'on_duty') presentDays++;
            else if (rec.status === 'absent') absentDays++;
            else if (rec.status === 'leave') leaveDays++;
            else if (rec.status === 'half_day') halfDays++;
        });

        // Last 7 days trend
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const weekRecords = await Attendance.find({
            userId: req.user._id,
            date: { $gte: sevenDaysAgo, $lte: now },
        }).sort({ date: 1 });

        const weeklyTrend = weekRecords.map((rec) => ({
            date: rec.date,
            status: rec.status,
            dutyHours: rec.dutyHours,
            checkIn: rec.checkIn,
            checkOut: rec.checkOut,
        }));

        // Duty status
        let isOnDuty = false;
        let elapsedSeconds = 0;
        if (todayRecord && todayRecord.status === 'on_duty' && todayRecord.checkInTime) {
            isOnDuty = true;
            elapsedSeconds = Math.floor((Date.now() - todayRecord.checkInTime.getTime()) / 1000);
        }

        // Staff profile
        const profile = await User.findById(req.user._id)
            .select('name email staffId mobileNumber role')
            .populate('branchId', 'name city');

        res.json({
            success: true,
            data: {
                profile: {
                    name: profile.name,
                    staffId: profile.staffId,
                    email: profile.email,
                    branch: profile.branchId,
                },
                today: {
                    isOnDuty,
                    elapsedSeconds,
                    hasCheckedIn: !!(todayRecord && todayRecord.checkInTime),
                    hasCheckedOut: !!(todayRecord && todayRecord.checkOutTime),
                    checkIn: todayRecord ? todayRecord.checkIn : null,
                    checkOut: todayRecord ? todayRecord.checkOut : null,
                    dutyHours: todayRecord ? todayRecord.dutyHours : 0,
                    status: todayRecord ? todayRecord.status : 'not_checked_in',
                },
                monthly: {
                    month: `${now.toLocaleString('en', { month: 'long' })} ${now.getFullYear()}`,
                    totalHours: parseFloat(monthlyHours.toFixed(2)),
                    averageHours: monthRecords.length > 0 ? parseFloat((monthlyHours / monthRecords.length).toFixed(2)) : 0,
                    presentDays,
                    absentDays,
                    leaveDays,
                    halfDays,
                    totalRecorded: monthRecords.length,
                },
                weeklyTrend,
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/staff/branch-staff - List teammates in the same branch
const getBranchStaff = async (req, res) => {
    try {
        if (!req.user.branchId) {
            return res.status(400).json({ success: false, message: 'No branch assigned to this user' });
        }

        const today = getToday();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const staff = await User.find({
            branchId: req.user.branchId,
            role: { $in: ['staff', 'branch_manager'] },
        })
            .select('-password -otp -otpExpires')
            .populate('branchId', 'name')
            .sort({ name: 1 });

        // Attach today's attendance status for each teammate
        const results = await Promise.all(
            staff.map(async (member) => {
                const attendance = await Attendance.findOne({
                    userId: member._id,
                    date: { $gte: today, $lt: tomorrow },
                });
                const obj = member.toObject();
                obj.todayStatus = attendance ? attendance.status : 'not_marked';
                return obj;
            })
        );

        res.json({ success: true, count: results.length, data: results });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getProfile,
    getGeofence,
    checkIn,
    checkOut,
    getDutyStatus,
    getAttendanceHistory,
    getAttendanceCalendar,
    getDashboard,
    getBranchStaff,
};
