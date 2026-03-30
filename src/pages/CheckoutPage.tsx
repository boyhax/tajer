import React, { useState, useEffect, useCallback } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import {
  MapPin,
  CheckCircle2,
  CreditCard,
  Banknote,
  Truck,
  ChevronDown,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  useCart,
  useAuth,
  useLanguage,
  useLocation,
} from '../contexts';
import { useDeliveryMethods } from '../hooks/useDeliveryMethods';
import { useRegions } from '../hooks/useRegions';
import { db, handleFirestoreError, OperationType } from '../services/firebaseService';
import { AppSettings, OrderPricing } from '../types';
import { config } from '../lib/config';
import { AddressDrawer } from '../components/ui/AddressDrawer';

interface CheckoutPageProps {
  onComplete: (orderId: string) => void;
}

export const CheckoutPage = ({ onComplete }: CheckoutPageProps) => {
  const { cart, clearCart } = useCart();
  const { user, profile } = useAuth();
  const { t, lang } = useLanguage();
  const { location: savedLocation, address: savedAddress } = useLocation();
  const { deliveryMethods } = useDeliveryMethods();
  const { regions } = useRegions();

  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState(savedAddress || profile?.address || '');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    savedLocation || profile?.defaultLocation || null,
  );
  const [isAddressDrawerOpen, setIsAddressDrawerOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    paymentMethods: { online: true, cod: true },
  });
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [deliveryMethodId, setDeliveryMethodId] = useState('');
  const [destinationRegionId, setDestinationRegionId] = useState('');

  // Server-verified pricing
  const [serverPricing, setServerPricing] = useState<OrderPricing | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  // Auto-select defaults
  useEffect(() => {
    const defaultMethod = deliveryMethods.find(m => m.isDefault && m.isPublished) || deliveryMethods.find(m => m.isPublished);
    if (defaultMethod && !deliveryMethodId) setDeliveryMethodId(defaultMethod.id);
  }, [deliveryMethods]);

  // Listen for app settings
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'app'),
      snap => {
        if (snap.exists()) {
          const settings = snap.data() as AppSettings;
          setAppSettings(settings);
          if (!settings.paymentMethods.online && settings.paymentMethods.cod) {
            setPaymentMethod('cod');
          }
        }
      },
      error => handleFirestoreError(error, OperationType.GET, 'settings/app'),
    );
    return unsub;
  }, []);

  // Fetch server-authoritative pricing preview whenever cart/delivery/region changes
  const fetchPreview = useCallback(async () => {
    if (!cart.length || !deliveryMethodId || !destinationRegionId || !user) {
      setServerPricing(null);
      return;
    }
    setPreviewLoading(true);
    setPreviewError('');
    try {
      const idToken = await user.getIdToken();
      const resp = await fetch('/api/order/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i.id, quantity: i.quantity })),
          deliveryMethodId,
          destinationRegionId,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Preview failed');
      setServerPricing(data.pricing as OrderPricing);
    } catch (err: any) {
      setPreviewError(err.message);
      setServerPricing(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [cart, deliveryMethodId, destinationRegionId, user]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  const handlePayment = async () => {
    if (!user) return alert(t({ en: 'Please sign in to checkout', ar: 'يرجى تسجيل الدخول لإتمام الشراء' }));
    if (!address) return alert(t({ en: 'Please provide a shipping address', ar: 'يرجى تقديم عنوان الشحن' }));
    if (!deliveryMethodId) return alert(t({ en: 'Please select a delivery method', ar: 'يرجى اختيار طريقة التوصيل' }));
    if (!destinationRegionId) return alert(t({ en: 'Please select your region', ar: 'يرجى اختيار منطقتك' }));

    // Determine gateway — use activeGateway from settings or default to myfatoorah
    const gateway = paymentMethod === 'cod'
      ? 'cod'
      : (appSettings.activeGateway ?? appSettings.paymentMethods.gateways?.[0] ?? 'myfatoorah');

    setLoading(true);
    try {
      const idToken = await user.getIdToken();
      const resp = await fetch('/api/order/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          items: cart.map(i => ({ productId: i.id, quantity: i.quantity })),
          deliveryMethodId,
          destinationRegionId,
          paymentGateway: gateway,
          customerAddress: address,
          ...(coords ? { destinationCoords: coords } : {}),
          language: lang,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Order creation failed');

      clearCart();

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        onComplete(data.orderId);
      }
    } catch (error: any) {
      console.error(error);
      alert(t({ en: 'Checkout failed: ', ar: 'فشل الدفع: ' }) + error.message);
    } finally {
      setLoading(false);
    }
  };

  const publishedMethods = deliveryMethods.filter(m => m.isPublished);
  const selectedMethod = deliveryMethods.find(m => m.id === deliveryMethodId);

  return (
    <div className="max-w-2xl mx-auto p-1 md:p-4">
      <h1 className="text-xl md:text-4xl font-bold mb-4 md:mb-12">
        {t({ en: 'Checkout', ar: 'إتمام الشراء' })}
      </h1>
      <div className="space-y-3 md:space-y-6">

        {/* Shipping Information */}
        <div className="bg-white border border-gray-100 rounded-xl md:rounded-2xl p-3 md:p-6 shadow-sm">
          <h3 className="font-bold text-sm md:text-lg mb-2 md:mb-4">
            {t({ en: 'Shipping Information', ar: 'معلومات الشحن' })}
          </h3>
          <div className="space-y-2 md:space-y-4">
            <div>
              <label className="text-[9px] font-bold uppercase text-gray-400 mb-0.5 md:mb-1 block">
                {t({ en: 'Full Name', ar: 'الاسم الكامل' })}
              </label>
              <div className="p-2 md:p-3 bg-gray-50 rounded-lg md:rounded-xl text-gray-600 text-xs md:text-sm">
                {user?.displayName}
              </div>
            </div>
            <div className="space-y-2 md:space-y-4">
              <div className="flex justify-between items-center mb-0.5 md:mb-1">
                <label className="text-[9px] font-bold uppercase text-gray-400">
                  {t({ en: 'Shipping Address', ar: 'عنوان الشحن' })}
                </label>
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
                t={t}
                onSave={(newAddress, newCoords) => {
                  setAddress(newAddress);
                  setCoords(newCoords);
                }}
              />
            </div>
          </div>
        </div>

        {/* Delivery Method */}
        <div className="bg-white border border-gray-100 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm">
          <h3 className="font-bold text-sm md:text-lg mb-3 md:mb-4 flex items-center gap-2">
            <Truck className="w-4 h-4 md:w-5 md:h-5" />
            {t({ en: 'Delivery Method', ar: 'طريقة التوصيل' })}
          </h3>
          <div className="space-y-2">
            {publishedMethods.map(method => (
              <button
                key={method.id}
                onClick={() => setDeliveryMethodId(method.id)}
                className={`w-full text-start p-3 md:p-4 rounded-xl border-2 transition-all ${
                  deliveryMethodId === method.id
                    ? 'border-black bg-gray-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="font-bold text-xs md:text-sm">{method.name}</div>
                {method.description && (
                  <div className="text-[10px] md:text-xs text-gray-500 mt-0.5">{method.description}</div>
                )}
              </button>
            ))}
            {publishedMethods.length === 0 && (
              <p className="text-xs text-gray-400">{t({ en: 'No delivery methods available', ar: 'لا توجد طرق توصيل متاحة' })}</p>
            )}
          </div>
        </div>

        {/* Destination Region */}
        <div className="bg-white border border-gray-100 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm">
          <h3 className="font-bold text-sm md:text-lg mb-3 md:mb-4">
            {t({ en: 'Delivery Region', ar: 'منطقة التوصيل' })}
          </h3>
          <div className="relative">
            <select
              value={destinationRegionId}
              onChange={e => setDestinationRegionId(e.target.value)}
              className="w-full appearance-none p-3 md:p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs md:text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-black/10"
            >
              <option value="">{t({ en: '— Select your region —', ar: '— اختر منطقتك —' })}</option>
              {regions.map(region => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white border border-gray-100 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm">
          <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4">
            {t({ en: 'Payment Method', ar: 'طريقة الدفع' })}
          </h3>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {appSettings.paymentMethods.online && (
              <button
                onClick={() => setPaymentMethod('online')}
                className={`p-3 md:p-4 rounded-lg md:rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 md:gap-2 ${
                  paymentMethod === 'online' ? 'border-black bg-gray-50' : 'border-gray-100'
                }`}
              >
                <CreditCard className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-[10px] md:text-xs font-bold">
                  {t({ en: 'Online Payment', ar: 'دفع إلكتروني' })}
                </span>
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
                <span className="text-[10px] md:text-xs font-bold">
                  {t({ en: 'Cash on Delivery', ar: 'الدفع عند الاستلام' })}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white border border-gray-100 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm">
          <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4">
            {t({ en: 'Order Summary', ar: 'ملخص الطلب' })}
          </h3>
          <div className="space-y-1.5 md:space-y-2 mb-3 md:mb-4">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-xs md:text-sm">
                <span>{t(item.locals.name)} × {item.quantity}</span>
                <span>{(item.price * item.quantity).toFixed(3)} {t(config.currency.symbol)}</span>
              </div>
            ))}
          </div>

          {/* Server-verified pricing breakdown */}
          {previewLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              {t({ en: 'Calculating...', ar: 'جاري الحساب...' })}
            </div>
          )}

          {previewError && (
            <div className="flex items-center gap-2 text-xs text-red-500 py-2">
              <AlertCircle className="w-3 h-3" />
              {previewError}
            </div>
          )}

          {serverPricing && !previewLoading && (
            <div className="border-t pt-3 md:pt-4 space-y-1.5">
              <div className="flex justify-between text-xs md:text-sm text-gray-500">
                <span>{t({ en: 'Subtotal', ar: 'المجموع الفرعي' })}</span>
                <span>{serverPricing.subtotal.toFixed(3)} {t(config.currency.symbol)}</span>
              </div>
              {serverPricing.discountAmount > 0 && (
                <div className="flex justify-between text-xs md:text-sm text-emerald-600">
                  <span>{t({ en: 'Discount', ar: 'الخصم' })}</span>
                  <span>−{serverPricing.discountAmount.toFixed(3)} {t(config.currency.symbol)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs md:text-sm text-gray-500">
                <span>{t({ en: 'Delivery', ar: 'التوصيل' })}</span>
                <span>
                  {serverPricing.deliveryCost === 0
                    ? t({ en: 'Free', ar: 'مجاني' })
                    : `${serverPricing.deliveryCost.toFixed(3)} ${t(config.currency.symbol)}`}
                </span>
              </div>
              {serverPricing.taxAmount > 0 && (
                <div className="flex justify-between text-xs md:text-sm text-gray-500">
                  <span>{t({ en: 'Tax', ar: 'الضريبة' })}</span>
                  <span>{serverPricing.taxAmount.toFixed(3)} {t(config.currency.symbol)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t font-bold text-base md:text-xl">
                <span>{t({ en: 'Total', ar: 'المجموع' })}</span>
                <span>{serverPricing.total.toFixed(3)} {t(config.currency.symbol)}</span>
              </div>
            </div>
          )}

          {!serverPricing && !previewLoading && !previewError && (
            <div className="border-t pt-3 md:pt-4 text-xs text-gray-400">
              {t({ en: 'Select a delivery method and region to see the total.', ar: 'اختر طريقة التوصيل والمنطقة لعرض الإجمالي.' })}
            </div>
          )}
        </div>

        <button
          onClick={handlePayment}
          disabled={loading || !serverPricing}
          className="w-full bg-black text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-bold text-base md:text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 md:gap-3 disabled:opacity-50"
        >
          {loading
            ? t({ en: 'Processing...', ar: 'جاري المعالجة...' })
            : paymentMethod === 'online'
              ? t({ en: 'Proceed to Payment', ar: 'المتابعة للدفع' })
              : t({ en: 'Confirm Order (COD)', ar: 'تأكيد الطلب (الدفع عند الاستلام)' })}
        </button>
      </div>
    </div>
  );
};
