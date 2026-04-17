import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdLogin, MdArrowForward } from 'react-icons/md';
import { useAuth } from '../../auth/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        @keyframes spin { 
          to { transform: rotate(360deg); } 
        }
        
        @keyframes fadeInUp { 
          from { opacity: 0; transform: translateY(30px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .login-wrapper {
          min-height: 100vh;
          display: flex;
          background: linear-gradient(135deg, #fef2f2 0%, #fff5f5 50%, #fef3f2 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Left Side - Branding */
        .left-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px 50px;
          position: relative;
          background: linear-gradient(135deg, #ffffff 0%, #fef2f2 50%, #fee2e2 100%);
          overflow: hidden;
          border-right: 1px solid rgba(192, 57, 43, 0.1);
        }

        .left-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 30%, rgba(192, 57, 43, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(231, 76, 60, 0.05) 0%, transparent 50%);
        }

        .brand-content {
          position: relative;
          z-index: 1;
          text-align: center;
          animation: fadeInUp 0.8s ease;
          max-width: 520px;
        }

        .brand-logo {
          width: 120px;
          height: 120px;
          background: white;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 32px;
          box-shadow: 
            0 20px 40px rgba(192, 57, 43, 0.15),
            0 0 0 1px rgba(192, 57, 43, 0.1);
          animation: float 6s ease-in-out infinite;
          position: relative;
          transition: transform 0.4s ease;
        }

        .brand-logo:hover {
          transform: scale(1.05);
        }

        .brand-logo img {
          width: 80px;
          height: 80px;
          object-fit: contain;
        }

        .brand-title {
          font-size: 36px;
          font-weight: 900;
          margin-bottom: 12px;
          letter-spacing: -1px;
          line-height: 1.1;
          background: linear-gradient(135deg, #1a202c 0%, #4a5568 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .brand-subtitle {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 4px;
          margin-bottom: 24px;
          color: #c0392b;
          background: rgba(192, 57, 43, 0.08);
          display: inline-block;
          padding: 8px 20px;
          border-radius: 20px;
        }

        .brand-description {
          font-size: 15px;
          line-height: 1.7;
          max-width: 420px;
          margin: 0 auto 36px;
          font-weight: 500;
          color: #4a5568;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          max-width: 420px;
          margin: 0 auto;
        }

        .stat-card {
          background: white;
          border: 2px solid rgba(192, 57, 43, 0.15);
          border-radius: 16px;
          padding: 18px 12px;
          text-align: center;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(192, 57, 43, 0.08);
        }

        .stat-card:hover {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          transform: translateY(-4px);
          border-color: rgba(192, 57, 43, 0.3);
          box-shadow: 0 8px 24px rgba(192, 57, 43, 0.15);
        }

        .stat-number {
          font-size: 28px;
          font-weight: 900;
          margin-bottom: 4px;
          display: block;
          background: linear-gradient(135deg, #c0392b 0%, #e74c3c 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stat-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #64748b;
        }

        .decorative-dots {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
        }

        .dot {
          width: 10px;
          height: 10px;
          background: #c0392b;
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
          box-shadow: 0 0 10px rgba(192, 57, 43, 0.3);
        }

        .dot:nth-child(2) { animation-delay: 0.3s; }
        .dot:nth-child(3) { animation-delay: 0.6s; }

        /* Right Side - Login Form */
        .right-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          position: relative;
        }

        .floating-shape {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        .shape-1 {
          top: -100px;
          right: -100px;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(192,57,43,0.08) 0%, transparent 70%);
          animation: float 10s ease-in-out infinite;
        }

        .shape-2 {
          bottom: -80px;
          left: -80px;
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, rgba(243,156,18,0.08) 0%, transparent 70%);
          animation: float 12s ease-in-out infinite;
          animation-delay: 2s;
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 28px;
          padding: 40px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
          border: 1px solid rgba(226, 232, 240, 0.6);
          animation: fadeInUp 0.6s ease;
          position: relative;
          z-index: 1;
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-title {
          font-size: 28px;
          font-weight: 800;
          color: #1a202c;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .login-subtitle {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          border: 2px solid #f87171;
          border-radius: 16px;
          color: #dc2626;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 24px;
          animation: slideInLeft 0.4s ease;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          margin-left: 4px;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
          transition: color 0.3s ease;
        }

        .form-input {
          width: 100%;
          padding: 13px 16px 13px 48px;
          font-size: 14px;
          font-weight: 500;
          color: #1a202c;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 14px;
          outline: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
        }

        .form-input:focus {
          background: #fff;
          border-color: #c0392b;
          box-shadow: 0 0 0 4px rgba(192, 57, 43, 0.1);
          transform: translateY(-2px);
        }

        .form-input:focus ~ .input-icon {
          color: #c0392b;
        }

        .toggle-password {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 8px;
          display: flex;
          align-items: center;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .toggle-password:hover {
          background: #f3f4f6;
          color: #c0392b;
        }

        .form-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
        }

        .checkbox-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
        }

        .checkbox-input {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #c0392b;
        }

        .checkbox-label {
          font-size: 13px;
          color: #4b5563;
          font-weight: 500;
        }

        .forgot-link {
          font-size: 13px;
          color: #64748b;
          text-decoration: none;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s ease;
          position: relative;
        }

        .forgot-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: #c0392b;
          transition: width 0.3s ease;
        }

        .forgot-link:hover {
          color: #c0392b;
        }

        .forgot-link:hover::after {
          width: calc(100% - 20px);
        }

        .submit-btn {
          width: 100%;
          padding: 14px 20px;
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          background: linear-gradient(135deg, #c0392b 0%, #e74c3c 100%);
          border: none;
          border-radius: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 8px 24px rgba(192, 57, 43, 0.35);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
          position: relative;
          overflow: hidden;
        }

        .submit-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .submit-btn:hover:not(:disabled)::before {
          left: 100%;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(192, 57, 43, 0.45);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(-1px);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        .login-footer {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
        }

        .footer-text {
          font-size: 13px;
          color: #94a3b8;
          font-weight: 500;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .left-panel {
            display: none;
          }
          .right-panel {
            flex: 1;
          }
        }

        @media (max-width: 640px) {
          .login-card {
            padding: 32px 24px;
            border-radius: 24px;
          }
          .login-title {
            font-size: 26px;
          }
          .form-options {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }
      `}</style>

      <div className="login-wrapper">
        {/* Left Panel - Branding */}
        <div className="left-panel">
          <div className="brand-content">
            <div className="brand-logo">
              <img src="/logos.png" alt="Chakra Industries" />
            </div>
            <h1 className="brand-title">Chakra Industries</h1>
            <div className="brand-subtitle">ERP PLATFORM</div>
            <p className="brand-description">
              Transforming manufacturing operations through intelligent automation and seamless integration
            </p>
            
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-number">6+</span>
                <span className="stat-label">Modules</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">100%</span>
                <span className="stat-label">Integrated</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Access</span>
              </div>
            </div>
          </div>
          <div className="decorative-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="right-panel">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>

          <div className="login-card">
            <div className="login-header">
              <h2 className="login-title">Welcome Back</h2>
              <p className="login-subtitle">Sign in to access your dashboard</p>
            </div>

            {error && (
              <div className="error-alert">
                <span style={{ fontSize: '20px' }}>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin}>
              {/* Email Field */}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@chakra.in"
                    autoComplete="email"
                  />
                  <MdEmail className="input-icon" size={20} />
                </div>
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrapper">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    style={{ paddingRight: '52px' }}
                  />
                  <MdLock className="input-icon" size={20} />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="form-options">
                <label className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span className="checkbox-label">Remember me</span>
                </label>
                <Link to="/forgot-password" className="forgot-link">
                  Forgot password?
                  <MdArrowForward size={16} />
                </Link>
              </div>

              {/* Submit Button */}
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <MdLogin size={22} />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            <div className="login-footer">
              <p className="footer-text">
                © 2026 Chakra Industries. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
