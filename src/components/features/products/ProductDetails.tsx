import React, { useState, useEffect, useContext } from 'react';
import { 
  X, 
  Heart, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Star, 
  ChevronRight, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  Share2, 
  Info, 
  CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, ProductVariant } from '../../../types';
import { useLanguage, useAuth } from '../../../contexts';
import { db } from '../../../firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  onSnapshot 
} from 'firebase/firestore';
import { OperationType, handleFirestoreError } from '../../../lib/error';
import { config } from '../../../lib/config';

export const ProductDetails = ({ 
  product, 
  onClose, 
  onAddToCart 
}: { 
  product: Product | null, 
  onClose: () => void, 
  onAddToCart: (p: Product, q: number, v?: ProductVariant) => void 
}) => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product?.variants && product.variants.length > 0 ? product.variants[0] : undefined
  );
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'shipping'>('details');

  useEffect(() => {
    if (!user || !product) return;
    const q = query(collection(db, 'wishlist'), where('userId', '==', user.uid), where('productId', '==', product.id));
    const unsub = onSnapshot(q, (snap) => {
      setIsWishlisted(!snap.empty);
    });
    return unsub;
  }, [user, product]);

  const toggleWishlist = async () => {
    if (!user || !product) return;
    try {
      const q = query(collection(db, 'wishlist'), where('userId', '==', user.uid), where('productId', '==', product.id));
      const snap = await getDocs(q);
      if (snap.empty) {
        await addDoc(collection(db, 'wishlist'), { userId: user.uid, productId: product.id });
      } else {
        await deleteDoc(snap.docs[0].ref);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'wishlist');
    }
  };

  if (!product) return null;

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center p-0 sm:p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="relative bg-white w-full max-w-5xl h-[95vh] sm:h-auto sm:max-h-[90vh] rounded-t-[40px] sm:rounded-[48px] shadow-2xl overflow-hidden flex flex-col sm:flex-row"
        >
          <div className="w-full sm:w-1/2 h-80 sm:h-auto relative bg-gray-50 flex items-center justify-center p-8">
            <motion.img 
              layoutId={`product-image-${product.id}`}
              src={product.image} 
              alt={product.name[lang]} 
              className="w-full h-full object-contain drop-shadow-2xl"
            />
            <div className="absolute top-8 left-8 flex gap-2">
              {product.discount && (
                <div className="px-4 py-2 bg-red-500 text-white text-xs font-black rounded-2xl shadow-lg shadow-red-200 uppercase tracking-widest">
                  -{product.discount}%
                </div>
              )}
              {product.isFeatured && (
                <div className="px-4 py-2 bg-black text-white text-xs font-black rounded-2xl shadow-lg shadow-black/20 uppercase tracking-widest">
                  {t({ en: 'Featured', ar: 'مميز' })}
                </div>
              )}
            </div>
            <button 
              onClick={onClose}
              className="absolute top-8 right-8 p-4 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl hover:bg-white transition-all sm:hidden"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 p-8 sm:p-12 overflow-y-auto flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-gray-100 text-[10px] font-black rounded-full uppercase tracking-widest text-gray-400">
                    {product.category || (product.categories && product.categories[0])}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-[10px] font-black">4.8 (124)</span>
                  </div>
                </div>
                <h2 className="text-4xl font-black tracking-tighter leading-none">{product.name[lang]}</h2>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={toggleWishlist}
                  className={`p-4 rounded-3xl border-2 transition-all ${isWishlisted ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-gray-100 text-gray-300 hover:border-black hover:text-black'}`}
                >
                  <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
                <button className="p-4 bg-white border-2 border-gray-100 rounded-3xl text-gray-300 hover:border-black hover:text-black transition-all">
                  <Share2 className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex items-baseline gap-4 mb-8">
              <span className="text-5xl font-black tracking-tighter">{currentPrice.toFixed(2)} {t(config.currency.symbol)}</span>
              {product.discount && (
                <span className="text-xl text-gray-300 line-through font-bold">
                  {(currentPrice / (1 - product.discount / 100)).toFixed(2)}
                </span>
              )}
            </div>

            {product.variants && product.variants.length > 0 && (
              <div className="mb-8">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{t({ en: 'Select Variant', ar: 'اختر النوع' })}</p>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((v, i) => (
                    <button 
                      key={i}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all border-2 ${selectedVariant?.name === v.name ? 'bg-black text-white border-black shadow-xl shadow-black/20' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300'}`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-8 border-b border-gray-100 mb-8">
              {['details', 'reviews', 'shipping'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-black' : 'text-gray-300'}`}
                >
                  {t({ en: tab, ar: tab === 'details' ? 'التفاصيل' : tab === 'reviews' ? 'التقييمات' : 'الشحن' })}
                  {activeTab === tab && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-1 bg-black rounded-full" />}
                </button>
              ))}
            </div>

            <div className="flex-1 mb-12">
              <p className="text-gray-500 leading-relaxed text-lg font-medium">
                {product.description[lang]}
              </p>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                  <Truck className="w-5 h-5 text-emerald-500" />
                  <span className="text-xs font-bold">{t({ en: 'Free Delivery', ar: 'توصيل مجاني' })}</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                  <span className="text-xs font-bold">{t({ en: 'Secure Payment', ar: 'دفع آمن' })}</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                  <RotateCcw className="w-5 h-5 text-orange-500" />
                  <span className="text-xs font-bold">{t({ en: 'Easy Returns', ar: 'إرجاع سهل' })}</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                  <Info className="w-5 h-5 text-purple-500" />
                  <span className="text-xs font-bold">{t({ en: 'Quality Assured', ar: 'جودة مضمونة' })}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-auto">
              <div className="flex items-center bg-gray-100 p-2 rounded-3xl border-2 border-transparent focus-within:border-black transition-all">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 flex items-center justify-center hover:bg-white rounded-2xl transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-16 text-center text-xl font-black">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 flex items-center justify-center hover:bg-white rounded-2xl transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button 
                onClick={() => {
                  onAddToCart(product, quantity, selectedVariant);
                  onClose();
                }}
                className="flex-1 py-6 bg-black text-white rounded-[32px] font-black text-xl hover:bg-gray-900 transition-all shadow-2xl shadow-black/20 flex items-center justify-center gap-4 group"
              >
                <ShoppingBag className="w-6 h-6 transition-transform group-hover:-translate-y-1" />
                {t({ en: 'Add to Cart', ar: 'أضف للسلة' })}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
