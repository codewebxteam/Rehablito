const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Patient',
        required: [true, 'Patient ID is required']
    },
    parentUserId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Parent User ID is required']
    },
    branchId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Branch',
        required: [true, 'Branch ID is required']
    },
    type: {
        type: String,
        enum: ['feedback', 'complaint', 'request'],
        default: 'feedback'
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'resolved', 'closed'],
        default: 'pending'
    },
    adminReply: {
        type: String,
        trim: true
    },
    repliedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        default: null
    },
    repliedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

feedbackSchema.index({ branchId: 1, status: 1 });
feedbackSchema.index({ parentUserId: 1 });
feedbackSchema.index({ patientId: 1 });
feedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
