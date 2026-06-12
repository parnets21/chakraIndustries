/**
 * Complete Login Flow Test
 * Tests the entire dealer login process end-to-end
 * Run: node test-complete-login.js
 */

import http from 'http';
import readline from 'readline';

const BASE_URL = 'localhost';
const PORT = 5001;
const MOBILE = '9305241794';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function makeRequest(path, method, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      host: BASE_URL,
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testCompleteLogin() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   🧪 COMPLETE DEALER LOGIN TEST - 9305241794');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('\n');

  try {
    // Step 1: Backend Health Check
    console.log('📋 Step 1: Checking Backend...');
    const health = await makeRequest('/api/health', 'GET');
    
    if (health.status !== 200) {
      console.log('❌ Backend not responding!');
      console.log('   Please start backend: cd chakraIndustries-backend && npm run dev\n');
      rl.close();
      return;
    }
    
    console.log('✅ Backend is running on port', PORT);
    console.log('   Response:', health.data);
    console.log('');

    // Step 2: Send OTP
    console.log('📋 Step 2: Sending OTP to', MOBILE, '...');
    const otpResponse = await makeRequest(
      '/api/dealer/auth/send-otp',
      'POST',
      { mobile: MOBILE }
    );

    if (!otpResponse.data.success) {
      console.log('❌ Failed to send OTP');
      console.log('   Error:', otpResponse.data.message);
      rl.close();
      return;
    }

    console.log('✅ OTP sent successfully!');
    console.log('   Dealer:', otpResponse.data.dealer.name);
    console.log('   Code:', otpResponse.data.dealer.dealerCode);
    console.log('');

    // Display OTP prominently
    const otp = otpResponse.data.otp;
    console.log('════════════════════════════════════════════════════════════');
    console.log('                    YOUR OTP CODE                          ');
    console.log('════════════════════════════════════════════════════════════');
    console.log('');
    console.log('                        ' + otp);
    console.log('');
    console.log('════════════════════════════════════════════════════════════');
    console.log('💡 This OTP is valid for 5 minutes');
    console.log('💡 Use this OTP to verify login');
    console.log('════════════════════════════════════════════════════════════');
    console.log('');

    // Step 3: Ask user to enter OTP
    console.log('📋 Step 3: OTP Verification...');
    const userOtp = await question(`Enter the OTP shown above (${otp}): `);

    if (userOtp.trim() !== otp) {
      console.log('');
      console.log('❌ WRONG OTP ENTERED!');
      console.log('   You entered:', userOtp.trim());
      console.log('   Correct OTP:', otp);
      console.log('');
      console.log('💡 Tip: Copy the OTP exactly as shown above');
      rl.close();
      return;
    }

    console.log('✅ OTP matched! Verifying...');
    console.log('');

    // Step 4: Verify OTP
    const verifyResponse = await makeRequest(
      '/api/dealer/auth/verify-otp',
      'POST',
      { mobile: MOBILE, otp: userOtp.trim() }
    );

    if (!verifyResponse.data.success) {
      console.log('❌ Verification failed');
      console.log('   Error:', verifyResponse.data.message);
      rl.close();
      return;
    }

    // Step 5: Success!
    console.log('════════════════════════════════════════════════════════════');
    console.log('   ✅ LOGIN SUCCESSFUL!');
    console.log('════════════════════════════════════════════════════════════');
    console.log('');
    console.log('📱 Dealer Information:');
    console.log('   ID:', verifyResponse.data.dealer.id);
    console.log('   Name:', verifyResponse.data.dealer.name);
    console.log('   Mobile:', verifyResponse.data.dealer.mobile);
    console.log('   Dealer Code:', verifyResponse.data.dealer.dealerCode);
    console.log('   Zone:', verifyResponse.data.dealer.zone);
    console.log('   Role:', verifyResponse.data.dealer.role);
    console.log('');
    console.log('🎫 Token Generated:', verifyResponse.data.token ? 'Yes ✅' : 'No ❌');
    if (verifyResponse.data.token) {
      console.log('   Token:', verifyResponse.data.token.substring(0, 50) + '...');
    }
    console.log('');
    console.log('════════════════════════════════════════════════════════════');
    console.log('   🎉 Complete login flow working perfectly!');
    console.log('════════════════════════════════════════════════════════════');
    console.log('');
    console.log('📱 Next Steps:');
    console.log('   1. Start mobile app: npm start');
    console.log('   2. Run on device: npx react-native run-android');
    console.log('   3. Login with: 9305241794');
    console.log('   4. Use OTP shown in alert popup');
    console.log('   5. Dashboard will open after successful login');
    console.log('');

  } catch (error) {
    console.log('');
    console.log('❌ TEST FAILED');
    console.log('   Error:', error.message);
    console.log('');
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Backend not running. Start it with:');
      console.log('   cd chakraIndustries-backend');
      console.log('   npm run dev');
    } else if (error.message.includes('timeout')) {
      console.log('💡 Request timeout. Check:');
      console.log('   - Backend is running on port', PORT);
      console.log('   - MongoDB is connected');
      console.log('   - No firewall blocking the port');
    }
    console.log('');
  } finally {
    rl.close();
  }
}

// Run the test
console.log('');
console.log('🚀 Starting Complete Login Flow Test...');
console.log('');
console.log('This will test:');
console.log('  1. Backend connectivity');
console.log('  2. OTP generation');
console.log('  3. OTP display');
console.log('  4. OTP verification');
console.log('  5. Token generation');
console.log('  6. Dealer data retrieval');
console.log('');

testCompleteLogin();
