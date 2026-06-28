import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SearchInput } from './SearchInput';

export interface LocationResult {
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  place_id: string;
  landmark: string;
}

interface LocationPickerProps {
  value: LocationResult | null;
  onChange: (loc: LocationResult) => void;
}

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const OVERPASS = 'https://overpass-api.de/api/interpreter';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DARK_TILES = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
const DARK_ATTR = '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>';
const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946];

async function nominatimSearch(q: string): Promise<Array<{ display_name: string; lat: string; lon: string }>> {
  if (q.length < 3) return [];
  const res = await fetch(`${NOMINATIM}/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`, {
    headers: { 'User-Agent': 'ShadowNet/1.0 (emergency response)' },
  });
  if (!res.ok) return [];
  return res.json();
}

async function nominatimReverse(lat: number, lng: number): Promise<{ display_name: string; address: Record<string, string> } | null> {
  const res = await fetch(`${NOMINATIM}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`, {
    headers: { 'User-Agent': 'ShadowNet/1.0 (emergency response)' },
  });
  if (!res.ok) return null;
  return res.json();
}

async function overpassNearby(lat: number, lng: number): Promise<string[]> {
  const query = `[out:json];
    (
      node["amenity"="fire_station"](around:3000,${lat},${lng});
      node["amenity"="hospital"](around:3000,${lat},${lng});
      node["amenity"="police"](around:3000,${lat},${lng});
      node["amenity"="school"](around:3000,${lat},${lng});
    );
    out center 5;`;
  try {
    const res = await fetch(OVERPASS, { method: 'POST', body: `data=${encodeURIComponent(query)}`, headers: { 'User-Agent': 'ShadowNet/1.0' } });
    if (!res.ok) return [];
    const data = await res.json();
    const tags: string[] = [];
    for (const el of data.elements || []) {
      const t = el.tags?.amenity || '';
      const name = el.tags?.name || `${t} nearby`;
      const label = t ? `${t.replace('_', ' ')}: ${name}` : name;
      if (!tags.includes(label)) tags.push(label);
    }
    return tags.slice(0, 8);
  } catch { return []; }
}

function toLocationResult(data: { display_name: string; address?: Record<string, string> }, lat: number, lng: number, placeId: string): LocationResult {
  const a = data.address || {};
  return {
    address: data.display_name,
    latitude: lat, longitude: lng,
    city: a.city || a.town || a.village || a.municipality || a.county || '',
    state: a.state || '',
    country: a.country || '',
    postal_code: a.postcode || '',
    place_id: placeId,
    landmark: a.neighbourhood || a.suburb || a.attraction || '',
  };
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <span key={i} className="text-ink font-medium">{part}</span>
      : <span key={i} className="text-ink-400">{part}</span>
  );
}

