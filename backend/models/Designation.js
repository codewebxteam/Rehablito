const mongoose = require('mongoose');

const designationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a designation name'],
        unique: true,
        trim: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Designation', designationSchema);