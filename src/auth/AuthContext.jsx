import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

// ─── Mock users (replace with real API call) ──────────────────────────────────
const MOCK_USERS = [
  { id: 1, email: 'admin@chakra.in',      password: 'admin123',    name: 'Arjun Kumar',    role: 'super_admin',      avatar: 'AK' },
  { id: 2, email: 'ceo@chakra.in',        password: 'mgmt123',     name: 'Priya Sharma',   role: 'management',       avatar: 'PS' },
  { id: 3, email: 'purchase@chakra.in',   password: 'purchase123', name: 'Ramesh Gupta',   role: 'purchase_manager', avatar: 'RG' },
  { id: 4, email: 'production@chakra.in', password: 'prod123',     name: 'Sunil Das',      role: 'production_manager', avatar: 'SD' },
  { id: 5, email: 'dealer@chakra.in',     password: 'dealer123',   name: 'Vijay Rao',      role: 'dealer',           avatar: 'VR' },
  { id: 6, email: 'client@chakra.in',     password: 'client123',   name: 'Meera Patel',    role: 'corporate_client', avatar: 'MP' },
];

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
    sessionStorage.removeItem('chakra_user');
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
    const found = MOCK_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) throw new Error('Invalid email or password');
    const { password: _, ...safeUser } = found;
    setUser(safeUser);
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('chakra_user', JSON.stringify(safeUser));
    return safeUser;
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
