import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  updateDoc, 
  doc, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../firebase';
import { AppNotification } from '../types';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  requestPermission: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  requestPermission: async () => {}
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, 'notifications'), 
      where('userId', '==', user.uid), 
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    });
    return unsub;
  }, [user]);

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const q = query(collection(db, 'notifications'), where('userId', '==', user.uid), where('read', '==', false));
    const snap = await getDocs(q);
    const promises = snap.docs.map(d => updateDoc(doc(db, 'notifications', d.id), { read: true }));
    await Promise.all(promises);
  };

  const requestPermission = async () => {
    if ('Notification' in window) {
      await Notification.requestPermission();
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, requestPermission }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
