const Feedback = require('../models/Feedback');

// @desc    Get all feedbacks (branch-scoped for manager, global for admin)
// @route   GET /api/manager/feedbacks  OR  GET /api/admin/feedbacks
// @access  Private (branch_manager, super_admin)
const getAllFeedbacks = async (req, res) => {
    try {
        const { status, branch, page = 1, limit = 10 } = req.query;

        let query = {};

        // Branch-scoped for manager, global for admin
        if (req.user.role === 'branch_manager') {
            query.branchId = req.user.branchId;
        } else if (req.user.role === 'super_admin' && branch && branch !== 'all') {
            query.branchId = branch;
        }

        // Status filter
        if (status && status !== 'all') {
            query.status = status;
        }

        console.log('Feedback API Query:', req.query, 'Constructed DB Query:', query);

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [feedbacks, totalCount, allFeedbacksForStats] = await Promise.all([
            Feedback.find(query)
                .populate('patientId', 'name patientId parentName')
                .populate('parentUserId', 'name email')
                .populate('branchId', 'name')
                .populate('repliedBy', 'name role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Feedback.countDocuments(query),
            Feedback.find(query).select('status').lean() // for accurate stats across all pages
        ]);

        const pendingCount = allFeedbacksForStats.filter(f => f.status === 'pending').length;
        const inProgressCount = allFeedbacksForStats.filter(f => f.status === 'in_progress').length;
        const resolvedCount = allFeedbacksForStats.filter(f => f.status === 'resolved').length;

        res.json({
            success: true,
            data: feedbacks,
            pagination: {
                total: totalCount,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalCount / parseInt(limit))
            },
            stats: {
                total: totalCount,
                pending: pendingCount,
                inProgress: inProgressCount,
                resolved: resolvedCount,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Reply to feedback + update status
// @route   PUT /api/manager/feedbacks/:id  OR  PUT /api/admin/feedbacks/:id
// @access  Private (branch_manager, super_admin)
const replyToFeedback = async (req, res) => {
    try {
        const { status, adminReply } = req.body;

        const feedback = await Feedback.findById(req.params.id);

        if (!feedback) {
            return res.status(404).json({ success: false, message: 'Feedback not found.' });
        }

        // Branch-scoped check for manager
        if (req.user.role === 'branch_manager' && feedback.branchId.toString() !== req.user.branchId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this feedback.' });
        }

        if (status) feedback.status = status;
        if (adminReply) {
            feedback.adminReply = adminReply;
            feedback.repliedBy = req.user.id;
            feedback.repliedAt = new Date();
        }

        await feedback.save();

        // Re-fetch with populated fields
        const updated = await Feedback.findById(feedback._id)
            .populate('patientId', 'name patientId parentName')
            .populate('parentUserId', 'name email')
            .populate('branchId', 'name')
            .populate('repliedBy', 'name role')
            .lean();

        res.json({
            success: true,
            data: updated
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllFeedbacks,
    replyToFeedback,
};
