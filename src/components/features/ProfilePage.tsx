import React, { useContext } from 'react';
import { useAuth, useLanguage } from '../../contexts';
import { 
  User as ProfileIcon, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Package, 
  Heart, 
  MapPin, 
  CreditCard, 
  Bell, 
  LayoutDashboard,
  ShieldCheck
} from 'lucide-react';

export const ProfilePage = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const { user, profile, logout } = useAuth();
  const { t, lang, setLang } = useLanguage();

  if (!user) return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <ProfileIcon className="w-10 h-10 text-gray-400" />
      </div>
      <h2 className="text-2xl font-bold mb-2">{t({ en: 'Join Kuzama', ar: 'انضم إلى خزامة' })}</h2>
      <p className="text-gray-500 mb-8 max-w-xs">{t({ en: 'Sign in to track orders, save favorites, and manage your profile.', ar: 'سجل الدخول لتتبع الطلبات وحفظ المفضلة وإدارة ملفك الشخصي.' })}</p>
      <button 
        onClick={() => onNavigate('home')}
        className="px-12 py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all"
      >
        {t({ en: 'Get Started', ar: 'ابدأ الآن' })}
      </button>
    </div>
  );

  const menuItems = [
    { id: 'orders', icon: Package, label: { en: 'My Orders', ar: 'طلباتي' }, color: 'bg-blue-50 text-blue-600' },
    { id: 'wishlist', icon: Heart, label: { en: 'Wishlist', ar: 'المفضلة' }, color: 'bg-red-50 text-red-600' },
    { id: 'addresses', icon: MapPin, label: { en: 'Saved Addresses', ar: 'العناوين المحفوظة' }, color: 'bg-emerald-50 text-emerald-600' },
    { id: 'payments', icon: CreditCard, label: { en: 'Payment Methods', ar: 'طرق الدفع' }, color: 'bg-purple-50 text-purple-600' },
    { id: 'notifications', icon: Bell, label: { en: 'Notifications', ar: 'الإشعارات' }, color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-6 mb-12">
        <div className="w-24 h-24 bg-gray-100 rounded-[32px] flex items-center justify-center text-3xl font-black text-gray-400 border-4 border-white shadow-xl">
          {profile?.displayName ? profile.displayName[0] : user.email?.[0].toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight">{profile?.displayName || t({ en: 'User', ar: 'مستخدم' })}</h1>
          <p className="text-gray-400 font-medium">{user.email}</p>
          <div className="flex gap-2 mt-2">
            {profile?.roles?.map(role => (
              <span key={role} className="px-3 py-1 bg-black text-white text-[10px] font-bold rounded-full uppercase tracking-widest">
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-12">
        {menuItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-3xl hover:border-black transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                <item.icon className="w-6 h-6" />
              </div>
              <span className="font-bold text-lg">{t(item.label)}</span>
            </div>
            <ChevronRight className={`w-5 h-5 text-gray-300 group-hover:text-black transition-all ${lang === 'ar' ? 'rotate-180' : ''}`} />
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 ml-2 mb-4">{t({ en: 'Preferences', ar: 'التفضيلات' })}</h3>
        
        <div className="bg-gray-50 p-6 rounded-[32px] space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-gray-400" />
              <span className="font-bold">{t({ en: 'Language', ar: 'اللغة' })}</span>
            </div>
            <div className="flex bg-white p-1 rounded-xl border border-gray-100">
              <button 
                onClick={() => setLang('en')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${lang === 'en' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black'}`}
              >
                EN
              </button>
              <button 
                onClick={() => setLang('ar')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${lang === 'ar' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black'}`}
              >
                AR
              </button>
            </div>
          </div>

          {profile?.roles?.includes('admin') && (
            <button 
              onClick={() => onNavigate('admin')}
              className="w-full flex items-center justify-between p-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5" />
                <span>{t({ en: 'Admin Dashboard', ar: 'لوحة الإدارة' })}</span>
              </div>
              <LayoutDashboard className="w-5 h-5 opacity-50" />
            </button>
          )}

          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-3 p-5 bg-white text-red-500 border border-red-100 rounded-2xl font-bold hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            {t({ en: 'Sign Out', ar: 'تسجيل الخروج' })}
          </button>
        </div>
      </div>
    </div>
  );
};
