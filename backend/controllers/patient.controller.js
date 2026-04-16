const Patient = require('../models/Patient');

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
        const created = await Patient.create(req.body);
        const patient = await Patient.findById(created._id)
            .populate('branchId', 'name')
            .populate('assignedTherapist', 'name');
        res.status(201).json({ success: true, data: patient });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// PUT /api/admin/patients/:id
const updatePatient = async (req, res) => {
    try {
        const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate('branchId', 'name')
            .populate('assignedTherapist', 'name');
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
        res.json({ success: true, data: patient });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
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

module.exports = { getPatients, createPatient, updatePatient, getPatientStats };
