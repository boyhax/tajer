import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Heart, 
  ChevronRight, 
  Navigation, 
  MapPin, 
  CheckCircle2, 
  Search, 
  ArrowRight,
  X
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage, useLocation } from '../../contexts';
import { config } from '../../lib/config';

// Fix Leaflet marker icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeModal = ({ isOpen, onClose }: WelcomeModalProps) => {
  const { t, lang } = useLanguage();
  const { setLocation, setAddress } = useLocation();
  const [step, setStep] = useState(1);
  const [tempLocation, setTempLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [tempAddress, setTempAddress] = useState('');
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await response.json();
      if (data.display_name) {
        setTempAddress(data.display_name);
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        const newLoc = { lat: latitude, lng: longitude };
        setTempLocation(newLoc);
        reverseGeocode(latitude, longitude);
        if (mapInstance) {
          mapInstance.setView([latitude, longitude], 16);
        }
      });
    }
  };

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        const newLoc = { lat: e.latlng.lat, lng: e.latlng.lng };
        setTempLocation(newLoc);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      },
    });
    return tempLocation ? <Marker position={[tempLocation.lat, tempLocation.lng]} /> : null;
  };

  const handleConfirm = () => {
    if (tempLocation && tempAddress) {
      setLocation(tempLocation);
      setAddress(tempAddress);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.8, y: 100 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white rounded-[3rem] w-full max-w-xl h-[85vh] overflow-hidden shadow-[0_0_150px_rgba(0,0,0,0.8)] flex flex-col border border-white/20"
      >
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex-1 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden"
            >
              {/* Animated Background Gradients */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                    x: [0, 50, 0],
                    y: [0, -50, 0]
                  }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute -top-1/2 -left-1/2 w-full h-full bg-emerald-500/10 rounded-full blur-[120px]" 
                />
                <motion.div 
                  animate={{ 
                    scale: [1, 1.3, 1],
                    rotate: [0, -120, 0],
                    x: [0, -80, 0],
                    y: [0, 80, 0]
                  }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-emerald-600/10 rounded-full blur-[120px]" 
                />
              </div>

              <motion.div 
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 12 }}
                transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.2 }}
                className="w-40 h-40 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-[3rem] flex items-center justify-center mb-12 shadow-[0_20px_60px_rgba(16,185,129,0.4)] relative z-10"
              >
                <ShoppingBag className="w-20 h-20" />
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-4 -right-4 w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-xl"
                >
                  <Heart className="w-6 h-6 text-emerald-400 fill-emerald-400" />
                </motion.div>
              </motion.div>

              <div className="relative z-10 space-y-6">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-6xl font-black tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-b from-black to-gray-600"
                >
                  {t({ en: 'KUZAMA', ar: 'خوزاما' })}
                </motion.h2>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-gray-400 text-xl max-w-xs mx-auto font-medium leading-relaxed"
                >
                  {t({ 
                    en: 'Experience the future of local grocery shopping.', 
                    ar: 'اختبر مستقبل تسوق البقالة المحلية.' 
                  })}
                </motion.p>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="w-full mt-16"
              >
                <button 
                  onClick={() => setStep(2)}
                  className="group relative w-full bg-black text-white py-8 rounded-[2.5rem] font-black text-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-2xl overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-4">
                    {t({ en: 'GET STARTED', ar: 'ابدأ الآن' })}
                    <ChevronRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div 
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col relative"
            >
              {/* Full Modal Map */}
              <div className="absolute inset-0 z-0">
                <MapContainer 
                  center={[tempLocation?.lat || config.map.defaultCenter.lat, tempLocation?.lng || config.map.defaultCenter.lng]} 
                  zoom={config.map.defaultZoom} 
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                  ref={setMapInstance}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapEvents />
                </MapContainer>
              </div>

              {/* Glass Overlays */}
              <div className="relative z-10 flex flex-col h-full pointer-events-none">
                {/* Top Bar */}
                <div className="p-8 pt-12 bg-gradient-to-b from-white via-white/80 to-transparent">
                  <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <h3 className="text-4xl font-black tracking-tight mb-1">
                        {t({ en: 'WHERE TO?', ar: 'إلى أين؟' })}
                      </h3>
                      <p className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em]">
                        {t({ en: 'Pin your delivery address', ar: 'حدد عنوان التوصيل الخاص بك' })}
                      </p>
                    </div>
                    <button 
                      onClick={handleLocateMe}
                      className="pointer-events-auto w-14 h-14 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-black hover:bg-emerald-500 hover:text-white transition-all active:scale-90 border border-gray-100"
                    >
                      <Navigation className="w-6 h-6" />
                    </button>
                  </motion.div>
                </div>

                {/* Bottom Controls Overlay */}
                <div className="mt-auto p-8 pb-12 space-y-6 pointer-events-auto">
                  {/* Floating Location Info */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white/90 backdrop-blur-2xl p-6 rounded-[2.5rem] shadow-2xl border border-white/50"
                  >
                    <div className="flex gap-6 items-start">
                      <div className="w-16 h-16 bg-emerald-500 rounded-[1.5rem] flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/30">
                        <MapPin className="w-8 h-8" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
                          {t({ en: 'DELIVERY ADDRESS', ar: 'عنوان التوصيل' })}
                        </h4>
                        <p className="text-lg font-bold text-gray-900 truncate leading-tight">
                          {isSearching ? t({ en: 'Locating...', ar: 'جاري التحديد...' }) : (tempAddress || t({ en: 'Tap map to select', ar: 'اضغط على الخريطة للاختيار' }))}
                        </p>
                      </div>
                    </div>

                    <button 
                      disabled={!tempLocation || isSearching}
                      onClick={handleConfirm}
                      className="w-full mt-8 bg-black text-white py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-xl"
                    >
                      {t({ en: 'CONFIRM LOCATION', ar: 'تأكيد الموقع' })}
                      <ArrowRight className="w-6 h-6" />
                    </button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
