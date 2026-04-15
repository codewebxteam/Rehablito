const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    childName: { type: String, trim: true },
    parentName: { type: String },
    parentPhone: { type: String, required: true },
    parentEmail: { type: String },
    age: { type: Number },
    diagnosis: { type: String },
    referredBy: { type: String },
    status: {
        type: String,
        enum: ['new', 'contacted', 'converted', 'closed'],
        default: 'new'
    },
    branchId: { type: mongoose.Schema.ObjectId, ref: 'Branch' },
    assignedTo: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
    notes: [{
        text: String,
        addedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now }
    }],
}, { timestamps: true });

leadSchema.index({ branchId: 1, status: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);
