const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function resetUsers() {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./models/User');

    // Reset Admin password to "admin123"
    const salt = await bcrypt.genSalt(10);
    const hashedAdmin = await bcrypt.hash('admin123', salt);
    const hashedManager = await bcrypt.hash('manager123', salt);
    const hashedPublic = await bcrypt.hash('user123', salt);

    // Update or create Super Admin
    await User.findOneAndUpdate(
        { email: 'admin@rehablito.com' },
        { password: hashedAdmin, role: 'super_admin', name: 'Admin User' },
        { upsert: true }
    );
    console.log('[OK] Super Admin: admin@rehablito.com / admin123');

    // Create Branch Manager if not exists
    const managerExists = await User.findOne({ email: 'manager@rehablito.com' });
    if (!managerExists) {
        await User.create({
            name: 'Branch Manager',
            email: 'manager@rehablito.com',
            password: 'manager123',
            role: 'branch_manager',
            branchId: new mongoose.Types.ObjectId(),
        });
    } else {
        await User.findOneAndUpdate(
            { email: 'manager@rehablito.com' },
            { password: hashedManager, role: 'branch_manager', name: 'Branch Manager' }
        );
    }
    console.log('[OK] Branch Manager: manager@rehablito.com / manager123');

    // Update OTP Staff
    const staffExists = await User.findOne({ staffId: 'STF-001' });
    if (staffExists) {
        console.log('[OK] Staff OTP: STF-001 / +1234567890 (request OTP, check backend console)');
    }

    // Create Public User if not exists
    const publicExists = await User.findOne({ email: 'user@rehablito.com' });
    if (!publicExists) {
        await User.create({
            name: 'Patient User',
            email: 'user@rehablito.com',
            password: 'user123',
            role: 'public_user',
        });
    } else {
        await User.findOneAndUpdate(
            { email: 'user@rehablito.com' },
            { password: hashedPublic, role: 'public_user', name: 'Patient User' }
        );
    }
    console.log('[OK] Public User: user@rehablito.com / user123');

    console.log('\nAll login credentials reset. You can now log in.\n');
    process.exit(0);
}

resetUsers().catch(e => { console.error('Error:', e.message); process.exit(1); });
