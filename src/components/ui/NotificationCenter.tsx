import React, { useState, useEffect, useContext } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { AppNotification } from '../../types';
import { AuthContext } from '../../contexts/AuthContext';
import { LanguageContext } from '../../contexts/LanguageContext';
import { OperationType, handleFirestoreError } from '../../lib/error';
import { 
  Bell, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  ChevronRight, 
  Trash2, 
  Sparkles, 
  Gift, 
  Truck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const NotificationCenter = ({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean, 
  onClose: () => void 
}) => {
  const { user } = useContext(AuthContext);
  const { t, lang } = useContext(LanguageContext);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'notifications'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as AppNotification)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'notifications'));
    return unsub;
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <Truck className="w-5 h-5" />;
      case 'promo': return <Gift className="w-5 h-5" />;
      case 'system': return <Info className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'order': return 'bg-blue-50 text-blue-500';
      case 'promo': return 'bg-emerald-50 text-emerald-500';
      case 'system': return 'bg-amber-50 text-amber-500';
      default: return 'bg-gray-50 text-gray-500';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex justify-end">
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
            <div className="p-8 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-xl shadow-black/10">
                  <Bell className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase italic">{t({ en: 'Inbox', ar: 'الإشعارات' })}</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{notifications.filter(n => !n.isRead).length} {t({ en: 'Unread', ar: 'غير مقروء' })}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                  <Bell className="w-24 h-24 mb-6" />
                  <p className="text-2xl font-black uppercase tracking-tighter italic">{t({ en: 'No notifications', ar: 'لا توجد إشعارات' })}</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id}
                    onClick={() => !notif.isRead && markAsRead(notif.id)}
                    className={`p-6 rounded-[32px] border-2 transition-all cursor-pointer group relative ${notif.isRead ? 'bg-white border-gray-50' : 'bg-emerald-50 border-emerald-100 shadow-lg shadow-emerald-100'}`}
                  >
                    {!notif.isRead && <div className="absolute top-6 right-6 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />}
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${getColor(notif.type)}`}>
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-lg leading-tight mb-1">{notif.title[lang]}</h4>
                        <p className="text-gray-500 text-sm font-medium leading-relaxed mb-3">{notif.body[lang]}</p>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                          {new Date(notif.createdAt?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-8 border-t border-gray-100 shrink-0">
              <button 
                onClick={onClose}
                className="w-full py-5 bg-black text-white rounded-[32px] font-black text-lg hover:bg-gray-900 transition-all shadow-2xl shadow-black/20"
              >
                {t({ en: 'Close', ar: 'إغلاق' })}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
