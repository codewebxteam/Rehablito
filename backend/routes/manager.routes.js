const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const { getBranches } = require('../controllers/branch.controller');
const { getServices, createService, updateService, deleteService } = require('../controllers/service.controller');

// ── Manager Controllers ──
const {
    getPatients,
    getPatient,
    createPatient,
    updatePatient,
    downloadPatientPDF,
    getPatientStats,
} = require('../controllers/manager.patient.controller');

const {
    getLeads,
    getLead,
    createLead,
    updateLead,
    addLeadNote,
    convertLeadToPatient,
    getLeadStats,
} = require('../controllers/manager.lead.controller');

const {
    getStaff,
    getStaffDetail,
    getStaffAttendanceHistory,
    getBranchAttendance,
    markAttendance,
    getAttendanceStats,
} = require('../controllers/manager.staff.controller');

const {
    getPayments,
    getPayment,
    createPayment,
    updatePayment,
    downloadInvoice,
    getBillingSummary,
    getPatientPayments,
} = require('../controllers/manager.billing.controller');

// ─── All routes require authentication + branch_manager or super_admin ───
router.use(protect, authorize('super_admin', 'branch_manager'));

// GET /api/manager/branches → for dropdowns
router.get('/branches', getBranches);

// ════════════════════════════════════════════════
// ██  Services (branch-scoped)
// ════════════════════════════════════════════════

// GET    /api/manager/services      → Services available to manager's branch
// POST   /api/manager/services      → Create service (auto-scoped to manager's branch)
router.route('/services').get(getServices).post(createService);

// PUT    /api/manager/services/:id  → Edit service (branch-scoped)
// DELETE /api/manager/services/:id  → Delete service (branch-scoped)
router.route('/services/:id').put(updateService).delete(deleteService);

// ════════════════════════════════════════════════
// ██  Patient Onboarding
// ════════════════════════════════════════════════

// GET    /api/manager/patients/stats   → Branch patient stats
router.get('/patients/stats', getPatientStats);

// GET    /api/manager/patients         → List branch patients (with search & pagination)
// POST   /api/manager/patients         → Register (onboard) new patient
router.route('/patients').get(getPatients).post(createPatient);

// GET    /api/manager/patients/:id     → Get single patient
// PUT    /api/manager/patients/:id     → Update patient
// DELETE /api/manager/patients/:id     → Delete patient
router.route('/patients/:id').get(getPatient).put(updatePatient).delete(async (req, res) => {
    const Patient = require('../models/Patient');
    try {
        const branchId = req.user.role === 'super_admin' && req.query.branch ? req.query.branch : req.user.branchId;
        const patient = await Patient.findOneAndDelete({ _id: req.params.id, branchId });
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
        res.json({ success: true, message: 'Patient deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET    /api/manager/patients/:id/pdf → Download registration PDF
router.get('/patients/:id/pdf', downloadPatientPDF);

// ════════════════════════════════════════════════
// ██  Lead Management (Phone Masking Applied)
// ════════════════════════════════════════════════

// GET    /api/manager/leads/stats      → Lead statistics & conversion rate
router.get('/leads/stats', getLeadStats);

// GET    /api/manager/leads            → List branch leads (masked phone numbers)
// POST   /api/manager/leads            → Create new lead entry
router.route('/leads').get(getLeads).post(createLead);

// GET    /api/manager/leads/:id        → Get single lead (masked)
// PUT    /api/manager/leads/:id        → Update lead
router.route('/leads/:id').get(getLead).put(updateLead);

// POST   /api/manager/leads/:id/notes  → Add follow-up note
router.post('/leads/:id/notes', addLeadNote);

// PUT    /api/manager/leads/:id/convert → Convert lead to patient
router.put('/leads/:id/convert', convertLeadToPatient);

// ════════════════════════════════════════════════
// ██  Staff Management & Attendance
// ════════════════════════════════════════════════

// GET    /api/manager/attendance/stats  → Today's & monthly attendance stats
router.get('/attendance/stats', getAttendanceStats);

// GET    /api/manager/staff             → List branch staff with attendance summary
router.get('/staff', getStaff);

// GET    /api/manager/staff/:id         → Get staff member details
router.get('/staff/:id', getStaffDetail);

// GET    /api/manager/staff/:id/attendance → Staff attendance history
router.get('/staff/:id/attendance', getStaffAttendanceHistory);

// GET    /api/manager/attendance        → Branch attendance for a date
// POST   /api/manager/attendance        → Mark attendance
router.route('/attendance').get(getBranchAttendance).post(markAttendance);

// ════════════════════════════════════════════════
// ██  Billing & Invoicing
// ════════════════════════════════════════════════

// GET    /api/manager/billing/summary   → Financial summary & analytics
router.get('/billing/summary', getBillingSummary);

// GET    /api/manager/billing/patient/:patientId → Payment history for a patient
router.get('/billing/patient/:patientId', getPatientPayments);

// GET    /api/manager/billing           → List branch payments
// POST   /api/manager/billing           → Record new payment
router.route('/billing').get(getPayments).post(createPayment);

// GET    /api/manager/billing/:id       → Get single payment
// PUT    /api/manager/billing/:id       → Update payment
router.route('/billing/:id').get(getPayment).put(updatePayment);

// GET    /api/manager/billing/:id/invoice → Download invoice/receipt PDF
router.get('/billing/:id/invoice', downloadInvoice);

module.exports = router;
