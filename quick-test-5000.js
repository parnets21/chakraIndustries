/**
 * Quick Test for Port 5000
 * Tests if backend is running on port 5000 and dealer login works
 */

import http from 'http';

const PORT = 5000;
const MOBILE = '9305241794';

console.log('\n🧪 Testing Backend on Port 5000...\n');

// Test 1: Health Check
function testHealth() {
  return new Promise((resolve) => {
    const req = http.request({
      host: 'localhost',
      port: PORT,
      path: '/api/health',
      method: 'GET',
      timeout: 5000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('✅ Backend is RUNNING on port', PORT);
        console.log('   Response:', data);
        resolve(true);
      });
    });

    req.on('error', (error) => {
      console.log('❌ Backend NOT running on port', PORT);
      console.log('   Error:', error.message);
      console.log('\n🔧 Fix: Start backend with "cd chakraIndustries-backend && npm run dev"');
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      console.log('❌ Connection timeout on port', PORT);
      resolve(false);
    });

    req.end();
  });
}

// Test 2: Send OTP
function testSendOTP() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ mobile: MOBILE });
    
    const req = http.request({
      host: 'localhost',
      port: PORT,
      path: '/api/dealer/auth/send-otp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 5000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.success) {
            console.log('✅ Dealer API Working!');
            console.log('   Dealer:', parsed.dealer?.name || 'N/A');
            if (parsed.otp) {
              console.log('\n🔐 OTP:', parsed.otp);
            }
            resolve(parsed.otp);
          } else {
            console.log('❌ Dealer API Error:', parsed.message);
            resolve(null);
          }
        } catch (e) {
          console.log('❌ Invalid response:', data);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Send OTP failed:', error.message);
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('1️⃣  Testing Health Check...');
  const isRunning = await testHealth();
  
  if (!isRunning) {
    console.log('\n❌ Backend not running. Cannot proceed with login test.\n');
    return;
  }
  
  console.log('\n2️⃣  Testing Send OTP for ' + MOBILE + '...');
  const otp = await testSendOTP();
  
  if (otp) {
    console.log('\n✅ ALL TESTS PASSED!');
    console.log('=' . repeat(60));
    console.log('📱 Backend URL: http://localhost:5000/api/dealer');
    console.log('📱 Android Emulator URL: http://10.0.2.2:5000/api/dealer');
    console.log('🔐 OTP for testing:', otp);
    console.log('✅ Ready to login from mobile app!');
    console.log('=' . repeat(60));
  } else {
    console.log('\n❌ OTP test failed. Check backend logs.\n');
  }
}

runTests();
