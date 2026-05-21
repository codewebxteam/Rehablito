const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function resetUsers() {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./models/User');
    const Branch = require('./models/Branch');

    // Secure password hashing for Production
    const salt = await bcrypt.genSalt(10);
    const hashedAdmin = await bcrypt.hash('@Rehablito2026', salt);

    // Update or create Super Admin
    await User.findOneAndUpdate(
        { email: 'rehablito@gmail.com' },
        { password: hashedAdmin, role: 'super_admin', name: 'Admin User' },
        { upsert: true }
    );

    process.exit(0);
}

resetUsers().catch(e => { console.error('Error:', e.message); process.exit(1); });