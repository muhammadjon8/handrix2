import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon in Vite/bundler environments
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

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center); }, [center, map]);
  return null;
}

export function MapEmbed({ center, zoom = 14, pins = [], className = 'h-64 w-full rounded-xl' }: Props) {
  return (
    <div aria-label="Map" role="region" className={className}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <RecenterMap center={center} />
        {pins.map((pin, i) => (
          <Marker
            key={i}
            position={[pin.lat, pin.lng]}
            icon={pin.type === 'handyman' ? handymanIcon : undefined}
          >
            <Popup>{pin.label}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
