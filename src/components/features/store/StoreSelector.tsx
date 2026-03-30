import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Store as StoreIcon, X, Search, CheckCircle2, MapPin, Star, ChevronRight } from 'lucide-react';
import { db } from '../../../firebase';
import { Store } from '../../../types';
import { useLanguage } from '../../../contexts';
import { OperationType, handleFirestoreError } from '../../../lib/error';

export const StoreSelector = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedStoreId 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSelect: (s: Store) => void, 
  selectedStoreId?: string 
}) => {
  const { t, lang } = useLanguage();
  const [stores, setStores] = useState<Store[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'stores'), where('isVerified', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      setStores(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'stores'));
    return unsub;
  }, []);

  const filteredStores = stores.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center p-0 sm:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="relative bg-white w-full max-w-2xl rounded-t-[40px] sm:rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-8 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <StoreIcon className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase italic">{t({ en: 'Select Store', ar: 'اختر المتجر' })}</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t({ en: 'Available Supermarkets', ar: 'السوبر ماركت المتاحة' })}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 border-b border-gray-100 shrink-0">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t({ en: 'Search for a store or area...', ar: 'ابحث عن متجر أو منطقة...' })}
                  className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-3xl font-bold transition-all outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t({ en: 'Finding stores...', ar: 'جاري البحث عن متاجر...' })}</p>
                </div>
              ) : filteredStores.length > 0 ? (
                filteredStores.map(store => (
                  <button 
                    key={store.id}
                    onClick={() => {
                      onSelect(store);
                      onClose();
                    }}
                    className={`w-full p-6 rounded-[32px] border-2 transition-all flex items-center justify-between group ${selectedStoreId === store.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-black hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-transform group-hover:scale-110 ${selectedStoreId === store.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-white border border-gray-100 text-gray-400 shadow-sm'}`}>
                        <StoreIcon className="w-8 h-8" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-xl font-black tracking-tight">{store.name}</h4>
                          {store.isVerified && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{store.address}</span>
                          </div>
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="w-3 h-3 fill-current" />
                            <span>4.9</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${store.status === 'online' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {store.status === 'online' ? t({ en: 'Open Now', ar: 'مفتوح الآن' }) : t({ en: 'Closed', ar: 'مغلق' })}
                          </span>
                          <span className="text-[10px] font-bold text-gray-300">1.2 km away</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={`w-6 h-6 text-gray-200 group-hover:text-black transition-all ${lang === 'ar' ? 'rotate-180' : ''}`} />
                  </button>
                ))
              ) : (
                <div className="py-20 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Search className="w-10 h-10 text-gray-200" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{t({ en: 'No stores found', ar: 'لم يتم العثور على متاجر' })}</h3>
                  <p className="text-gray-400">{t({ en: 'Try searching for a different area or name.', ar: 'حاول البحث عن منطقة أو اسم مختلف.' })}</p>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-gray-100 shrink-0">
              <button 
                onClick={onClose}
                className="w-full py-5 bg-black text-white rounded-[32px] font-black text-lg hover:bg-gray-900 transition-all shadow-2xl shadow-black/20"
              >
                {t({ en: 'Done', ar: 'تم' })}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
