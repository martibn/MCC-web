import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
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
    html: `<svg width="28" height="40" viewBox="0 0 28 40" fill="${color}" xmlns="http://www.w3.org/2000/svg"><path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 12.5 24.2 13.2 25 .3.4.8.6 1.3.6h-.4c.5 0 1-.2 1.3-.6C15.5 38.2 28 24.5 28 14 28 6.3 21.7 0 14 0zm0 20c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z"/></svg>`,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  });
}

const ICON_CACHE = {};
function getIcon(category) {
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.OTHER;
  if (!ICON_CACHE[color]) ICON_CACHE[color] = createIcon(color);
  return ICON_CACHE[color];
}

function LocationMarker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
}

function MapFlyTo({ target, onArrived }) {
  const map = useMap();
  const onArrivedRef = useRef(onArrived);
  onArrivedRef.current = onArrived;

  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], 17, { duration: 1.2 });
      const timer = setTimeout(() => {
        if (onArrivedRef.current) onArrivedRef.current();
      }, 1300);
      return () => clearTimeout(timer);
    }
  }, [map, target]);
  return null;
}

function NominatimSearch({ query, setQuery, onSelectResult, skipNextSearch }) {
  const { t } = useTranslation();
  const timer = useRef(null);

  const search = useCallback(async (q) => {
    if (q.length < 3) {
      onSelectResult([]);
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=es`
      );
      const data = await res.json();
      onSelectResult(data);
    } catch {
      onSelectResult([]);
    }
  }, [onSelectResult]);

  useEffect(() => {
    if (skipNextSearch && skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(query), 400);
    return () => clearTimeout(timer.current);
  }, [query, search, skipNextSearch]);

  return (
    <input
      type="text"
      placeholder={t('map.search')}
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}

function sortAcceptances(accs) {
  if (!accs) return [];
  return [...accs].sort((a, b) => {
    if (a.works && !b.works) return -1;
    if (!a.works && b.works) return 1;
    return 0;
  });
}

export default function MapPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [cardTypeFilter, setCardTypeFilter] = useState('');
  const [showNonWorking, setShowNonWorking] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [formData, setFormData] = useState({ name: '', address: '', categories: [], acceptances: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [flyTarget, setFlyTarget] = useState(null);
  const [tempMarker, setTempMarker] = useState(null);
  const searchOverlayRef = useRef(null);
  const tempMarkerRef = useRef(null);
  const skipSearchRef = useRef(false);

  useEffect(() => {
    if (searchResults.length === 0) return;
    const handleClick = (e) => {
      if (searchOverlayRef.current && !searchOverlayRef.current.contains(e.target)) {
        const searchInput = document.querySelector('.search-box input');
        if (searchInput && !searchInput.contains(e.target)) {
          setSearchResults([]);
        }
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [searchResults]);

  const fetchLocations = useCallback(async () => {
    try {
      const { data } = await api.get('/locations');
      setLocations(Array.isArray(data) ? data : []);
    } catch {
      setLocations([]);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleNominatimSelect = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setSelectedPosition({ lat, lng });
    setFormData((prev) => ({ ...prev, address: result.display_name }));
    setFlyTarget({ lat, lng });
    setSearchResults([]);
    skipSearchRef.current = true;
    setSearchQuery(result.display_name);
    setTempMarker({ lat, lng, name: result.display_name.split(',')[0], address: result.display_name });
  };

  const handleSearchSelect = (item) => {
    handleNominatimSelect(item);
  };

  const toggleCategory = (cat) => {
    setCategoryFilter((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleMapClick = (latlng) => {
    setSelectedPosition(latlng);
    setTempMarker(null);
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
        categories: formData.categories,
      });
      if (formData.acceptances.length > 0) {
        await Promise.all(
          formData.acceptances.map((acc) =>
            api.post(`/locations/${data.id}/acceptances`, { card_type: acc.cardType, works: acc.works })
          )
        );
      }
      setSelectedPosition(null);
      setFormData({ name: '', address: '', categories: [], acceptances: [] });
      setTempMarker(null);
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

  const filteredLocations = (Array.isArray(locations) ? locations : []).filter((loc) => {
    const locCats = loc.categories || [];
    if (categoryFilter.length > 0 && !categoryFilter.some((c) => locCats.includes(c))) return false;
    if (cardTypeFilter) {
      const hasWorking = loc.acceptances?.some((a) => a.cardType === cardTypeFilter && a.works);
      if (!hasWorking) return false;
    } else if (!showNonWorking) {
      const hasWorking = loc.acceptances?.some((a) => a.works);
      if (!hasWorking) return false;
    }
    return true;
  });

  return (
    <div className="map-page">
      <div className="toolbar">
        <div className="search-box">
          <NominatimSearch query={searchQuery} setQuery={setSearchQuery} onSelectResult={setSearchResults} skipNextSearch={skipSearchRef} />
        </div>

        <div className="category-pills">
          {Object.keys(CATEGORY_COLORS).map((cat) => (
            <button
              key={cat}
              className={`category-pill ${categoryFilter.includes(cat) ? 'active' : ''}`}
              style={{ '--cat-color': CATEGORY_COLORS[cat] }}
              onClick={() => toggleCategory(cat)}
            >
              {t(`category.${cat}`)}
            </button>
          ))}
        </div>

        <div className="filters">
        <select value={cardTypeFilter} onChange={(e) => setCardTypeFilter(e.target.value)}>
          <option value="">{t('map.filterAll')}</option>
          <option value="PAYFLOW">Payflow</option>
          <option value="FLEXOH">Flexoh</option>
        </select>
        <label>
          <input type="checkbox" checked={showNonWorking} onChange={(e) => setShowNonWorking(e.target.checked)} />
          {t('map.showNonWorking')}
        </label>
      </div>
      </div>

      <div className="map-wrap">
        <MapContainer center={[41.9844, 2.8244]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker onLocationSelect={handleMapClick} />
          <MapFlyTo target={flyTarget} onArrived={() => {
            if (tempMarkerRef.current) {
              tempMarkerRef.current.openPopup();
            }
          }} />
          {filteredLocations.map((loc) => {
            const cats = loc.categories || [];
            const firstCat = cats[0] || 'OTHER';
            return (
            <Marker
              key={loc.id}
              position={[loc.lat, loc.lng]}
              icon={getIcon(firstCat)}
            >
              <Popup>
                <div className="popup-card">
                  <div className="popup-header" style={{ borderLeftColor: CATEGORY_COLORS[firstCat] || CATEGORY_COLORS.OTHER }}>
                    <strong>{loc.name}</strong>
                  </div>
                  <p className="popup-dir">{loc.address}</p>
                  <div className="popup-cats">
                    {cats.map((cat) => (
                      <span key={cat} className="popup-cat" style={{ background: CATEGORY_COLORS[cat] || CATEGORY_COLORS.OTHER }}>
                        {t(`category.${cat}`)}
                      </span>
                    ))}
                  </div>
                  <div className="popup-cards">
                    {loc.acceptances && loc.acceptances.length > 0 ? (
                      sortAcceptances(loc.acceptances).map((acc) => (
                        <span key={acc.id} className={`card-badge ${acc.cardType === 'PAYFLOW' ? 'payflow' : 'flexoh'} ${acc.works ? 'works' : 'fails'}`}>
                          {acc.cardType} {acc.works ? '\u2713' : '\u2717'}
                        </span>
                      ))
                    ) : (
                      <span className="card-badge no-data">{t('point.noCards')}</span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
            );
          })}
          {tempMarker && (
            <Marker
              ref={tempMarkerRef}
              key={`temp-${tempMarker.lat}-${tempMarker.lng}`}
              position={[tempMarker.lat, tempMarker.lng]}
              icon={getIcon('RESTAURANT')}
            >
              <Popup>
                <div className="popup-card">
                  <div className="popup-header" style={{ borderLeftColor: CATEGORY_COLORS.RESTAURANT }}>
                    <strong>{tempMarker.name}</strong>
                  </div>
                  <p className="popup-dir">{tempMarker.address}</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
        {searchResults.length > 0 && (
          <div className="search-results-overlay" ref={searchOverlayRef}>
            <ul>
              {searchResults.map((item, idx) => (
                <li key={item.osm_id ?? idx} onClick={() => handleSearchSelect(item)}>
                  <span className="result-name">{item.display_name.split(',')[0]}</span>
                  <span className="result-full">{item.display_name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {selectedPosition && user && (
        <form onSubmit={handleAddPoint} className="add-point-form">
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
            <div className="checkbox-group">
              {Object.keys(CATEGORY_COLORS).map((cat) => (
                <label key={cat}>
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(cat)}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        categories: prev.categories.includes(cat)
                          ? prev.categories.filter((c) => c !== cat)
                          : [...prev.categories, cat],
                      }))
                    }
                  />
                  {t(`category.${cat}`)}
                </label>
              ))}
            </div>
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
          <div className="form-actions">
            <button type="submit" className="btn-save">{t('common.save')}</button>
            <button type="button" className="btn-cancel" onClick={() => { setSelectedPosition(null); setTempMarker(null); }}>{t('common.cancel')}</button>
          </div>
        </form>
      )}
    </div>
  );
}
