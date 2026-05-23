const Patient = require('../models/Patient');
const Branch = require('../models/Branch');
const Lead = require('../models/Lead');
const PatientAttendance = require('../models/PatientAttendance'); // 🔥 NEW: Added Attendance Model
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

// 🔥 ─────────────────────────────────────────────
// 🔥 GET /api/manager/patient-attendance/today
// 🔥 Get today's attendance list and summary
// 🔥 ─────────────────────────────────────────────
const getTodayAttendance = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);
        
        // Setup today's start and end time
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Fetch all active patients in this branch
        const patients = await Patient.find({ branchId, status: 'active' })
            .select('name parentName therapyType status');

        // Fetch today's attendance records for this branch
        const attendances = await PatientAttendance.find({
            branchId,
            date: { $gte: today, $lt: tomorrow }
        });

        let currentlyAvailable = 0;
        let checkedOutToday = 0;

        // Map patients with their attendance status
        const attendanceList = patients.map(patient => {
            const record = attendances.find(a => a.patientId.toString() === patient._id.toString());
            let currentStatus = 'not_marked'; // default

            if (record) {
                currentStatus = record.status; // 'checked_in' or 'checked_out'
                if (currentStatus === 'checked_in') currentlyAvailable++;
                if (currentStatus === 'checked_out') checkedOutToday++;
            }

            return {
                _id: patient._id,
                name: patient.name,
                parentName: patient.parentName,
                therapyType: patient.therapyType,
                attendanceStatus: currentStatus,
                checkInTime: record ? record.checkInTime : null,
                checkOutTime: record ? record.checkOutTime : null,
                recordId: record ? record._id : null
            };
        });

        res.json({
            success: true,
            data: {
                summary: {
                    totalActivePatients: patients.length,
                    currentlyAvailable,
                    checkedOutToday
                },
                list: attendanceList
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 🔥 ─────────────────────────────────────────────
// 🔥 POST /api/manager/patient-attendance/check-in
// 🔥 Mark a patient as checked-in (arrived)
// 🔥 ─────────────────────────────────────────────
const checkInPatient = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);
        const { patientId } = req.body;

        if (!patientId) {
            return res.status(400).json({ success: false, message: 'Patient ID is required' });
        }

        // Verify patient belongs to this branch
        const patient = await Patient.findOne({ _id: patientId, branchId });
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found in this branch' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Check if already checked in/out today
        const existingRecord = await PatientAttendance.findOne({
            patientId,
            date: { $gte: today, $lt: tomorrow }
        });

        if (existingRecord) {
            return res.status(400).json({ 
                success: false, 
                message: `Patient is already ${existingRecord.status.replace('_', ' ')} today.` 
            });
        }

        // Create check-in record
        const attendance = await PatientAttendance.create({
            patientId,
            branchId,
            date: today,
            checkInTime: new Date(),
            status: 'checked_in',
            recordedBy: req.user._id // Manager ID
        });

        res.status(201).json({ success: true, message: 'Patient checked in successfully', data: attendance });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 🔥 ─────────────────────────────────────────────
// 🔥 POST /api/manager/patient-attendance/check-out
// 🔥 Mark a patient as checked-out (departed)
// 🔥 ─────────────────────────────────────────────
const checkOutPatient = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);
        const { patientId } = req.body;

        if (!patientId) {
            return res.status(400).json({ success: false, message: 'Patient ID is required' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find the active check-in record for today
        const attendance = await PatientAttendance.findOne({
            patientId,
            branchId,
            date: { $gte: today, $lt: tomorrow },
            status: 'checked_in'
        });

        if (!attendance) {
            return res.status(400).json({ success: false, message: 'No active check-in found for this patient today.' });
        }

        // Update record to checked-out
        attendance.checkOutTime = new Date();
        attendance.status = 'checked_out';
        await attendance.save();

        res.json({ success: true, message: 'Patient checked out successfully', data: attendance });
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
    getTodayAttendance, // 🔥 Added export
    checkInPatient,     // 🔥 Added export
    checkOutPatient,    // 🔥 Added export
};