const Branch = require('../models/Branch');
const User = require('../models/User');

// GET /api/admin/branches
const getBranches = async (req, res) => {
    try {
        const branches = await Branch.find()
            .populate('managerId', 'name email')
            .sort({ createdAt: -1 });
        res.json({ success: true, count: branches.length, data: branches });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/admin/branches/:id
const getBranch = async (req, res) => {
    try {
        const branch = await Branch.findById(req.params.id).populate('managerId', 'name email');
        if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
        res.json({ success: true, data: branch });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/admin/branches
const createBranch = async (req, res) => {
    try {
        const branch = await Branch.create(req.body);
        res.status(201).json({ success: true, data: branch });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// PUT /api/admin/branches/:id
const updateBranch = async (req, res) => {
    try {
        const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
        res.json({ success: true, data: branch });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// DELETE /api/admin/branches/:id (soft delete)
const deleteBranch = async (req, res) => {
    try {
        const branch = await Branch.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
        res.json({ success: true, message: 'Branch deactivated', data: branch });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getBranches, getBranch, createBranch, updateBranch, deleteBranch };
