const Message = require('../models/Message');

// Manager sends a message to parents
exports.sendMessage = async (req, res) => {
    try {
        const { message, patientId, isGlobal } = req.body;
        const branchId = req.user.branchId;

        const newMessage = await Message.create({
            senderId: req.user._id,
            senderRole: req.user.role,
            senderName: req.user.name,
            branchId,
            patientId: patientId || null,
            message,
            isGlobal: !!isGlobal
        });

        res.status(201).json({ success: true, data: newMessage });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Parent fetches messages
exports.getMessagesForParent = async (req, res) => {
    try {
        const patientId = req.user.patientId;
        // Find messages where patientId matches OR it's global for the branch
        // We'd need branchId of the patient to get branch global messages.
        // Let's just fetch global messages + patient specific messages.
        
        const Patient = require('../models/Patient');
        const patient = await Patient.findById(patientId);
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

        const messages = await Message.find({
            $or: [
                { patientId: patientId },
                { branchId: patient.branchId, isGlobal: true }
            ],
            status: 'active'
        }).sort({ createdAt: -1 });

        res.json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
