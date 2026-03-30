import React, { useState, useEffect, useContext } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  updateDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { Order, Driver } from '../../../types';
import { useAuth, useLanguage } from '../../../contexts';
import { OperationType, handleFirestoreError } from '../../../lib/error';
import { 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Navigation, 
  Phone, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  ChevronRight, 
  X, 
  User, 
  Package, 
  Map as MapIcon, 
  Activity, 
  Power, 
  ShieldCheck, 
  Star 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const DriverDashboard = () => {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState<Order | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'drivers', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Driver;
        setDriver(data);
        setIsOnline(data.status !== 'offline');
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, `drivers/${user.uid}`));
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user || !isOnline) {
      setOrders([]);
      return;
    }
    const q = query(collection(db, 'orders'), where('driverId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const allOrders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(allOrders);
      const active = allOrders.find(o => ['picked_up', 'assigned'].includes(o.deliveryStatus || ''));
      setActiveOrder(active || null);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));
    return unsub;
  }, [user, isOnline]);

  const toggleOnline = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'drivers', user.uid), {
        status: isOnline ? 'offline' : 'online',
        lastActive: serverTimestamp()
      });
      setIsOnline(!isOnline);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `drivers/${user.uid}`);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        deliveryStatus: status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (!driver?.isVerified) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
      <div className="max-w-md bg-white p-12 rounded-[48px] shadow-2xl border border-gray-100">
        <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-amber-100">
          <ShieldCheck className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black mb-4 tracking-tight">{t({ en: 'Verification Pending', ar: 'قيد التحقق' })}</h2>
        <p className="text-gray-500 mb-10 leading-relaxed font-medium">{t({ en: 'Your driver account is currently under review. We will notify you once you are verified to start accepting orders.', ar: 'حساب السائق الخاص بك قيد المراجعة حاليًا. سنقوم بإخطارك بمجرد التحقق منك لبدء قبول الطلبات.' })}</p>
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-gray-400 font-bold uppercase tracking-widest">
          {t({ en: 'Status: Under Review', ar: 'الحالة: قيد المراجعة' })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <header className="bg-white border-b border-gray-100 p-6 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Truck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">{t({ en: 'Driver Hub', ar: 'مركز السائق' })}</h1>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{isOnline ? t({ en: 'Online', ar: 'متصل' }) : t({ en: 'Offline', ar: 'غير متصل' })}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={toggleOnline}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black transition-all shadow-lg ${
              isOnline 
              ? 'bg-red-50 text-red-500 hover:bg-red-100 shadow-red-100' 
              : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200'
            }`}
          >
            <Power className="w-5 h-5" />
            {isOnline ? t({ en: 'Go Offline', ar: 'قطع الاتصال' }) : t({ en: 'Go Online', ar: 'اتصال' })}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: DollarSign, label: { en: 'Earnings', ar: 'الأرباح' }, value: '245.50', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: Package, label: { en: 'Deliveries', ar: 'التوصيلات' }, value: '12', color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: Star, label: { en: 'Rating', ar: 'التقييم' }, value: '4.9', color: 'text-amber-600', bg: 'bg-amber-50' },
            { icon: Clock, label: { en: 'Hours', ar: 'الساعات' }, value: '34h', color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t(stat.label)}</p>
              <p className="text-2xl font-black">{stat.value}</p>
            </div>
          ))}
        </div>

        {activeOrder ? (
          <div className="bg-emerald-500 rounded-[40px] p-8 text-white shadow-2xl shadow-emerald-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
                    {t({ en: 'Active Delivery', ar: 'توصيل نشط' })}
                  </span>
                  <h2 className="text-4xl font-black tracking-tighter">#{activeOrder.id.slice(0, 8)}</h2>
                </div>
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center">
                  <Activity className="w-8 h-8 animate-pulse" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">{t({ en: 'Customer Location', ar: 'موقع العميل' })}</p>
                      <p className="font-bold text-lg leading-tight">{activeOrder.customerInfo.address}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">{t({ en: 'Contact', ar: 'الاتصال' })}</p>
                      <p className="font-bold text-lg">{activeOrder.customerInfo.phone}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-black/10 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                  <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-4">{t({ en: 'Order Items', ar: 'محتويات الطلب' })}</p>
                  <div className="space-y-2">
                    {activeOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm font-bold">
                        <span>{item.name} × {item.quantity}</span>
                        <span>{item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                {activeOrder.deliveryStatus === 'assigned' ? (
                  <button 
                    onClick={() => updateOrderStatus(activeOrder.id, 'picked_up')}
                    className="flex-1 py-5 bg-white text-emerald-600 rounded-2xl font-black text-lg hover:bg-gray-50 transition-all shadow-xl"
                  >
                    {t({ en: 'Confirm Pickup', ar: 'تأكيد الاستلام' })}
                  </button>
                ) : (
                  <button 
                    onClick={() => updateOrderStatus(activeOrder.id, 'delivered')}
                    className="flex-1 py-5 bg-white text-emerald-600 rounded-2xl font-black text-lg hover:bg-gray-50 transition-all shadow-xl"
                  >
                    {t({ en: 'Mark as Delivered', ar: 'تم التوصيل' })}
                  </button>
                )}
                <button className="w-20 py-5 bg-black/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center hover:bg-black/30 transition-all">
                  <Navigation className="w-8 h-8" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-[48px] border border-gray-100 text-center shadow-sm">
            <div className="w-24 h-24 bg-gray-50 text-gray-200 rounded-[32px] flex items-center justify-center mx-auto mb-8">
              <Package className="w-12 h-12" />
            </div>
            <h3 className="text-3xl font-black mb-2 tracking-tight">{t({ en: 'No Active Orders', ar: 'لا توجد طلبات نشطة' })}</h3>
            <p className="text-gray-400 font-medium max-w-xs mx-auto">
              {isOnline 
                ? t({ en: 'Waiting for new delivery requests in your area...', ar: 'في انتظار طلبات توصيل جديدة في منطقتك...' })
                : t({ en: 'Go online to start receiving delivery requests.', ar: 'اتصل بالإنترنت لبدء تلقي طلبات التوصيل.' })}
            </p>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xl font-black tracking-tight">{t({ en: 'Recent History', ar: 'السجل الأخير' })}</h3>
            <button className="text-xs font-black text-emerald-600 uppercase tracking-widest hover:underline">{t({ en: 'View All', ar: 'عرض الكل' })}</button>
          </div>
          <div className="space-y-4">
            {orders.filter(o => o.deliveryStatus === 'delivered').slice(0, 5).map(order => (
              <div key={order.id} className="bg-white p-6 rounded-[32px] border border-gray-100 flex items-center justify-between hover:border-emerald-500 transition-all group shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-black text-lg">#{order.id.slice(0, 8)}</h4>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{new Date(order.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-emerald-600">+12.50</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t({ en: 'Commission', ar: 'العمولة' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
