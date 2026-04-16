import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('chakra_user') || sessionStorage.getItem('chakra_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const timerRef = useRef(null);

  const logout = useCallback(() => {
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
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Invalid email or password');
    }

    const { user: userData, token } = data;
    setUser(userData);

    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('chakra_user', JSON.stringify(userData));
    storage.setItem('chakra_token', token);

    return userData;
  };

  const register = async (name, email, password, role) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Registration failed');
    }

    const { user: userData, token } = data;
    setUser(userData);
    sessionStorage.setItem('chakra_user', JSON.stringify(userData));
    sessionStorage.setItem('chakra_token', token);

    return userData;
  };

  // Helper to make authenticated API calls
  const authFetch = useCallback(async (url, options = {}) => {
    const token =
      localStorage.getItem('chakra_token') ||
      sessionStorage.getItem('chakra_token');

    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (res.status === 401) {
      logout();
      throw new Error('Session expired. Please log in again.');
    }

    return res.json();
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
