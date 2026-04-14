import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapEmbed } from '../../../components/MapEmbed';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationState {
  categoryId: string;
  categoryName: string;
}

const DEFAULT_CENTER: [number, number] = [51.505, -0.09];

export default function BookLocationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [description, setDescription] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [searchError, setSearchError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchNominatim = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setSearchError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`,
        { headers: { 'User-Agent': 'Handrix/1.0' } }
      );
      if (!res.ok) throw new Error('Search failed');
      const results: NominatimResult[] = await res.json();
      setSuggestions(results);
      setSuggestionsOpen(true);
    } catch {
      setSearchError('Address search unavailable. Please try again.');
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchNominatim(searchQuery), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, searchNominatim]);

  function handleSelectSuggestion(s: NominatimResult) {
    setSelectedLat(parseFloat(s.lat));
    setSelectedLng(parseFloat(s.lon));
    setSelectedAddress(s.display_name);
    setSearchQuery(s.display_name);
    setSuggestions([]);
    setSuggestionsOpen(false);
  }

  function handleUseMyLocation() {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setSelectedLat(latitude);
        setSelectedLng(longitude);
        // Reverse geocode
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { 'User-Agent': 'Handrix/1.0' } }
          );
          const data = await res.json();
          const addr = data.display_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          setSelectedAddress(addr);
          setSearchQuery(addr);
        } catch {
          const addr = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          setSelectedAddress(addr);
          setSearchQuery(addr);
        }
        setGeoLoading(false);
      },
      (err) => {
        setGeoError(err.message || 'Unable to retrieve your location.');
        setGeoLoading(false);
      },
      { timeout: 10000 }
    );
  }

  function handleContinue() {
    if (!selectedLat || !selectedLng || !state) return;
    navigate('/client/book/estimate', {
      state: {
        categoryId: state.categoryId,
        categoryName: state.categoryName,
        locationLat: selectedLat,
        locationLng: selectedLng,
        locationAddress: selectedAddress,
        description,
      },
    });
  }

  const mapCenter: [number, number] = selectedLat && selectedLng
    ? [selectedLat, selectedLng]
    : DEFAULT_CENTER;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="mb-6">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Step 2 of 4</p>
        <h1 className="text-2xl font-bold text-gray-900">Where is the job?</h1>
        <p className="text-sm text-gray-500 mt-1">
          {state?.categoryName ? `Service: ${state.categoryName}` : 'Set the job location'}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1.5 rounded-full flex-1 ${i <= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        ))}
      </div>

      <div className="space-y-4">
        {/* Use my location button */}
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={geoLoading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium rounded-xl hover:bg-blue-100 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition"
        >
          {geoLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Getting location…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Use my current location
            </>
          )}
        </button>

        {geoError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{geoError}</p>
        )}

        {/* Address search */}
        <div className="relative">
          <label htmlFor="address-search" className="block text-sm font-medium text-gray-700 mb-1.5">
            Or search for an address
          </label>
          <input
            id="address-search"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              // Reset selection if user edits address
              if (selectedAddress && e.target.value !== selectedAddress) {
                setSelectedLat(null);
                setSelectedLng(null);
                setSelectedAddress('');
              }
            }}
            onFocus={() => suggestions.length > 0 && setSuggestionsOpen(true)}
            onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
            placeholder="e.g. 123 Main St, New York"
            autoComplete="off"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />

          {suggestionsOpen && suggestions.length > 0 && (
            <ul
              role="listbox"
              className="absolute z-30 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 overflow-hidden"
            >
              {suggestions.map((s) => (
                <li
                  key={s.place_id}
                  role="option"
                  aria-selected={selectedAddress === s.display_name}
                  onMouseDown={() => handleSelectSuggestion(s)}
                  className="px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 truncate"
                >
                  {s.display_name}
                </li>
              ))}
            </ul>
          )}

          {searchError && (
            <p className="mt-1 text-xs text-red-600">{searchError}</p>
          )}
        </div>

        {/* Map preview */}
        {selectedLat && selectedLng && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500">Selected location</p>
            <MapEmbed
              center={mapCenter}
              zoom={15}
              pins={[{ lat: selectedLat, lng: selectedLng, label: selectedAddress || 'Job location' }]}
              className="h-52 w-full rounded-xl border border-gray-200"
            />
          </div>
        )}

        {/* Description */}
        <div>
          <label htmlFor="job-description" className="block text-sm font-medium text-gray-700 mb-1.5">
            Describe the job <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="job-description"
            rows={3}
            maxLength={300}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us more about what needs to be done…"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/300</p>
        </div>

        {/* Continue button */}
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selectedLat || !selectedLng}
          className="w-full py-3 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
