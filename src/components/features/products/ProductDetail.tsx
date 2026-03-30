import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Heart, 
  ShoppingCart 
} from 'lucide-react';
import { 
  useCart, 
  useLanguage, 
  useWishlist, 
  useAuth 
} from '../../../contexts';
import { Product, ProductVariant } from '../../../types';
import { config } from '../../../lib/config';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

export const ProductDetail = ({ product, onBack }: ProductDetailProps) => {
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);

  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const hasDiscount = product.discount && product.discount > 0;
  const discountedPrice = hasDiscount ? currentPrice * (1 - product.discount! / 100) : currentPrice;

  return (
    <div className="max-w-6xl mx-auto p-3 md:p-8 flex flex-col md:flex-row gap-4 md:gap-12">
      <div className="flex-1">
        <button onClick={onBack} className="flex items-center gap-1 text-gray-500 mb-3 md:mb-8 hover:text-black transition-colors text-xs md:text-sm">
          <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" /> {t({ en: 'Back to Shop', ar: 'العودة للمتجر' })}
        </button>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="aspect-square md:aspect-[4/5] bg-gray-100 rounded-xl md:rounded-3xl overflow-hidden relative"
        >
          <img 
            src={product.image || undefined} 
            alt={t(product.locals.name)} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {user && (
            <button 
              onClick={() => toggleWishlist(product.id)}
              className={`absolute top-2 right-2 p-1.5 md:top-6 md:right-6 md:p-4 rounded-lg md:rounded-2xl shadow-lg backdrop-blur-md transition-all ${
                isInWishlist(product.id) 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/90 text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 md:w-6 md:h-6 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
            </button>
          )}
          {hasDiscount && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-1.5 py-0.5 md:top-6 md:left-6 md:px-4 md:py-2 rounded-md md:rounded-xl font-bold shadow-lg text-[8px] md:text-sm">
              {product.discount}% OFF
            </div>
          )}
        </motion.div>
      </div>
      <div className="flex-1 py-2 md:py-12">
        <span className="text-[8px] md:text-xs font-bold uppercase tracking-widest text-gray-400 mb-0.5 md:mb-2 block">{product.brand}</span>
        <h1 className="text-xl md:text-5xl font-bold mb-2 md:mb-6 tracking-tight leading-tight">{t(product.locals.name)}</h1>
        <p className="text-gray-600 text-xs md:text-lg leading-relaxed mb-3 md:mb-8">{t(product.locals.description)}</p>
        
        <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-10">
          <div className="text-xl md:text-4xl font-black">
            {discountedPrice.toFixed(2)} {t(config.currency.symbol)}
          </div>
          {hasDiscount && (
            <div className="text-sm md:text-2xl text-gray-400 line-through font-bold">
              {currentPrice.toFixed(2)} {t(config.currency.symbol)}
            </div>
          )}
        </div>

        {product.hasVariants && product.variants && product.variants.length > 0 && (
          <div className="mb-3 md:mb-10 space-y-1.5 md:space-y-4">
            <h3 className="text-[8px] md:text-sm font-bold uppercase tracking-widest text-gray-400">{t({ en: 'Select Variant', ar: 'اختر النوع' })}</h3>
            <div className="flex flex-wrap gap-1.5 md:gap-3">
              {product.variants.map(variant => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant)}
                  className={`px-3 py-1.5 md:px-6 md:py-3 rounded-lg md:rounded-2xl font-bold transition-all border-2 text-xs md:text-base ${
                    selectedVariant?.id === variant.id 
                      ? 'border-black bg-black text-white shadow-md' 
                      : 'border-gray-100 hover:border-gray-300'
                  }`}
                >
                  {t(variant.name)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 md:gap-6 mb-4 md:mb-10">
          <div className="flex items-center bg-gray-100 rounded-lg md:rounded-2xl p-0.5 md:p-2">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center hover:bg-white rounded-md md:rounded-xl transition-all text-sm md:text-base"
            >
              -
            </button>
            <span className="w-8 md:w-12 text-center font-bold text-base md:text-xl">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center hover:bg-white rounded-md md:rounded-xl transition-all text-sm md:text-base"
            >
              +
            </button>
          </div>
        </div>
        
        <button 
          onClick={() => {
            if (product.hasVariants && !selectedVariant) {
              return;
            }
            const itemToCart = {
              ...product,
              price: discountedPrice,
              id: selectedVariant ? `${product.id}_${selectedVariant.id}` : product.id,
              name: selectedVariant ? `${product.name} (${t(selectedVariant.name)})` : product.name,
              locals: {
                ...product.locals,
                name: selectedVariant ? {
                  en: `${product.locals.name.en} (${selectedVariant.name.en})`,
                  ar: `${product.locals.name.ar} (${selectedVariant.name.ar})`
                } : product.locals.name
              }
            };
            for(let i = 0; i < quantity; i++) {
              addToCart(itemToCart);
            }
          }}
          className="w-full bg-black text-white py-3.5 md:py-6 rounded-xl md:rounded-3xl font-bold text-base md:text-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.98]"
        >
          <ShoppingCart className="w-4 h-4 md:w-6 md:h-6" /> {t({ en: 'Add to Shopping Bag', ar: 'أضف إلى حقيبة التسوق' })}
        </button>
      </div>
    </div>
  );
};
