import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

export default function SuggestionModal({ onClose }) {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const altchaRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const altchaEl = altchaRef.current;
    const altchaPayload = altchaEl?.value;
    if (!altchaPayload) {
      setError(t('suggest.captchaRequired'));
      return;
    }

    setSending(true);
    try {
      await api.post('/suggestions', { message, altchaPayload });
      if (altchaEl) altchaEl.value = '';
      setMessage('');
      onClose(true);
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => onClose(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{t('suggest.title')}</h2>
        <p className="modal-desc">{t('suggest.description')}</p>
        <form onSubmit={handleSubmit}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('suggest.placeholder')}
            rows={4}
            required
          />
          <div className="altcha-wrapper">
            <altcha-widget
              ref={altchaRef}
              challenge={`${import.meta.env.VITE_API_URL || '/api'}/altcha/challenge`}
              auto="onload"
              type="checkbox"
              workers="4"
            />
          </div>
          {error && <p className="error">{error}</p>}
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => onClose(false)}>{t('common.cancel')}</button>
            <button type="submit" className="btn-save" disabled={sending}>
              {sending ? t('common.sending') : t('common.send')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
