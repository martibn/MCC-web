import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const CATEGORY_COLORS = {
  RESTAURANT: '#e74c3c',
  BAR: '#8e44ad',
  CAFETERIA: '#f39c12',
  BUTCHER: '#e67e22',
  SUPERMARKET: '#2ecc71',
  BAZAAR: '#3498db',
  OTHER: '#95a5a6',
};

function createIcon(color) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"/></svg>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

function LocationMarker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
}

function NominatimSearch({ onSelect }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const timer = useRef(null);

  const search = useCallback(async (q) => {
    if (q.length < 3) {
      setResults([]);
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=es`
      );
      const data = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    }
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(query), 400);
    return () => clearTimeout(timer.current);
  }, [query, search]);

  const handleSelect = (item) => {
    setQuery(item.display_name);
    setResults([]);
    onSelect({ lat: parseFloat(item.lat), lng: parseFloat(item.lon), address: item.display_name });
  };

  return (
    <div>
      <input
        type="text"
        placeholder={t('map.search')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.length > 0 && (
        <ul>
          {results.map((item) => (
            <li key={item.osm_id} onClick={() => handleSelect(item)}>
              {item.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MapPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [cardTypeFilter, setCardTypeFilter] = useState('');
  const [worksFilter, setWorksFilter] = useState('');
  const [showNonWorking, setShowNonWorking] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [formData, setFormData] = useState({ name: '', address: '', category: 'RESTAURANT', acceptances: [] });
  const [searchResult, setSearchResult] = useState(null);

  const fetchLocations = useCallback(async () => {
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (cardTypeFilter) params.card_type = cardTypeFilter;
      if (worksFilter) params.works = worksFilter;
      const { data } = await api.get('/locations', { params });
      setLocations(data);
    } catch {
      setLocations([]);
    }
  }, [categoryFilter, cardTypeFilter, worksFilter]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleNominatimSelect = (result) => {
    setSearchResult(result);
    setSelectedPosition({ lat: result.lat, lng: result.lng });
    setFormData((prev) => ({ ...prev, address: result.address }));
  };

  const handleMapClick = (latlng) => {
    setSelectedPosition(latlng);
  };

  const handleAddPoint = async (e) => {
    e.preventDefault();
    if (!selectedPosition || !user) return;
    try {
      const { data } = await api.post('/locations', {
        name: formData.name,
        address: formData.address,
        lat: selectedPosition.lat,
        lng: selectedPosition.lng,
        category: formData.category,
      });
      if (formData.acceptances.length > 0) {
        await Promise.all(
          formData.acceptances.map((acc) =>
            api.post(`/locations/${data.id}/acceptances`, { card_type: acc.cardType, works: acc.works })
          )
        );
      }
      setSelectedPosition(null);
      setFormData({ name: '', address: '', category: 'RESTAURANT', acceptances: [] });
      setSearchResult(null);
      fetchLocations();
    } catch {
      // handle error
    }
  };

  const toggleAcceptance = (cardType) => {
    setFormData((prev) => {
      const exists = prev.acceptances.find((a) => a.cardType === cardType);
      if (exists) {
        return { ...prev, acceptances: prev.acceptances.filter((a) => a.cardType !== cardType) };
      }
      return { ...prev, acceptances: [...prev.acceptances, { cardType, works: true }] };
    });
  };

  const filteredLocations = locations.filter((loc) => {
    if (!showNonWorking) {
      const hasWorking = loc.acceptances?.some((a) => a.works);
      if (!hasWorking) return false;
    }
    return true;
  });

  return (
    <div>
      <div>
        <NominatimSearch onSelect={handleNominatimSelect} />
      </div>

      <div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">{t('map.filterAll')}</option>
          {Object.keys(CATEGORY_COLORS).map((cat) => (
            <option key={cat} value={cat}>{t(`category.${cat}`)}</option>
          ))}
        </select>
        <select value={cardTypeFilter} onChange={(e) => setCardTypeFilter(e.target.value)}>
          <option value="">{t('map.filterAll')}</option>
          <option value="PAYFLOW">Payflow</option>
          <option value="FLEXOH">Flexoh</option>
        </select>
        <select value={worksFilter} onChange={(e) => setWorksFilter(e.target.value)}>
          <option value="">{t('map.filterAll')}</option>
          <option value="true">{t('map.filterYes')}</option>
          <option value="false">{t('map.filterNo')}</option>
        </select>
        <label>
          <input type="checkbox" checked={showNonWorking} onChange={(e) => setShowNonWorking(e.target.checked)} />
          {t('map.showNonWorking')}
        </label>
      </div>

      <MapContainer center={[41.3874, 2.1686]} zoom={12} style={{ height: '500px', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker onLocationSelect={handleMapClick} />
        {filteredLocations.map((loc) => (
          <Marker
            key={loc.id}
            position={[loc.lat, loc.lng]}
            icon={createIcon(CATEGORY_COLORS[loc.serviceCategory] || CATEGORY_COLORS.OTHER)}
          >
            <Popup>
              <div>
                <strong>{loc.name}</strong>
                <p>{loc.address}</p>
                <p>{t(`category.${loc.serviceCategory}`)}</p>
                <div>
                  {loc.acceptances && loc.acceptances.length > 0 ? (
                    loc.acceptances.map((acc) => (
                      <p key={acc.id}>
                        {acc.cardType}: {acc.works ? t('point.works') : t('point.doesNotWork')}
                      </p>
                    ))
                  ) : (
                    <p>{t('point.noCards')}</p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {selectedPosition && user && (
        <form onSubmit={handleAddPoint}>
          <h2>{t('map.addPointTitle')}</h2>
          <div>
            <label>{t('point.name')}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label>{t('point.address')}</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              required
            />
          </div>
          <div>
            <label>{t('point.category')}</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
            >
              {Object.keys(CATEGORY_COLORS).map((cat) => (
                <option key={cat} value={cat}>{t(`category.${cat}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <p>{t('point.addAcceptance')}</p>
            <label>
              <input type="checkbox" checked={formData.acceptances.some((a) => a.cardType === 'PAYFLOW')} onChange={() => toggleAcceptance('PAYFLOW')} />
              Payflow
            </label>
            <label>
              <input type="checkbox" checked={formData.acceptances.some((a) => a.cardType === 'FLEXOH')} onChange={() => toggleAcceptance('FLEXOH')} />
              Flexoh
            </label>
          </div>
          <button type="submit">{t('common.save')}</button>
          <button type="button" onClick={() => setSelectedPosition(null)}>{t('common.cancel')}</button>
        </form>
      )}
    </div>
  );
}
