import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

export default function AdminPage() {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSuggestions = () => {
    api.get('/admin/suggestions')
      .then(({ data }) => setSuggestions(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSuggestions(); }, []);

  const deleteSuggestion = async (id) => {
    try {
      await api.delete(`/admin/suggestions/${id}`);
      fetchSuggestions();
    } catch {}
  };

  if (loading) return <div className="page"><p>{t('common.loading')}</p></div>;

  return (
    <div className="page" style={{ maxWidth: '700px' }}>
      <h1>{t('admin.title')}</h1>
      {suggestions.length === 0 ? (
        <p style={{ color: '#888' }}>{t('admin.noSuggestions')}</p>
      ) : (
        <ul className="admin-suggestions">
          {suggestions.map((s) => (
            <li key={s.id}>
              <div className="suggestion-meta">
                <span className="suggestion-date">{new Date(s.createdAt).toLocaleDateString()}</span>
                <span className="suggestion-user">{s.user?.name || t('admin.anonymous')}</span>
              </div>
              <p className="suggestion-text">{s.message}</p>
              <div className="suggestion-actions">
                <button className="btn-delete" onClick={() => deleteSuggestion(s.id)}>{t('common.delete')}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
