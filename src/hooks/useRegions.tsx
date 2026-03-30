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
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { Region } from '../types';

interface RegionsContextType {
  regions: Region[];
  loading: boolean;
  addRegion: (region: Omit<Region, 'id' | 'createdAt'>) => Promise<void>;
  updateRegion: (id: string, data: Partial<Region>) => Promise<void>;
  deleteRegion: (id: string) => Promise<void>;
}

const RegionsContext = createContext<RegionsContextType>({
  regions: [],
  loading: true,
  addRegion: async () => {},
  updateRegion: async () => {},
  deleteRegion: async () => {}
});

export const RegionsProvider = ({ children }: { children: React.ReactNode }) => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'regions'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Region));
      setRegions(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching regions:', error);
      setLoading(false);
    });
    return unsub;
  }, []);

  const addRegion = async (region: Omit<Region, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'regions'), {
      ...region,
      createdAt: serverTimestamp()
    });
  };

  const updateRegion = async (id: string, data: Partial<Region>) => {
    await updateDoc(doc(db, 'regions', id), data);
  };

  const deleteRegion = async (id: string) => {
    await deleteDoc(doc(db, 'regions', id));
  };

  return (
    <RegionsContext.Provider value={{ regions, loading, addRegion, updateRegion, deleteRegion }}>
      {children}
    </RegionsContext.Provider>
  );
};

export const useRegions = () => useContext(RegionsContext);
