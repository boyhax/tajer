import React, { useState, useEffect, useContext } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Product, Store } from '../../types';
import { useLanguage, useLocation } from '../../contexts';
import { OperationType, handleFirestoreError } from '../../lib/error';
import { 
  ShoppingBag, 
  Search, 
  MapPin, 
  ChevronRight, 
  Sparkles, 
  ArrowRight, 
  Filter, 
  LayoutGrid, 
  List, 
  TrendingUp, 
  Clock, 
  Star 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PromotionBanner } from '../ui/PromotionBanner';
import { CategoryList } from './products/CategoryList';
import { ProductGrid } from './products/ProductGrid';
import { StoreSelector } from './store/StoreSelector';

export const HomePage = ({ 
  onProductSelect, 
  onNavigate 
}: { 
  onProductSelect: (p: Product) => void, 
  onNavigate: (page: string) => void 
}) => {
  const { t, lang } = useLanguage();
  const { location } = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isStoreSelectorOpen, setIsStoreSelectorOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  useEffect(() => {
    let q = query(collection(db, 'products'), where('status', '==', 'published'), orderBy('createdAt', 'desc'));
    if (selectedCategory !== 'all') {
      q = query(collection(db, 'products'), where('status', '==', 'published'), where('categories', 'array-contains', selectedCategory), orderBy('createdAt', 'desc'));
    }
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));
    return unsub;
  }, [selectedCategory]);

  const filteredProducts = products.filter(p => 
    t(p.locals.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
    t(p.locals.description).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12 md:space-y-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
              {t({ en: 'Fresh & Fast', ar: 'طازج وسريع' })}
            </span>
          </div>
          <h1 className="text-4xl md:text-8xl font-black tracking-tighter leading-none mb-8 uppercase italic">
            {t({ en: 'Groceries', ar: 'مقاضيك' })}<br />
            <span className="text-emerald-500">{t({ en: 'Delivered.', ar: 'توصلك.' })}</span>
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
            <div className="flex-1 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-black transition-colors" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t({ en: 'Search 5,000+ products...', ar: 'ابحث في أكثر من 5000 منتج...' })}
                className="w-full pl-16 pr-8 py-6 bg-white border-2 border-gray-100 focus:border-black rounded-[32px] font-bold text-lg transition-all outline-none shadow-sm hover:shadow-xl hover:shadow-black/5"
              />
            </div>
            <button 
              onClick={() => setIsStoreSelectorOpen(true)}
              className="px-8 py-6 bg-black text-white rounded-[32px] font-black text-lg hover:bg-gray-900 transition-all shadow-2xl shadow-black/20 flex items-center justify-center gap-4 group"
            >
              <MapPin className="w-6 h-6 transition-transform group-hover:-translate-y-1" />
              <div className="text-left">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">{t({ en: 'Delivering to', ar: 'التوصيل إلى' })}</p>
                <p className="leading-none">{selectedStore?.name || t({ en: 'Select Store', ar: 'اختر المتجر' })}</p>
              </div>
              <ChevronRight className={`w-5 h-5 opacity-40 ${lang === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
        <div className="hidden lg:block w-1/3">
          <div className="bg-emerald-500 p-8 rounded-[48px] text-white shadow-2xl shadow-emerald-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
            <h3 className="text-2xl font-black mb-4 tracking-tight">{t({ en: 'Kuzama Prime', ar: 'خزامة برايم' })}</h3>
            <p className="text-white/80 font-medium mb-8 leading-relaxed">{t({ en: 'Get unlimited free delivery on all orders above 100 SAR.', ar: 'احصل على توصيل مجاني غير محدود لجميع الطلبات فوق 100 ريال.' })}</p>
            <button className="w-full py-4 bg-white text-emerald-600 rounded-2xl font-black hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
              {t({ en: 'Join Now', ar: 'انضم الآن' })}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <PromotionBanner />

      <section>
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic">{t({ en: 'Categories', ar: 'الأقسام' })}</h2>
            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mt-1">{t({ en: 'Browse by department', ar: 'تصفح حسب القسم' })}</p>
          </div>
          <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:text-emerald-500 transition-colors">
            {t({ en: 'View All', ar: 'عرض الكل' })}
            <ChevronRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <CategoryList selectedCategory={selectedCategory} onSelect={setSelectedCategory} />
      </section>

      <section>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic">{t({ en: 'Popular Now', ar: 'الأكثر طلباً' })}</h2>
            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mt-1">{t({ en: 'Trending in your area', ar: 'الأكثر تداولاً في منطقتك' })}</p>
          </div>
          <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-3xl border border-gray-100">
            <button className="p-3 bg-white text-black rounded-2xl shadow-sm">
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button className="p-3 text-gray-400 hover:text-black transition-colors">
              <List className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-2" />
            <button className="flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
              <Filter className="w-4 h-4" />
              {t({ en: 'Filter', ar: 'تصفية' })}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[3/4] bg-gray-50 rounded-[48px] animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <ProductGrid products={filteredProducts} onSelect={onProductSelect} />
        ) : (
          <div className="py-32 text-center bg-gray-50 rounded-[64px] border-2 border-dashed border-gray-100">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
              <ShoppingBag className="w-12 h-12 text-gray-200" />
            </div>
            <h3 className="text-2xl font-black mb-2">{t({ en: 'No products found', ar: 'لم يتم العثور على منتجات' })}</h3>
            <p className="text-gray-400 font-medium">{t({ en: 'Try adjusting your search or category filter.', ar: 'حاول تعديل البحث أو تصفية الأقسام.' })}</p>
          </div>
        )}
      </section>

      <StoreSelector 
        isOpen={isStoreSelectorOpen}
        onClose={() => setIsStoreSelectorOpen(false)}
        onSelect={setSelectedStore}
        selectedStoreId={selectedStore?.id}
      />
    </div>
  );
};
