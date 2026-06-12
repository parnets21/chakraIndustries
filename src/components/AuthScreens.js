import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import BrandLogo from './BrandLogo';
import {colors, shadow} from './theme';
import authService from '../services/authService';

const AUTH_SCREEN = {
  LOGIN: 'login',
  REGISTER: 'register',
  OTP: 'otp',
};

function AuthScreens({onAuthenticated}) {
  const [screen, setScreen] = useState(AUTH_SCREEN.LOGIN);
  const [mobile, setMobile] = useState('');
  const [currentOTP, setCurrentOTP] = useState('');

  if (screen === AUTH_SCREEN.OTP) {
    return (
      <OtpScreen
        mobile={mobile}
        receivedOTP={currentOTP}
        onBack={() => {
          setScreen(AUTH_SCREEN.LOGIN);
          setCurrentOTP('');
        }}
        onVerify={onAuthenticated}
      />
    );
  }

  if (screen === AUTH_SCREEN.REGISTER) {
    return (
      <RegisterScreen
        onBack={() => setScreen(AUTH_SCREEN.LOGIN)}
        onRegistered={(registeredMobile, otp) => {
          setMobile(registeredMobile);
          setCurrentOTP(otp);
          setScreen(AUTH_SCREEN.OTP);
        }}
      />
    );
  }

  return (
    <LoginScreen
      mobile={mobile}
      setMobile={setMobile}
      onRegister={() => setScreen(AUTH_SCREEN.REGISTER)}
      onOtp={(otp) => {
        setCurrentOTP(otp);
        setScreen(AUTH_SCREEN.OTP);
      }}
    />
  );
}

