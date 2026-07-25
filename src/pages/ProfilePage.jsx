import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

export default function ProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/me')
      .then(({ data }) => setProfile(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><p>{t('common.loading')}</p></div>;
  if (!profile) return <div className="page"><p className="error">Error loading profile</p></div>;

  return (
    <div className="page">
      <h1>{t('profile.title')}</h1>
      <div className="profile-info">
        <p><strong>{t('auth.name')}:</strong> {profile.name}</p>
        <p><strong>{t('auth.email')}:</strong> {profile.email}</p>
        <p><strong>{t('profile.role')}:</strong> {profile.role}</p>
        <p><strong>{t('profile.acceptanceCount')}:</strong> {profile.acceptanceCount}</p>
      </div>

      <h2 style={{ marginTop: '1.5rem', fontSize: '1.1rem' }}>{t('profile.myLocations')} ({profile.locations?.length || 0})</h2>
      {profile.locations?.length > 0 ? (
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
