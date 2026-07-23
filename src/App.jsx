import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MapPage from './pages/MapPage';
import './i18n';

function Nav() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  return (
    <nav>
      <Link to="/">{t('app.title')}</Link>
      {user ? (
        <>
          <span>{user.name}</span>
          <button onClick={logout}>{t('nav.logout')}</button>
        </>
      ) : (
        <>
          <Link to="/login">{t('nav.login')}</Link>
          <Link to="/register">{t('nav.register')}</Link>
        </>
      )}
    </nav>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<MapPage />} />
      <Route path="/login" element={user ? <MapPage /> : <LoginPage />} />
      <Route path="/register" element={user ? <MapPage /> : <RegisterPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Nav />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}