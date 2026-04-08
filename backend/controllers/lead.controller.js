const Lead = require('../models/Lead');

// GET /api/admin/leads?branch=ID&status=new
const getLeads = async (req, res) => {
    try {
        const filter = {};
        if (req.query.branch) filter.branchId = req.query.branch;
        if (req.query.status) filter.status = req.query.status;

        const leads = await Lead.find(filter)
            .populate('branchId', 'name')
            .populate('assignedTo', 'name')
            .sort({ createdAt: -1 });
        res.json({ success: true, count: leads.length, data: leads });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/admin/leads
const createLead = async (req, res) => {
    try {
        const lead = await Lead.create(req.body);
        res.status(201).json({ success: true, data: lead });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// PUT /api/admin/leads/:id
const updateLead = async (req, res) => {
    try {
        const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
        res.json({ success: true, data: lead });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// GET /api/admin/leads/stats
const getLeadStats = async (req, res) => {
    try {
        const filter = {};
        if (req.query.branch) filter.branchId = req.query.branch;

        const [total, newLeads, contacted, converted, closed] = await Promise.all([
            Lead.countDocuments(filter),
            Lead.countDocuments({ ...filter, status: 'new' }),
            Lead.countDocuments({ ...filter, status: 'contacted' }),
            Lead.countDocuments({ ...filter, status: 'converted' }),
            Lead.countDocuments({ ...filter, status: 'closed' }),
        ]);

        res.json({
            success: true,
            data: { total, new: newLeads, contacted, converted, closed }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getLeads, createLead, updateLead, getLeadStats };
