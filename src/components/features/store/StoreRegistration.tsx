import React, { useState, useContext } from 'react';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Store as StoreIcon, MapPin } from 'lucide-react';
import { db } from '../../../firebase';
import { AuthContext } from '../../../contexts/AuthContext';
import { LanguageContext } from '../../../contexts/LanguageContext';
import { config } from '../../../lib/config';

export const StoreRegistration = () => {
  const { user, profile } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setLoading(true);
    try {
      const storeId = user.uid;
      await setDoc(doc(db, 'stores', storeId), {
        id: storeId,
        ownerId: user.uid,
        name: formData.name,
        description: formData.description,
        location: formData.location,
        isVerified: false,
        locals: {
          name: { en: formData.name, ar: formData.name },
          description: { en: formData.description, ar: formData.description }
        },
        createdAt: serverTimestamp()
      });
      if (profile.roles?.includes('admin')) {
        if (!profile.roles.includes('store')) {
          await updateDoc(doc(db, 'users', user.uid), { roles: [...profile.roles, 'store'] });
        }
      } else {
        await updateDoc(doc(db, 'users', user.uid), { role: 'store', roles: [...(profile.roles || []), 'store'] });
      }
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('Error registering store');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm max-w-xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
          <StoreIcon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold">{t({ en: 'Register as a Store', ar: 'التسجيل كمتجر' })}</h2>
        <p className="text-gray-500 text-sm mt-2">{t({ en: `Start selling your products on ${t(config.name)} today.`, ar: `ابدأ ببيع منتجاتك على ${t(config.name)} اليوم.` })}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">{t({ en: 'Store Name', ar: 'اسم المتجر' })}</label>
          <input 
            required
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black"
            placeholder={t({ en: 'Enter store name', ar: 'أدخل اسم المتجر' })}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">{t({ en: 'Description', ar: 'الوصف' })}</label>
          <textarea 
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black min-h-[100px]"
            placeholder={t({ en: 'Tell us about your store', ar: 'أخبرنا عن متجرك' })}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">{t({ en: 'Location', ar: 'الموقع' })}</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              required
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full p-4 pl-12 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black"
              placeholder={t({ en: 'Store address', ar: 'عنوان المتجر' })}
            />
          </div>
        </div>
        <button 
          disabled={loading}
          className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
        >
          {loading ? t({ en: 'Processing...', ar: 'جاري المعالجة...' }) : t({ en: 'Register Store', ar: 'تسجيل المتجر' })}
        </button>
      </form>
    </div>
  );
};
