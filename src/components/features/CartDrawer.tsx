import React, { useState, useContext, useEffect } from 'react';
import { 
  ShoppingBag, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ArrowLeft, 
  Wallet, 
  Smartphone, 
  Apple, 
  Banknote, 
  LayoutDashboard 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, useLanguage } from '../../contexts';
import { db } from '../../firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { OperationType, handleFirestoreError } from '../../lib/error';
import { config } from '../../lib/config';
import { CartItem, AppSettings } from '../../types';

export const CheckoutModal = ({ 
  isOpen, 
  onClose, 
  items, 
  total, 
  onSuccess 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  items: CartItem[], 
  total: number,
  onSuccess: () => void
}) => {
  const { user, profile } = useAuth();
  const { t, lang } = useLanguage();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [address, setAddress] = useState(profile?.address || '');
  const [phone, setPhone] = useState(profile?.phone || '');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'app'), (snap) => {
      if (snap.exists()) setAppSettings(snap.data() as AppSettings);
    });
    return unsub;
  }, []);

  const handleCheckout = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const orderData = {
        userId: user.uid,
        items: items.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        totalAmount: total,
        status: paymentMethod === 'cod' ? 'pending' : 'paid',
        paymentMethod,
        deliveryStatus: 'pending',
        createdAt: serverTimestamp(),
        customerInfo: {
          name: profile?.displayName || 'Guest',
          address,
          phone,
          destinationCoords: { lat: 24.7136, lng: 46.6753 } // Default Riyadh coords
        }
      };

      await addDoc(collection(db, 'orders'), orderData);
      setStep(3);
      onSuccess();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
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
        className="relative bg-white w-full max-w-xl rounded-t-[40px] sm:rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            {step > 1 && step < 3 && (
              <button onClick={() => setStep(step - 1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className={`w-6 h-6 ${lang === 'ar' ? 'rotate-180' : ''}`} />
              </button>
            )}
            <h2 className="text-3xl font-black tracking-tighter uppercase italic">
              {step === 1 ? t({ en: 'Delivery Info', ar: 'معلومات التوصيل' }) : 
               step === 2 ? t({ en: 'Payment', ar: 'الدفع' }) : 
               t({ en: 'Success!', ar: 'تم بنجاح!' })}
            </h2>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-8">
              <div className="p-6 bg-emerald-50 rounded-[32px] border border-emerald-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <Truck className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">{t({ en: 'Delivery Speed', ar: 'سرعة التوصيل' })}</p>
                  <p className="text-lg font-black">{t({ en: 'Express (15-30 mins)', ar: 'سريع (15-30 دقيقة)' })}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">{t({ en: 'Delivery Address', ar: 'عنوان التوصيل' })}</label>
                  <div className="relative">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={t({ en: 'Enter your full address', ar: 'أدخل عنوانك بالكامل' })}
                      className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-3xl font-bold transition-all outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">{t({ en: 'Phone Number', ar: 'رقم الجوال' })}</label>
                  <div className="relative">
                    <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+966 5X XXX XXXX"
                      className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-3xl font-bold transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-4">
                {appSettings?.paymentMethods?.online && (
                  <button 
                    onClick={() => setPaymentMethod('online')}
                    className={`p-6 rounded-[32px] border-2 transition-all flex items-center justify-between group ${paymentMethod === 'online' ? 'border-black bg-black text-white shadow-2xl' : 'border-gray-100 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${paymentMethod === 'online' ? 'bg-white/20' : 'bg-gray-100'}`}>
                        <CreditCard className="w-7 h-7" />
                      </div>
                      <div className="text-left">
                        <p className="font-black text-lg">{t({ en: 'Pay Online', ar: 'دفع أونلاين' })}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${paymentMethod === 'online' ? 'text-white/60' : 'text-gray-400'}`}>Mada, Visa, Apple Pay</p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'online' ? 'border-white bg-emerald-500' : 'border-gray-200'}`}>
                      {paymentMethod === 'online' && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                  </button>
                )}

                {appSettings?.paymentMethods?.cod && (
                  <button 
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-6 rounded-[32px] border-2 transition-all flex items-center justify-between group ${paymentMethod === 'cod' ? 'border-black bg-black text-white shadow-2xl' : 'border-gray-100 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${paymentMethod === 'cod' ? 'bg-white/20' : 'bg-gray-100'}`}>
                        <Banknote className="w-7 h-7" />
                      </div>
                      <div className="text-left">
                        <p className="font-black text-lg">{t({ en: 'Cash on Delivery', ar: 'الدفع عند الاستلام' })}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${paymentMethod === 'cod' ? 'text-white/60' : 'text-gray-400'}`}>Pay when you receive</p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-white bg-emerald-500' : 'border-gray-200'}`}>
                      {paymentMethod === 'cod' && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                  </button>
                )}
              </div>

              <div className="p-8 bg-gray-50 rounded-[40px] space-y-4">
                <div className="flex justify-between text-sm font-bold text-gray-400 uppercase tracking-widest">
                  <span>{t({ en: 'Subtotal', ar: 'المجموع الفرعي' })}</span>
                  <span>{total.toFixed(2)} {t(config.currency.symbol)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-400 uppercase tracking-widest">
                  <span>{t({ en: 'Delivery Fee', ar: 'رسوم التوصيل' })}</span>
                  <span className="text-emerald-600">{t({ en: 'FREE', ar: 'مجاني' })}</span>
                </div>
                <div className="pt-4 border-t-2 border-dashed border-gray-200 flex justify-between items-center">
                  <span className="text-xl font-black uppercase tracking-tighter">{t({ en: 'Total', ar: 'الإجمالي' })}</span>
                  <span className="text-3xl font-black">{total.toFixed(2)} {t(config.currency.symbol)}</span>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-12 text-center">
              <div className="w-32 h-32 bg-emerald-500 text-white rounded-[48px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-200 animate-bounce">
                <CheckCircle2 className="w-16 h-16" />
              </div>
              <h3 className="text-4xl font-black tracking-tighter mb-4">{t({ en: 'Order Placed!', ar: 'تم الطلب بنجاح!' })}</h3>
              <p className="text-gray-500 text-lg font-medium max-w-xs mx-auto leading-relaxed">
                {t({ en: 'Your order has been received and is being prepared.', ar: 'تم استلام طلبك وجاري تحضيره الآن.' })}
              </p>
              <div className="mt-12 p-6 bg-gray-50 rounded-[32px] border border-gray-100 inline-block">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t({ en: 'Estimated Delivery', ar: 'التوصيل المتوقع' })}</p>
                <p className="text-2xl font-black text-emerald-600">15 - 25 MINS</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-gray-100 shrink-0">
          {step < 3 ? (
            <button 
              onClick={() => step === 1 ? setStep(2) : handleCheckout()}
              disabled={loading || (step === 1 && (!address || !phone))}
              className="w-full py-6 bg-black text-white rounded-[32px] font-black text-xl hover:bg-gray-900 transition-all shadow-2xl shadow-black/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {step === 1 ? t({ en: 'Continue to Payment', ar: 'المتابعة للدفع' }) : t({ en: 'Confirm Order', ar: 'تأكيد الطلب' })}
                  <ChevronRight className={`w-6 h-6 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>
          ) : (
            <button 
              onClick={onClose}
              className="w-full py-6 bg-black text-white rounded-[32px] font-black text-xl hover:bg-gray-900 transition-all shadow-2xl shadow-black/20"
            >
              {t({ en: 'Done', ar: 'تم' })}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export const CartDrawer = ({ 
  isOpen, 
  onClose, 
  items, 
  onUpdateQuantity, 
  onRemove 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  items: CartItem[], 
  onUpdateQuantity: (id: string, q: number) => void, 
  onRemove: (id: string) => void 
}) => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[150] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: lang === 'ar' ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: lang === 'ar' ? '-100%' : '100%' }}
              className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black text-white rounded-2xl flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tighter uppercase italic">{t({ en: 'Your Cart', ar: 'سلتك' })}</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <ShoppingBag className="w-20 h-20 mb-6" />
                    <p className="text-xl font-bold">{t({ en: 'Your cart is empty', ar: 'سلتك فارغة' })}</p>
                  </div>
                ) : (
                  items.map(item => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="w-24 h-24 bg-gray-50 rounded-3xl overflow-hidden shrink-0 border border-gray-100">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-lg leading-tight">{item.name}</h3>
                            <button onClick={() => onRemove(item.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-emerald-600 font-black mt-1">{item.price.toFixed(2)} {t(config.currency.symbol)}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                            <button 
                              onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                              className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-10 text-center font-black text-sm">{item.quantity}</span>
                            <button 
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg transition-all"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="font-black text-sm">{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {items.length > 0 && (
                <div className="p-8 border-t border-gray-100 space-y-6 shrink-0">
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-400 text-xs font-bold uppercase tracking-widest">
                      <span>{t({ en: 'Subtotal', ar: 'المجموع الفرعي' })}</span>
                      <span>{total.toFixed(2)} {t(config.currency.symbol)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-black tracking-tighter uppercase italic">{t({ en: 'Total', ar: 'الإجمالي' })}</span>
                      <span className="text-3xl font-black">{total.toFixed(2)} {t(config.currency.symbol)}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsCheckoutOpen(true)}
                    className="w-full py-6 bg-black text-white rounded-[32px] font-black text-xl hover:bg-gray-900 transition-all shadow-2xl shadow-black/20 flex items-center justify-center gap-3"
                  >
                    {t({ en: 'Checkout', ar: 'إتمام الطلب' })}
                    <ChevronRight className={`w-6 h-6 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={items}
        total={total}
        onSuccess={() => {
          // Clear cart logic would go here
        }}
      />
    </>
  );
};
