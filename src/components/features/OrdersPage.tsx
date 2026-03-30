import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, X, Navigation } from 'lucide-react';
import { db } from '../../firebase';
import { Order } from '../../types';
import { useAuth, useLanguage } from '../../contexts';
import { OperationType, handleFirestoreError } from '../../lib/error';
import { config } from '../../lib/config';

// Placeholder for DeliveryTracker if not exported elsewhere
const DeliveryTracker = ({ driverId, destinationCoords }: { driverId: string, destinationCoords: any }) => (
  <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
    <p className="text-sm text-gray-500">Real-time tracking for driver {driverId}</p>
    <p className="text-[10px] text-gray-400 mt-1">Destination: {destinationCoords.lat}, {destinationCoords.lng}</p>
  </div>
);

export const TrackingDrawer = ({ 
  isOpen, 
  onClose, 
  order, 
  t 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  order: Order | null,
  t: (ls: any) => string
}) => {
  if (!order || !order.driverId) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="relative bg-white w-full max-w-xl rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{t({ en: 'Track Your Order', ar: 'تتبع طلبك' })}</h2>
                  <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">#{order.id.slice(0, 8)}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <DeliveryTracker 
                driverId={order.driverId} 
                destinationCoords={order.customerInfo.destinationCoords} 
              />
            </div>

            <div className="p-6 border-t border-gray-100 shrink-0">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-900 transition-all shadow-lg shadow-black/10"
              >
                {t({ en: 'Close Tracking', ar: 'إغلاق التتبع' })}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const OrdersPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));
    return unsub;
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto p-1.5 md:p-4">
      <h1 className="text-xl md:text-4xl font-bold mb-3 md:mb-12">{t({ en: 'My Orders', ar: 'طلباتي' })}</h1>
      <div className="space-y-2 md:space-y-6">
        {orders.map(order => (
          <div key={order.id} className="bg-white border border-gray-100 rounded-lg md:rounded-2xl p-2.5 md:p-6 shadow-sm">
            <div className="flex justify-between items-start mb-1.5 md:mb-4">
              <div>
                <div className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 md:mb-1">{t({ en: 'Order ID', ar: 'رقم الطلب' })}</div>
                <div className="font-mono text-[8px] md:text-sm">{order.id}</div>
              </div>
              <div className={`px-1 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-[10px] font-bold uppercase ${
                order.status === 'paid' ? 'bg-green-100 text-green-600' : 
                order.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
              }`}>
                {t({ en: order.status, ar: order.status === 'paid' ? 'مدفوع' : order.status === 'pending' ? 'قيد الانتظار' : 'فشل' })}
              </div>
            </div>
            <div className="space-y-0.5 md:space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[9px] md:text-sm text-gray-600">
                  <span>{item.name} × {item.quantity}</span>
                  <span>{(item.price * item.quantity).toFixed(2)} {t(config.currency.symbol)}</span>
                </div>
              ))}
            </div>
            <div className="mt-1.5 md:mt-4 pt-1.5 md:pt-4 border-t flex justify-between items-center">
              <span className="text-gray-400 text-[8px] md:text-xs">{new Date(order.createdAt?.seconds * 1000).toLocaleDateString()}</span>
              <span className="font-bold text-xs md:text-lg">{order.totalAmount.toFixed(2)} {t(config.currency.symbol)}</span>
            </div>
            
            {order.deliveryStatus === 'picked_up' && order.driverId && (
              <div className="mt-2 md:mt-6">
                <button 
                  onClick={() => {
                    setTrackingOrder(order);
                    setIsTrackingOpen(true);
                  }}
                  className="w-full py-2 md:py-4 bg-emerald-50 text-emerald-600 rounded-lg md:rounded-2xl font-bold text-[9px] md:text-sm hover:bg-emerald-100 transition-all flex items-center justify-center gap-1 md:gap-2 border border-emerald-100"
                >
                  <Navigation className="w-3 h-3 md:w-4 md:h-4 animate-pulse" />
                  {t({ en: 'Track Real-time Delivery', ar: 'تتبع التوصيل المباشر' })}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <TrackingDrawer 
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        order={trackingOrder}
        t={t}
      />
    </div>
  );
};
