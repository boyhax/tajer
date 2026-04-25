import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, ChevronRight, CheckCircle2, Building2, Map as MapIcon, Info } from 'lucide-react';
import { MapPicker } from './MapPicker';
import { useRegions } from '../../App';
import { AddressDetails } from '../../types';

interface AddressDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: string, coords: { lat: number, lng: number } | null, mode: 'normal' | 'map', details?: AddressDetails) => void;
  initialAddress: string;
  initialCoords: { lat: number, lng: number } | null;
  initialMode?: 'normal' | 'map';
  initialDetails?: AddressDetails;
  t: (ls: any) => string;
}

export const AddressDrawer = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialAddress, 
  initialCoords, 
  initialMode = 'map',
  initialDetails,
  t 
}: AddressDrawerProps) => {
  const [mode, setMode] = useState<'normal' | 'map'>(initialMode);
  const [address, setAddress] = useState(initialAddress);
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(initialCoords);
  const { regions } = useRegions();

  const [details, setDetails] = useState<AddressDetails>(initialDetails || {
    regionId: '',
    streetName: '',
    buildingNumber: '',
    floorNumber: '',
    apartmentNumber: '',
    additionalInstructions: ''
  });

  useEffect(() => {
    if (isOpen) {
      setAddress(initialAddress);
      setCoords(initialCoords);
      setMode(initialMode);
      if (initialDetails) setDetails(initialDetails);
    }
  }, [isOpen, initialAddress, initialCoords, initialMode, initialDetails]);

  // Update string address when details change in normal mode
  useEffect(() => {
    if (mode === 'normal') {
      const regionName = regions.find(r => r.id === details.regionId)?.name || '';
      const parts = [
        regionName,
        details.streetName ? `${t({ en: 'Street', ar: 'شارع' })}: ${details.streetName}` : '',
        details.buildingNumber ? `${t({ en: 'Building', ar: 'بناية' })}: ${details.buildingNumber}` : '',
        details.floorNumber ? `${t({ en: 'Floor', ar: 'طابق' })}: ${details.floorNumber}` : '',
        details.apartmentNumber ? `${t({ en: 'Apartment', ar: 'شقة' })}: ${details.apartmentNumber}` : '',
      ].filter(Boolean);
      setAddress(parts.join(', '));
    }
  }, [details, mode, regions, t]);

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
            className="relative bg-white w-full max-w-2xl h-[85vh] sm:h-[90vh] rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header / Mode Switcher */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between z-20 bg-white">
              <div className="flex bg-gray-100 p-1 rounded-2xl">
                <button 
                  onClick={() => setMode('map')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    mode === 'map' ? 'bg-white shadow-sm text-black' : 'text-gray-500'
                  }`}
                >
                  <MapIcon className="w-4 h-4" />
                  {t({ en: 'Map Picker', ar: 'تحديد من الخريطة' })}
                </button>
                <button 
                  onClick={() => setMode('normal')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    mode === 'normal' ? 'bg-white shadow-sm text-black' : 'text-gray-500'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  {t({ en: 'Normal Address', ar: 'عنوان عادي' })}
                </button>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 relative overflow-y-auto">
              {mode === 'map' ? (
                <>
                  {/* Full Map */}
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

                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl md:rounded-[32px] p-4 md:p-6 shadow-2xl border border-white/20 space-y-3 md:space-y-4">
                      <div className="space-y-1 md:space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400">{t({ en: 'Selected Address', ar: 'العنوان المختار' })}</label>
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
                          onSave(address, coords, 'map');
                          onClose();
                        }}
                        className="w-full py-3 md:py-4 bg-black text-white rounded-xl md:rounded-2xl font-bold hover:bg-gray-900 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2 group text-sm md:text-base"
                      >
                        <span>{t({ en: 'Confirm Map Location', ar: 'تأكيد موقع الخريطة' })}</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Normal Address Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">{t({ en: 'Region', ar: 'المنطقة' })}</label>
                      <select 
                        value={details.regionId}
                        onChange={(e) => setDetails({ ...details, regionId: e.target.value })}
                        className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-black text-sm outline-none"
                      >
                        <option value="">{t({ en: 'Select Region', ar: 'اختر المنطقة' })}</option>
                        {regions.map(region => (
                          <option key={region.id} value={region.id}>{region.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">{t({ en: 'Street Name', ar: 'اسم الشارع' })}</label>
                        <input 
                          type="text" 
                          value={details.streetName}
                          onChange={(e) => setDetails({ ...details, streetName: e.target.value })}
                          placeholder={t({ en: 'e.g. Al Khalidiyah St', ar: 'مثلاً شارع الخالدية' })}
                          className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-black text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">{t({ en: 'Building Number', ar: 'رقم البناية' })}</label>
                        <input 
                          type="text" 
                          value={details.buildingNumber}
                          onChange={(e) => setDetails({ ...details, buildingNumber: e.target.value })}
                          placeholder={t({ en: 'e.g. 12', ar: 'مثلاً 12' })}
                          className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-black text-sm outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">{t({ en: 'Floor Number', ar: 'رقم الطابق' })}</label>
                        <input 
                          type="text" 
                          value={details.floorNumber}
                          onChange={(e) => setDetails({ ...details, floorNumber: e.target.value })}
                          placeholder={t({ en: 'e.g. 3', ar: 'مثلاً 3' })}
                          className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-black text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">{t({ en: 'Apartment Number', ar: 'رقم الشقة' })}</label>
                        <input 
                          type="text" 
                          value={details.apartmentNumber}
                          onChange={(e) => setDetails({ ...details, apartmentNumber: e.target.value })}
                          placeholder={t({ en: 'e.g. 304', ar: 'مثلاً 304' })}
                          className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-black text-sm outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-gray-400 mb-1.5 block">{t({ en: 'Additional Instructions (Optional)', ar: 'تعليمات إضافية (اختياري)' })}</label>
                      <textarea 
                        value={details.additionalInstructions}
                        onChange={(e) => setDetails({ ...details, additionalInstructions: e.target.value })}
                        placeholder={t({ en: 'Near the supermarket, etc...', ar: 'بجانب السوبر ماركت، الخ...' })}
                        className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 focus:ring-2 focus:ring-black text-sm outline-none resize-none min-h-[80px]"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50 rounded-3xl flex gap-3 items-start">
                    <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-200">
                      <Info className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{t({ en: 'Address Preview', ar: 'معاينة العنوان' })}</p>
                      <p className="text-[11px] text-emerald-700 leading-relaxed mt-1">{address || t({ en: 'Please fill details to generate address...', ar: 'يرجى تعبئة التفاصيل لإنشاء العنوان...' })}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      if (!details.regionId) return alert(t({ en: 'Please select a region', ar: 'يرجى اختيار منطقة' }));
                      onSave(address, null, 'normal', details);
                      onClose();
                    }}
                    className="w-full py-4 bg-black text-white rounded-3xl font-bold hover:bg-gray-900 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2 group text-base"
                  >
                    <span>{t({ en: 'Save Address Details', ar: 'حفظ تفاصيل العنوان' })}</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
