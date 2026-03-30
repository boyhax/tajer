import React, { useContext } from 'react';
import { 
  Bell, 
  Search, 
  MapPin, 
  ChevronDown, 
  Sparkles, 
  ShoppingBag 
} from 'lucide-react';
import { LanguageContext } from '../../contexts/LanguageContext';
import { AuthContext } from '../../contexts/AuthContext';
import { Store } from '../../types';

export const TopNav = ({ 
  onOpenNotifications, 
  onOpenStoreSelector, 
  selectedStore 
}: { 
  onOpenNotifications: () => void, 
  onOpenStoreSelector: () => void, 
  selectedStore: Store | null 
}) => {
  const { t, lang } = useContext(LanguageContext);
  const { user } = useContext(AuthContext);

  return (
    <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-gray-100 px-6 py-4 md:py-8 flex justify-between items-center safe-area-top shadow-sm">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-black/20 group hover:scale-110 transition-transform">
            <ShoppingBag className="w-7 h-7 transition-transform group-hover:-translate-y-1" />
          </div>
          <div className="hidden md:block">
            <h1 className="text-3xl font-black tracking-tighter uppercase italic leading-none">Kuzama</h1>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-1">{t({ en: 'Supermarket', ar: 'سوبر ماركت' })}</p>
          </div>
        </div>
        <div className="h-10 w-px bg-gray-100 mx-2 hidden md:block" />
        <button 
          onClick={onOpenStoreSelector}
          className="flex items-center gap-3 px-6 py-3 bg-gray-50 rounded-2xl border border-gray-100 hover:border-black hover:bg-white transition-all group"
        >
          <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm group-hover:bg-emerald-500 group-hover:text-white transition-all">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{t({ en: 'Delivering to', ar: 'التوصيل إلى' })}</p>
            <p className="text-sm font-black leading-none flex items-center gap-2">
              {selectedStore?.name || t({ en: 'Select Store', ar: 'اختر المتجر' })}
              <ChevronDown className={`w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity ${lang === 'ar' ? 'rotate-180' : ''}`} />
            </p>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <button className="p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-black hover:bg-white hover:border-black border border-transparent transition-all hidden sm:block">
          <Search className="w-6 h-6" />
        </button>
        <button 
          onClick={onOpenNotifications}
          className="p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-black hover:bg-white hover:border-black border border-transparent transition-all relative group"
        >
          <Bell className="w-6 h-6 transition-transform group-hover:rotate-12" />
          <span className="absolute top-3 right-3 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-lg shadow-emerald-200 animate-pulse" />
        </button>
        <div className="h-10 w-px bg-gray-100 mx-2 hidden md:block" />
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t({ en: 'Welcome', ar: 'مرحباً' })}</p>
            <p className="text-sm font-black">{user?.displayName || t({ en: 'Guest', ar: 'ضيف' })}</p>
          </div>
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-xl font-black text-gray-300 border-2 border-white shadow-xl">
            {user?.displayName ? user.displayName[0] : 'G'}
          </div>
        </div>
      </div>
    </header>
  );
};
