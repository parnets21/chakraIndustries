/**
 * Backend Connection Test Script
 * Run: node test-backend-connection.js
 * 
 * This script tests if the backend is running and accessible
 */

import http from 'http';

const BACKEND_URLS = [
  { name: 'Localhost (iOS Simulator)', host: 'localhost', port: 5000 },
  { name: 'Android Emulator', host: '10.0.2.2', port: 5000 },
];

const DEALER_MOBILE = '9305241794';

console.log('\n🔍 Testing Backend Connection...');
console.log('=' . repeat(60));

function testConnection(host, port) {
  return new Promise((resolve) => {
    const options = {
      host,
      port,
      path: '/api/health',
      method: 'GET',
      timeout: 3000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ success: true, status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Connection timeout' });
    });

    req.end();
  });
}

function testDealerAPI(host, port) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ mobile: DEALER_MOBILE });
    
    const options = {
      host,
      port,
      path: '/api/dealer/auth/send-otp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 5000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ success: true, status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Connection timeout' });
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  for (const config of BACKEND_URLS) {
    console.log(`\n📡 Testing: ${config.name} (${config.host}:${config.port})`);
    console.log('-' . repeat(60));

    // Test 1: Health check
    console.log('  Test 1: Health Check...');
    const healthResult = await testConnection(config.host, config.port);
    
    if (healthResult.success) {
      console.log(`  ✅ Backend is RUNNING (Status: ${healthResult.status})`);
      console.log(`  Response: ${healthResult.data}`);
    } else {
      console.log(`  ❌ Backend is NOT accessible`);
      console.log(`  Error: ${healthResult.error}`);
      continue; // Skip dealer API test if health check fails
    }

    // Test 2: Dealer API
    console.log('\n  Test 2: Dealer Login API...');
    const dealerResult = await testDealerAPI(config.host, config.port);
    
    if (dealerResult.success) {
      console.log(`  ✅ Dealer API responding (Status: ${dealerResult.status})`);
      try {
        const parsed = JSON.parse(dealerResult.data);
        console.log(`  Response:`, JSON.stringify(parsed, null, 2));
        
        if (parsed.success && parsed.otp) {
          console.log(`  🔐 OTP: ${parsed.otp}`);
        }
      } catch (e) {
        console.log(`  Response: ${dealerResult.data}`);
      }
    } else {
      console.log(`  ❌ Dealer API not responding`);
      console.log(`  Error: ${dealerResult.error}`);
    }
  }

  console.log('\n' + '=' . repeat(60));
  console.log('✅ Test Complete!\n');
  console.log('📝 Next Steps:');
  console.log('1. If localhost works: Use iOS Simulator or update config for real iOS device');
  console.log('2. If 10.0.2.2 works: Use Android Emulator');
  console.log('3. If both fail: Start backend with "cd chakraIndustries-backend && npm run dev"');
  console.log('4. For real device: Get your computer IP with "ipconfig" and update api.js\n');
}

runTests().catch(console.error);
