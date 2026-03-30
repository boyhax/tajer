import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, ChevronRight, CheckCircle2 } from 'lucide-react';
import { MapPicker } from './MapPicker';

interface AddressDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: string, coords: { lat: number, lng: number } | null) => void;
  initialAddress: string;
  initialCoords: { lat: number, lng: number } | null;
  t: (ls: any) => string;
}

export const AddressDrawer = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialAddress, 
  initialCoords, 
  t 
}: AddressDrawerProps) => {
  const [address, setAddress] = useState(initialAddress);
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(initialCoords);

  useEffect(() => {
    if (isOpen) {
      setAddress(initialAddress);
      setCoords(initialCoords);
    }
  }, [isOpen, initialAddress, initialCoords]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();
      if (data.display_name) {
        setAddress(data.display_name);
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        reverseGeocode(latitude, longitude);
      }, (err) => {
        console.error(err);
        alert(t({ en: 'Could not get location', ar: 'تعذر الحصول على الموقع' }));
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="relative bg-white w-full max-w-2xl h-[85vh] sm:h-[80vh] rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Full Map Background */}
            <div className="absolute inset-0 z-0">
              <MapPicker 
                t={t}
                className="h-full"
                initialCoords={coords} 
                onLocationSelect={(lat, lng) => {
                  setCoords({ lat, lng });
                  reverseGeocode(lat, lng);
                }} 
              />
            </div>

            {/* Floating Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 z-10 p-3 bg-white/90 backdrop-blur-md rounded-full shadow-xl hover:bg-white transition-all border border-white/20"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Floating Location Button */}
            <button 
              onClick={getCurrentLocation}
              className="absolute top-6 left-6 z-10 p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl hover:bg-white transition-all border border-white/20 flex items-center gap-2 group"
            >
              <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-gray-900 pr-2">{t({ en: 'Current Location', ar: 'موقعي الحالي' })}</span>
            </button>

            {/* Floating Address Card */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-10">
              <div className="bg-white/95 backdrop-blur-xl rounded-2xl md:rounded-[32px] p-4 md:p-6 shadow-2xl border border-white/20 space-y-3 md:space-y-4">
                <div className="space-y-1 md:space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400">{t({ en: 'Delivery Address', ar: 'عنوان التوصيل' })}</label>
                    {coords && (
                      <span className="text-[8px] md:text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                      </span>
                    )}
                  </div>
                  <textarea 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t({ en: 'Tap map to select or enter address...', ar: 'اضغط على الخريطة أو أدخل العنوان...' })}
                    className="w-full p-3 md:p-4 bg-gray-50/50 rounded-xl md:rounded-2xl border border-gray-100 focus:ring-2 focus:ring-black min-h-[60px] md:min-h-[80px] text-xs md:text-sm resize-none"
                  />
                </div>

                <button 
                  onClick={() => {
                    onSave(address, coords);
                    onClose();
                  }}
                  className="w-full py-3 md:py-4 bg-black text-white rounded-xl md:rounded-2xl font-bold hover:bg-gray-900 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2 group text-sm md:text-base"
                >
                  <span>{t({ en: 'Confirm Delivery Location', ar: 'تأكيد موقع التوصيل' })}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
