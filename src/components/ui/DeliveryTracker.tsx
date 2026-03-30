import React, { useState, useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Truck, MapPin } from 'lucide-react';

// Custom icons for tracking
const driverIcon = L.divIcon({
  html: `<div class="bg-emerald-500 p-2 rounded-full shadow-lg border-2 border-white text-white"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-truck"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg></div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const destinationIcon = L.divIcon({
  html: `<div class="bg-black p-2 rounded-full shadow-lg border-2 border-white text-white"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

export const DeliveryTracker = ({ driverId, destinationCoords }: { driverId: string, destinationCoords?: { lat: number, lng: number } }) => {
  const [driverLocation, setDriverLocation] = useState<{ lat: number, lng: number } | null>(null);

  useEffect(() => {
    if (!driverId) return;
    const unsub = onSnapshot(doc(db, 'drivers', driverId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.currentLocation) {
          setDriverLocation(data.currentLocation);
        }
      }
    });
    return unsub;
  }, [driverId]);

  if (!driverLocation) return (
    <div className="h-64 bg-gray-50 rounded-3xl flex items-center justify-center flex-col gap-4">
      <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Connecting to driver GPS...</p>
    </div>
  );

  return (
    <div className="h-96 rounded-3xl overflow-hidden border border-gray-100 shadow-inner relative">
      <MapContainer 
        center={[driverLocation.lat, driverLocation.lng]} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
          <Popup>Driver is here</Popup>
        </Marker>
        {destinationCoords && (
          <Marker position={[destinationCoords.lat, destinationCoords.lng]} icon={destinationIcon}>
            <Popup>Your Location</Popup>
          </Marker>
        )}
      </MapContainer>
      
      <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg z-[1000] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Status</p>
            <p className="text-sm font-bold text-emerald-600">On the way to you</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Est. Arrival</p>
          <p className="text-sm font-bold">8-12 mins</p>
        </div>
      </div>
    </div>
  );
};
