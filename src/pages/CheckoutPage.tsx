import React, { useState, useEffect } from 'react';
import { onSnapshot, doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  MapPin, 
  CheckCircle2, 
  CreditCard, 
  Banknote 
} from 'lucide-react';
import { 
  useCart, 
  useAuth, 
  useLanguage, 
  useLocation 
} from '../contexts';
import { db, handleFirestoreError, OperationType } from '../services/firebaseService';
import { AppSettings } from '../types';
import { config } from '../lib/config';
import { AddressDrawer } from '../components/ui/AddressDrawer';

interface CheckoutPageProps {
  onComplete: (orderId: string) => void;
}

export const CheckoutPage = ({ onComplete }: CheckoutPageProps) => {
  const { cart, total, clearCart } = useCart();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const { location: savedLocation, address: savedAddress } = useLocation();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState(savedAddress || profile?.address || '');
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(savedLocation || profile?.defaultLocation || null);
  const [addressMode, setAddressMode] = useState<'normal' | 'map'>(profile?.addressMode || 'map');
  const [addressDetails, setAddressDetails] = useState(profile?.addressDetails);
  const [isAddressDrawerOpen, setIsAddressDrawerOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>({ paymentMethods: { online: true, cod: true }, restrictDeliveryToRegions: false });
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');

  useEffect(() => {
    if (profile) {
      if (!savedAddress && profile.address) setAddress(profile.address);
      if (!savedLocation && profile.defaultLocation) setCoords(profile.defaultLocation);
      setAddressMode(profile.addressMode || 'map');
      setAddressDetails(profile.addressDetails);
    }
  }, [profile]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'app'), (snap) => {
      if (snap.exists()) {
        const settings = snap.data() as AppSettings;
        setAppSettings(settings);
        if (!settings.paymentMethods.online && settings.paymentMethods.cod) {
          setPaymentMethod('cod');
        }
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/app'));
    return unsub;
  }, []);

  const handlePayment = async () => {
    if (!user) return alert(t({ en: 'Please sign in to checkout', ar: 'يرجى تسجيل الدخول لإتمام الشراء' }));
    if (!address) return alert(t({ en: 'Please provide a shipping address', ar: 'يرجى تقديم عنوان الشحن' }));

    setLoading(true);
    try {
      // 1. Create Order in Firestore
      const orderData = {
        userId: user.uid,
        items: cart.map(item => ({
          id: item.id,
          name: t(item.locals.name),
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount: total,
        status: 'pending',
        paymentMethod,
        createdAt: serverTimestamp(),
        customerInfo: {
          name: user?.displayName || '',
          email: user?.email || '',
          address: address,
          addressMode,
          addressDetails: addressDetails || undefined,
          destinationCoords: coords || undefined
        }
      };
      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      
      if (paymentMethod === 'cod') {
        clearCart();
        onComplete(orderRef.id);
        return;
      }

      // 2. Initiate MyFatoorah Payment via Backend
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          currency: config.currency.code,
          customerName: user?.displayName || '',
          customerEmail: user?.email || '',
          orderId: orderRef.id
        })
      });

      const data = await response.json();
      if (data.IsSuccess) {
        window.location.href = data.Data.PaymentURL;
      } else {
        const validationError = data.ValidationErrors?.[0]?.Error || data.ValidationErrors?.[0]?.Message;
        const errorMessage = data.Message || validationError || 'Payment initiation failed';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error(error);
      alert('Checkout failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-1 md:p-4">
      <h1 className="text-xl md:text-4xl font-bold mb-4 md:mb-12">{t({ en: 'Checkout', ar: 'إتمام الشراء' })}</h1>
      <div className="space-y-3 md:space-y-6">
        <div className="bg-white border border-gray-100 rounded-xl md:rounded-2xl p-3 md:p-6 shadow-sm">
          <h3 className="font-bold text-sm md:text-lg mb-2 md:mb-4">{t({ en: 'Shipping Information', ar: 'معلومات الشحن' })}</h3>
          <div className="space-y-2 md:space-y-4">
            <div>
              <label className="text-[9px] font-bold uppercase text-gray-400 mb-0.5 md:mb-1 block">{t({ en: 'Full Name', ar: 'الاسم الكامل' })}</label>
              <div className="p-2 md:p-3 bg-gray-50 rounded-lg md:rounded-xl text-gray-600 text-xs md:text-sm">{user?.displayName}</div>
            </div>
            <div className="space-y-2 md:space-y-4">
              <div className="flex justify-between items-center mb-0.5 md:mb-1">
                <label className="text-[9px] font-bold uppercase text-gray-400">{t({ en: 'Shipping Address', ar: 'عنوان الشحن' })}</label>
                <button 
                  onClick={() => setIsAddressDrawerOpen(true)}
                  className="text-[8px] md:text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 md:px-2 md:py-1 rounded-lg transition-colors"
                >
                  <MapPin className="w-2 h-2 md:w-3 md:h-3" />
                  {t({ en: 'Change Address', ar: 'تغيير العنوان' })}
                </button>
              </div>
              
              <div className="p-2.5 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-100">
                <p className="text-[11px] md:text-sm text-gray-600 leading-relaxed">
                  {address || t({ en: 'No address selected', ar: 'لم يتم اختيار عنوان' })}
                </p>
                {coords && (
                  <div className="mt-1 md:mt-2 flex items-center gap-1 text-[8px] md:text-[10px] text-emerald-600 font-bold">
                    <CheckCircle2 className="w-2 h-2 md:w-3 md:h-3" />
                    {t({ en: 'Precise location set', ar: 'تم تحديد الموقع بدقة' })}
                  </div>
                )}
              </div>

              <AddressDrawer 
                isOpen={isAddressDrawerOpen}
                onClose={() => setIsAddressDrawerOpen(false)}
                initialAddress={address}
                initialCoords={coords}
                initialMode={addressMode}
                initialDetails={addressDetails}
                t={t}
                onSave={(newAddress, newCoords, mode, details) => {
                  setAddress(newAddress);
                  setCoords(newCoords);
                  setAddressMode(mode);
                  setAddressDetails(details);
                }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm">
          <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4">{t({ en: 'Payment Method', ar: 'طريقة الدفع' })}</h3>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {appSettings.paymentMethods.online && (
              <button 
                onClick={() => setPaymentMethod('online')}
                className={`p-3 md:p-4 rounded-lg md:rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 md:gap-2 ${
                  paymentMethod === 'online' ? 'border-black bg-gray-50' : 'border-gray-100'
                }`}
              >
                <CreditCard className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-[10px] md:text-xs font-bold">{t({ en: 'Online Payment', ar: 'دفع إلكتروني' })}</span>
              </button>
            )}
            {appSettings.paymentMethods.cod && (
              <button 
                onClick={() => setPaymentMethod('cod')}
                className={`p-3 md:p-4 rounded-lg md:rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 md:gap-2 ${
                  paymentMethod === 'cod' ? 'border-black bg-gray-50' : 'border-gray-100'
                }`}
              >
                <Banknote className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-[10px] md:text-xs font-bold">{t({ en: 'Cash on Delivery', ar: 'الدفع عند الاستلام' })}</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm">
          <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4">{t({ en: 'Order Summary', ar: 'ملخص الطلب' })}</h3>
          <div className="space-y-1.5 md:space-y-2 mb-3 md:mb-4">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-xs md:text-sm">
                <span>{t(item.locals.name)} × {item.quantity}</span>
                <span>{(item.price * item.quantity).toFixed(2)} {t(config.currency.symbol)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 md:pt-4 flex justify-between items-center">
            <span className="font-bold text-lg md:text-xl">{t({ en: 'Total', ar: 'المجموع' })}</span>
            <span className="font-bold text-lg md:text-xl">{total.toFixed(2)} {t(config.currency.symbol)}</span>
          </div>
        </div>

        <button 
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-black text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-bold text-base md:text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 md:gap-3 disabled:opacity-50"
        >
          {loading ? t({ en: 'Processing...', ar: 'جاري المعالجة...' }) : 
           paymentMethod === 'online' ? t({ en: 'Pay with MyFatoorah', ar: 'الدفع بواسطة MyFatoorah' }) :
           t({ en: 'Confirm Order (COD)', ar: 'تأكيد الطلب (الدفع عند الاستلام)' })}
        </button>
      </div>
    </div>
  );
};
