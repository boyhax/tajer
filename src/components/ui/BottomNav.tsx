import React, { useContext } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Heart, 
  User as UserIcon, 
  LayoutDashboard, 
  Truck, 
  Store as StoreIcon 
} from 'lucide-react';
import { useLanguage, useAuth } from '../../contexts';

export const BottomNav = ({ 
  activePage, 
  onNavigate, 
  cartCount 
}: { 
  activePage: string, 
  onNavigate: (page: string) => void, 
  cartCount: number 
}) => {
  const { t } = useLanguage();
  const { profile } = useAuth();

  const navItems = [
    { id: 'home', icon: ShoppingBag, label: { en: 'Shop', ar: 'تسوق' } },
    { id: 'wishlist', icon: Heart, label: { en: 'Wishlist', ar: 'المفضلة' } },
    { id: 'cart', icon: ShoppingBag, label: { en: 'Cart', ar: 'السلة' }, count: cartCount },
    { id: 'profile', icon: UserIcon, label: { en: 'Profile', ar: 'حسابي' } },
  ];

  if (profile?.roles?.includes('admin')) {
    navItems.splice(3, 0, { id: 'admin', icon: LayoutDashboard, label: { en: 'Admin', ar: 'الإدارة' } });
  }
  if (profile?.roles?.includes('driver')) {
    navItems.splice(3, 0, { id: 'driver', icon: Truck, label: { en: 'Driver', ar: 'السائق' } });
  }
  if (profile?.roles?.includes('store')) {
    navItems.splice(3, 0, { id: 'store', icon: StoreIcon, label: { en: 'Store', ar: 'المتجر' } });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-gray-100 px-4 py-3 md:py-6 z-50 flex justify-around items-center safe-area-bottom shadow-2xl shadow-black/10">
      {navItems.map((item) => (
        <button 
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`flex flex-col items-center gap-1.5 transition-all relative group ${activePage === item.id ? 'text-black scale-110' : 'text-gray-300 hover:text-black'}`}
        >
          <div className={`p-3 rounded-2xl transition-all ${activePage === item.id ? 'bg-black text-white shadow-lg shadow-black/20' : 'group-hover:bg-gray-50'}`}>
            <item.icon className="w-6 h-6" />
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest transition-all ${activePage === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {t(item.label)}
          </span>
          {item.count !== undefined && item.count > 0 && (
            <span className="absolute top-1 right-1 w-6 h-6 bg-emerald-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg shadow-emerald-200 animate-bounce">
              {item.count}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
};
