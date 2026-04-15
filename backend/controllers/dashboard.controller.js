const Patient = require('../models/Patient');
const Lead = require('../models/Lead');
const FeePayment = require('../models/FeePayment');
const User = require('../models/User');

// GET /api/admin/dashboard — single combined endpoint
const getDashboardData = async (req, res) => {
    try {
        const branchFilter = req.query.branch ? { branchId: req.query.branch } : {};

        const [
            // Patient stats
            totalPatients,
            activePatients,
            dischargedPatients,
            onHoldPatients,
            // Lead stats
            totalLeads,
            newLeads,
            contactedLeads,
            convertedLeads,
            closedLeads,
            // Attendance stats (today)
            attendanceToday,
            // Fee summary
            feeSummaryAgg,
            // Recent leads (limit 4)
            recentLeads,
            // Recent fees (limit 5)
            recentFees,
        ] = await Promise.all([
            Patient.countDocuments({ ...branchFilter }),
            Patient.countDocuments({ ...branchFilter, status: 'active' }),
            Patient.countDocuments({ ...branchFilter, status: 'discharged' }),
            Patient.countDocuments({ ...branchFilter, status: 'on_hold' }),

            Lead.countDocuments({ ...branchFilter }),
            Lead.countDocuments({ ...branchFilter, status: 'new' }),
            Lead.countDocuments({ ...branchFilter, status: 'contacted' }),
            Lead.countDocuments({ ...branchFilter, status: 'converted' }),
            Lead.countDocuments({ ...branchFilter, status: 'closed' }),

            // Today's attendance
            (async () => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const Attendance = require('../models/Attendance');
                const records = await Attendance.find({
                    date: { $gte: today, $lt: tomorrow },
                    ...branchFilter,
                });
                const totalStaff = await User.countDocuments({
                    role: { $in: ['staff', 'branch_manager'] },
                    ...(req.query.branch ? { branchId: req.query.branch } : {}),
                });
                return {
                    date: today.toISOString().split('T')[0],
                    present: records.filter(r => r.status === 'present' || r.status === 'on_duty').length,
                    absent: Math.max(0, totalStaff - records.length),
                    leave: records.filter(r => r.status === 'leave').length,
                    halfDay: records.filter(r => r.status === 'half_day').length,
                    total: totalStaff,
                };
            })(),

            // Fee summary with branch-wise and monthly trend
            FeePayment.aggregate([
                ...(req.query.branch ? [{ $match: { branchId: require('mongoose').Types.ObjectId(req.query.branch) } }] : []),
                {
                    $lookup: {
                        from: 'branches',
                        localField: 'branchId',
                        foreignField: '_id',
                        as: 'branch',
                    },
                },
                { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } },
                {
                    $facet: {
                        totals: [
                            {
                                $group: {
                                    _id: null,
                                    totalRevenue: { $sum: '$amount' },
                                    totalDues: { $sum: '$dueAmount' },
                                    totalTransactions: { $sum: 1 },
                                },
                            },
                        ],
                        branchWise: [
                            {
                                $group: {
                                    _id: '$branchId',
                                    branchName: { $first: '$branch.name' },
                                    revenue: { $sum: '$amount' },
                                    dues: { $sum: '$dueAmount' },
                                    count: { $sum: 1 },
                                },
                            },
                            { $sort: { revenue: -1 } },
                        ],
                        methodBreakdown: [
                            {
                                $group: {
                                    _id: '$method',
                                    total: { $sum: '$amount' },
                                    count: { $sum: 1 },
                                },
                            },
                        ],
                        monthlyTrend: [
                            {
                                $group: {
                                    _id: {
                                        year: { $year: '$paymentDate' },
                                        month: { $month: '$paymentDate' },
                                        branchName: '$branch.name',
                                    },
                                    revenue: { $sum: '$amount' },
                                },
                            },
                            { $sort: { '_id.year': 1, '_id.month': 1 } },
                        ],
                    },
                },
            ]),

            Lead.find({ ...branchFilter })
                .populate('branchId', 'name')
                .sort({ createdAt: -1 })
                .limit(4)
                .lean(),

            FeePayment.find({ ...branchFilter })
                .populate('patientId', 'name parentName')
                .populate('branchId', 'name')
                .sort({ paymentDate: -1 })
                .limit(5)
                .lean(),
        ]);

        // Flatten fee summary
        const feeAgg = feeSummaryAgg[0] || {};
        const totals = (feeAgg.totals && feeAgg.totals[0]) || { totalRevenue: 0, totalDues: 0, totalTransactions: 0 };

        res.json({
            success: true,
            data: {
                patientStats: {
                    total: totalPatients,
                    active: activePatients,
                    discharged: dischargedPatients,
                    onHold: onHoldPatients,
                },
                leadStats: {
                    total: totalLeads,
                    new: newLeads,
                    contacted: contactedLeads,
                    converted: convertedLeads,
                    closed: closedLeads,
                },
                attendanceStats: attendanceToday,
                feeSummary: {
                    totalRevenue: totals.totalRevenue,
                    totalDues: totals.totalDues,
                    totalTransactions: totals.totalTransactions,
                    branchWise: feeAgg.branchWise || [],
                    methodBreakdown: feeAgg.methodBreakdown || [],
                    monthlyTrend: feeAgg.monthlyTrend || [],
                },
                recentLeads,
                recentFees,
            },
        });
    } catch (err) {
        console.error('Dashboard endpoint error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getDashboardData };