function LoginScreen({mobile, setMobile, onOtp, onRegister}) {
  const [loading, setLoading] = useState(false);
  const canSubmit = mobile.length === 10;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    
    setLoading(true);
    console.log('🚀 Sending OTP to:', mobile);
    
    try {
      const response = await authService.sendOTP(mobile);
      console.log('📡 Full Send OTP Response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        // Get OTP from response (or fallback to 123456)
        const otpToSend = response.otp || '123456';
        console.log('✅ Using OTP for screen:', otpToSend);
        onOtp(otpToSend);
      } else {
        Alert.alert('❌ Error', response.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('❌ Send OTP Error:', error);
      Alert.alert('❌ Connection Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.authScreen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.authKeyboard}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.authBody}>
          
          <View style={styles.authGlowOne} />
          <View style={styles.authGlowTwo} />

          <View style={styles.logoArea}>
            <BrandLogo compact />
            <Text style={styles.authTitle}>Dealer Login</Text>
            <Text style={styles.authSubtitle}>
              Login to your Sri Chakra dealer account
            </Text>
          </View>

          <View style={styles.loginCard}>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View style={styles.phoneRow}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                keyboardType="number-pad"
                maxLength={10}
                value={mobile}
                onChangeText={value => setMobile(value.replace(/\D/g, ''))}
                placeholder="9876543210"
                placeholderTextColor="#9E9E9E"
                style={styles.input}
              />
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit || loading}
              style={[styles.primaryButton, (!canSubmit || loading) && styles.buttonDisabled]}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Send OTP</Text>
              )}
            </Pressable>

            <Text style={styles.helpText}>
              First time? Contact Sri Chakra sales team for dealer onboarding.
            </Text>

            <Pressable onPress={onRegister} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Register New Dealer</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RegisterScreen({onBack, onRegistered}) {
  const [form, setForm] = useState({
    name: '',
    businessName: '',
    mobile: '',
    email: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [loading, setLoading] = useState(false);

  const setField = (field, value) => {
    const cleanValue = field === 'mobile'
      ? value.replace(/\D/g, '').slice(0, 10)
      : field === 'pincode'
        ? value.replace(/\D/g, '').slice(0, 6)
        : field === 'gstin'
          ? value.toUpperCase().replace(/\s/g, '')
          : value;
    setForm(prev => ({...prev, [field]: cleanValue}));
  };

  const canRegister = form.name.trim() && form.mobile.length === 10;

  const handleRegister = async () => {
    if (!canRegister) return;

    setLoading(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        businessName: form.businessName.trim(),
        contactPerson: form.name.trim(),
      };
      const registerResponse = await authService.registerDealer(payload);
      if (!registerResponse.success) {
        Alert.alert('Error', registerResponse.message || 'Registration failed');
        return;
      }

      const otpResponse = await authService.sendOTP(form.mobile);
      if (otpResponse.success) {
        onRegistered(form.mobile, otpResponse.otp || '');
      } else {
        Alert.alert('Registered', 'Dealer registered. Please login to receive OTP.');
        onBack();
      }
    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'Unable to register dealer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.authScreen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.authKeyboard}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.registerBody}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.text} />
          </Pressable>

          <View style={styles.logoArea}>
            <BrandLogo compact />
            <Text style={styles.authTitle}>Dealer Registration</Text>
            <Text style={styles.authSubtitle}>
              Create your Sri Chakra dealer account
            </Text>
          </View>

          <View style={styles.loginCard}>
            <Text style={styles.inputLabel}>Owner Name *</Text>
            <TextInput
              value={form.name}
              onChangeText={value => setField('name', value)}
              placeholder="Dealer owner name"
              placeholderTextColor="#9E9E9E"
              style={styles.inputBox}
            />

            <Text style={styles.inputLabel}>Business Name</Text>
            <TextInput
              value={form.businessName}
              onChangeText={value => setField('businessName', value)}
              placeholder="Firm / shop name"
              placeholderTextColor="#9E9E9E"
              style={styles.inputBox}
            />

            <Text style={styles.inputLabel}>Mobile Number *</Text>
            <View style={styles.phoneRow}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                keyboardType="number-pad"
                maxLength={10}
                value={form.mobile}
                onChangeText={value => setField('mobile', value)}
                placeholder="9876543210"
                placeholderTextColor="#9E9E9E"
                style={styles.input}
              />
            </View>

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={value => setField('email', value)}
              placeholder="dealer@example.com"
              placeholderTextColor="#9E9E9E"
              style={styles.inputBox}
            />

            <Text style={styles.inputLabel}>GSTIN</Text>
            <TextInput
              autoCapitalize="characters"
              maxLength={15}
              value={form.gstin}
              onChangeText={value => setField('gstin', value)}
              placeholder="27AABCC1234D1Z5"
              placeholderTextColor="#9E9E9E"
              style={styles.inputBox}
            />

            <Text style={styles.inputLabel}>Business Address</Text>
            <TextInput
              value={form.address}
              onChangeText={value => setField('address', value)}
              placeholder="Address"
              placeholderTextColor="#9E9E9E"
              style={[styles.inputBox, styles.multilineInput]}
              multiline
            />

            <View style={styles.twoCol}>
              <View style={styles.colField}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  value={form.city}
                  onChangeText={value => setField('city', value)}
                  placeholder="City"
                  placeholderTextColor="#9E9E9E"
                  style={styles.inputBox}
                />
              </View>
              <View style={styles.colField}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput
                  value={form.state}
                  onChangeText={value => setField('state', value)}
                  placeholder="State"
                  placeholderTextColor="#9E9E9E"
                  style={styles.inputBox}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Pincode</Text>
            <TextInput
              keyboardType="number-pad"
              maxLength={6}
              value={form.pincode}
              onChangeText={value => setField('pincode', value)}
              placeholder="560001"
              placeholderTextColor="#9E9E9E"
              style={styles.inputBox}
            />

            <Pressable
              onPress={handleRegister}
              disabled={!canRegister || loading}
              style={[styles.primaryButton, (!canRegister || loading) && styles.buttonDisabled]}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Register & Send OTP</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function OtpScreen({mobile, receivedOTP = '', onVerify, onBack}) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const refs = useRef([]);

  useEffect(() => {
    console.log('📱 OtpScreen received OTP:', receivedOTP);
    if (timer <= 0) return undefined;
    const id = setInterval(() => setTimer(value => value - 1), 1000);
    return () => clearInterval(id);
  }, [timer, receivedOTP]);

  const updateOtp = (value, index) => {
    const digit = value.replace(/\D/g, '').slice(0, 1);
    const nextOtp = [...otp];
    nextOtp[index] = digit;
    setOtp(nextOtp);

    if (digit && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const filled = otp.every(item => item);

  const handleVerifyOTP = async () => {
    if (!filled) return;
    
    const otpCode = otp.join('');
    console.log('🔐 Verifying OTP:', otpCode);
    
    setLoading(true);
    try {
      const response = await authService.verifyOTP(mobile, otpCode);
      
      if (response.success) {
        console.log('✅ Login Successful!');
        // Go directly to dashboard — no extra alert needed
        onVerify(response.dealer);
      } else {
        Alert.alert('Verification Failed', response.message || 'Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']);
        refs.current[0]?.focus();
      }
    } catch (error) {
      console.error('❌ Verify OTP Error:', error);
      // Strip the long network troubleshooting message — show only the relevant part
      const msg = error.message || 'Verification failed';
      const shortMsg = msg.includes('\n') ? msg.split('\n')[0] : msg;
      Alert.alert('Verification Failed', shortMsg);
      setOtp(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;
    
    setLoading(true);
    try {
      const response = await authService.sendOTP(mobile);
      if (response.success) {
        Alert.alert('✅ Success', 'OTP resent successfully');
        setTimer(30);
        setOtp(['', '', '', '', '', '']);
        refs.current[0]?.focus();
      }
    } catch (error) {
      Alert.alert('❌ Error', error.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // Show only the OTP received from the backend, default to 123456 if empty
  const displayOTP = (receivedOTP && String(receivedOTP).length >= 6) ? String(receivedOTP) : '123456';

  return (
    <SafeAreaView style={styles.authScreen}>
      <ScrollView 
        contentContainerStyle={styles.otpBody}
        keyboardShouldPersistTaps="handled">
        <Pressable onPress={onBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.text} />
        </Pressable>

        <BrandLogo compact />
        <Text style={styles.authTitle}>Verify OTP</Text>
        <Text style={styles.authSubtitle}>
          6-digit OTP sent to +91 {mobile || '9876543210'}
        </Text>
        
        {/* OTP Display Card - Always visible now for testing */}
        <View style={styles.otpDisplayCard}>
          <View style={styles.otpCardHeader}>
            <Icon name="shield-check" size={24} color={colors.red} />
            <Text style={styles.otpCardTitle}>Your OTP Number</Text>
          </View>
          
          <View style={styles.otpCodeRow}>
            {displayOTP.split('').map((digit, index) => (
              <View key={index} style={styles.otpDigit}>
                <Text style={styles.otpDigitText}>{digit}</Text>
              </View>
            ))}
          </View>
          
          <Text style={styles.otpCardHint}>Enter this code below</Text>
        </View>

        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => {
                refs.current[index] = ref;
              }}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={value => updateOtp(value, index)}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
            />
          ))}
        </View>

        <Pressable
          disabled={!filled || loading}
          onPress={handleVerifyOTP}
          style={[styles.primaryButton, (!filled || loading) && styles.buttonDisabled]}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>Verify & Continue</Text>
          )}
        </Pressable>

        <Pressable
          disabled={timer > 0 || loading}
          onPress={handleResendOTP}
          style={styles.resendButton}>
          <Text style={[styles.resendText, (timer > 0 || loading) && {opacity: 0.5}]}>
            {loading ? 'Sending...' : timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  authScreen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  authKeyboard: {
    flex: 1,
  },
  authBody: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  registerBody: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 72,
  },
  authGlowOne: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.red,
    opacity: 0.05,
  },
  authGlowTwo: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.red,
    opacity: 0.04,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 32,
  },
  authTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 24,
    letterSpacing: 0.5,
  },
  authSubtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  loginCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.line,
    padding: 20,
    ...shadow,
  },
  inputLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 12,
    letterSpacing: 0.5,
  },
  phoneRow: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  countryCode: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: colors.line,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    fontWeight: '600',
  },
  inputBox: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#FFFFFF',
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    fontWeight: '600',
  },
  multilineInput: {
    minHeight: 78,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  colField: {
    flex: 1,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    ...shadow,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  helpText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  secondaryButtonText: {
    color: colors.red,
    fontSize: 14,
    fontWeight: '900',
  },
  otpBody: {
    flexGrow: 1,
    padding: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 18,
    left: 22,
    paddingVertical: 8,
    paddingHorizontal: 8,
    zIndex: 10,
  },
  // ── OTP Display Card (NO POPUP) ──
  otpDisplayCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.red,
    padding: 14,
    marginTop: 16,
    marginBottom: 12,
    ...shadow,
  },
  otpCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  otpCardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.text,
    marginLeft: 6,
  },
  otpCodeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  otpDigit: {
    width: 36,
    height: 42,
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  otpDigitText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.red,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  otpCardHint: {
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    fontWeight: '600',
  },
  otpRow: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 10,
  },
  otpInput: {
    width: 44,
    height: 52,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#FFFFFF',
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginHorizontal: 4,
  },
  otpInputFilled: {
    borderColor: colors.red,
    backgroundColor: '#FFF5F5',
  },
  resendButton: {
    marginTop: 12,
    padding: 10,
  },
  resendText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
});

export default AuthScreens;
