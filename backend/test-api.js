async function testAPI() {
    console.log('Testing API Endpoints');

    const baseUrl = 'http://localhost:5000/api';
    
    // 1. Register Super Admin
    console.log('\n 1. Register Super Admin');
    const adminRes = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Admin User',
            email: 'admin@rehablito.com',
            password: 'password123',
            role: 'super_admin'
        })
    });
    const adminData = await adminRes.json();
    console.log('Register Response:', adminData);
    const adminToken = adminData.token;

    // 2. Login Super Admin
    console.log('\n2. Login Super Admin');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@rehablito.com',
            password: 'password123'
        })
    });
    const loginData = await loginRes.json();
    console.log('Login Response:', { success: loginData.success, role: loginData.role, token: loginData.token ? '***' : null });

    // 3. Test Admin Dashboard with Admin Token
    console.log('\n3. Test Admin Dashboard (Should Succeed)');
    if (adminToken) {
        const dashRes1 = await fetch(`${baseUrl}/admin/dashboard`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        console.log('Admin Dashboard Response:', await dashRes1.json());
    }

    // 4. Register Staff
    console.log('\n4. Register Staff');
    const staffRes = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Staff User',
            email: 'staff@rehablito.com',
            password: 'password123',
            role: 'staff',
            branchId: '60d21b4667d0d8992e610c85' // Mock ObjectId
        })
    });
    const staffData = await staffRes.json();
    console.log('Register Staff Response:', staffData);
    const staffToken = staffData.token;

    // 5. Test Admin Dashboard with Staff Token (Should Fail)
    console.log('\n5. Test Admin Dashboard with Staff Token (Should Fail)');
    if (staffToken) {
        const dashRes2 = await fetch(`${baseUrl}/admin/dashboard`, {
            headers: { 'Authorization': `Bearer ${staffToken}` }
        });
        console.log('Admin Dashboard (Staff) Response:', await dashRes2.json());
    }

    // 6. Test Staff Dashboard with Staff Token (Should Succeed)
    console.log('\n6. Test Staff Dashboard with Staff Token (Should Succeed)');
    if (staffToken) {
        const dashRes3 = await fetch(`${baseUrl}/staff/dashboard`, {
            headers: { 'Authorization': `Bearer ${staffToken}` }
        });
        console.log('Staff Dashboard Response:', await dashRes3.json());
    }
}

testAPI().catch(console.error);
