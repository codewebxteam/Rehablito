const Patient = require('../models/Patient');
const PatientAttendance = require('../models/PatientAttendance');
const User = require('../models/User'); // 🔥 Parent Portal
const FeePayment = require('../models/FeePayment');
const Service = require('../models/Service');

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

// GET /api/admin/patients?branch=ID&status=active&page=1&limit=20
const getPatients = async (req, res) => {
    try {
        const filter = {};
        if (req.query.branch) filter.branchId = req.query.branch;
        if (req.query.status) filter.status = req.query.status;

        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 0;

        let query = Patient.find(filter)
            .populate('branchId', 'name')
            .populate('assignedTherapist', 'name')
            .sort({ admissionDate: -1 });

        const total = await Patient.countDocuments(filter);

        if (page > 0 && limit > 0) {
            query = query.skip((page - 1) * limit).limit(limit);
        }

        const patients = await query;
        res.json({
            success: true,
            count: patients.length,
            total,
            page: page || 1,
            pages: limit > 0 ? Math.ceil(total / limit) : 1,
            data: patients,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/admin/patients
const createPatient = async (req, res) => {
    try {
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
        const created = await Patient.create(req.body);

        // 🔥 Parent Portal: Auto-create parent account if parentEmail + parentPassword are provided
        let parentAccount = null;
        const { parentEmail, parentPassword, parentName, parentPhone } = req.body;
        if (parentEmail && parentPassword) {
            const existingParent = await User.findOne({ email: parentEmail });
            if (!existingParent) {
                parentAccount = await User.create({
                    name: parentName || created.name + "'s Parent",
                    email: parentEmail,
                    password: parentPassword,
                    role: 'parent',
                    patientId: created._id,
                    mobileNumber: parentPhone || undefined,
                });
                console.log(`✅ Parent account created: ${parentEmail} for patient ${created.name}`);
            } else {
                console.log(`⚠️ Parent email ${parentEmail} already exists, skipping account creation.`);
            }
        }

        const patient = await Patient.findById(created._id)
            .populate('branchId', 'name')
            .populate('assignedTherapist', 'name');
        res.status(201).json({ success: true, data: patient, parentAccountCreated: !!parentAccount });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// PUT /api/admin/patients/:id
const updatePatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

        if (req.body.therapyType) {
            await processTherapyUpdates(patient, req.body.therapyType, req.body.therapyDetails);
        }

        Object.assign(patient, req.body);
        await patient.save();

        const populated = await Patient.findById(patient._id)
            .populate('branchId', 'name')
            .populate('assignedTherapist', 'name');

        // 🔥 Parent Portal: Update or Create parent account if provided
        const { parentPassword, parentEmail, parentName, parentPhone } = req.body;
        
        let parentUser = await User.findOne({ patientId: patient._id });
        
        if (parentEmail) {
            if (parentUser) {
                // Update existing parent user
                parentUser.email = parentEmail.trim();
                if (parentPassword) {
                    parentUser.password = parentPassword;
                }
                if (parentName) parentUser.name = parentName;
                if (parentPhone) parentUser.mobileNumber = parentPhone;
                await parentUser.save();
                console.log(`✅ Parent account updated for patient ${patient.name}`);
            } else if (parentPassword) {
                // Create new parent user if they didn't have one
                await User.create({
                    name: parentName || patient.name + "'s Parent",
                    email: parentEmail.trim(),
                    password: parentPassword,
                    role: 'parent',
                    patientId: patient._id,
                    mobileNumber: parentPhone || undefined,
                });
                console.log(`✅ New Parent account created during update for patient ${patient.name}`);
            }
        } else if (parentPassword && parentUser) {
             // If only password was updated
             parentUser.password = parentPassword;
             await parentUser.save();
        }

        res.json({ success: true, data: populated });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// DELETE /api/admin/patients/:id
const deletePatient = async (req, res) => {
    try {
        const patient = await Patient.findByIdAndDelete(req.params.id);
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
        
        // Also delete parent account if exists
        await User.findOneAndDelete({ patientId: req.params.id });

        res.json({ success: true, message: 'Patient deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/admin/patients/stats
const getPatientStats = async (req, res) => {
    try {
        const filter = {};
        if (req.query.branch) filter.branchId = req.query.branch;

        const [total, active, discharged, onHold] = await Promise.all([
            Patient.countDocuments(filter),
            Patient.countDocuments({ ...filter, status: 'active' }),
            Patient.countDocuments({ ...filter, status: 'discharged' }),
            Patient.countDocuments({ ...filter, status: 'on_hold' }),
        ]);

        res.json({
            success: true,
            data: { total, active, discharged, onHold }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 🔥 NEW: GET /api/admin/patient-attendance?branch=ID
const getGlobalPatientAttendance = async (req, res) => {
    try {
        const filter = {};
        if (req.query.branch) filter.branchId = req.query.branch;

        // Setup today's start and end time
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Fetch all active patients (with branch filter if applied)
        const patientFilter = { status: 'active', ...filter };
        const patients = await Patient.find(patientFilter)
            .populate('branchId', 'name') // Populate branch name
            .select('name parentName therapyType status branchId');

        // Fetch today's attendance records
        const attendanceFilter = { date: { $gte: today, $lt: tomorrow }, ...filter };
        const attendances = await PatientAttendance.find(attendanceFilter);

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
                branchName: patient.branchId ? patient.branchId.name : 'Unknown Branch',
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

// GET /api/admin/patients/:id
const getPatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id)
            .populate('branchId', 'name address city phone email')
            .populate('assignedTherapist', 'name');
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
        res.json({ success: true, data: patient });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { 
    getPatients, 
    getPatient, // 🔥 Added export
    createPatient, 
    updatePatient, 
    deletePatient,
    getPatientStats,
    getGlobalPatientAttendance // 🔥 NEW EXPORT
};