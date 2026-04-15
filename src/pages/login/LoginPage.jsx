import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdLogin } from 'react-icons/md';
import { useAuth } from '../../auth/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [remember, setRemember]   = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e) => {
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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fdf0ef 0%, #fff5f5 40%, #f4f6f9 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0,
      }}>
        <div style={{
          position: 'absolute', top: -120, right: -120, width: 400, height: 400,
          borderRadius: '50%', background: 'rgba(192,57,43,0.06)',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -80, width: 300, height: 300,
          borderRadius: '50%', background: 'rgba(243,156,18,0.06)',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>
        {/* Card */}
        <div style={{
          background: '#fff',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 60px rgba(0,0,0,0.10), 0 4px 16px rgba(192,57,43,0.08)',
          padding: '40px 36px',
        }}>
          {/* Logo + Brand */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: '#fff', border: '2px solid #f5c6c2',
              boxShadow: '0 4px 16px rgba(192,57,43,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <img src="/logos.png" alt="Chakra" style={{ width: 48, height: 48, objectFit: 'contain' }} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1c2833', letterSpacing: '-0.4px' }}>
              Chakra Industries
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#c0392b', letterSpacing: '2.5px', textTransform: 'uppercase', marginTop: 4 }}>
              ERP Platform
            </div>
            <div style={{ fontSize: 13, color: '#718096', marginTop: 10 }}>
              Sign in to your account
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
              padding: '10px 14px', marginBottom: 20,
              fontSize: 13, color: '#dc2626', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: '#9ca3af', display: 'flex', pointerEvents: 'none',
                }}>
                  <MdEmail size={17} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@chakra.in"
                  autoComplete="email"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: '#9ca3af', display: 'flex', pointerEvents: 'none',
                }}>
                  <MdLock size={17} />
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{ ...inputStyle, paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#9ca3af', display: 'flex', padding: 2,
                  }}
                >
                  {showPass ? <MdVisibilityOff size={17} /> : <MdVisibility size={17} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, marginTop: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: '#c0392b', cursor: 'pointer' }}
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => alert('Password reset link sent to your email.')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, color: '#c0392b', fontWeight: 600,
                  fontFamily: 'inherit', padding: 0,
                }}
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px 20px',
                background: loading ? '#e5e7eb' : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                color: loading ? '#9ca3af' : '#fff',
                border: 'none', borderRadius: 12,
                fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : '0 4px 14px rgba(185,28,28,0.35)',
                transition: 'all 0.15s',
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: 16, height: 16, border: '2px solid #9ca3af', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  Signing in…
                </>
              ) : (
                <>
                  <MdLogin size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo credentials hint */}
          <div style={{
            marginTop: 24, padding: '12px 14px',
            background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>
              Demo Credentials
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
              {[
                ['Super Admin', 'admin@chakra.in', 'admin123'],
                ['Management', 'ceo@chakra.in', 'mgmt123'],
                ['Purchase Mgr', 'purchase@chakra.in', 'purchase123'],
                ['Production Mgr', 'production@chakra.in', 'prod123'],
                ['Dealer', 'dealer@chakra.in', 'dealer123'],
                ['Corp. Client', 'client@chakra.in', 'client123'],
              ].map(([role, em, pass]) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => { setEmail(em); setPassword(pass); }}
                  style={{
                    background: 'none', border: '1px solid #e2e8f0', borderRadius: 7,
                    padding: '5px 8px', cursor: 'pointer', textAlign: 'left',
                    fontFamily: 'inherit', transition: 'border-color 0.15s, background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#fca5a5'; e.currentTarget.style.background = '#fef2f2'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'none'; }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#c0392b' }}>{role}</div>
                  <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>{em}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
          © 2026 Chakra Industries. All rights reserved.
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { outline: none; border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important; }
      `}</style>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px 10px 38px',
  border: '1.5px solid #e2e8f0',
  borderRadius: 10,
  fontSize: 13,
  color: '#1c2833',
  background: '#f9fafb',
  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box',
};
