const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['super_admin', 'branch_manager', 'staff', 'parent'],
        default: 'staff'
    },
    // 🔥 NEW: Dynamic Designation Field (Physiotherapist, Speech Therapist, etc.)
    designation: {
        type: String,
        trim: true
    },
    // 🔥 Parent Portal: Link parent user to their child's patient record
    patientId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Patient',
        default: null
    },
    // Required fields for specific roles (not required for parent)
    branchId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Branch',
        required: function() {
            return this.role === 'branch_manager' || this.role === 'staff';
        }
    },
    staffId: {
        type: String,
        unique: true,
        sparse: true
    },
    mobileNumber: {
        type: String
    },
    aadharNumber: {
        type: String
    },
    otp: {
        type: String
    },
    otpExpires: {
        type: Date
    }
}, { timestamps: true });

// Encrypt password using bcrypt
userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.index({ branchId: 1, role: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);