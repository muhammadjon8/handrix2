import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons broken by Vite's asset bundling
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const handymanIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export interface MapPin {
  lat: number;
  lng: number;
  label: string;
  type?: 'default' | 'handyman';
}

interface Props {
  center: [number, number];
  zoom?: number;
  pins?: MapPin[];
  className?: string;
}

// Recenters the map when center/zoom props change.
// try-catch guards against the case where the Leaflet map instance has
// already been torn down before this effect fires (React 19 StrictMode, route changes).
function RecenterMap({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    try {
      map.setView(center, zoom);
    } catch {
      // Map container was detached — safe to ignore
    }
  }, [center, zoom, map]);
  return null;
}

// Manages markers imperatively via Leaflet's JS API instead of using
// react-leaflet's <Marker> component. This avoids the
// "Cannot read properties of undefined (reading '_leaflet_events')" crash
// that occurs when react-leaflet tries to call map.removeLayer() on a marker
// whose icon DOM element React has already removed from the tree.
function PinsLayer({ pins }: { pins: MapPin[] }) {
  const map = useMap();
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    // Clear previous markers
    markersRef.current.forEach((m) => {
      try { map.removeLayer(m); } catch { /* map already torn down */ }
    });
    markersRef.current = [];

    // Add new markers
    pins.forEach((pin) => {
      try {
        const marker = L.marker([pin.lat, pin.lng], {
          icon: pin.type === 'handyman' ? handymanIcon : new L.Icon.Default(),
        });
        marker.bindPopup(pin.label);
        marker.addTo(map);
        markersRef.current.push(marker);
      } catch { /* map not ready */ }
    });

    return () => {
      markersRef.current.forEach((m) => {
        try { map.removeLayer(m); } catch { /* map already torn down */ }
      });
      markersRef.current = [];
    };
  }, [pins, map]);

  return null;
}

export function MapEmbed({ center, zoom = 14, pins = [], className = 'h-64 w-full rounded-xl' }: Props) {
  return (
    <div aria-label="Map" role="region" className={className}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <RecenterMap center={center} zoom={zoom} />
        <PinsLayer pins={pins} />
      </MapContainer>
    </div>
  );
}
