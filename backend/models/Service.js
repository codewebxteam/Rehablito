const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Service name is required'], trim: true },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    unit: { type: String, enum: ['session', 'month'], default: 'session' },
    description: { type: String, trim: true },
    // Empty array = global (visible to ALL branches). Populated = only those branches.
    branchIds: [{ type: mongoose.Schema.ObjectId, ref: 'Branch' }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
}, { timestamps: true });

serviceSchema.index({ branchIds: 1 });
serviceSchema.index({ isActive: 1 });

module.exports = mongoose.model('Service', serviceSchema);
