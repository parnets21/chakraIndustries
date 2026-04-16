import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdEmail, MdLock, MdVisibility, MdVisibilityOff,
  MdLogin, MdPersonAdd, MdPerson,
} from 'react-icons/md';import { useAuth } from '../../auth/AuthContext';

const ROLES = [
  { value: 'super_admin',        label: 'Super Admin' },
  { value: 'purchase_manager',   label: 'Purchase Manager' },
  { value: 'production_manager', label: 'Production Manager' },
  { value: 'management',         label: 'Management' },
  { value: 'dealer',             label: 'Dealer' },
  { value: 'corporate_client',   label: 'Corporate Client' },
];

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode]         = useState('login'); // 'login' | 'register'
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  // Login fields
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Register fields
  const [regName, setRegName]         = useState('');
  const [regEmail, setRegEmail]       = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm]   = useState('');
  const [regRole, setRegRole]         = useState('purchase_manager');
  const [showRegPass, setShowRegPass] = useState(false);

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setSuccess('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password, remember);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError('All fields are required.');
      return;
    }
    if (regPassword !== regConfirm) {
      setError('Passwords do not match.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(regName.trim(), regEmail.trim(), regPassword, regRole);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .auth-input:focus {
          outline: none;
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important;
          background: #fff !important;
        }
        .auth-select:focus {
          outline: none;
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important;
        }
        .tab-btn { transition: all 0.18s; }
        .login-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #fdf0ef 0%, #fff5f5 40%, #f4f6f9 100%);
          display: flex; align-items: center; justify-content: center;
          padding: 24px 16px;
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        }
        .login-card {
          background: #fff; border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 20px 60px rgba(0,0,0,0.10), 0 4px 16px rgba(192,57,43,0.08);
          padding: 36px 36px 32px; width: 100%;
          animation: fadeIn 0.3s ease;
        }
        .form-section { animation: fadeIn 0.25s ease; }
        @media (max-width: 480px) {
          .login-card { padding: 24px 18px; }
          .demo-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="login-page">
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: -120, right: -120, width: 400, height: 400, borderRadius: '50%', background: 'rgba(192,57,43,0.06)' }} />
          <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(243,156,18,0.06)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460 }}>
          <div className="login-card">

            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: '#fff', border: '2px solid #f5c6c2',
                boxShadow: '0 4px 16px rgba(192,57,43,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <img src="/logos.png" alt="Chakra" style={{ width: 46, height: 46, objectFit: 'contain' }} />
              </div>
              <div style={{ fontSize: 21, fontWeight: 800, color: '#1c2833', letterSpacing: '-0.4px' }}>
                Chakra Industries
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#c0392b', letterSpacing: '2.5px', textTransform: 'uppercase', marginTop: 3 }}>
                ERP Platform
              </div>
            </div>

            {/* Tab switcher */}
            <div style={{
              display: 'flex', background: '#f1f5f9', borderRadius: 12,
              padding: 4, marginBottom: 24, gap: 4,
            }}>
              {[
                { key: 'login',    label: 'Sign In',       icon: <MdLogin size={15} /> },
                { key: 'register', label: 'Create Account', icon: <MdPersonAdd size={15} /> },
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  className="tab-btn"
                  onClick={() => switchMode(tab.key)}
                  style={{
                    flex: 1, padding: '9px 12px',
                    border: 'none', borderRadius: 9, cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    background: mode === tab.key ? '#fff' : 'transparent',
                    color: mode === tab.key ? '#c0392b' : '#64748b',
                    boxShadow: mode === tab.key ? '0 1px 6px rgba(0,0,0,0.10)' : 'none',
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Alert */}
            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
                padding: '10px 14px', marginBottom: 16,
                fontSize: 13, color: '#dc2626', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
                padding: '10px 14px', marginBottom: 16,
                fontSize: 13, color: '#16a34a', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                ✅ {success}
              </div>
            )}

            {/* ── LOGIN FORM ── */}
            {mode === 'login' && (
              <form className="form-section" onSubmit={handleLogin} noValidate>
                <Field label="Email Address">
                  <IconInput icon={<MdEmail size={17} />}>
                    <input className="auth-input" type="email" value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@chakra.in" autoComplete="email" style={inputStyle} />
                  </IconInput>
                </Field>

                <Field label="Password">
                  <IconInput icon={<MdLock size={17} />} right={
                    <EyeBtn show={showPass} toggle={() => setShowPass(v => !v)} />
                  }>
                    <input className="auth-input" type={showPass ? 'text' : 'password'}
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password" autoComplete="current-password"
                      style={{ ...inputStyle, paddingRight: 42 }} />
                  </IconInput>
                </Field>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '12px 0 20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                    <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                      style={{ width: 15, height: 15, accentColor: '#c0392b', cursor: 'pointer' }} />
                    Remember me
                  </label>
                  <button type="button"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#c0392b', fontWeight: 600, fontFamily: 'inherit', padding: 0 }}>
                    Forgot Password?
                  </button>
                </div>

                <SubmitBtn loading={loading} label="Sign In" loadingLabel="Signing in…" icon={<MdLogin size={18} />} />
              </form>
            )}

            {/* ── REGISTER FORM ── */}
            {mode === 'register' && (
              <form className="form-section" onSubmit={handleRegister} noValidate>
                <Field label="Full Name">
                  <IconInput icon={<MdPerson size={17} />}>
                    <input className="auth-input" type="text" value={regName}
                      onChange={e => setRegName(e.target.value)}
                      placeholder="Your full name" autoComplete="name" style={inputStyle} />
                  </IconInput>
                </Field>

                <Field label="Email Address">
                  <IconInput icon={<MdEmail size={17} />}>
                    <input className="auth-input" type="email" value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      placeholder="you@company.com" autoComplete="email" style={inputStyle} />
                  </IconInput>
                </Field>

                <Field label="Role">
                  <select className="auth-select" value={regRole} onChange={e => setRegRole(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 14, appearance: 'none', cursor: 'pointer' }}>
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Password">
                  <IconInput icon={<MdLock size={17} />} right={
                    <EyeBtn show={showRegPass} toggle={() => setShowRegPass(v => !v)} />
                  }>
                    <input className="auth-input" type={showRegPass ? 'text' : 'password'}
                      value={regPassword} onChange={e => setRegPassword(e.target.value)}
                      placeholder="Min. 6 characters" autoComplete="new-password"
                      style={{ ...inputStyle, paddingRight: 42 }} />
                  </IconInput>
                </Field>

                <Field label="Confirm Password">
                  <IconInput icon={<MdLock size={17} />}>
                    <input className="auth-input" type="password"
                      value={regConfirm} onChange={e => setRegConfirm(e.target.value)}
                      placeholder="Re-enter password" autoComplete="new-password"
                      style={inputStyle} />
                  </IconInput>
                </Field>

                <div style={{ marginBottom: 20 }} />

                <SubmitBtn loading={loading} label="Create Account" loadingLabel="Creating…" icon={<MdPersonAdd size={18} />} />

                <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 14 }}>
                  Already have an account?{' '}
                  <button type="button" onClick={() => switchMode('login')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', fontWeight: 700, fontFamily: 'inherit', fontSize: 12, padding: 0 }}>
                    Sign in
                  </button>
                </p>
              </form>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: '#94a3b8' }}>
            © 2026 Chakra Industries. All rights reserved.
          </div>
        </div>
      </div>
    </>
  );
}

