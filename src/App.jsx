import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MapPage from './pages/MapPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import SuggestionModal from './components/SuggestionModal';
import './styles.css';
import './i18n';

const LANGUAGES = ['CA', 'ES', 'EN'];

function Nav() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [showSuggest, setShowSuggest] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);
  const currentLanguage = (i18n.language || 'ca').substring(0, 2).toUpperCase();

  useEffect(() => {
    const handleClick = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const changeLang = (lng) => {
    i18n.changeLanguage(lng.toLowerCase());
    setLangOpen(false);
  };

  return (
    <nav>
      <Link to="/" className="logo">{t('app.title')}</Link>
      <div className="spacer" />
      {user ? (
        <>
          <Link to="/profile">{t('nav.profile')}</Link>
          {user.role === 'ADMIN' && <Link to="/admin">{t('nav.admin')}</Link>}
          <button className="btn-suggest" onClick={() => setShowSuggest(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>
            <span>{t('nav.suggest')}</span>
          </button>
          <button className="btn-logout" onClick={logout} title={t('nav.logout')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
          </button>
        </>
      ) : (
        <>
          <Link to="/login">{t('nav.login')}</Link>
          <Link to="/register">{t('nav.register')}</Link>
          <button className="btn-suggest" onClick={() => setShowSuggest(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>
            <span>{t('nav.suggest')}</span>
          </button>
        </>
      )}
      {showSuggest && <SuggestionModal onClose={() => setShowSuggest(false)} />}
      <a href="https://github.com/martibn/MCC-web" target="_blank" rel="noopener noreferrer" className="github-link" title="GitHub">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
      </a>
      <div className="lang-selector" ref={langRef}>
        <button onClick={() => setLangOpen((o) => !o)}>{currentLanguage}</button>
        {langOpen && (
          <div className="lang-dropdown">
            {LANGUAGES.filter((l) => l !== currentLanguage).map((l) => (
              <button key={l} onClick={() => changeLang(l)}>{l}</button>
            ))}
          </div>
        )}
      </div>
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
      <Route path="/profile" element={user ? <ProfilePage /> : <LoginPage />} />
      <Route path="/admin" element={user?.role === 'ADMIN' ? <AdminPage /> : <MapPage />} />
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
