const Patient = require('../models/Patient');
const PatientAttendance = require('../models/PatientAttendance');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const FeePayment = require('../models/FeePayment'); // NEW

// @desc    Get parent dashboard data (child details + attendance summary)
// @route   GET /api/parent/dashboard
// @access  Private (parent)
const getDashboard = async (req, res) => {
    try {
        const parentUser = await User.findById(req.user.id).populate('patientId');
        if (!parentUser || !parentUser.patientId) {
            return res.status(404).json({ success: false, message: 'No linked patient found for this parent account.' });
        }

        const patient = await Patient.findById(parentUser.patientId)
            .populate('branchId', 'name address')
            .populate('assignedTherapist', 'name designation');

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient record not found.' });
        }

        // Attendance summary
        const totalAttendance = await PatientAttendance.countDocuments({ patientId: patient._id });
        const checkedOutAttendance = await PatientAttendance.countDocuments({ patientId: patient._id, status: 'checked_out' });

        // Days since admission
        const admissionDate = patient.admissionDate || patient.createdAt;
        const daysSinceAdmission = Math.floor((Date.now() - new Date(admissionDate).getTime()) / (1000 * 60 * 60 * 24));

        // Recent feedback count
        const pendingFeedbacks = await Feedback.countDocuments({ parentUserId: req.user.id, status: { $in: ['pending', 'in_progress'] } });

        res.json({
            success: true,
            data: {
                patient: {
                    id: patient._id,
                    patientId: patient.patientId,
                    name: patient.name,
                    age: patient.age,
                    gender: patient.gender,
                    diagnosis: patient.diagnosis,
                    therapyType: patient.therapyType,
                    admissionDate: admissionDate,
                    status: patient.status,
                    totalFee: patient.totalFee,
                    branch: patient.branchId,
                    therapist: patient.assignedTherapist,
                    parentName: patient.parentName,
                    parentPhone: patient.parentPhone,
                    parentEmail: patient.parentEmail,
                    address: patient.address,
                    diagnosisReportUrl: patient.diagnosisReportUrl,
                    consentFormUrl: patient.consentFormUrl,
                },
                stats: {
                    totalSessions: totalAttendance,
                    completedSessions: checkedOutAttendance,
                    daysSinceAdmission,
                    pendingFeedbacks,
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get full attendance history for linked patient
// @route   GET /api/parent/attendance
// @access  Private (parent)
const getAttendance = async (req, res) => {
    try {
        const parentUser = await User.findById(req.user.id);
        if (!parentUser || !parentUser.patientId) {
            return res.status(404).json({ success: false, message: 'No linked patient found.' });
        }

        const { month, year } = req.query;

        let query = { patientId: parentUser.patientId };

        // Filter by month/year if provided
        if (month && year) {
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const attendance = await PatientAttendance.find(query)
            .sort({ date: -1 })
            .lean();

        // Monthly summary
        const totalPresent = attendance.length;
        const totalCheckedOut = attendance.filter(a => a.status === 'checked_out').length;

        res.json({
            success: true,
            data: {
                records: attendance.map(a => ({
                    id: a._id,
                    date: a.date,
                    checkInTime: a.checkInTime,
                    checkOutTime: a.checkOutTime,
                    status: a.status,
                })),
                summary: {
                    totalPresent,
                    totalCheckedOut,
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get therapy schedule info
// @route   GET /api/parent/therapy
// @access  Private (parent)
const getTherapySchedule = async (req, res) => {
    try {
        const parentUser = await User.findById(req.user.id);
        if (!parentUser || !parentUser.patientId) {
            return res.status(404).json({ success: false, message: 'No linked patient found.' });
        }

        const patient = await Patient.findById(parentUser.patientId)
            .populate('serviceId', 'name price unit description')
            .populate('assignedTherapist', 'name designation');

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found.' });
        }

        res.json({
            success: true,
            data: {
                therapyType: patient.therapyType,
                service: patient.serviceId,
                therapist: patient.assignedTherapist,
                admissionDate: patient.admissionDate || patient.createdAt,
                status: patient.status,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all feedbacks submitted by this parent
// @route   GET /api/parent/feedbacks
// @access  Private (parent)
const getFeedbacks = async (req, res) => {
    try {
        const feedbacks = await Feedback.find({ parentUserId: req.user.id })
            .populate('repliedBy', 'name role')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            data: feedbacks
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Submit new feedback/request
// @route   POST /api/parent/feedbacks
// @access  Private (parent)
const createFeedback = async (req, res) => {
    try {
        const parentUser = await User.findById(req.user.id);
        if (!parentUser || !parentUser.patientId) {
            return res.status(404).json({ success: false, message: 'No linked patient found.' });
        }

        const patient = await Patient.findById(parentUser.patientId);
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found.' });
        }

        const { type, subject, message } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ success: false, message: 'Subject and message are required.' });
        }

        const feedback = await Feedback.create({
            patientId: patient._id,
            parentUserId: req.user.id,
            branchId: patient.branchId,
            type: type || 'feedback',
            subject,
            message,
        });

        res.status(201).json({
            success: true,
            data: feedback
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get parent + patient profile data
// @route   GET /api/parent/profile
// @access  Private (parent)
const getProfile = async (req, res) => {
    try {
        const parentUser = await User.findById(req.user.id);
        if (!parentUser || !parentUser.patientId) {
            return res.status(404).json({ success: false, message: 'No linked patient found.' });
        }

        const patient = await Patient.findById(parentUser.patientId)
            .populate('branchId', 'name address phone')
            .populate('assignedTherapist', 'name designation mobileNumber');

        res.json({
            success: true,
            data: {
                parent: {
                    id: parentUser._id,
                    name: parentUser.name,
                    email: parentUser.email,
                    phone: parentUser.mobileNumber,
                },
                patient: patient ? {
                    id: patient._id,
                    patientId: patient.patientId,
                    name: patient.name,
                    parentName: patient.parentName,
                    parentPhone: patient.parentPhone,
                    age: patient.age,
                    gender: patient.gender,
                    diagnosis: patient.diagnosis,
                    therapyType: patient.therapyType,
                    therapyDetails: patient.therapyDetails,
                    totalFee: patient.totalFee,
                    address: patient.address,
                    admissionDate: patient.admissionDate,
                    status: patient.status,
                    branch: patient.branchId,
                    therapist: patient.assignedTherapist,
                    diagnosisReportUrl: patient.diagnosisReportUrl,
                    consentFormUrl: patient.consentFormUrl,
                } : null
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get parent billing history
// @route   GET /api/parent/billing
// @access  Private (parent)
const getBilling = async (req, res) => {
    try {
        const parentUser = await User.findById(req.user.id);
        if (!parentUser || !parentUser.patientId) {
            return res.status(404).json({ success: false, message: 'No linked patient found.' });
        }

        const patient = await Patient.findById(parentUser.patientId);
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

        let billingHistory = await FeePayment.find({ patientId: patient._id })
            .populate('branchId')
            .sort({ createdAt: -1 });

        // Auto-heal missing fee payments (Initial Onboarding Fee)
        const totalBilled = billingHistory.reduce((sum, r) => sum + (r.amount || 0), 0);
        if (patient.totalFee > totalBilled) {
            const difference = patient.totalFee - totalBilled;
            const newFee = await FeePayment.create({
                patientId: patient._id,
                branchId: patient.branchId,
                amount: difference,
                dueAmount: difference,
                status: 'pending',
                description: 'Initial Therapy Fee',
                paymentDate: patient.admissionDate || new Date()
            });
            
            // Re-fetch to get the newly created record correctly
            billingHistory = await FeePayment.find({ patientId: patient._id })
                .populate('branchId')
                .sort({ createdAt: -1 });
        } else if (totalBilled > patient.totalFee) {
            // Auto-heal reduced fee payments by adjusting pending invoices
            let difference = totalBilled - patient.totalFee;
            const pendingInvoices = billingHistory.filter(r => r.dueAmount > 0);
            for (const inv of pendingInvoices) {
                if (difference <= 0) break;
                const reduceBy = Math.min(inv.dueAmount, difference);
                inv.amount = Math.max(0, inv.amount - reduceBy);
                inv.dueAmount = Math.max(0, inv.dueAmount - reduceBy);
                if (inv.dueAmount <= 0) {
                    inv.status = 'paid';
                } else {
                    inv.status = 'partial';
                }
                await inv.save();
                difference -= reduceBy;
            }
            
            // Re-fetch to get updated records
            billingHistory = await FeePayment.find({ patientId: patient._id })
                .populate('branchId')
                .sort({ createdAt: -1 });
        }

        const totalPaid = billingHistory.reduce((sum, f) => {
            if (f.transactions && f.transactions.length > 0) {
                const txPaid = f.transactions
                    .filter(t => t.status === 'approved' || !t.status)
                    .reduce((s, t) => s + (Number(t.amountPaid) || 0), 0);
                return sum + txPaid;
            }
            // Ignore auto-generated unpaid invoices in the paid calculation
            if (f.status === 'pending' && Number(f.amount) === Number(f.dueAmount)) {
                return sum;
            }
            return sum + (Number(f.amount) || 0);
        }, 0);

        const totalFee = patient.totalFee || 0;
        const totalDue = Math.max(0, totalFee - totalPaid);
        res.json({
            success: true,
            data: {
                history: billingHistory,
                totalFee,
                totalDue,
                totalPaid
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getDashboard,
    getAttendance,
    getTherapySchedule,
    getFeedbacks,
    createFeedback,
    getProfile,
    getBilling,
};
