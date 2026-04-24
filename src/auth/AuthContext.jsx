import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('chakra_user') || sessionStorage.getItem('chakra_user');
      const token = localStorage.getItem('chakra_token') || sessionStorage.getItem('chakra_token');
      if (stored && !token) {
        // Stale mock session — no real JWT, clear it
        localStorage.removeItem('chakra_user');
        sessionStorage.removeItem('chakra_user');
        return null;
      }
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const timerRef = useRef(null);

  const logout = useCallback(async () => {
    // Fire logout to backend (best-effort)
    try {
      const token = localStorage.getItem('chakra_token') || sessionStorage.getItem('chakra_token');
      if (token) {
        await fetch(`${BASE}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch { /* ignore */ }

    setUser(null);
    localStorage.removeItem('chakra_user');
    localStorage.removeItem('chakra_token');
    sessionStorage.removeItem('chakra_user');
    sessionStorage.removeItem('chakra_token');
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // Auto-logout on inactivity
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, INACTIVITY_TIMEOUT);
  }, [logout]);

  useEffect(() => {
    if (!user) return;
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, resetTimer]);

  const login = async (email, password, remember = false) => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Invalid email or password');

    const { token, user: userData } = data;
    const storage = remember ? localStorage : sessionStorage;

    storage.setItem('chakra_token', token);
    storage.setItem('chakra_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
