const mongoose = require('mongoose');
require('dotenv').config();

const Branch = require('./models/Branch');
const User = require('./models/User');
const Lead = require('./models/Lead');
const Patient = require('./models/Patient');
const FeePayment = require('./models/FeePayment');
const Attendance = require('./models/Attendance');

// ──────────────────────────────────────────────────────────────
//  Rehablito Seed  —  Authentic Indian data
// ──────────────────────────────────────────────────────────────
//  Preserves existing user emails. New patient parent emails
//  are generated realistically. Creates 5 branches across major
//  Indian cities with Rehablito-style therapy operations.
// ──────────────────────────────────────────────────────────────

const pick = (arr, i) => arr[i % arr.length];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pad = (n, w = 3) => String(n).padStart(w, '0');
const indianMobile = (seed) => `+919${String(800000000 + seed).padStart(9, '0')}`;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...\n');

    // ─────────────────────────────────────────────
    // 1. BRANCHES — 5 branches across major Indian cities
    // ─────────────────────────────────────────────
    await Branch.deleteMany({});
    const branchSeed = [
        {
            name: 'Rehablito Andheri',
            address: 'B-204, Lotus Business Park, Andheri West',
            city: 'Mumbai', state: 'Maharashtra',
            phone: '+91-2226748100', email: 'andheri@rehablito.com',
            location: { latitude: 19.1197, longitude: 72.8468, radiusMeters: 150 },
            shiftStart: '09:00', shiftEnd: '19:00',
        },
        {
            name: 'Rehablito Kothrud',
            address: '3rd Floor, Prabhat Plaza, Paud Road, Kothrud',
            city: 'Pune', state: 'Maharashtra',
            phone: '+91-2025391450', email: 'kothrud@rehablito.com',
            location: { latitude: 18.5074, longitude: 73.8077, radiusMeters: 180 },
            shiftStart: '09:30', shiftEnd: '19:30',
        },
        {
            name: 'Rehablito Dwarka',
            address: 'Plot 12, Sector 7, Dwarka',
            city: 'New Delhi', state: 'Delhi',
            phone: '+91-1145678210', email: 'dwarka@rehablito.com',
            location: { latitude: 28.5921, longitude: 77.0460, radiusMeters: 200 },
            shiftStart: '09:00', shiftEnd: '18:30',
        },
        {
            name: 'Rehablito Indiranagar',
            address: '100 Feet Road, HAL 2nd Stage, Indiranagar',
            city: 'Bengaluru', state: 'Karnataka',
            phone: '+91-8041234567', email: 'indiranagar@rehablito.com',
            location: { latitude: 12.9719, longitude: 77.6412, radiusMeters: 160 },
            shiftStart: '09:30', shiftEnd: '19:00',
        },
        {
            name: 'Rehablito Jubilee Hills',
            address: 'Road No. 36, Jubilee Hills',
            city: 'Hyderabad', state: 'Telangana',
            phone: '+91-4023547800', email: 'jubileehills@rehablito.com',
            location: { latitude: 17.4326, longitude: 78.4071, radiusMeters: 170 },
            shiftStart: '09:00', shiftEnd: '19:00',
        },
    ];
    const branches = await Branch.insertMany(branchSeed);
    console.log(`${branches.length} Branches created`);

    // ─────────────────────────────────────────────
    // 2. UPDATE EXISTING USERS — preserve emails, refresh names/ids
    // ─────────────────────────────────────────────
    const existingPlan = [
        { email: 'admin@ok.com', name: 'Ravi Menon', role: 'super_admin' },
        { email: 'user@rehablito.com', name: 'Neha Kulkarni', role: 'public_user' },
        { email: 'manager@ok.com', name: 'Arjun Deshmukh', role: 'branch_manager',
          staffId: 'RHB-MGR-001', mobileNumber: '+919820010001', branchIdx: 0 },
        { email: 'staff@ok.com', name: 'Priya Sharma', role: 'staff',
          staffId: 'RHB-STF-001', mobileNumber: '+919820020001', branchIdx: 0 },
        { email: 'staff2@ok.com', name: 'Rohan Iyer', role: 'staff',
          staffId: 'RHB-STF-002', mobileNumber: '+919820020002', branchIdx: 0 },
    ];

    for (const p of existingPlan) {
        const u = await User.findOne({ email: p.email });
        if (!u) continue;
        u.name = p.name;
        if (p.staffId) u.staffId = p.staffId;
        if (p.mobileNumber) u.mobileNumber = p.mobileNumber;
        if (p.branchIdx !== undefined) u.branchId = branches[p.branchIdx]._id;
        await u.save();
    }
    console.log(`${existingPlan.length} Existing users refreshed`);

    // ─────────────────────────────────────────────
    // 3. BRANCH MANAGERS — one per branch (excluding Andheri which already has manager@ok.com)
    // ─────────────────────────────────────────────
    const managerSeed = [
        { name: 'Aishwarya Bhagat', branchIdx: 1, city: 'pune' },
        { name: 'Harpreet Singh', branchIdx: 2, city: 'delhi' },
        { name: 'Deepika Reddy', branchIdx: 3, city: 'bengaluru' },
        { name: 'Manish Chopra', branchIdx: 4, city: 'hyderabad' },
    ];

    const managers = [];
    const andheriManager = await User.findOne({ email: 'manager@ok.com' });
    if (andheriManager) managers.push(andheriManager);

    for (let i = 0; i < managerSeed.length; i++) {
        const m = managerSeed[i];
        const email = `manager.${m.city}@rehablito.com`;
        let user = await User.findOne({ email });
        const patch = {
            name: m.name,
            role: 'branch_manager',
            branchId: branches[m.branchIdx]._id,
            staffId: `RHB-MGR-${pad(i + 2)}`,
            mobileNumber: indianMobile(i + 10),
        };
        if (!user) {
            user = await User.create({ email, password: 'manager123', ...patch });
        } else {
            Object.assign(user, patch);
            await user.save();
        }
        managers.push(user);
    }
    console.log(`${managers.length} Branch managers ready`);

    // Attach managers to branches
    for (let i = 0; i < branches.length; i++) {
        branches[i].managerId = managers[i]._id;
        await branches[i].save();
    }

    // ─────────────────────────────────────────────
    // 4. THERAPISTS / STAFF — 3 per branch
    // ─────────────────────────────────────────────
    const therapistSeed = [
        // Mumbai / Andheri (branch 0) — existing staff@ok.com + staff2@ok.com + 2 new
        { name: 'Priya Sharma',      branchIdx: 0, speciality: 'Speech Therapist',       existing: 'staff@ok.com' },
        { name: 'Rohan Iyer',        branchIdx: 0, speciality: 'Occupational Therapist', existing: 'staff2@ok.com' },
        { name: 'Ananya Bhatt',      branchIdx: 0, speciality: 'ABA Therapist' },
        { name: 'Siddharth Naik',    branchIdx: 0, speciality: 'Physiotherapist' },
        // Pune / Kothrud (branch 1)
        { name: 'Sneha Kulkarni',    branchIdx: 1, speciality: 'Speech Therapist' },
        { name: 'Vikram Joshi',      branchIdx: 1, speciality: 'Physiotherapist' },
        { name: 'Ishita Patil',      branchIdx: 1, speciality: 'ABA Therapist' },
        // Delhi / Dwarka (branch 2)
        { name: 'Karan Malhotra',    branchIdx: 2, speciality: 'Physiotherapist' },
        { name: 'Meera Chawla',      branchIdx: 2, speciality: 'Occupational Therapist' },
        { name: 'Tanvi Bansal',      branchIdx: 2, speciality: 'Speech Therapist' },
        // Bengaluru / Indiranagar (branch 3)
        { name: 'Karthik Subramanian', branchIdx: 3, speciality: 'ABA Therapist' },
        { name: 'Divya Nair',          branchIdx: 3, speciality: 'Speech Therapist' },
        { name: 'Rajesh Hegde',        branchIdx: 3, speciality: 'Physiotherapist' },
        // Hyderabad / Jubilee Hills (branch 4)
        { name: 'Lakshmi Rao',       branchIdx: 4, speciality: 'Occupational Therapist' },
        { name: 'Aditya Varma',      branchIdx: 4, speciality: 'Physiotherapist' },
        { name: 'Shruti Reddy',      branchIdx: 4, speciality: 'Speech Therapist' },
    ];

    const staffUsers = [];
    for (let i = 0; i < therapistSeed.length; i++) {
        const t = therapistSeed[i];
        const email = t.existing || `${slug(t.name)}@rehablito.com`;
        let user = await User.findOne({ email });
        const patch = {
            name: t.name,
            role: 'staff',
            branchId: branches[t.branchIdx]._id,
            staffId: `RHB-STF-${pad(i + 1)}`,
            mobileNumber: indianMobile(100 + i),
        };
        if (!user) {
            user = await User.create({ email, password: 'staff123', ...patch });
        } else {
            Object.assign(user, patch);
            await user.save();
        }
        // stash speciality for display use (non-schema; safe to ignore by API)
        staffUsers.push({ user, speciality: t.speciality });
    }
    console.log(`${staffUsers.length} Therapists ready`);

    // ─────────────────────────────────────────────
    // 5. LEADS — 20 authentic parent inquiries
    // ─────────────────────────────────────────────
    await Lead.deleteMany({});
    const referralSources = [
        'Dr. Arvind Kapoor (Paediatrician)',
        'Dr. Sunita Mehta (Neurologist)',
        'Kokilaben Hospital Referral',
        'Fortis Memorial Hospital',
        'Apollo Cradle Referral',
        'Rainbow Children\'s Hospital',
        'Google Search',
        'Instagram @rehablito',
        'Parent Community WhatsApp',
        'Walk-in Inquiry',
        'Word of Mouth',
        'Rehablito Website',
        'School Counsellor',
    ];

    const diagnoses = [
        'Autism Spectrum Disorder',
        'Speech & Language Delay',
        'ADHD',
        'Cerebral Palsy',
        'Down Syndrome',
        'Global Developmental Delay',
        'Sensory Processing Disorder',
        'Learning Disability',
        'Post-fracture Rehabilitation',
        'Muscular Dystrophy',
    ];

    const leadSeed = [
        { childName: 'Arjun Mehta',      parentName: 'Rajesh Mehta',    age: 4, diagnosis: 'Autism Spectrum Disorder', status: 'new' },
        { childName: 'Sanya Patel',      parentName: 'Vikas Patel',     age: 6, diagnosis: 'Speech & Language Delay',  status: 'contacted' },
        { childName: 'Rohan Das',        parentName: 'Amit Das',        age: 3, diagnosis: 'Cerebral Palsy',            status: 'converted' },
        { childName: 'Isha Gupta',       parentName: 'Suresh Gupta',    age: 5, diagnosis: 'ADHD',                      status: 'new' },
        { childName: 'Kabir Singh',      parentName: 'Harpreet Singh',  age: 7, diagnosis: 'Autism Spectrum Disorder', status: 'contacted' },
        { childName: 'Anaya Joshi',      parentName: 'Deepak Joshi',    age: 4, diagnosis: 'Down Syndrome',             status: 'new' },
        { childName: 'Vivaan Reddy',     parentName: 'Krishna Reddy',   age: 8, diagnosis: 'Learning Disability',       status: 'closed' },
        { childName: 'Diya Nair',        parentName: 'Sunil Nair',      age: 5, diagnosis: 'Speech & Language Delay',   status: 'new' },
        { childName: 'Aarush Khanna',    parentName: 'Nikhil Khanna',   age: 3, diagnosis: 'Global Developmental Delay', status: 'contacted' },
        { childName: 'Myra Desai',       parentName: 'Parth Desai',     age: 6, diagnosis: 'Sensory Processing Disorder', status: 'new' },
        { childName: 'Atharv Pillai',    parentName: 'Ramesh Pillai',   age: 7, diagnosis: 'ADHD',                       status: 'contacted' },
        { childName: 'Riya Shetty',      parentName: 'Ganesh Shetty',   age: 4, diagnosis: 'Autism Spectrum Disorder',   status: 'converted' },
        { childName: 'Dhruv Bansal',     parentName: 'Anil Bansal',     age: 5, diagnosis: 'Speech & Language Delay',    status: 'new' },
        { childName: 'Aanya Chopra',     parentName: 'Sahil Chopra',    age: 9, diagnosis: 'Post-fracture Rehabilitation', status: 'new' },
        { childName: 'Kiaan Verma',      parentName: 'Gaurav Verma',    age: 6, diagnosis: 'Cerebral Palsy',              status: 'contacted' },
        { childName: 'Saanvi Rao',       parentName: 'Madhav Rao',      age: 4, diagnosis: 'Autism Spectrum Disorder',    status: 'closed' },
        { childName: 'Shaurya Kapoor',   parentName: 'Rahul Kapoor',    age: 5, diagnosis: 'ADHD',                        status: 'new' },
        { childName: 'Tara Sinha',       parentName: 'Abhishek Sinha',  age: 3, diagnosis: 'Global Developmental Delay',  status: 'contacted' },
        { childName: 'Vedant Kulkarni',  parentName: 'Nitin Kulkarni',  age: 8, diagnosis: 'Muscular Dystrophy',          status: 'new' },
        { childName: 'Myra Shah',        parentName: 'Ketan Shah',      age: 6, diagnosis: 'Learning Disability',         status: 'converted' },
    ];

    const now = new Date();
    const leadDocs = leadSeed.map((l, i) => {
        const daysAgo = randInt(0, 45);
        const created = new Date(now);
        created.setDate(created.getDate() - daysAgo);
        return {
            childName: l.childName,
            parentName: l.parentName,
            parentPhone: indianMobile(200 + i),
            parentEmail: `${slug(l.parentName)}@gmail.com`,
            age: l.age,
            diagnosis: l.diagnosis,
            referredBy: pick(referralSources, i),
            status: l.status,
            branchId: branches[i % branches.length]._id,
            assignedTo: managers[i % managers.length]._id,
            notes: l.status !== 'new' ? [
                { text: 'Initial call completed. Assessment scheduled.', addedBy: managers[i % managers.length]._id },
            ] : [],
            createdAt: created,
            updatedAt: created,
        };
    });
    const leads = await Lead.insertMany(leadDocs);
    console.log(`${leads.length} Leads created`);

    // ─────────────────────────────────────────────
    // 6. PATIENTS — 30 active/discharged patients across branches
    // ─────────────────────────────────────────────
    await Patient.deleteMany({});
    const therapies = ['physiotherapy', 'speech_therapy', 'occupational_therapy', 'aba_therapy', 'autism_therapy'];

    const patientSeed = [
        { name: 'Aarav Sharma',      parent: 'Vishal Sharma',     gender: 'male',   diagnosis: 'Autism Spectrum Disorder' },
        { name: 'Myra Kapoor',       parent: 'Rohit Kapoor',      gender: 'female', diagnosis: 'Speech & Language Delay' },
        { name: 'Vivaan Choudhary',  parent: 'Prashant Choudhary',gender: 'male',   diagnosis: 'ADHD' },
        { name: 'Ananya Iyer',       parent: 'Karthik Iyer',      gender: 'female', diagnosis: 'Cerebral Palsy' },
        { name: 'Reyansh Malhotra',  parent: 'Saurabh Malhotra',  gender: 'male',   diagnosis: 'Autism Spectrum Disorder' },
        { name: 'Kiara Bose',        parent: 'Abhijit Bose',      gender: 'female', diagnosis: 'Sensory Processing Disorder' },
        { name: 'Aditya Pillai',     parent: 'Mohan Pillai',      gender: 'male',   diagnosis: 'Speech & Language Delay' },
        { name: 'Saanvi Jain',       parent: 'Rakesh Jain',       gender: 'female', diagnosis: 'Down Syndrome' },
        { name: 'Vihaan Agarwal',    parent: 'Nitin Agarwal',     gender: 'male',   diagnosis: 'Autism Spectrum Disorder' },
        { name: 'Zara Khan',         parent: 'Imran Khan',        gender: 'female', diagnosis: 'Global Developmental Delay' },
        { name: 'Ishaan Nair',       parent: 'Vinod Nair',        gender: 'male',   diagnosis: 'Cerebral Palsy' },
        { name: 'Anika Saxena',      parent: 'Pradeep Saxena',    gender: 'female', diagnosis: 'ADHD' },
        { name: 'Arnav Mishra',      parent: 'Devendra Mishra',   gender: 'male',   diagnosis: 'Learning Disability' },
        { name: 'Riya Shetty',       parent: 'Ganesh Shetty',     gender: 'female', diagnosis: 'Autism Spectrum Disorder' },
        { name: 'Dhruv Bansal',      parent: 'Sanjay Bansal',     gender: 'male',   diagnosis: 'Speech & Language Delay' },
        { name: 'Advait Rao',        parent: 'Srinivas Rao',      gender: 'male',   diagnosis: 'Muscular Dystrophy' },
        { name: 'Aanya Reddy',       parent: 'Venkat Reddy',      gender: 'female', diagnosis: 'Autism Spectrum Disorder' },
        { name: 'Krish Singh',       parent: 'Manpreet Singh',    gender: 'male',   diagnosis: 'Post-fracture Rehabilitation' },
        { name: 'Pari Verma',        parent: 'Rohit Verma',       gender: 'female', diagnosis: 'Down Syndrome' },
        { name: 'Atharv Mehta',      parent: 'Hemant Mehta',      gender: 'male',   diagnosis: 'ADHD' },
        { name: 'Tara Chopra',       parent: 'Akshay Chopra',     gender: 'female', diagnosis: 'Speech & Language Delay' },
        { name: 'Aarush Gupta',      parent: 'Ajay Gupta',        gender: 'male',   diagnosis: 'Autism Spectrum Disorder' },
        { name: 'Siya Desai',        parent: 'Nilesh Desai',      gender: 'female', diagnosis: 'Cerebral Palsy' },
        { name: 'Rudra Pandey',      parent: 'Ashish Pandey',     gender: 'male',   diagnosis: 'Sensory Processing Disorder' },
        { name: 'Myra Shah',         parent: 'Ketan Shah',        gender: 'female', diagnosis: 'Learning Disability' },
        { name: 'Shaurya Khanna',    parent: 'Rahul Khanna',      gender: 'male',   diagnosis: 'Autism Spectrum Disorder' },
        { name: 'Kavya Patel',       parent: 'Dipesh Patel',      gender: 'female', diagnosis: 'Global Developmental Delay' },
        { name: 'Neev Sinha',        parent: 'Anuj Sinha',        gender: 'male',   diagnosis: 'ADHD' },
        { name: 'Amaira Menon',      parent: 'Sathish Menon',     gender: 'female', diagnosis: 'Speech & Language Delay' },
        { name: 'Vedant Kulkarni',   parent: 'Prakash Kulkarni',  gender: 'male',   diagnosis: 'Autism Spectrum Disorder' },
    ];

    const patientDocs = patientSeed.map((p, i) => {
        const branchIdx = i % branches.length;
        const branchStaff = staffUsers.filter(s => s.user.branchId.toString() === branches[branchIdx]._id.toString());
        const therapist = branchStaff[i % Math.max(1, branchStaff.length)] || staffUsers[0];
        const age = randInt(3, 12);
        const dob = new Date(now.getFullYear() - age, randInt(0, 11), randInt(1, 28));
        const monthsAgo = randInt(0, 11);
        const admissionDate = new Date(now);
        admissionDate.setMonth(admissionDate.getMonth() - monthsAgo);
        admissionDate.setDate(randInt(1, 28));

        const therapyCount = randInt(1, 3);
        const therapyPool = [...therapies].sort(() => 0.5 - Math.random());
        const therapyType = therapyPool.slice(0, therapyCount);

        let status = 'active';
        if (i >= 26) status = 'discharged';
        else if (i >= 24) status = 'on_hold';

        return {
            name: p.name,
            parentName: p.parent,
            parentPhone: indianMobile(300 + i),
            parentEmail: `${slug(p.parent)}@gmail.com`,
            dob,
            age,
            gender: p.gender,
            diagnosis: p.diagnosis,
            therapyType,
            branchId: branches[branchIdx]._id,
            assignedTherapist: therapist.user._id,
            admissionDate,
            status,
        };
    });
    const patients = await Patient.insertMany(patientDocs);
    console.log(`${patients.length} Patients created`);

    // ─────────────────────────────────────────────
    // 7. FEE PAYMENTS — realistic monthly billing across last 6 months
    // ─────────────────────────────────────────────
    await FeePayment.deleteMany({});
    const methods = ['cash', 'upi', 'bank_transfer', 'card'];
    // Indian therapy package rates (per month)
    const packageRates = [12000, 15000, 18000, 22000, 25000, 30000];

    const feeDocs = [];
    for (let i = 0; i < patients.length; i++) {
        const p = patients[i];
        const sessionsPerMonth = randInt(8, 16);
        const rate = randFrom(packageRates);
        // How many months of billing history based on admission date
        const admissionMonths = Math.max(1, Math.min(6,
            Math.floor((now.getTime() - new Date(p.admissionDate).getTime()) / (30 * 24 * 60 * 60 * 1000)) + 1
        ));

        for (let m = 0; m < admissionMonths; m++) {
            const paymentDate = new Date(now);
            paymentDate.setMonth(paymentDate.getMonth() - m);
            paymentDate.setDate(randInt(1, 10));

            // Last month has higher chance of being pending / partial
            const isCurrent = m === 0;
            const roll = Math.random();

            let amount = rate;
            let due = 0;
            let status = 'paid';

            if (isCurrent && roll < 0.25) {
                // partial payment this month
                amount = Math.round(rate * 0.5);
                due = rate - amount;
                status = 'partial';
            } else if (isCurrent && roll < 0.35) {
                // outstanding
                amount = 0;
                due = rate;
                status = 'pending';
            } else if (!isCurrent && roll < 0.08) {
                // occasional overdue
                amount = Math.round(rate * 0.4);
                due = rate - amount;
                status = 'overdue';
            }

            const dueDate = new Date(paymentDate);
            dueDate.setDate(dueDate.getDate() + 15);

            feeDocs.push({
                patientId: p._id,
                branchId: p.branchId,
                amount,
                dueAmount: due,
                paymentDate,
                dueDate: due > 0 ? dueDate : null,
                method: randFrom(methods),
                status,
                collectedBy: managers[Math.floor(Math.random() * managers.length)]._id,
                description: `${p.therapyType[0].replace('_', ' ')} — ${sessionsPerMonth} sessions (${paymentDate.toLocaleString('en', { month: 'short', year: 'numeric' })})`,
            });
        }
    }
    const fees = await FeePayment.insertMany(feeDocs);
    console.log(`${fees.length} Fee Payments created`);

    // ─────────────────────────────────────────────
    // 8. ATTENDANCE — last 30 days, skipping Sundays
    // ─────────────────────────────────────────────
    await Attendance.deleteMany({});
    const attDocs = [];
    const allEmployees = await User.find({
        role: { $in: ['staff', 'branch_manager'] },
        branchId: { $exists: true, $ne: null }
    });

    for (let day = 0; day < 30; day++) {
        const date = new Date();
        date.setDate(date.getDate() - day);
        date.setHours(0, 0, 0, 0);
        // Skip Sundays
        if (date.getDay() === 0) continue;

        for (const emp of allEmployees) {
            const branch = branches.find(b => b._id.toString() === emp.branchId.toString());
            if (!branch) continue;

            const branchLat = branch.location.latitude;
            const branchLng = branch.location.longitude;

            // Realistic attendance pattern
            const rnd = Math.random();
            let status;
            if (rnd > 0.93) status = 'absent';
            else if (rnd > 0.88) status = 'leave';
            else if (rnd > 0.83) status = 'half_day';
            else status = 'present';

            // For day 0 (today), some employees are still "on_duty" — only those with present status
            if (day === 0 && status === 'present' && Math.random() < 0.3) {
                status = 'on_duty';
            }

            const record = {
                userId: emp._id,
                branchId: emp.branchId,
                date,
                status,
                locationVerified: status === 'present' || status === 'half_day' || status === 'on_duty',
            };

            if (status !== 'absent' && status !== 'leave') {
                // Check-in: usually between 09:00 and 09:30
                const ciHour = 9;
                const ciMin = randInt(0, 45);
                const checkInDate = new Date(date);
                checkInDate.setHours(ciHour, ciMin, 0, 0);

                record.checkIn = `${pad(ciHour, 2)}:${pad(ciMin, 2)}`;
                record.checkInTime = checkInDate;
                record.checkInLocation = {
                    latitude: branchLat + (Math.random() - 0.5) * 0.001,
                    longitude: branchLng + (Math.random() - 0.5) * 0.001,
                };

                // Check-out (unless on_duty)
                if (status !== 'on_duty') {
                    let coHour, coMin;
                    if (status === 'half_day') {
                        coHour = randInt(13, 14);
                        coMin = randInt(0, 59);
                    } else {
                        coHour = randInt(18, 19);
                        coMin = randInt(0, 59);
                    }
                    const checkOutDate = new Date(date);
                    checkOutDate.setHours(coHour, coMin, 0, 0);

                    record.checkOut = `${pad(coHour, 2)}:${pad(coMin, 2)}`;
                    record.checkOutTime = checkOutDate;
                    record.checkOutLocation = {
                        latitude: branchLat + (Math.random() - 0.5) * 0.001,
                        longitude: branchLng + (Math.random() - 0.5) * 0.001,
                    };
                    const diff = checkOutDate.getTime() - checkInDate.getTime();
                    record.dutyHours = parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
                }
            }

            attDocs.push(record);
        }
    }

    try {
        const att = await Attendance.insertMany(attDocs, { ordered: false });
        console.log(`${att.length} Attendance records created`);
    } catch (e) {
        console.log(`Attendance records inserted (some duplicates skipped): ${e.writeErrors?.length || 0} errors`);
    }

    // ─────────────────────────────────────────────
    // Summary
    // ─────────────────────────────────────────────
    const totalRevenue = feeDocs.reduce((s, f) => s + f.amount, 0);
    const totalDues = feeDocs.reduce((s, f) => s + f.dueAmount, 0);

    console.log('\n═════════════════════════════════════════');
    console.log('  REHABLITO SEED COMPLETE');
    console.log('═════════════════════════════════════════');
    console.log(`  Branches:     ${branches.length}`);
    console.log(`  Managers:     ${managers.length}`);
    console.log(`  Therapists:   ${staffUsers.length}`);
    console.log(`  Leads:        ${leads.length}`);
    console.log(`  Patients:     ${patients.length}`);
    console.log(`  Fee Records:  ${fees.length}`);
    console.log(`  Revenue:      ₹${totalRevenue.toLocaleString('en-IN')}`);
    console.log(`  Dues:         ₹${totalDues.toLocaleString('en-IN')}`);
    console.log('═════════════════════════════════════════\n');
    console.log('Login credentials (preserved):');
    console.log('  Super Admin:     admin@ok.com');
    console.log('  Branch Manager:  manager@ok.com          (Rehablito Andheri)');
    console.log('  Staff OTP:       staff@ok.com            staffId: RHB-STF-001   mobile: +919820020001');
    console.log('  Staff OTP:       staff2@ok.com           staffId: RHB-STF-002   mobile: +919820020002');
    console.log('  New Managers:    manager.pune@rehablito.com    password: manager123');
    console.log('                   manager.delhi@rehablito.com');
    console.log('                   manager.bengaluru@rehablito.com');
    console.log('                   manager.hyderabad@rehablito.com');
    console.log('');

    process.exit(0);
}

seed().catch(e => { console.error('Seed error:', e); process.exit(1); });
