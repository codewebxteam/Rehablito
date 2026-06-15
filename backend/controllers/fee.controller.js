const FeePayment = require('../models/FeePayment');
const mongoose = require('mongoose');

// GET /api/admin/fees?branch=ID&status=paid
const getFees = async (req, res) => {
    try {
        const filter = {};
        if (req.query.branch) filter.branchId = req.query.branch;
        if (req.query.status) filter.status = req.query.status;
        if (req.query.patientId) filter.patientId = req.query.patientId;

        const fees = await FeePayment.find(filter)
            .populate('patientId', 'name parentName patientId totalFee therapyType')
            .populate('branchId', 'name')
            .populate('collectedBy', 'name')
            .sort({ paymentDate: -1 });
        res.json({ success: true, count: fees.length, data: fees });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/admin/fees
const createFee = async (req, res) => {
    try {
        const fee = await FeePayment.create(req.body);
        res.status(201).json({ success: true, data: fee });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// GET /api/admin/fees/summary?branch=ID
const getFeeSummary = async (req, res) => {
    try {
        const matchStage = {};
        if (req.query.branch) matchStage.branchId = new mongoose.Types.ObjectId(req.query.branch);

        // Total revenue and dues
        const [totals] = await FeePayment.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$amount' },
                    totalDues: { $sum: '$dueAmount' },
                    totalTransactions: { $sum: 1 },
                }
            }
        ]);

        // Branch-wise breakdown
        const branchWise = await FeePayment.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$branchId',
                    revenue: { $sum: '$amount' },
                    dues: { $sum: '$dueAmount' },
                    count: { $sum: 1 },
                }
            },
            {
                $lookup: {
                    from: 'branches',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'branch'
                }
            },
            { $unwind: '$branch' },
            {
                $project: {
                    branchName: '$branch.name',
                    revenue: 1,
                    dues: 1,
                    count: 1,
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        // Payment method breakdown
        const methodBreakdown = await FeePayment.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$method',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                }
            }
        ]);

        // Monthly trend (last 6 months) with per-branch split
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const monthlyTrend = await FeePayment.aggregate([
            {
                $match: {
                    ...matchStage,
                    paymentDate: { $gte: sixMonthsAgo },
                },
            },
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
        ]);

        res.json({
            success: true,
            data: {
                totalRevenue: totals?.totalRevenue || 0,
                totalDues: totals?.totalDues || 0,
                totalTransactions: totals?.totalTransactions || 0,
                branchWise,
                methodBreakdown,
                monthlyTrend,
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/admin/fees/pending-approvals?branch=ID
const getPendingApprovals = async (req, res) => {
    try {
        const filter = { approvalStatus: 'pending' };
        if (req.query.branch) filter.branchId = req.query.branch;

        const pendingPayments = await FeePayment.find(filter)
            .populate('patientId', 'name parentName parentPhone')
            .populate('branchId', 'name')
            .sort({ updatedAt: -1 });

        res.json({
            success: true,
            count: pendingPayments.length,
            data: pendingPayments,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/admin/fees/:id/approve-manual
const approveManualPayment = async (req, res) => {
    try {
        const payment = await FeePayment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment record not found' });
        }
        if (payment.approvalStatus !== 'pending') {
            return res.status(400).json({ success: false, message: 'Payment is not pending approval' });
        }

        const pendingTx = payment.transactions.find(tx => tx.transactionId === 'pending_approval') || payment.transactions[payment.transactions.length - 1];
        
        let amountPaid = 0;
        if (pendingTx) {
            amountPaid = pendingTx.amountPaid;
            pendingTx.transactionId = 'approved_' + Date.now();
        } else {
            amountPaid = payment.dueAmount;
        }

        payment.dueAmount -= amountPaid;
        if (payment.dueAmount <= 0) {
            payment.dueAmount = 0;
            payment.status = 'paid';
        } else {
            payment.status = 'partial';
        }
        
        payment.approvalStatus = 'approved';
        await payment.save();

        res.json({ success: true, message: 'Payment approved successfully', data: payment });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/admin/fees/:id/reject-manual
const rejectManualPayment = async (req, res) => {
    try {
        const payment = await FeePayment.findById(req.params.id);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment record not found' });
        }
        
        payment.approvalStatus = 'rejected';
        
        // Remove the pending transaction
        payment.transactions = payment.transactions.filter(tx => tx.transactionId !== 'pending_approval');
        
        await payment.save();

        res.json({ success: true, message: 'Payment rejected' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { 
    getFees, 
    createFee, 
    getFeeSummary,
    getPendingApprovals,
    approveManualPayment,
    rejectManualPayment
};
