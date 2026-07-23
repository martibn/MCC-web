import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const CATEGORIES = [
  'RESTAURANT',
  'BAR',
  'CAFETERIA',
  'BUTCHER',
  'SUPERMARKET',
  'BAZAAR',
  'OTHER',
];

export default function AddPointPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [category, setCategory] = useState('RESTAURANT');
  const [error, setError] = useState('');

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/locations', {
        name,
        address,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        category,
      });
      navigate('/');
    } catch {
      setError('Error adding location');
    }
  };

  return (
    <div>
      <h1>{t('map.addPointTitle')}</h1>
      {error && <p>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>{t('point.name')}</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>{t('point.address')}</label>
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required />
        </div>
        <div>
          <label>Lat</label>
          <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} required />
        </div>
        <div>
          <label>Lng</label>
          <input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} required />
        </div>
        <div>
          <label>{t('point.category')}</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{t(`category.${cat}`)}</option>
            ))}
          </select>
        </div>
        <button type="submit">{t('common.save')}</button>
      </form>
    </div>
  );
}
