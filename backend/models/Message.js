const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['super_admin', 'branch_manager', 'staff'], required: true },
    senderName: { type: String },
    branchId: { type: mongoose.Schema.ObjectId, ref: 'Branch' }, // Optional, to target a branch
    patientId: { type: mongoose.Schema.ObjectId, ref: 'Patient' }, // Optional, to target a specific patient
    message: { type: String, required: true },
    isGlobal: { type: Boolean, default: false }, // If true, sent to all parents
    status: { type: String, enum: ['active', 'archived'], default: 'active' }
}, { timestamps: true });

messageSchema.index({ branchId: 1, createdAt: -1 });
messageSchema.index({ patientId: 1, createdAt: -1 });
messageSchema.index({ isGlobal: 1 });

module.exports = mongoose.model('Message', messageSchema);