// ── Small reusable pieces ─────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function IconInput({ icon, right, children }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', display: 'flex', pointerEvents: 'none' }}>
        {icon}
      </span>
      {children}
      {right && (
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
          {right}
        </span>
      )}
    </div>
  );
}

function EyeBtn({ show, toggle }) {
  return (
    <button type="button" onClick={toggle}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 2 }}>
      {show ? <MdVisibilityOff size={17} /> : <MdVisibility size={17} />}
    </button>
  );
}

function SubmitBtn({ loading, label, loadingLabel, icon }) {
  return (
    <button type="submit" disabled={loading} style={{
      width: '100%', padding: '13px 20px',
      background: loading ? '#e5e7eb' : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
      color: loading ? '#9ca3af' : '#fff',
      border: 'none', borderRadius: 12,
      fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
      cursor: loading ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      boxShadow: loading ? 'none' : '0 4px 14px rgba(185,28,28,0.35)',
      transition: 'all 0.15s',
    }}>
      {loading ? (
        <>
          <span style={{ width: 16, height: 16, border: '2px solid #9ca3af', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
          {loadingLabel}
        </>
      ) : (
        <>{icon} {label}</>
      )}
    </button>
  );
}

const inputStyle = {
  width: '100%',
  padding: '11px 12px 11px 38px',
  border: '1.5px solid #e2e8f0',
  borderRadius: 10,
  fontSize: 14,
  color: '#1c2833',
  background: '#f9fafb',
  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  transition: 'border-color 0.15s, box-shadow 0.15s',
};
