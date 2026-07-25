import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

const PW_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function ProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const pwValid = PW_PATTERN.test(pwNew);
  const showPwHint = pwNew.length > 0 && !pwValid;

  useEffect(() => {
    api.get('/users/me')
      .then(({ data }) => setProfile(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg('');
    setPwError('');

    if (!pwValid) {
      setPwError(t('auth.passwordRequirements'));
      return;
    }

    setChangingPw(true);
    try {
      await api.put('/users/me/password', { currentPassword: pwCurrent, newPassword: pwNew });
      setPwMsg(t('profile.passwordChanged'));
      setPwCurrent('');
      setPwNew('');
    } catch (err) {
      setPwError(err.response?.data?.error || t('common.error'));
    } finally {
      setChangingPw(false);
    }
  };

  if (loading) return <div className="page"><p>{t('common.loading')}</p></div>;
  if (!profile) return <div className="page"><p className="error">Error loading profile</p></div>;

  const locationsCount = profile.locations?.length || 0;

  return (
    <div className="page">
      <h1>{t('profile.title')}</h1>

      <div className="profile-stats">
        <div className="stat-card">
          <span className="stat-number">{locationsCount}</span>
          <span className="stat-label">{t('profile.statsLocations')}</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{profile.acceptanceCount}</span>
          <span className="stat-label">{t('profile.statsAcceptances')}</span>
        </div>
      </div>

      <div className="profile-info">
        <p><strong>{t('auth.name')}:</strong> {profile.name}</p>
        <p><strong>{t('auth.email')}:</strong> {profile.email}</p>
      </div>

      <form className="password-form" onSubmit={handleChangePassword}>
          <h3>{t('profile.changePassword')}</h3>
          <input type="password" placeholder={t('profile.currentPassword')} value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} required />
          <input type="password" placeholder={t('profile.newPassword')} value={pwNew} onChange={(e) => setPwNew(e.target.value)} required />
          {showPwHint && <p className="pw-hint">{t('auth.passwordRequirements')}</p>}
          {pwMsg && <p className="success">{pwMsg}</p>}
          {pwError && <p className="error">{pwError}</p>}
          <button type="submit" disabled={changingPw}>{changingPw ? t('common.sending') : t('profile.updatePassword')}</button>
        </form>

      <h2 style={{ marginTop: '1.5rem', fontSize: '1.1rem' }}>{t('profile.myLocations')} ({locationsCount})</h2>
      {locationsCount > 0 ? (
        <ul className="profile-locations">
          {profile.locations.map((loc) => (
            <li key={loc.id}>
              <strong>{loc.name}</strong>
              <span className="profile-addr">{loc.address}</span>
              <span className="profile-cats">{loc.categories?.join(', ')}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: '#888', fontSize: '.85rem' }}>{t('profile.noLocations')}</p>
      )}
    </div>
  );
}
