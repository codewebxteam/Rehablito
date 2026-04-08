const FeePayment = require('../models/FeePayment');
const Patient = require('../models/Patient');
const Branch = require('../models/Branch');
const mongoose = require('mongoose');
const { generateInvoicePDF } = require('../utils/pdfGenerator');

// Helper: Get manager's branch ID
const getManagerBranchId = (req) => {
    if (req.user.role === 'super_admin' && req.query.branch) {
        return req.query.branch;
    }
    return req.user.branchId;
};

// GET /api/manager/billing
// List all payments for the branch
const getPayments = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);
        const filter = { branchId };

        if (req.query.status) filter.status = req.query.status;
        if (req.query.method) filter.method = req.query.method;
        if (req.query.patientId) filter.patientId = req.query.patientId;

        // Date range filter
        if (req.query.from || req.query.to) {
            filter.paymentDate = {};
            if (req.query.from) filter.paymentDate.$gte = new Date(req.query.from);
            if (req.query.to) filter.paymentDate.$lte = new Date(req.query.to);
        }

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [payments, total] = await Promise.all([
            FeePayment.find(filter)
                .populate('patientId', 'childName parentName parentPhone')
                .populate('branchId', 'name')
                .populate('collectedBy', 'name')
                .sort({ paymentDate: -1 })
                .skip(skip)
                .limit(limit),
            FeePayment.countDocuments(filter),
        ]);

        res.json({
            success: true,
            count: payments.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: payments,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/manager/billing/:id
// Get single payment record
const getPayment = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);

        const payment = await FeePayment.findOne({ _id: req.params.id, branchId })
            .populate('patientId', 'childName parentName parentPhone parentEmail therapyType')
            .populate('branchId', 'name address city phone email')
            .populate('collectedBy', 'name');

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment record not found in your branch' });
        }

        res.json({ success: true, data: payment });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/manager/billing
// Record a new payment
const createPayment = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);

        // Verify patient belongs to branch
        if (req.body.patientId) {
            const patient = await Patient.findOne({ _id: req.body.patientId, branchId });
            if (!patient) {
                return res.status(404).json({
                    success: false,
                    message: 'Patient not found in your branch',
                });
            }
        }

        const paymentData = {
            ...req.body,
            branchId,
            collectedBy: req.user._id,
        };

        const payment = await FeePayment.create(paymentData);

        const populated = await FeePayment.findById(payment._id)
            .populate('patientId', 'childName parentName')
            .populate('branchId', 'name')
            .populate('collectedBy', 'name');

        res.status(201).json({ success: true, data: populated });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// PUT /api/manager/billing/:id
// Update a payment record (e.g., add partial payment, mark overdue)
const updatePayment = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);

        // Prevent changing branch or collector
        delete req.body.branchId;
        delete req.body.collectedBy;

        const payment = await FeePayment.findOneAndUpdate(
            { _id: req.params.id, branchId },
            req.body,
            { new: true, runValidators: true }
        )
            .populate('patientId', 'childName parentName')
            .populate('branchId', 'name')
            .populate('collectedBy', 'name');

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment record not found in your branch' });
        }

        res.json({ success: true, data: payment });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// GET /api/manager/billing/:id/invoice
// Generate and download invoice/receipt PDF
const downloadInvoice = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);

        const payment = await FeePayment.findOne({ _id: req.params.id, branchId })
            .populate('patientId', 'childName parentName parentPhone parentEmail therapyType')
            .populate('collectedBy', 'name');

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment record not found in your branch' });
        }

        const branch = await Branch.findById(branchId);
        const patient = payment.patientId;

        const pdfBuffer = await generateInvoicePDF(payment, patient, branch);

        const fileName = `Invoice_${payment.receiptNumber}_${Date.now()}.pdf`;

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Length': pdfBuffer.length,
        });

        res.send(pdfBuffer);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/manager/billing/summary
// Financial summary for the branch
const getBillingSummary = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);
        const branchObjId = new mongoose.Types.ObjectId(branchId);

        // Overall totals
        const [totals] = await FeePayment.aggregate([
            { $match: { branchId: branchObjId } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$amount' },
                    totalDues: { $sum: '$dueAmount' },
                    totalTransactions: { $sum: 1 },
                }
            },
        ]);

        // Monthly revenue (current month)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const [monthly] = await FeePayment.aggregate([
            {
                $match: {
                    branchId: branchObjId,
                    paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
                },
            },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: '$amount' },
                    dues: { $sum: '$dueAmount' },
                    count: { $sum: 1 },
                },
            },
        ]);

        // Payment status breakdown
        const statusBreakdown = await FeePayment.aggregate([
            { $match: { branchId: branchObjId } },
            {
                $group: {
                    _id: '$status',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]);

        // Payment method breakdown
        const methodBreakdown = await FeePayment.aggregate([
            { $match: { branchId: branchObjId } },
            {
                $group: {
                    _id: '$method',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                },
            },
        ]);

        // Outstanding dues (patients with pending / overdue amounts)
        const outstandingDues = await FeePayment.aggregate([
            {
                $match: {
                    branchId: branchObjId,
                    status: { $in: ['pending', 'partial', 'overdue'] },
                    dueAmount: { $gt: 0 },
                },
            },
            {
                $group: {
                    _id: '$patientId',
                    totalDue: { $sum: '$dueAmount' },
                    lastPayment: { $max: '$paymentDate' },
                },
            },
            {
                $lookup: {
                    from: 'patients',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'patient',
                },
            },
            { $unwind: '$patient' },
            {
                $project: {
                    patientName: '$patient.childName',
                    parentName: '$patient.parentName',
                    totalDue: 1,
                    lastPayment: 1,
                },
            },
            { $sort: { totalDue: -1 } },
            { $limit: 20 },
        ]);

        // Monthly trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyTrend = await FeePayment.aggregate([
            {
                $match: {
                    branchId: branchObjId,
                    paymentDate: { $gte: sixMonthsAgo },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$paymentDate' },
                        month: { $month: '$paymentDate' },
                    },
                    revenue: { $sum: '$amount' },
                    dues: { $sum: '$dueAmount' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        res.json({
            success: true,
            data: {
                overall: {
                    totalRevenue: totals?.totalRevenue || 0,
                    totalDues: totals?.totalDues || 0,
                    totalTransactions: totals?.totalTransactions || 0,
                },
                currentMonth: {
                    month: `${now.toLocaleString('en', { month: 'long' })} ${now.getFullYear()}`,
                    revenue: monthly?.revenue || 0,
                    dues: monthly?.dues || 0,
                    transactions: monthly?.count || 0,
                },
                statusBreakdown,
                methodBreakdown,
                outstandingDues,
                monthlyTrend,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/manager/billing/patient/:patientId
// Get all payments for a specific patient
const getPatientPayments = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);

        // Verify patient belongs to branch
        const patient = await Patient.findOne({ _id: req.params.patientId, branchId });
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found in your branch' });
        }

        const payments = await FeePayment.find({
            patientId: req.params.patientId,
            branchId,
        })
            .populate('collectedBy', 'name')
            .sort({ paymentDate: -1 });

        // Calculate totals for this patient
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const totalDue = payments.reduce((sum, p) => sum + (p.dueAmount || 0), 0);

        res.json({
            success: true,
            count: payments.length,
            data: {
                patient: {
                    id: patient._id,
                    childName: patient.childName,
                    parentName: patient.parentName,
                },
                totalPaid,
                totalDue,
                payments,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getPayments,
    getPayment,
    createPayment,
    updatePayment,
    downloadInvoice,
    getBillingSummary,
    getPatientPayments,
};
