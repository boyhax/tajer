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
import { Order, Store } from '../../../types';
import { AuthContext } from '../../../contexts/AuthContext';
import { LanguageContext } from '../../../contexts/LanguageContext';
import { OperationType, handleFirestoreError } from '../../../services/firebaseService';
import { 
  Store as StoreIcon, 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  ChevronRight, 
  X, 
  User, 
  Package, 
  Activity, 
  Power, 
  ShieldCheck, 
  Star, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const StoreDashboard = () => {
  const { user } = useContext(AuthContext);
  const { t, lang } = useContext(LanguageContext);
  const [store, setStore] = useState<Store | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'stores', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Store;
        setStore(data);
        setIsOnline(data.status === 'online');
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, `stores/${user.uid}`));
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user || !isOnline) {
      setOrders([]);
      return;
    }
    const q = query(collection(db, 'orders'), where('storeId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));
    return unsub;
  }, [user, isOnline]);

  const toggleOnline = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'stores', user.uid), {
        status: isOnline ? 'offline' : 'online',
        lastActive: serverTimestamp()
      });
      setIsOnline(!isOnline);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `stores/${user.uid}`);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50"><div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (!store?.isVerified) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-center">
      <div className="max-w-md bg-white p-12 rounded-[48px] shadow-2xl border border-gray-100">
        <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-amber-100">
          <ShieldCheck className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black mb-4 tracking-tight">{t({ en: 'Verification Pending', ar: 'قيد التحقق' })}</h2>
        <p className="text-gray-500 mb-10 leading-relaxed font-medium">{t({ en: 'Your store is currently under review. We will notify you once you are verified to start receiving orders.', ar: 'متجرك قيد المراجعة حاليًا. سنقوم بإخطارك بمجرد التحقق منك لبدء تلقي الطلبات.' })}</p>
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-gray-400 font-bold uppercase tracking-widest">
          {t({ en: 'Status: Under Review', ar: 'الحالة: قيد المراجعة' })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <header className="bg-white border-b border-gray-100 p-6 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <StoreIcon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">{store.name}</h1>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{isOnline ? t({ en: 'Accepting Orders', ar: 'نستقبل الطلبات' }) : t({ en: 'Closed', ar: 'مغلق' })}</span>
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
            {isOnline ? t({ en: 'Close Store', ar: 'إغلاق المتجر' }) : t({ en: 'Open Store', ar: 'فتح المتجر' })}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: DollarSign, label: { en: 'Total Sales', ar: 'إجمالي المبيعات' }, value: '1,245.50', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: ShoppingBag, label: { en: 'Orders Today', ar: 'طلبات اليوم' }, value: '24', color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: TrendingUp, label: { en: 'Growth', ar: 'النمو' }, value: '+12%', color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6`}>
                <stat.icon className="w-7 h-7" />
              </div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t(stat.label)}</p>
              <p className="text-4xl font-black">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-2xl font-black tracking-tight">{t({ en: 'Incoming Orders', ar: 'الطلبات الواردة' })}</h3>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black rounded-full uppercase tracking-widest">
                {orders.filter(o => o.status === 'pending').length} {t({ en: 'New', ar: 'جديد' })}
              </span>
            </div>

            <div className="space-y-4">
              {orders.filter(o => o.status === 'pending').map(order => (
                <div key={order.id} className="bg-white p-8 rounded-[40px] border border-gray-100 hover:border-emerald-500 transition-all shadow-sm group">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">
                        <Package className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-black tracking-tight">#{order.id.slice(0, 8)}</h4>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{new Date(order.createdAt?.seconds * 1000).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-emerald-600">{order.totalAmount.toFixed(2)}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t({ en: 'Total Amount', ar: 'المبلغ الإجمالي' })}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-3xl mb-8 border border-gray-100">
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm font-bold">
                          <span className="text-gray-500">{item.name} × {item.quantity}</span>
                          <span>{item.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'paid')}
                      className="flex-1 py-5 bg-emerald-500 text-white rounded-2xl font-black text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100"
                    >
                      {t({ en: 'Accept Order', ar: 'قبول الطلب' })}
                    </button>
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      className="px-8 py-5 bg-red-50 text-red-500 rounded-2xl font-black hover:bg-red-100 transition-all"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ))}

              {orders.filter(o => o.status === 'pending').length === 0 && (
                <div className="py-20 text-center bg-white rounded-[48px] border-2 border-dashed border-gray-100">
                  <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Activity className="w-10 h-10 text-gray-200" />
                  </div>
                  <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">{t({ en: 'Waiting for orders...', ar: 'في انتظار الطلبات...' })}</h3>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-black text-white p-8 rounded-[48px] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <h3 className="text-xl font-black mb-6 tracking-tight">{t({ en: 'Store Performance', ar: 'أداء المتجر' })}</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-2 text-white/60">
                    <span>{t({ en: 'Order Completion', ar: 'إكمال الطلبات' })}</span>
                    <span>98%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[98%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-2 text-white/60">
                    <span>{t({ en: 'Customer Satisfaction', ar: 'رضا العملاء' })}</span>
                    <span>4.9/5.0</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[94%]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[48px] border border-gray-100 shadow-sm">
              <h3 className="text-xl font-black mb-6 tracking-tight">{t({ en: 'Recent History', ar: 'السجل الأخير' })}</h3>
              <div className="space-y-4">
                {orders.filter(o => o.status === 'paid').slice(0, 5).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-3xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black text-sm">#{order.id.slice(0, 8)}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(order.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="font-black text-emerald-600">{order.totalAmount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
