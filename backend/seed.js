const mongoose = require('mongoose');
require('dotenv').config();

const Branch = require('./models/Branch');
const User = require('./models/User');
const Lead = require('./models/Lead');
const Patient = require('./models/Patient');
const FeePayment = require('./models/FeePayment');
const Attendance = require('./models/Attendance');

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...\n');

    // 1. BRANCHES with geofence coordinates
    await Branch.deleteMany({});
    const branches = await Branch.insertMany([
        {
            name: 'Downtown Clinic', address: '123 Main St', city: 'Mumbai', state: 'Maharashtra',
            phone: '+91-9876543210', email: 'downtown@rehablito.com',
            location: { latitude: 19.0760, longitude: 72.8777, radiusMeters: 200 },
            shiftStart: '09:00', shiftEnd: '18:00',
        },
        {
            name: 'Westside Center', address: '456 Oak Avenue', city: 'Delhi', state: 'Delhi',
            phone: '+91-9876543211', email: 'westside@rehablito.com',
            location: { latitude: 28.6139, longitude: 77.2090, radiusMeters: 250 },
            shiftStart: '09:00', shiftEnd: '18:00',
        },
        {
            name: 'North Hills Hub', address: '789 Pine Road', city: 'Bangalore', state: 'Karnataka',
            phone: '+91-9876543212', email: 'northhills@rehablito.com',
            location: { latitude: 12.9716, longitude: 77.5946, radiusMeters: 200 },
            shiftStart: '09:30', shiftEnd: '18:30',
        },
    ]);
    console.log(`${branches.length} Branches created`);

    // 2. STAFF USERS
    const staffUsers = [];
    const therapistNames = [
        'Dr. Priya Sharma', 'Dr. Rahul Gupta', 'Dr. Anita Desai', 'Therapist Kiran Rao',
        'Therapist Meena Patel', 'Dr. Sanjay Kumar', 'Therapist Neha Verma', 'Dr. Ravi Shankar'
    ];

    for (let i = 0; i < therapistNames.length; i++) {
        const branchIdx = i % 3;
        const emailKey = therapistNames[i].toLowerCase().replace(/[^a-z]/g, '') + '@rehablito.com';
        let user = await User.findOne({ email: emailKey });
        if (!user) {
            user = await User.create({
                name: therapistNames[i],
                email: emailKey,
                password: 'staff123',
                role: 'staff',
                branchId: branches[branchIdx]._id,
                staffId: `STF-${String(100 + i).padStart(3, '0')}`,
                mobileNumber: `+91${9000000000 + i}`,
            });
        } else {
            user.branchId = branches[branchIdx]._id;
            await user.save();
        }
        staffUsers.push(user);
    }
    console.log(`${staffUsers.length} Staff/Therapists ready`);

    // Update branch managers
    let mgr = await User.findOne({ email: 'manager@rehablito.com' });
    if (mgr) {
        mgr.branchId = branches[0]._id;
        await mgr.save();
        branches[0].managerId = mgr._id;
        await branches[0].save();
    }

    // Update STF-001 branchId
    const stf001 = await User.findOne({ staffId: 'STF-001' });
    if (stf001) {
        stf001.branchId = branches[0]._id;
        await stf001.save();
    }

    // 3. LEADS
    await Lead.deleteMany({});
    const leadData = [
        { childName: 'Arjun Mehta', parentName: 'Rajesh Mehta', parentPhone: '+91-9800000001', age: 4, diagnosis: 'Autism Spectrum', status: 'new', branchId: branches[0]._id, referredBy: 'Dr. Singh' },
        { childName: 'Sanya Patel', parentName: 'Vikas Patel', parentPhone: '+91-9800000002', age: 6, diagnosis: 'Speech Delay', status: 'contacted', branchId: branches[0]._id, referredBy: 'Hospital' },
        { childName: 'Rohan Das', parentName: 'Amit Das', parentPhone: '+91-9800000003', age: 3, diagnosis: 'Cerebral Palsy', status: 'converted', branchId: branches[1]._id, referredBy: 'Walk-in' },
        { childName: 'Isha Gupta', parentName: 'Suresh Gupta', parentPhone: '+91-9800000004', age: 5, diagnosis: 'ADHD', status: 'new', branchId: branches[1]._id, referredBy: 'Online' },
        { childName: 'Kabir Singh', parentName: 'Harpreet Singh', parentPhone: '+91-9800000005', age: 7, diagnosis: 'Autism', status: 'contacted', branchId: branches[2]._id, referredBy: 'Parent Referral' },
        { childName: 'Anaya Joshi', parentName: 'Deepak Joshi', parentPhone: '+91-9800000006', age: 4, diagnosis: 'Down Syndrome', status: 'new', branchId: branches[2]._id, referredBy: 'School' },
        { childName: 'Vivaan Reddy', parentName: 'Krishna Reddy', parentPhone: '+91-9800000007', age: 8, diagnosis: 'Learning Disability', status: 'closed', branchId: branches[0]._id, referredBy: 'Dr. Rao' },
        { childName: 'Diya Nair', parentName: 'Sunil Nair', parentPhone: '+91-9800000008', age: 5, diagnosis: 'Speech Delay', status: 'new', branchId: branches[1]._id, referredBy: 'Walk-in' },
    ];
    const leads = await Lead.insertMany(leadData);
    console.log(`${leads.length} Leads created`);

    // 4. PATIENTS
    await Patient.deleteMany({});
    const therapies = ['physiotherapy', 'speech_therapy', 'occupational_therapy', 'aba_therapy', 'autism_therapy'];
    const patientData = [];
    const childNames = [
        'Aarav Sharma', 'Myra Kapoor', 'Vivaan Choudhary', 'Ananya Iyer', 'Reyansh Malhotra',
        'Kiara Bose', 'Aditya Pillai', 'Saanvi Jain', 'Vihaan Agarwal', 'Zara Khan',
        'Ishaan Nair', 'Anika Saxena', 'Arnav Mishra', 'Riya Shetty', 'Dhruv Bansal',
    ];
    for (let i = 0; i < childNames.length; i++) {
        const branchIdx = i % 3;
        const therapistIdx = i % staffUsers.length;
        patientData.push({
            childName: childNames[i],
            parentName: `Parent of ${childNames[i].split(' ')[0]}`,
            parentPhone: `+91-98${String(10000000 + i)}`,
            dob: new Date(2018 + (i % 5), i % 12, (i % 28) + 1),
            age: 4 + (i % 5),
            gender: i % 3 === 0 ? 'male' : i % 3 === 1 ? 'female' : 'other',
            diagnosis: ['Autism', 'Speech Delay', 'Cerebral Palsy', 'ADHD', 'Down Syndrome'][i % 5],
            therapyType: [therapies[i % 5], therapies[(i + 1) % 5]],
            branchId: branches[branchIdx]._id,
            assignedTherapist: staffUsers[therapistIdx]._id,
            admissionDate: new Date(2025, i % 12, (i % 28) + 1),
            status: i < 12 ? 'active' : i < 14 ? 'on_hold' : 'discharged',
        });
    }
    const patients = await Patient.insertMany(patientData);
    console.log(`${patients.length} Patients created`);

    // 5. FEE PAYMENTS
    await FeePayment.deleteMany({});
    const feeData = [];
    const methods = ['cash', 'upi', 'bank_transfer', 'card'];
    for (let i = 0; i < patients.length; i++) {
        const p = patients[i];
        for (let j = 0; j < 2; j++) {
            const amount = [5000, 8000, 10000, 12000, 15000][i % 5];
            const due = j === 0 ? 0 : [0, 2000, 3000, 0, 5000][i % 5];
            feeData.push({
                patientId: p._id,
                branchId: p.branchId,
                amount,
                dueAmount: due,
                paymentDate: new Date(2025, (i + j) % 12, (i % 28) + 1),
                dueDate: due > 0 ? new Date(2026, (i + j + 1) % 12, 15) : null,
                method: methods[(i + j) % 4],
                status: due === 0 ? 'paid' : due < amount ? 'partial' : 'overdue',
                collectedBy: staffUsers[i % staffUsers.length]._id,
                description: `Therapy fees - Month ${j + 1}`,
            });
        }
    }
    const fees = await FeePayment.insertMany(feeData);
    console.log(`${fees.length} Fee Payments created`);

    // 6. ATTENDANCE with timestamps and location data
    await Attendance.deleteMany({});
    const attData = [];
    const allStaff = await User.find({ role: { $in: ['staff', 'branch_manager'] }, branchId: { $exists: true } });

    // Last 14 days attendance with proper timestamps
    for (let day = 0; day < 14; day++) {
        const date = new Date();
        date.setDate(date.getDate() - day);
        date.setHours(0, 0, 0, 0);

        for (const s of allStaff) {
            const rnd = Math.random();
            const branch = branches.find(b => b._id.toString() === s.branchId.toString());
            const branchLat = branch ? branch.location.latitude : 19.0760;
            const branchLng = branch ? branch.location.longitude : 72.8777;

            // Randomize check-in between 8:45 and 9:30
            const checkInHour = 8 + Math.floor(Math.random() * 2);
            const checkInMin = Math.floor(Math.random() * 60);
            const checkInDate = new Date(date);
            checkInDate.setHours(checkInHour, checkInMin, 0, 0);

            // Randomize check-out between 17:00 and 19:00
            const checkOutHour = 17 + Math.floor(Math.random() * 2);
            const checkOutMin = Math.floor(Math.random() * 60);
            const checkOutDate = new Date(date);
            checkOutDate.setHours(checkOutHour, checkOutMin, 0, 0);

            // Calculate duty hours
            const diffMs = checkOutDate.getTime() - checkInDate.getTime();
            const dutyHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

            let status;
            if (rnd > 0.85) status = 'absent';
            else if (rnd > 0.75) status = 'leave';
            else if (rnd > 0.65) status = 'half_day';
            else status = 'present';

            const record = {
                userId: s._id,
                branchId: s.branchId,
                date,
                status,
                locationVerified: status !== 'absent' && status !== 'leave',
            };

            // Only add check-in/out for non-absent, non-leave days
            if (status !== 'absent' && status !== 'leave') {
                record.checkIn = `${String(checkInHour).padStart(2, '0')}:${String(checkInMin).padStart(2, '0')}`;
                record.checkOut = `${String(checkOutHour).padStart(2, '0')}:${String(checkOutMin).padStart(2, '0')}`;
                record.checkInTime = checkInDate;
                record.checkOutTime = checkOutDate;
                record.dutyHours = status === 'half_day' ? parseFloat((dutyHours / 2).toFixed(2)) : dutyHours;
                // Slightly offset location from branch center
                record.checkInLocation = {
                    latitude: branchLat + (Math.random() - 0.5) * 0.001,
                    longitude: branchLng + (Math.random() - 0.5) * 0.001,
                };
                record.checkOutLocation = {
                    latitude: branchLat + (Math.random() - 0.5) * 0.001,
                    longitude: branchLng + (Math.random() - 0.5) * 0.001,
                };
            }

            attData.push(record);
        }
    }

    try {
        const att = await Attendance.insertMany(attData, { ordered: false });
        console.log(`${att.length} Attendance records created`);
    } catch (e) {
        console.log('Attendance records created (some duplicates skipped)');
    }

    // Summary
    const totalRevenue = feeData.reduce((s, f) => s + f.amount, 0);
    const totalDues = feeData.reduce((s, f) => s + f.dueAmount, 0);
    console.log('\n===================================');
    console.log('  SEED COMPLETE');
    console.log('===================================');
    console.log(`  Branches:    ${branches.length}`);
    console.log(`  Staff:       ${staffUsers.length}`);
    console.log(`  Leads:       ${leads.length}`);
    console.log(`  Patients:    ${patients.length}`);
    console.log(`  Payments:    ${fees.length}`);
    console.log(`  Revenue:     Rs.${totalRevenue.toLocaleString()}`);
    console.log(`  Dues:        Rs.${totalDues.toLocaleString()}`);
    console.log('===================================\n');

    process.exit(0);
}

seed().catch(e => { console.error('Seed error:', e.message); process.exit(1); });
