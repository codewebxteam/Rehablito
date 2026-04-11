const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Branch name is required'], trim: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    phone: { type: String, required: true },
    email: { type: String },
    managerId: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true },
    // Geofence configuration for location-based attendance
    location: {
        latitude: { type: Number, default: 0 },
        longitude: { type: Number, default: 0 },
        radiusMeters: { type: Number, default: 200 }
    },
    // Shift timing defaults
    shiftStart: { type: String, default: '09:00' },
    shiftEnd: { type: String, default: '18:00' },
}, { timestamps: true });

module.exports = mongoose.model('Branch', branchSchema);
