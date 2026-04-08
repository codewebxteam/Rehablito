const mongoose = require('mongoose');
const User = require('./models/User');

const baseUrl = 'http://localhost:5000/api';

async function testFullOTPFlow() {
    console.log('Testing MongoDB OTP Flow');

    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/rehablito');
        await User.deleteMany({ $or: [{email: 'otp_staff@rehablito.com'}, {staffId: 'STF-001'}] });

        console.log('\n1. Register Staff User');
        const regRes = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'OTP Demo Staff',
                email: 'otp_staff@rehablito.com',
                password: 'password123',
                role: 'staff',
                branchId: '60d21b4667d0d8992e610c85',
                staffId: 'STF-001',
                mobileNumber: '+1234567890'
            })
        });
        console.log('Register Response:', await regRes.json());

        console.log('\n2. Requesting OTP...');
        const otpRes = await fetch(`${baseUrl}/auth/request-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staffId: 'STF-001', mobileNumber: '+1234567890' })
        });
        console.log('Request OTP Response:', await otpRes.json());

        console.log('\n3. Fetching OTP from Database...');
        const user = await User.findOne({ staffId: 'STF-001' });
        const generatedOtp = user.otp;
        console.log('Found OTP in DB:', generatedOtp);

        console.log('\n4. Verifying OTP...');
        const verifyRes = await fetch(`${baseUrl}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staffId: 'STF-001', otp: generatedOtp })
        });
        const verifyData = await verifyRes.json();
        console.log('Verify OTP Response:', verifyData);

        console.log('\n5. Accessing Protected Route with Role Guard...');
        const testRes = await fetch(`${baseUrl}/staff/dashboard`, {
            headers: { 'Authorization': `Bearer ${verifyData.token}` }
        });
        console.log('Staff Dashboard Output:', await testRes.json());

        await mongoose.disconnect();
    } catch(e) {
        console.error(e);
        await mongoose.disconnect();
    }
}
testFullOTPFlow();
