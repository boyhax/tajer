import React, { useState, useContext } from 'react';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Truck } from 'lucide-react';
import { db } from '../../../firebase';
import { AuthContext } from '../../../contexts/AuthContext';
import { LanguageContext } from '../../../contexts/LanguageContext';
import { config } from '../../../lib/config';

export const DriverRegistration = () => {
  const { user, profile } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vehicleInfo: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setLoading(true);
    try {
      const driverId = user.uid;
      await setDoc(doc(db, 'drivers', driverId), {
        id: driverId,
        userId: user.uid,
        vehicleInfo: formData.vehicleInfo,
        isVerified: false,
        status: 'available',
        createdAt: serverTimestamp()
      });
      if (profile.roles?.includes('admin')) {
        if (!profile.roles.includes('driver')) {
          await updateDoc(doc(db, 'users', user.uid), { roles: [...profile.roles, 'driver'] });
        }
      } else {
        await updateDoc(doc(db, 'users', user.uid), { role: 'driver', roles: [...(profile.roles || []), 'driver'] });
      }
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('Error registering driver');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm max-w-xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
          <Truck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold">{t({ en: 'Become a Driver', ar: 'كن سائقاً' })}</h2>
        <p className="text-gray-500 text-sm mt-2">{t({ en: `Deliver orders and earn money with ${t(config.name)}.`, ar: `قم بتوصيل الطلبات واكسب المال مع ${t(config.name)}.` })}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">{t({ en: 'Vehicle Information', ar: 'معلومات المركبة' })}</label>
          <textarea 
            required
            value={formData.vehicleInfo}
            onChange={(e) => setFormData({ ...formData, vehicleInfo: e.target.value })}
            className="w-full p-4 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-black min-h-[100px]"
            placeholder={t({ en: 'Car model, plate number, etc.', ar: 'موديل السيارة، رقم اللوحة، إلخ.' })}
          />
        </div>
        <button 
          disabled={loading}
          className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-all disabled:opacity-50"
        >
          {loading ? t({ en: 'Processing...', ar: 'جاري المعالجة...' }) : t({ en: 'Register as Driver', ar: 'التسجيل كسائق' })}
        </button>
      </form>
    </div>
  );
};
