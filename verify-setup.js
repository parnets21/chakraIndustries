#!/usr/bin/env node

/**
 * Setup Verification Script
 * Checks if everything is properly configured for dealer login
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🔍 Verifying Dealer Login Setup...');
console.log('='.repeat(70));

let allGood = true;

// Check 1: Backend authRoutes.js
console.log('\n1️⃣  Checking Backend Auth Routes...');
const authRoutesPath = path.join(__dirname, '../chakraIndustries-backend/routes/dealer/authRoutes.js');
if (fs.existsSync(authRoutesPath)) {
  const content = fs.readFileSync(authRoutesPath, 'utf8');
  if (content.includes('9305241794') && content.includes('Rajan Mehta')) {
    console.log('   ✅ Dealer 9305241794 found in AUTHORIZED_DEALERS');
  } else {
    console.log('   ❌ Dealer 9305241794 NOT found in AUTHORIZED_DEALERS');
    allGood = false;
  }
  
  if (content.includes('generateOTP')) {
    console.log('   ✅ OTP generation function exists');
  } else {
    console.log('   ❌ OTP generation function missing');
    allGood = false;
  }
  
  if (content.includes('/send-otp') && content.includes('/verify-otp')) {
    console.log('   ✅ Send OTP and Verify OTP routes exist');
  } else {
    console.log('   ❌ OTP routes missing');
    allGood = false;
  }
} else {
  console.log('   ❌ Auth routes file not found');
  allGood = false;
}

// Check 2: Mobile App API Config
console.log('\n2️⃣  Checking Mobile App API Configuration...');
const apiConfigPath = path.join(__dirname, 'src/config/api.js');
if (fs.existsSync(apiConfigPath)) {
  const content = fs.readFileSync(apiConfigPath, 'utf8');
  if (content.includes('10.0.2.2') && content.includes('localhost')) {
    console.log('   ✅ Both Android and iOS URLs configured');
  } else {
    console.log('   ⚠️  Device-specific URLs might be missing');
  }
  
  if (content.includes('/api/dealer')) {
    console.log('   ✅ Dealer API endpoint configured');
  } else {
    console.log('   ❌ Dealer API endpoint missing');
    allGood = false;
  }
  
  if (content.includes('Platform')) {
    console.log('   ✅ Platform detection implemented');
  } else {
    console.log('   ⚠️  Platform detection might be missing');
  }
} else {
  console.log('   ❌ API config file not found');
  allGood = false;
}

// Check 3: Auth Service
console.log('\n3️⃣  Checking Auth Service...');
const authServicePath = path.join(__dirname, 'src/services/authService.js');
if (fs.existsSync(authServicePath)) {
  const content = fs.readFileSync(authServicePath, 'utf8');
  if (content.includes('sendOTP') && content.includes('verifyOTP')) {
    console.log('   ✅ sendOTP and verifyOTP methods exist');
  } else {
    console.log('   ❌ Required methods missing');
    allGood = false;
  }
  
  if (content.includes('console.log')) {
    console.log('   ✅ Debug logging enabled');
  } else {
    console.log('   ⚠️  No debug logging (optional)');
  }
} else {
  console.log('   ❌ Auth service file not found');
  allGood = false;
}

// Check 4: Auth Screens
console.log('\n4️⃣  Checking Auth Screens...');
const authScreensPath = path.join(__dirname, 'src/components/AuthScreens.js');
if (fs.existsSync(authScreensPath)) {
  const content = fs.readFileSync(authScreensPath, 'utf8');
  if (content.includes('LoginScreen') && content.includes('OtpScreen')) {
    console.log('   ✅ Login and OTP screens exist');
  } else {
    console.log('   ❌ Required screens missing');
    allGood = false;
  }
  
  if (content.includes('handleSubmit') && content.includes('handleVerifyOTP')) {
    console.log('   ✅ Submit and verify handlers exist');
  } else {
    console.log('   ❌ Required handlers missing');
    allGood = false;
  }
} else {
  console.log('   ❌ Auth screens file not found');
  allGood = false;
}

// Check 5: Backend Server
console.log('\n5️⃣  Checking Backend Server Configuration...');
const serverPath = path.join(__dirname, '../chakraIndustries-backend/server.js');
if (fs.existsSync(serverPath)) {
  const content = fs.readFileSync(serverPath, 'utf8');
  if (content.includes('/api/dealer/auth')) {
    console.log('   ✅ Dealer auth routes registered');
  } else {
    console.log('   ❌ Dealer auth routes NOT registered');
    allGood = false;
  }
  
  if (content.includes('dealerAuthRoutes')) {
    console.log('   ✅ Dealer auth routes imported');
  } else {
    console.log('   ❌ Dealer auth routes import missing');
    allGood = false;
  }
} else {
  console.log('   ❌ Server file not found');
  allGood = false;
}

// Check 6: Package Dependencies
console.log('\n6️⃣  Checking Backend Dependencies...');
const backendPackagePath = path.join(__dirname, '../chakraIndustries-backend/package.json');
if (fs.existsSync(backendPackagePath)) {
  const pkg = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));
  const required = ['express', 'mongoose', 'jsonwebtoken', 'cors', 'dotenv'];
  let allInstalled = true;
  
  required.forEach(dep => {
    if (pkg.dependencies && pkg.dependencies[dep]) {
      console.log(`   ✅ ${dep} installed`);
    } else {
      console.log(`   ❌ ${dep} missing`);
      allInstalled = false;
      allGood = false;
    }
  });
  
  if (allInstalled) {
    console.log('   ✅ All required dependencies present');
  }
} else {
  console.log('   ❌ Backend package.json not found');
  allGood = false;
}

// Check 7: Mobile App Dependencies
console.log('\n7️⃣  Checking Mobile App Dependencies...');
const appPackagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(appPackagePath)) {
  const pkg = JSON.parse(fs.readFileSync(appPackagePath, 'utf8'));
  const required = ['react', 'react-native', '@react-native-async-storage/async-storage'];
  let allInstalled = true;
  
  required.forEach(dep => {
    if ((pkg.dependencies && pkg.dependencies[dep]) || (pkg.devDependencies && pkg.devDependencies[dep])) {
      console.log(`   ✅ ${dep} installed`);
    } else {
      console.log(`   ❌ ${dep} missing`);
      allInstalled = false;
      allGood = false;
    }
  });
  
  if (allInstalled) {
    console.log('   ✅ All required dependencies present');
  }
} else {
  console.log('   ❌ App package.json not found');
  allGood = false;
}

// Summary
console.log('\n' + '='.repeat(70));
if (allGood) {
  console.log('✅ ALL CHECKS PASSED! Setup is complete and ready to use.');
  console.log('\n📋 Next Steps:');
  console.log('   1. Start backend: cd chakraIndustries-backend && npm run dev');
  console.log('   2. Start app: cd chakraDealerApp && npm start');
  console.log('   3. Run Android: npx react-native run-android');
  console.log('   4. Login with: 9305241794');
  console.log('   5. Check backend console for OTP');
} else {
  console.log('❌ SOME CHECKS FAILED! Please review the issues above.');
  console.log('\n📋 Please fix the issues and run this script again.');
}
console.log('='.repeat(70) + '\n');

process.exit(allGood ? 0 : 1);
