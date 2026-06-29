const Patient = require('../models/Patient');
const Branch = require('../models/Branch');
const Lead = require('../models/Lead');
const User = require('../models/User'); // 🔥 Parent Portal: Auto-create parent accounts
const PatientAttendance = require('../models/PatientAttendance'); // 🔥 NEW: Added Attendance Model
const FeePayment = require('../models/FeePayment'); // 🔥 NEW: Added FeePayment Model
const Service = require('../models/Service');
const mongoose = require('mongoose');
const { generatePatientRegistrationPDF } = require('../utils/pdfGenerator');

async function processTherapyUpdates(patient, newTherapies, newDetails) {
    if (!newTherapies) return;
    if (!patient.therapyDetails) patient.therapyDetails = [];

    const existingTherapies = patient.therapyDetails.map(td => td.therapy);
    const addedTherapies = newTherapies.filter(t => !existingTherapies.includes(t));

    for (const therapy of addedTherapies) {
        const detailInput = newDetails ? newDetails.find(d => d.therapy === therapy) : null;
        const discount = detailInput ? (Number(detailInput.discount) || 0) : 0;

        patient.therapyDetails.push({ 
            therapy, 
            addedAt: new Date(), 
            discount 
        });
    }

    if (newDetails) {
        for (const td of patient.therapyDetails) {
            const detailInput = newDetails.find(d => d.therapy === td.therapy);
            if (detailInput) {
                td.discount = Number(detailInput.discount) || 0;
            }
        }
    }
}

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
        const limit = parseInt(req.query.limit) || 10000;
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

        if (req.body.therapyDetails) {
            req.body.therapyDetails = req.body.therapyDetails.map(td => ({
                therapy: td.therapy,
                addedAt: td.addedAt ? new Date(td.addedAt) : new Date(),
                discount: Number(td.discount) || 0
            }));
        } else if (req.body.therapyType) {
            req.body.therapyDetails = req.body.therapyType.map(t => ({
                therapy: t,
                addedAt: new Date(),
                discount: 0
            }));
        }

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

        // 🔥 Parent Portal: Auto-create parent account if parentEmail + parentPassword are provided
        let parentAccount = null;
        const { parentEmail, parentPassword } = req.body;
        if (parentEmail && parentPassword) {
            // Check if parent user already exists
            const existingParent = await User.findOne({ email: parentEmail });
            if (!existingParent) {
                parentAccount = await User.create({
                    name: req.body.parentName || patient.name + "'s Parent",
                    email: parentEmail,
                    password: parentPassword,
                    role: 'parent',
                    patientId: patient._id,
                    mobileNumber: req.body.parentPhone || undefined,
                });
                console.log(`✅ Parent account created: ${parentEmail} for patient ${patient.name}`);
            } else {
                console.log(`⚠️ Parent email ${parentEmail} already exists, skipping account creation.`);
            }
        }

        // Populate for response
        const populatedPatient = await Patient.findById(patient._id)
            .populate('branchId', 'name address city phone email')
            .populate('assignedTherapist', 'name email');

        res.status(201).json({ success: true, data: populatedPatient, parentAccountCreated: !!parentAccount });
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

        const patient = await Patient.findOne({ _id: req.params.id, branchId });
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found in your branch' });
        }

        if (req.body.therapyType) {
            await processTherapyUpdates(patient, req.body.therapyType, req.body.therapyDetails);
        }

        Object.assign(patient, req.body);
        await patient.save();

        const populated = await Patient.findById(patient._id)
            .populate('branchId', 'name')
            .populate('assignedTherapist', 'name email');

        // 🔥 Parent Portal: Update or Create parent account if provided
        const { parentPassword, parentEmail, parentName, parentPhone } = req.body;
        
        let parentUser = await User.findOne({ patientId: patient._id });
        
        if (parentEmail) {
            if (parentUser) {
                // Update existing parent user
                parentUser.email = parentEmail.trim().toLowerCase();
                if (parentPassword) {
                    parentUser.password = parentPassword;
                }
                if (parentName) parentUser.name = parentName;
                if (parentPhone) parentUser.mobileNumber = parentPhone;
                await parentUser.save();
                console.log(`✅ Parent account updated for patient ${patient.name} by manager`);
            } else if (parentPassword) {
                // Create new parent user if they didn't have one
                await User.create({
                    name: parentName || patient.name + "'s Parent",
                    email: parentEmail.trim().toLowerCase(),
                    password: parentPassword,
                    role: 'parent',
                    patientId: patient._id,
                    mobileNumber: parentPhone || undefined,
                });
                console.log(`✅ New Parent account created during update for patient ${patient.name} by manager`);
            }
        } else if (parentPassword && parentUser) {
             // If only password was updated
             parentUser.password = parentPassword;
             await parentUser.save();
             console.log(`✅ Parent password updated for patient ${patient.name} by manager`);
        }

        res.json({ success: true, data: populated });
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