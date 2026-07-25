import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const PW_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const pwValid = PW_PATTERN.test(password);
  const showPwHint = password.length > 0 && !pwValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!pwValid) {
      setError(t('auth.passwordRequirements'));
      return;
    }

    try {
      await register(email, password, name);
      navigate('/');
    } catch {
      setError(t('auth.registerError'));
    }
  };

  return (
    <div className="page">
      <h1>{t('auth.register')}</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>{t('auth.name')}</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>{t('auth.email')}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>{t('auth.password')}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {showPwHint && <p className="pw-hint">{t('auth.passwordRequirements')}</p>}
        </div>
        <button type="submit">{t('auth.register')}</button>
      </form>
      <div className="link"><Link to="/login">{t('auth.hasAccount')}</Link></div>
    </div>
  );
}
