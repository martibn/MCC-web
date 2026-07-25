import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

const STATUSES = ['PENDING', 'READ', 'RESOLVED'];

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

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/admin/suggestions/${id}/status`, { status });
      fetchSuggestions();
    } catch {}
  };

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
            <li key={s.id} className={`admin-suggestion status-${s.status?.toLowerCase()}`}>
              <div className="suggestion-meta">
                <span className={`suggestion-status status-${s.status?.toLowerCase()}`}>{s.status}</span>
                <span className="suggestion-date">{new Date(s.createdAt).toLocaleDateString()}</span>
                <span className="suggestion-user">{s.user?.name || t('admin.anonymous')}</span>
              </div>
              <p className="suggestion-text">{s.message}</p>
              <div className="suggestion-actions">
                {STATUSES.map((st) => (
                  <button key={st} className={`btn-status ${st === s.status ? 'active' : ''}`} onClick={() => updateStatus(s.id, st)}>{st}</button>
                ))}
                <button className="btn-delete" onClick={() => deleteSuggestion(s.id)}>{t('common.delete')}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
