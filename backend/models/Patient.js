const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    childName: { type: String, required: [true, 'Child name is required'], trim: true },
    parentName: { type: String, required: true },
    parentPhone: { type: String, required: true },
    parentEmail: { type: String },
    dob: { type: Date },
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    diagnosis: { type: String },
    therapyType: [{
        type: String,
        enum: ['physiotherapy', 'speech_therapy', 'occupational_therapy', 'aba_therapy', 'autism_therapy']
    }],
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

module.exports = mongoose.model('Patient', patientSchema);
