// Simple test script to verify authentication endpoints
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api/auth';

async function testAuth() {
    console.log('🧪 Testing Authentication Endpoints...\n');

    // Test 1: Signup
    console.log('1. Testing Signup...');
    try {
        const signupResponse = await fetch(`${BASE_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            })
        });

        const signupData = await signupResponse.json();
        
        if (signupResponse.ok) {
            console.log('✅ Signup successful!');
            console.log('Token received:', signupData.token ? 'Yes' : 'No');
        } else {
            console.log('❌ Signup failed:', signupData.message || signupData.errors?.[0]?.msg);
        }
    } catch (error) {
        console.log('❌ Signup error:', error.message);
    }

    console.log('\n2. Testing Login...');
    try {
        const loginResponse = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'password123'
            })
        });

        const loginData = await loginResponse.json();
        
        if (loginResponse.ok) {
            console.log('✅ Login successful!');
            console.log('Token received:', loginData.token ? 'Yes' : 'No');
        } else {
            console.log('❌ Login failed:', loginData.message || loginData.errors?.[0]?.msg);
        }
    } catch (error) {
        console.log('❌ Login error:', error.message);
    }

    console.log('\n3. Testing Invalid Login...');
    try {
        const invalidLoginResponse = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'wrong@example.com',
                password: 'wrongpassword'
            })
        });

        const invalidLoginData = await invalidLoginResponse.json();
        
        if (!invalidLoginResponse.ok) {
            console.log('✅ Invalid login correctly rejected:', invalidLoginData.message);
        } else {
            console.log('❌ Invalid login should have been rejected');
        }
    } catch (error) {
        console.log('❌ Invalid login test error:', error.message);
    }

    console.log('\n🎉 Authentication tests completed!');
}

// Run the test
testAuth().catch(console.error); 