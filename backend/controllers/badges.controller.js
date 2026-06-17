const FeePayment = require('../models/FeePayment');
const Feedback = require('../models/Feedback');

const getBadgesCount = async (req, res) => {
    try {
        let paymentFilter = { approvalStatus: 'pending' };
        let feedbackFilter = { status: 'pending' };

        // Scope to the manager's branch
        if (req.user.role === 'branch_manager') {
            paymentFilter.branchId = req.user.branchId;
            feedbackFilter.branchId = req.user.branchId;
        } else if (req.user.role === 'super_admin' && req.query.branch && req.query.branch !== 'all') {
            paymentFilter.branchId = req.query.branch;
            feedbackFilter.branchId = req.query.branch;
        }

        const [pendingPayments, pendingFeedbacks] = await Promise.all([
            FeePayment.countDocuments(paymentFilter),
            Feedback.countDocuments(feedbackFilter)
        ]);

        res.json({
            success: true,
            data: {
                pendingApprovals: pendingPayments,
                pendingFeedbacks: pendingFeedbacks
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getBadgesCount };
