import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { DeliveryMethod } from '../types';

interface DeliveryMethodsContextType {
  deliveryMethods: DeliveryMethod[];
  loading: boolean;
  addDeliveryMethod: (method: Omit<DeliveryMethod, 'id' | 'createdAt'>) => Promise<void>;
  updateDeliveryMethod: (id: string, data: Partial<DeliveryMethod>) => Promise<void>;
  deleteDeliveryMethod: (id: string) => Promise<void>;
  setDefaultMethod: (id: string) => Promise<void>;
}

const DeliveryMethodsContext = createContext<DeliveryMethodsContextType>({
  deliveryMethods: [],
  loading: true,
  addDeliveryMethod: async () => {},
  updateDeliveryMethod: async () => {},
  deleteDeliveryMethod: async () => {},
  setDefaultMethod: async () => {}
});

export const DeliveryMethodsProvider = ({ children }: { children: React.ReactNode }) => {
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'deliveryMethods'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DeliveryMethod));
      setDeliveryMethods(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching delivery methods:', error);
      setLoading(false);
    });
    return unsub;
  }, []);

  const addDeliveryMethod = async (method: Omit<DeliveryMethod, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'deliveryMethods'), {
      ...method,
      createdAt: serverTimestamp()
    });
  };

  const updateDeliveryMethod = async (id: string, data: Partial<DeliveryMethod>) => {
    await updateDoc(doc(db, 'deliveryMethods', id), data);
  };

  const deleteDeliveryMethod = async (id: string) => {
    await deleteDoc(doc(db, 'deliveryMethods', id));
  };

  const setDefaultMethod = async (id: string) => {
    const batch = writeBatch(db);
    const snapshot = await getDocs(collection(db, 'deliveryMethods'));
    snapshot.docs.forEach(d => {
      batch.update(d.ref, { isDefault: d.id === id });
    });
    await batch.commit();
  };

  return (
    <DeliveryMethodsContext.Provider value={{ 
      deliveryMethods, 
      loading, 
      addDeliveryMethod, 
      updateDeliveryMethod, 
      deleteDeliveryMethod,
      setDefaultMethod
    }}>
      {children}
    </DeliveryMethodsContext.Provider>
  );
};

export const useDeliveryMethods = () => useContext(DeliveryMethodsContext);
