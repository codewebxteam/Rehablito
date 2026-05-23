const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

// Controllers
const { getBranches, getBranch, createBranch, updateBranch, deleteBranch } = require('../controllers/branch.controller');
const { getLeads, createLead, updateLead, getLeadStats } = require('../controllers/lead.controller');
const { 
    getPatients, 
    createPatient, 
    updatePatient, 
    getPatientStats,
    getGlobalPatientAttendance // 🔥 NEW: Imported Attendance Controller
} = require('../controllers/patient.controller');
const { getFees, createFee, getFeeSummary } = require('../controllers/fee.controller');
const { getDashboardData } = require('../controllers/dashboard.controller');
const { 
    getStaff, 
    createStaff, 
    updateStaff, 
    deleteStaff, 
    transferStaff, 
    getAttendance, 
    markAttendance, 
    getAttendanceStats,
    getDesignations,    // 🔥 NEW: Imported Designation function
    createDesignation   // 🔥 NEW: Imported Designation function
} = require('../controllers/staff.controller');
const { getServices, createService, updateService, deleteService } = require('../controllers/service.controller');

// All routes require super_admin
router.use(protect, authorize('super_admin'));

// ── Dashboard (combined endpoint) ──
router.get('/dashboard', getDashboardData);

// ── Branches ──
router.route('/branches').get(getBranches).post(createBranch);
router.route('/branches/:id').get(getBranch).put(updateBranch).delete(deleteBranch);

// ── Leads ──
router.get('/leads/stats', getLeadStats);
router.route('/leads').get(getLeads).post(createLead);
router.route('/leads/:id').put(updateLead);

// ── Patients ──
router.get('/patients/stats', getPatientStats);
router.route('/patients').get(getPatients).post(createPatient);
router.route('/patients/:id').put(updatePatient);

// 🔥 NEW: Patient Attendance 
router.get('/patient-attendance', getGlobalPatientAttendance);

// ── Fees ──
router.get('/fees/summary', getFeeSummary);
router.route('/fees').get(getFees).post(createFee);

// ── Staff, Designations & Attendance ──
router.route('/designations').get(getDesignations).post(createDesignation); // 🔥 NEW: Designations route
router.route('/staff').get(getStaff).post(createStaff);
router.route('/staff/:id').put(updateStaff).delete(deleteStaff);
router.put('/staff/:id/transfer', transferStaff);
router.get('/attendance/stats', getAttendanceStats);
router.route('/attendance').get(getAttendance).post(markAttendance);

// ── Services ──
router.route('/services').get(getServices).post(createService);
router.route('/services/:id').put(updateService).delete(deleteService);

module.exports = router;