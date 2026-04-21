const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    patientId: { type: String, unique: true, sparse: true },
    name: { type: String, required: [true, 'Name is required'], trim: true },
    parentName: { type: String },
    parentPhone: { type: String },
    parentEmail: { type: String },
    dob: { type: Date },
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    diagnosis: { type: String },
    address: { type: String },
    therapyType: [{
        type: String
    }],
    // Service from the Services catalogue
    serviceId: { type: mongoose.Schema.ObjectId, ref: 'Service', default: null },
    // Total fee captured at time of onboarding (denormalised for billing reference)
    totalFee: { type: Number, default: 0 },
    branchId: { type: mongoose.Schema.ObjectId, ref: 'Branch', required: true },
    assignedTherapist: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
    admissionDate: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['active', 'discharged', 'on_hold'],
        default: 'active'
    },
    leadId: { type: mongoose.Schema.ObjectId, ref: 'Lead', default: null },
}, { timestamps: true });

patientSchema.index({ branchId: 1, status: 1 });
patientSchema.index({ status: 1 });
patientSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Patient', patientSchema);
