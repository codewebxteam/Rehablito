const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    branchId: { type: mongoose.Schema.ObjectId, ref: 'Branch', required: true },
    date: { type: Date, required: true },
    // Check-in/out as full timestamps for duty timer calculation
    checkIn: { type: String },
    checkOut: { type: String },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    status: {
        type: String,
        enum: ['present', 'absent', 'leave', 'half_day', 'on_duty'],
        default: 'present'
    },
    // Location captured at check-in
    checkInLocation: {
        latitude: { type: Number },
        longitude: { type: Number }
    },
    checkOutLocation: {
        latitude: { type: Number },
        longitude: { type: Number }
    },
    // Calculated duty hours
    dutyHours: { type: Number, default: 0 },
    // Whether check-in was validated against geofence
    locationVerified: { type: Boolean, default: false },
}, { timestamps: true });

// Compound index to prevent duplicate attendance per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

// Calculate duty hours on check-out
attendanceSchema.pre('save', function () {
    if (this.checkInTime && this.checkOutTime) {
        const diff = this.checkOutTime.getTime() - this.checkInTime.getTime();
        this.dutyHours = parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
    }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
