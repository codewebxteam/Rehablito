const Service = require('../models/Service');
const Branch = require('../models/Branch');

// ─────────────────────────────────────────────
// GET /api/admin/services
// Admin: all services with branch info
// GET /api/manager/services
// Manager: services available to their branch (global + branch-specific)
// ─────────────────────────────────────────────
const getServices = async (req, res) => {
    try {
        let query = { isActive: true };

        if (req.user.role === 'branch_manager') {
            const branchId = req.user.branchId;
            if (!branchId) {
                return res.json({ success: true, count: 0, data: [] });
            }
            // Fetch services that are global (branchIds empty) OR include this branch
            query = {
                isActive: true,
                $or: [
                    { branchIds: { $size: 0 } },
                    { branchIds: branchId },
                ],
            };
        }

        const services = await Service.find(query)
            .populate('branchIds', 'name')
            .sort({ name: 1 });

        res.json({ success: true, count: services.length, data: services });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// POST /api/admin/services  (admin only)
// POST /api/manager/services (manager: auto-scope to their branch)
// ─────────────────────────────────────────────
const createService = async (req, res) => {
    try {
        let branchIds = req.body.branchIds || [];

        // If manager creates a service, scope it to their branch
        if (req.user.role === 'branch_manager') {
            branchIds = req.user.branchId ? [req.user.branchId] : [];
        }

        const service = await Service.create({
            name: req.body.name,
            price: req.body.price,
            unit: req.body.unit || 'session',
            description: req.body.description,
            branchIds,
            createdBy: req.user._id,
        });

        const populated = await Service.findById(service._id).populate('branchIds', 'name');
        res.status(201).json({ success: true, data: populated });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// PUT /api/admin/services/:id  (admin: full update)
// PUT /api/manager/services/:id (manager: price/name only, no branch change)
// ─────────────────────────────────────────────
const updateService = async (req, res) => {
    try {
        const updateData = {
            name: req.body.name,
            price: req.body.price,
            unit: req.body.unit,
            description: req.body.description,
        };

        // Only admin can change branch scoping
        if (req.user.role === 'super_admin') {
            updateData.branchIds = req.body.branchIds || [];
        }

        // Manager can only update services scoped to their branch
        let filter = { _id: req.params.id };
        if (req.user.role === 'branch_manager') {
            filter.branchIds = req.user.branchId;
        }

        const service = await Service.findOneAndUpdate(filter, updateData, {
            new: true,
            runValidators: true,
        }).populate('branchIds', 'name');

        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found or not accessible' });
        }

        res.json({ success: true, data: service });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// ─────────────────────────────────────────────
// DELETE /api/admin/services/:id (admin only)
// DELETE /api/manager/services/:id (manager: only their branch services)
// ─────────────────────────────────────────────
const deleteService = async (req, res) => {
    try {
        let filter = { _id: req.params.id };

        // Manager can only delete services scoped specifically to their branch
        if (req.user.role === 'branch_manager') {
            filter.branchIds = req.user.branchId;
        }

        const service = await Service.findOneAndUpdate(
            filter,
            { isActive: false },
            { new: true }
        );

        if (!service) {
            return res.status(404).json({ success: false, message: 'Service not found or not accessible' });
        }

        res.json({ success: true, message: 'Service deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { getServices, createService, updateService, deleteService };
