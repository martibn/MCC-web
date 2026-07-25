import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MapPage from './pages/MapPage';
import './styles.css';
import './i18n';

function Nav() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const currentLanguage = i18n.language || 'ca';

  return (
    <nav>
      <Link to="/" className="logo">{t('app.title')}</Link>
      <div className="spacer" />
      <div className="lang-selector">
        <button 
          className={currentLanguage.startsWith('ca') ? 'active' : ''} 
          onClick={() => i18n.changeLanguage('ca')}
        >
          CA
        </button>
        <button 
          className={currentLanguage.startsWith('es') ? 'active' : ''} 
          onClick={() => i18n.changeLanguage('es')}
        >
          ES
        </button>
        <button 
          className={currentLanguage.startsWith('en') ? 'active' : ''} 
          onClick={() => i18n.changeLanguage('en')}
        >
          EN
        </button>
      </div>
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