import React, { useState } from 'react';
import { 
  Globe, 
  Bell, 
  ShoppingCart, 
  User as UserIcon, 
  LogOut 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  useAuth, 
  useCart, 
  useLanguage, 
  useNotifications 
} from '../../contexts';
import { config } from '../../lib/config';
import { NotificationCenter } from './NotificationCenter';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Navbar = ({ onNavigate, currentPage }: NavbarProps) => {
  const { user, profile, signIn, logout } = useAuth();
  const { cart } = useCart();
  const { lang, setLang, t } = useLanguage();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <nav className="hidden md:flex sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 items-center justify-between" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div 
        className="flex items-center gap-2 cursor-pointer" 
        onClick={() => onNavigate('home')}
      >
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xl italic"
          style={{ backgroundColor: config.theme.primary }}
        >
          {t(config.name).charAt(0)}
        </div>
        <span className="text-xl font-bold tracking-tight">{t(config.name)}</span>
      </div>

      <div className="hidden md:flex items-center gap-6">
        <button 
          onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-1 text-sm font-bold hover:text-black transition-colors"
        >
          <Globe className="w-4 h-4" />
          {lang === 'en' ? 'العربية' : 'English'}
        </button>

        <button 
          onClick={() => onNavigate('home')}
          className={`text-sm font-medium hover:text-black transition-colors ${currentPage === 'home' ? 'text-black font-bold' : 'text-gray-500'}`}
        >
          {t({ en: 'Shop', ar: 'المتجر' })}
        </button>

        {user && (
          <button 
            onClick={() => onNavigate('wishlist')}
            className={`text-sm font-medium hover:text-black transition-colors ${currentPage === 'wishlist' ? 'text-black font-bold' : 'text-gray-500'}`}
          >
            {t({ en: 'Wishlist', ar: 'الأمنيات' })}
          </button>
        )}

        {user && (
          <button 
            onClick={() => onNavigate('orders')}
            className={`text-sm font-medium hover:text-black transition-colors ${currentPage === 'orders' ? 'text-black font-bold' : 'text-gray-500'}`}
          >
            {t({ en: 'Orders', ar: 'الطلبات' })}
          </button>
        )}

        {profile?.roles?.includes('admin') && (
          <button 
            onClick={() => onNavigate('admin')}
            className={`text-sm font-medium hover:text-black transition-colors ${currentPage === 'admin' ? 'text-black font-bold' : 'text-gray-500'}`}
          >
            {t({ en: 'Admin', ar: 'المشرف' })}
          </button>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <button 
            onClick={() => setShowNotifications(true)}
            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-emerald-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>
        )}

        <button 
          onClick={() => onNavigate('cart')}
          className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ShoppingCart className="w-6 h-6" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              {cart.length}
            </span>
          )}
        </button>

        <AnimatePresence>
          {showNotifications && (
            <NotificationCenter 
              isOpen={showNotifications} 
              onClose={() => setShowNotifications(false)} 
            />
          )}
        </AnimatePresence>

        {user ? (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate('profile')}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors overflow-hidden"
            >
              {user.photoURL ? (
                <img src={user.photoURL || undefined} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon className="w-5 h-5" />
              )}
            </button>
            <button 
              onClick={logout}
              className="hidden md:flex p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button 
            onClick={signIn}
            className="bg-black text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-gray-800 transition-all"
          >
            {t({ en: 'Sign In', ar: 'تسجيل الدخول' })}
          </button>
        )}
      </div>
    </nav>
  );
};
