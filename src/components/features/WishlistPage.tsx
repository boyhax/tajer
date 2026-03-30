import React, { useState, useEffect, useContext } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Product } from '../../types';
import { useAuth, useLanguage } from '../../contexts';
import { OperationType, handleFirestoreError } from '../../lib/error';
import { Heart, ShoppingBag, Search } from 'lucide-react';
import { ProductGrid } from './products/ProductGrid';

export const WishlistPage = ({ onSelectProduct }: { onSelectProduct: (p: Product) => void }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(query(collection(db, 'wishlist'), where('userId', '==', user.uid)), async (snap) => {
      const productIds = snap.docs.map(doc => doc.data().productId);
      if (productIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // Fetch actual products
      const productsQuery = query(collection(db, 'products'), where('__name__', 'in', productIds));
      const productsSnap = await getDocs(productsQuery);
      setProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'wishlist'));

    return unsub;
  }, [user]);

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div></div>;

  if (!user) return (
    <div className="flex flex-col items-center justify-center py-32 px-6 text-center">
      <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-8">
        <Heart className="w-12 h-12" />
      </div>
      <h2 className="text-3xl font-black mb-4">{t({ en: 'Save Your Favorites', ar: 'احفظ مفضلاتك' })}</h2>
      <p className="text-gray-500 mb-10 max-w-sm leading-relaxed">{t({ en: 'Sign in to save products to your wishlist and access them from any device.', ar: 'سجل الدخول لحفظ المنتجات في مفضلتك والوصول إليها من أي جهاز.' })}</p>
      <button className="px-12 py-5 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-xl shadow-black/10">
        {t({ en: 'Sign In Now', ar: 'سجل الدخول الآن' })}
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">{t({ en: 'Wishlist', ar: 'المفضلة' })}</h1>
          <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mt-1">{t({ en: 'Your curated collection', ar: 'مجموعتك المختارة' })}</p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black">{products.length}</span>
          <p className="text-[10px] font-bold text-gray-400 uppercase">{t({ en: 'Items', ar: 'عناصر' })}</p>
        </div>
      </div>

      {products.length > 0 ? (
        <ProductGrid products={products} onSelect={onSelectProduct} />
      ) : (
        <div className="py-32 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-100">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <ShoppingBag className="w-10 h-10 text-gray-200" />
          </div>
          <h3 className="text-2xl font-bold mb-2">{t({ en: 'Your wishlist is empty', ar: 'مفضلتك فارغة' })}</h3>
          <p className="text-gray-400 mb-8">{t({ en: 'Start exploring our collection and save items you love.', ar: 'ابدأ في استكشاف مجموعتنا واحفظ العناصر التي تحبها.' })}</p>
          <button className="px-8 py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2 mx-auto">
            <Search className="w-4 h-4" />
            {t({ en: 'Explore Products', ar: 'استكشف المنتجات' })}
          </button>
        </div>
      )}
    </div>
  );
};
