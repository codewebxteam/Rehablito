const Lead = require('../models/Lead');
const mongoose = require('mongoose');

// Helper: Get manager's branch ID
const getManagerBranchId = (req) => {
    if (req.user.role === 'super_admin' && req.query.branch) {
        return req.query.branch;
    }
    return req.user.branchId;
};

// Helper: Mask phone number
// Managers can see names but phone numbers must be masked: ******3210
const maskPhone = (phone) => {
    if (!phone || phone.length < 4) return '**********';
    return '*'.repeat(phone.length - 4) + phone.slice(-4);
};

// Apply masking to lead data
const maskLeadData = (lead) => {
    const obj = lead.toObject ? lead.toObject() : { ...lead };
    if (obj.parentPhone) {
        obj.parentPhone = maskPhone(obj.parentPhone);
    }
    if (obj.parentEmail) {
        // Partially mask email: ab****@domain.com
        const [localPart, domain] = obj.parentEmail.split('@');
        if (localPart && domain) {
            const visible = localPart.slice(0, 2);
            obj.parentEmail = `${visible}${'*'.repeat(Math.max(localPart.length - 2, 2))}@${domain}`;
        }
    }
    return obj;
};

// GET /api/manager/leads
// Fetch all leads for the manager's branch
const getLeads = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);
        const filter = { branchId };
        if (req.query.status) filter.status = req.query.status;
        if (req.query.search) {
            filter.$or = [
                { childName: { $regex: req.query.search, $options: 'i' } },
                { parentName: { $regex: req.query.search, $options: 'i' } },
            ];
        }

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [leads, total] = await Promise.all([
            Lead.find(filter)
                .populate('branchId', 'name')
                .populate('assignedTo', 'name')
                .populate('notes.addedBy', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Lead.countDocuments(filter),
        ]);

        // Mask phone numbers for privacy
        const maskedLeads = leads.map(maskLeadData);

        res.json({
            success: true,
            count: maskedLeads.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: maskedLeads,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/manager/leads/:id
// Get single lead (branch-scoped, masked)
const getLead = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);
        const lead = await Lead.findOne({ _id: req.params.id, branchId })
            .populate('branchId', 'name')
            .populate('assignedTo', 'name')
            .populate('notes.addedBy', 'name');

        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found in your branch' });
        }

        res.json({ success: true, data: maskLeadData(lead) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/manager/leads
// Create a new lead entry
const createLead = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);

        const leadData = {
            ...req.body,
            branchId,
        };

        const lead = await Lead.create(leadData);

        const populatedLead = await Lead.findById(lead._id)
            .populate('branchId', 'name')
            .populate('assignedTo', 'name');

        res.status(201).json({ success: true, data: maskLeadData(populatedLead) });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// PUT /api/manager/leads/:id
// Update a lead (branch-scoped)
const updateLead = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);

        // Prevent manager from changing branch
        delete req.body.branchId;

        const lead = await Lead.findOneAndUpdate(
            { _id: req.params.id, branchId },
            req.body,
            { new: true, runValidators: true }
        )
            .populate('branchId', 'name')
            .populate('assignedTo', 'name');

        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found in your branch' });
        }

        res.json({ success: true, data: maskLeadData(lead) });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// POST /api/manager/leads/:id/notes
// Add a note/follow-up to a lead
const addLeadNote = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ success: false, message: 'Note text is required' });
        }

        const lead = await Lead.findOne({ _id: req.params.id, branchId });
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found in your branch' });
        }

        lead.notes.push({
            text,
            addedBy: req.user._id,
            addedAt: new Date(),
        });

        await lead.save();

        const populatedLead = await Lead.findById(lead._id)
            .populate('branchId', 'name')
            .populate('assignedTo', 'name')
            .populate('notes.addedBy', 'name');

        res.json({ success: true, data: maskLeadData(populatedLead) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/manager/leads/:id/convert
// Convert a lead to a patient
const convertLeadToPatient = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);

        const lead = await Lead.findOne({ _id: req.params.id, branchId });
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found in your branch' });
        }

        if (lead.status === 'converted') {
            return res.status(400).json({ success: false, message: 'Lead is already converted to patient' });
        }

        // Return the lead data for the frontend to pre-fill the patient form.
        // The actual patient creation should happen via POST /api/manager/patients.
        lead.status = 'converted';
        await lead.save();

        res.json({
            success: true,
            message: 'Lead marked as converted. Use the patient data to create a patient record.',
            data: {
                leadId: lead._id,
                prefillData: {
                    childName: lead.childName,
                    parentName: lead.parentName,
                    parentPhone: lead.parentPhone,
                    parentEmail: lead.parentEmail,
                    age: lead.age,
                    diagnosis: lead.diagnosis,
                    branchId: lead.branchId,
                    leadId: lead._id,
                }
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/manager/leads/stats
// Lead statistics for the branch
const getLeadStats = async (req, res) => {
    try {
        const branchId = getManagerBranchId(req);
        const filter = { branchId: new mongoose.Types.ObjectId(branchId) };

        const [total, newLeads, contacted, converted, closed] = await Promise.all([
            Lead.countDocuments({ branchId }),
            Lead.countDocuments({ branchId, status: 'new' }),
            Lead.countDocuments({ branchId, status: 'contacted' }),
            Lead.countDocuments({ branchId, status: 'converted' }),
            Lead.countDocuments({ branchId, status: 'closed' }),
        ]);

        // Conversion rate
        const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : 0;

        // Leads by referral source
        const referralBreakdown = await Lead.aggregate([
            { $match: filter },
            { $group: { _id: '$referredBy', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        // Recent leads (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentLeads = await Lead.countDocuments({
            branchId,
            createdAt: { $gte: sevenDaysAgo },
        });

        res.json({
            success: true,
            data: {
                total,
                new: newLeads,
                contacted,
                converted,
                closed,
                conversionRate: `${conversionRate}%`,
                recentLeads,
                referralBreakdown,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getLeads,
    getLead,
    createLead,
    updateLead,
    addLeadNote,
    convertLeadToPatient,
    getLeadStats,
};
