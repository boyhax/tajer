import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlist: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

export const WishlistContext = createContext<WishlistContextType>({
  wishlist: [],
  toggleWishlist: async () => {},
  isInWishlist: () => false
});

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      setWishlist([]);
      return;
    }

    const q = query(collection(db, 'wishlist'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setWishlist(snap.docs.map(doc => doc.data().productId));
    });
    return unsub;
  }, [user]);

  const toggleWishlist = async (productId: string) => {
    if (!user) return;

    const q = query(
      collection(db, 'wishlist'), 
      where('userId', '==', user.uid), 
      where('productId', '==', productId)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      await addDoc(collection(db, 'wishlist'), {
        userId: user.uid,
        productId,
        createdAt: serverTimestamp()
      });
    } else {
      await deleteDoc(doc(db, 'wishlist', snap.docs[0].id));
    }
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
