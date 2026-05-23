const mongoose = require('mongoose');

const patientAttendanceSchema = new mongoose.Schema({
    patientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Patient', 
        required: true 
    },
    branchId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Branch', 
        required: true 
    },
    date: { 
        type: Date, 
        required: true 
    }, // Aaj ki date (00:00:00 time ke sath for easy filtering)
    checkInTime: { 
        type: Date, 
        default: null 
    },
    checkOutTime: { 
        type: Date, 
        default: null 
    },
    status: {
        type: String,
        enum: ['checked_in', 'checked_out'],
        default: 'checked_in'
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Manager jisne attendance mark ki
        required: true
    }
}, { timestamps: true });

// Ek din me ek patient ka ek hi attendance record banega (Prevent duplicates)
patientAttendanceSchema.index({ patientId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('PatientAttendance', patientAttendanceSchema);