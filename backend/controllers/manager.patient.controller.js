const Patient = require('../models/Patient');
const Branch = require('../models/Branch');
const Lead = require('../models/Lead');
const mongoose = require('mongoose');
const { generatePatientRegistrationPDF } = require('../utils/pdfGenerator');

// ─── Helper: Get manager's branch ID ───
const getManagerBranchId = (req) => {
    // super_admin can pass ?branch=ID, branch_manager is locked to their own branch
    if (req.user.role === 'super_admin' && req.query.branch) {
        return req.query.branch;
    }
    return req.user.branchId;
};

// ─────────────────────────────────────────────
// GET /api/manager/patients
// Fetch all patients for the manager's branch
// ─────────────────────────────────────────────
const getPatients = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);
        const filter = { branchId };
        if (req.query.status) filter.status = req.query.status;
        if (req.query.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { parentName: { $regex: req.query.search, $options: 'i' } },
            ];
        }

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [patients, total] = await Promise.all([
            Patient.find(filter)
                .populate('branchId', 'name')
                .populate('assignedTherapist', 'name email')
                .populate('leadId', 'childName status')
                .sort({ admissionDate: -1 })
                .skip(skip)
                .limit(limit),
            Patient.countDocuments(filter),
        ]);

        res.json({
            success: true,
            count: patients.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: patients,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/manager/patients/:id
// Get single patient by ID (branch-scoped)
// ─────────────────────────────────────────────
const getPatient = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);
        const patient = await Patient.findOne({ _id: req.params.id, branchId })
            .populate('branchId', 'name address city phone email')
            .populate('assignedTherapist', 'name email')
            .populate('leadId', 'childName parentName status');

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found in your branch' });
        }

        res.json({ success: true, data: patient });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// POST /api/manager/patients
// Register (onboard) a new patient
// ─────────────────────────────────────────────
const createPatient = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);

        // Force the patient to the manager's branch
        const patientData = {
            ...req.body,
            branchId,
        };

        const patient = await Patient.create(patientData);

        // If there's a linked lead, mark it as converted
        if (patient.leadId) {
            await Lead.findByIdAndUpdate(patient.leadId, { status: 'converted' });
        }

        // Populate for response
        const populatedPatient = await Patient.findById(patient._id)
            .populate('branchId', 'name address city phone email')
            .populate('assignedTherapist', 'name email');

        res.status(201).json({ success: true, data: populatedPatient });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// PUT /api/manager/patients/:id
// Update patient details (branch-scoped)
// ─────────────────────────────────────────────
const updatePatient = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);

        // Prevent manager from changing the branchId
        delete req.body.branchId;

        const patient = await Patient.findOneAndUpdate(
            { _id: req.params.id, branchId },
            req.body,
            { new: true, runValidators: true }
        )
            .populate('branchId', 'name')
            .populate('assignedTherapist', 'name email');

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found in your branch' });
        }

        res.json({ success: true, data: patient });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// GET /api/manager/patients/:id/pdf
// Generate & download patient registration PDF
// ─────────────────────────────────────────────
const downloadPatientPDF = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);

        const patient = await Patient.findOne({ _id: req.params.id, branchId })
            .populate('branchId', 'name address city phone email')
            .populate('assignedTherapist', 'name email');

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found in your branch' });
        }

        const branch = await Branch.findById(branchId);
        const pdfBuffer = await generatePatientRegistrationPDF(patient, branch);

        const fileName = `Registration_${patient.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

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

// ─────────────────────────────────────────────
// GET /api/manager/patients/stats
// Dashboard stats for the manager's branch
// ─────────────────────────────────────────────
const getPatientStats = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);
        const filter = { branchId };

        const [total, active, discharged, onHold] = await Promise.all([
            Patient.countDocuments(filter),
            Patient.countDocuments({ ...filter, status: 'active' }),
            Patient.countDocuments({ ...filter, status: 'discharged' }),
            Patient.countDocuments({ ...filter, status: 'on_hold' }),
        ]);

        // Recent admissions (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentAdmissions = await Patient.countDocuments({
            ...filter,
            admissionDate: { $gte: thirtyDaysAgo },
        });

        // Therapy type distribution
        const therapyDistribution = await Patient.aggregate([
            { $match: { branchId: new mongoose.Types.ObjectId(branchId) } },
            { $unwind: '$therapyType' },
            { $group: { _id: '$therapyType', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        res.json({
            success: true,
            data: {
                total,
                active,
                discharged,
                onHold,
                recentAdmissions,
                therapyDistribution,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};



module.exports = {
    getPatients,
    getPatient,
    createPatient,
    updatePatient,
    downloadPatientPDF,
    getPatientStats,
};
