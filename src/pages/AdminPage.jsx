import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

export default function AdminPage() {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchSuggestions = (q, p) => {
    setLoading(true);
    const params = { page: p, size: 10 };
    if (q) params.search = q;
    api.get('/admin/suggestions', { params })
      .then(({ data }) => {
        setSuggestions(data.content);
        setTotalPages(data.totalPages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSuggestions('', 0); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchSuggestions(search, 0);
  };

  const goToPage = (p) => {
    setPage(p);
    fetchSuggestions(search, p);
  };

  const deleteSuggestion = async (id) => {
    try {
      await api.delete(`/admin/suggestions/${id}`);
      fetchSuggestions(search, page);
    } catch {}
  };

  if (loading) return <div className="page"><p>{t('common.loading')}</p></div>;

  return (
    <div className="page" style={{ maxWidth: '700px' }}>
      <h1>{t('admin.title')}</h1>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', width: '100%' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.searchPlaceholder')}
          style={{ flex: 1, padding: '.5rem .7rem', border: '1px solid #d0d0d0', borderRadius: '8px', fontSize: '.85rem' }}
        />
        <button type="submit" style={{ padding: '.5rem .8rem', background: '#e74c3c', color: '#fff', border: 0, borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '.85rem' }}>
          {t('common.search')}
        </button>
      </form>

      {suggestions.length === 0 ? (
        <p style={{ color: '#888' }}>{t('admin.noSuggestions')}</p>
      ) : (
        <>
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

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center', marginTop: '1rem', alignItems: 'center' }}>
              <button onClick={() => goToPage(page - 1)} disabled={page === 0} style={{ padding: '.3rem .6rem', border: '1px solid #ddd', borderRadius: '6px', background: '#fff', cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? '.5' : '1' }}>
                {t('common.previous')}
              </button>
              <span style={{ fontSize: '.85rem', color: '#888' }}>{page + 1} / {totalPages}</span>
              <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages - 1} style={{ padding: '.3rem .6rem', border: '1px solid #ddd', borderRadius: '6px', background: '#fff', cursor: page >= totalPages - 1 ? 'default' : 'pointer', opacity: page >= totalPages - 1 ? '.5' : '1' }}>
                {t('common.next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
