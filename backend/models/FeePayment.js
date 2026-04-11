const mongoose = require('mongoose');

const feePaymentSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.ObjectId, ref: 'Patient', required: true },
    branchId: { type: mongoose.Schema.ObjectId, ref: 'Branch', required: true },
    amount: { type: Number, required: [true, 'Amount is required'] },
    dueAmount: { type: Number, default: 0 },
    paymentDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
    method: {
        type: String,
        enum: ['cash', 'upi', 'bank_transfer', 'card'],
        default: 'cash'
    },
    status: {
        type: String,
        enum: ['paid', 'partial', 'overdue', 'pending'],
        default: 'paid'
    },
    receiptNumber: { type: String },
    collectedBy: { type: mongoose.Schema.ObjectId, ref: 'User' },
    description: { type: String },
}, { timestamps: true });

// Auto-generate receipt number
feePaymentSchema.pre('save', function () {
    if (!this.receiptNumber) {
        this.receiptNumber = 'RCP-' + Date.now().toString(36).toUpperCase();
    }
});

module.exports = mongoose.model('FeePayment', feePaymentSchema);
