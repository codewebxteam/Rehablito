const http = require('http');

const BASE = 'http://localhost:5000';
let TOKEN = '';

function req(method, path, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE);
        const options = {
            hostname: url.hostname, port: url.port, path: url.pathname + url.search,
            method, headers: { 'Content-Type': 'application/json' }
        };
        if (TOKEN) options.headers['Authorization'] = `Bearer ${TOKEN}`;

        const r = http.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, body: data }); }
            });
        });
        r.on('error', reject);
        if (body) r.write(JSON.stringify(body));
        r.end();
    });
}

async function test() {
    console.log('--- TESTING SUPER ADMIN API ---\n');

    // 1. Login as super admin
    const login = await req('POST', '/api/auth/login', { email: 'admin@rehablito.com', password: 'admin123' });
    TOKEN = login.body.token;
    console.log(`1. Login: ${login.status === 200 ? '[PASS]' : '[FAIL]'} (${login.status})`);

    // 2. Get branches
    const branches = await req('GET', '/api/admin/branches');
    console.log(`2. Branches: ${branches.body.success ? '[PASS]' : '[FAIL]'} (count: ${branches.body.count})`);
    const branchId = branches.body.data?.[0]?._id;

    // 3. Get patients
    const patients = await req('GET', '/api/admin/patients');
    console.log(`3. Patients (all): ${patients.body.success ? '[PASS]' : '[FAIL]'} (count: ${patients.body.count})`);

    // 4. Patients filtered by branch
    const pFiltered = await req('GET', `/api/admin/patients?branch=${branchId}`);
    console.log(`4. Patients (branch): ${pFiltered.body.success ? '[PASS]' : '[FAIL]'} (count: ${pFiltered.body.count})`);

    // 5. Patient stats
    const pStats = await req('GET', '/api/admin/patients/stats');
    console.log(`5. Patient stats: ${pStats.body.success ? '[PASS]' : '[FAIL]'}`, pStats.body.data);

    // 6. Leads
    const leads = await req('GET', '/api/admin/leads');
    console.log(`6. Leads: ${leads.body.success ? '[PASS]' : '[FAIL]'} (count: ${leads.body.count})`);

    // 7. Lead stats
    const lStats = await req('GET', '/api/admin/leads/stats');
    console.log(`7. Lead stats: ${lStats.body.success ? '[PASS]' : '[FAIL]'}`, lStats.body.data);

    // 8. Fee summary
    const feeSummary = await req('GET', '/api/admin/fees/summary');
    console.log(`8. Fee summary: ${feeSummary.body.success ? '[PASS]' : '[FAIL]'}`, {
        revenue: feeSummary.body.data?.totalRevenue,
        dues: feeSummary.body.data?.totalDues,
        branches: feeSummary.body.data?.branchWise?.length,
    });

    // 9. Staff list
    const staff = await req('GET', '/api/admin/staff');
    console.log(`9. Staff: ${staff.body.success ? '[PASS]' : '[FAIL]'} (count: ${staff.body.count})`);

    // 10. Attendance
    const att = await req('GET', '/api/admin/attendance');
    console.log(`10. Attendance: ${att.body.success ? '[PASS]' : '[FAIL]'} (count: ${att.body.count})`);

    // 11. Attendance stats (today)
    const attStats = await req('GET', '/api/admin/attendance/stats');
    console.log(`11. Att. stats: ${attStats.body.success ? '[PASS]' : '[FAIL]'}`, attStats.body.data);

    console.log('\n--- ALL TESTS COMPLETE ---');
}

test().catch(e => console.error('Test error:', e));