function DraggableMarker({ position, onMove }: { position: [number, number]; onMove: (lat: number, lng: number) => void }) {
  const markerRef = useRef<L.Marker>(null);
  return <Marker ref={markerRef} position={position} draggable={true} eventHandlers={{ dragend() { const m = markerRef.current; if (m) { const p = m.getLatLng(); onMove(p.lat, p.lng); } } }} />;
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onClick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [map, center]);
  return null;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [center, setCenter] = useState<[number, number]>(value?.latitude ? [value.latitude, value.longitude] : DEFAULT_CENTER);
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(value?.latitude ? [value.latitude, value.longitude] : null);
  const [searchText, setSearchText] = useState(value?.address || '');
  const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [nearby, setNearby] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => { return () => { if (debounceRef.current) clearTimeout(debounceRef.current); }; }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = useCallback(async (text: string) => {
    setSearchText(text);
    setActiveIndex(-1);
    if (text.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    setSearching(true);
    const results = await nominatimSearch(text);
    setSuggestions(results);
    setShowSuggestions(results.length > 0);
    setSearching(false);
  }, []);

  const selectSuggestion = useCallback(async (s: { display_name: string; lat: string; lon: string }) => {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setSearchText(s.display_name);
    setShowSuggestions(false);
    setActiveIndex(-1);
    setCenter([lat, lng]);
    setMarkerPos([lat, lng]);
    const rev = await nominatimReverse(lat, lng);
    if (rev) {
      const loc = toLocationResult(rev, lat, lng, `${lat},${lng}`);
      onChange(loc);
      overpassNearby(lat, lng).then(setNearby).catch(() => {});
    }
  }, [onChange]);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setMarkerPos([lat, lng]);
    setCenter([lat, lng]);
    const rev = await nominatimReverse(lat, lng);
    if (rev) {
      setSearchText(rev.display_name);
      const loc = toLocationResult(rev, lat, lng, `${lat},${lng}`);
      onChange(loc);
      overpassNearby(lat, lng).then(setNearby).catch(() => {});
    }
  }, [onChange]);

  const handleMarkerDrag = useCallback(async (lat: number, lng: number) => {
    setCenter([lat, lng]);
    const rev = await nominatimReverse(lat, lng);
    if (rev) {
      setSearchText(rev.display_name);
      const loc = toLocationResult(rev, lat, lng, `${lat},${lng}`);
      onChange(loc);
      overpassNearby(lat, lng).then(setNearby).catch(() => {});
    }
  }, [onChange]);

  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocating(false);
        setMarkerPos([lat, lng]);
        setCenter([lat, lng]);
        const rev = await nominatimReverse(lat, lng);
        if (rev) {
          setSearchText(rev.display_name);
          const loc = toLocationResult(rev, lat, lng, `${lat},${lng}`);
          onChange(loc);
          overpassNearby(lat, lng).then(setNearby).catch(() => {});
        }
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  return (
    <div className="space-y-3">

      {/* Search row */}
      <div ref={containerRef} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchInput
              value={searchText}
              onChange={(v) => {
                setSearchText(v);
                if (debounceRef.current) clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => handleSearch(v), 400);
              }}
              onClear={() => { setSuggestions([]); setShowSuggestions(false); setActiveIndex(-1); }}
              placeholder="Search for a location…"
              loading={searching}
              onKeyDown={handleKeyDown}
              icon={
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              }
            />
            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div ref={suggestionsRef} className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-border shadow-lg max-h-56 overflow-y-auto">
                <ul ref={listRef} role="listbox" className="py-1">
                  {suggestions.map((s, i) => (
                    <li key={i} role="option" aria-selected={i === activeIndex}>
                      <button
                        type="button"
                        onClick={() => selectSuggestion(s)}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors duration-75 ${
                          i === activeIndex ? 'bg-surface-200 text-ink' : 'text-ink-400'
                        }`}
                      >
                        {highlightMatch(s.display_name, searchText)}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleMyLocation}
            disabled={locating}
            className="btn-secondary btn-sm shrink-0 min-w-[100px]"
          >
            {locating ? (
              <span className="flex items-center gap-1.5">
                <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Locating
              </span>
            ) : 'My Location'}
          </button>
        </div>
      </div>

      {/* Selected location badge */}
      {value && value.address && (
        <div className="flex items-center gap-2 bg-surface-200 border border-border px-3 py-2">
          <svg className="w-3 h-3 text-safe shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span className="text-[12px] text-ink-300 truncate">{value.address}</span>
        </div>
      )}

      {/* Map */}
      <div className="h-64 border border-border">
        <MapContainer center={center} zoom={13} className="h-full w-full" zoomControl={true}>
          <TileLayer url={DARK_TILES} attribution={DARK_ATTR} />
          <ClickHandler onClick={handleMapClick} />
          {markerPos && (
            <>
              <DraggableMarker position={markerPos} onMove={handleMarkerDrag} />
              <MapCenter center={markerPos} />
            </>
          )}
        </MapContainer>
      </div>

      {/* Coordinates */}
      {markerPos && (
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span className="text-[10px] font-mono text-ink-500">Lat {markerPos[0].toFixed(6)}</span>
          <span className="text-[10px] font-mono text-ink-500">Lng {markerPos[1].toFixed(6)}</span>
          {value?.city && <span className="text-[10px] font-mono text-ink-500">{value.city}</span>}
          {value?.state && <span className="text-[10px] font-mono text-ink-500">{value.state}</span>}
          {value?.country && <span className="text-[10px] font-mono text-ink-500">{value.country}</span>}
          {value?.postal_code && <span className="text-[10px] font-mono text-ink-500">{value.postal_code}</span>}
        </div>
      )}

      {/* Nearby */}
      {nearby.length > 0 && (
        <div>
          <p className="text-[10px] font-mono text-ink-500 uppercase tracking-[0.08em] mb-1">Nearby</p>
          <div className="flex flex-wrap gap-1.5">
            {nearby.map((n, i) => (
              <span key={i} className="text-[10px] font-mono text-ink-400 bg-surface-200 border border-border px-2 py-0.5">{n}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
