import { useLocation } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import MainLayout from './layout/MainLayout';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  const location = useLocation();
  const isLogin = location.pathname === '/login';
  const activePage = location.pathname.replace('/', '').split('/')[0] || 'dashboard';

  return (
    <AuthProvider>
      {isLogin ? (
        <AppRoutes />
      ) : (
        <MainLayout activePage={activePage}>
          <AppRoutes />
        </MainLayout>
      )}
    </AuthProvider>
  );
}
