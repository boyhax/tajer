import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialCoords: { lat: number, lng: number } | null;
  t: (ls: any) => string;
  className?: string;
}

export const MapPicker = ({ onLocationSelect, initialCoords, t, className = "h-64" }: MapPickerProps) => {
  const [position, setPosition] = useState<{ lat: number, lng: number } | null>(initialCoords);
  
  const MapEvents = () => {
    const map = useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition({ lat, lng });
        onLocationSelect(lat, lng);
      },
    });

    useEffect(() => {
      if (initialCoords) {
        setPosition(initialCoords);
        map.setView([initialCoords.lat, initialCoords.lng], map.getZoom());
      }
    }, [initialCoords, map]);

    return null;
  };

  return (
    <div className={`${className} w-full rounded-2xl overflow-hidden border border-gray-100 shadow-inner relative z-0`}>
      <MapContainer 
        center={position ? [position.lat, position.lng] : [24.7136, 46.6753]} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapEvents />
        {position && (
          <Marker position={[position.lat, position.lng]}>
            <Popup>{t({ en: 'Delivery Location', ar: 'موقع التوصيل' })}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};
