const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    childName: { type: String, required: [true, 'Child name is required'], trim: true },
    parentName: { type: String, required: true },
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
    branchId: { type: mongoose.Schema.ObjectId, ref: 'Branch', required: true },
    assignedTo: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
    notes: [{
        text: String,
        addedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
        addedAt: { type: Date, default: Date.now }
    }],
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
