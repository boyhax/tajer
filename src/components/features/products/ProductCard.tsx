import React from 'react';
import { motion } from 'motion/react';
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  Clock 
} from 'lucide-react';
import { 
  useLanguage, 
  useWishlist, 
  useCart, 
  useAuth 
} from '../../../contexts';
import { Product } from '../../../types';
import { config } from '../../../lib/config';

interface ProductCardProps {
  product: Product;
  onSelect: (p: Product) => void;
  variant?: 'default' | 'local-delivery' | 'minimal';
  key?: string;
}

export const ProductCard = ({ 
  product, 
  onSelect,
  variant: propVariant
}: ProductCardProps) => {
  const { t } = useLanguage();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();

  // Determine variant: prop > category-based > global config
  let variant = propVariant || config.productCard.variant;
  
  if (!propVariant) {
    if (product.categories.includes('food') || product.categories.includes('drinks')) {
      variant = 'local-delivery';
    }
  }

  if (variant === 'local-delivery') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="group cursor-pointer relative aspect-[4/5] rounded-2xl md:rounded-[2rem] overflow-hidden transition-all duration-500 shadow-lg"
        onClick={() => onSelect(product)}
        whileHover={{ scale: 0.98 }}
      >
        <img 
          src={product.image || undefined} 
          alt={t(product.locals.name)} 
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10">
          {user && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(product.id);
              }}
              className={`p-1.5 md:p-2 rounded-xl shadow-xl backdrop-blur-md transition-all ${
                isInWishlist(product.id) 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/20 text-white hover:bg-red-500'
              }`}
            >
              <Heart className={`w-3 h-3 md:w-3.5 md:h-3.5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 text-white space-y-1 md:space-y-2">
          <div className="space-y-0.5">
            <h3 className="font-black text-[10px] md:text-sm line-clamp-1 tracking-tight">{t(product.locals.name)}</h3>
            <p className="text-white/60 text-[7px] md:text-[8px] font-bold uppercase tracking-widest">{product.brand}</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="font-black text-lg md:text-2xl tracking-tighter">{product.price}</span>
              <span className="text-[8px] md:text-[10px] font-black text-white/60 uppercase tracking-widest">{t(config.currency.symbol)}</span>
            </div>

            <div className="flex items-center gap-1 md:gap-2 text-[8px] md:text-[10px] font-black uppercase tracking-widest">
              {product.rating && (
                <div className="flex items-center gap-0.5 md:gap-1 bg-white/10 backdrop-blur-md px-1 py-0.5 md:px-1.5 rounded-md">
                  <Star className="w-2.5 h-2.5 md:w-3 md:h-3 text-amber-400 fill-current" />
                  <span>{product.rating}</span>
                </div>
              )}
              {product.deliveryTime && (
                <div className="flex items-center gap-0.5 md:gap-1 bg-white/10 backdrop-blur-md px-1 py-0.5 md:px-1.5 rounded-md">
                  <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  <span>{product.deliveryTime}m</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product);
          }}
          className="absolute bottom-2 right-2 md:bottom-4 md:right-4 w-8 h-8 md:w-10 md:h-10 bg-emerald-500 text-white rounded-lg md:rounded-xl flex items-center justify-center shadow-2xl hover:bg-emerald-600 hover:scale-110 active:scale-95 transition-all z-20 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
        >
          <ShoppingCart className="w-4 h-4 md:w-5 h-5" />
        </button>
      </motion.div>
    );
  }

  if (variant === 'minimal') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="group cursor-pointer relative aspect-square rounded-xl md:rounded-2xl overflow-hidden transition-all duration-500 shadow-md"
        onClick={() => onSelect(product)}
        whileHover={{ scale: 0.98 }}
      >
        <img 
          src={product.image || undefined} 
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
          referrerPolicy="no-referrer" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-1.5 md:p-2 text-white">
          <h4 className="text-[9px] md:text-[10px] font-black truncate tracking-tight">{t(product.locals.name)}</h4>
          <div className="flex items-center gap-1">
            <span className="text-[11px] md:text-[13px] font-black">{product.price}</span>
            <span className="text-[7px] md:text-[8px] font-bold text-white/60 uppercase">{t(config.currency.symbol)}</span>
          </div>
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product);
          }}
          className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-6 h-6 md:w-7 md:h-7 bg-white/20 backdrop-blur-md text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-emerald-500 transition-colors z-10"
        >
          <ShoppingCart className="w-3 h-3 md:w-4 md:h-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group cursor-pointer relative aspect-[4/5] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden transition-all duration-500 shadow-sm"
      onClick={() => onSelect(product)}
      whileHover={{ y: -4 }}
    >
      <img 
        src={product.image || undefined} 
        alt={t(product.locals.name)} 
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      
      <div className="absolute top-2 right-2 md:top-3 md:right-3 flex flex-col gap-1 md:gap-2 z-10">
        {user && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className={`p-1.5 md:p-2 rounded-xl shadow-xl backdrop-blur-md transition-all ${
              isInWishlist(product.id) 
                ? 'bg-red-500 text-white' 
                : 'bg-white/20 text-white hover:bg-red-500'
            }`}
          >
            <Heart className={`w-3 h-3 md:w-3.5 md:h-3.5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-5 text-white">
        <div className="space-y-0.5 md:space-y-1">
          <h3 className="font-black text-xs md:text-base line-clamp-1 tracking-tight">{t(product.locals.name)}</h3>
          <p className="text-white/60 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">{product.brand}</p>
        </div>

        <div className="mt-2 md:mt-4 flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="font-black text-lg md:text-2xl tracking-tighter">{product.price}</span>
            <span className="text-[8px] md:text-[10px] font-black text-white/60 uppercase tracking-widest">{t(config.currency.symbol)}</span>
          </div>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            className="w-8 h-8 md:w-10 md:h-10 bg-white text-black rounded-lg md:rounded-xl flex items-center justify-center shadow-xl hover:bg-emerald-500 hover:text-white transition-all"
          >
            <ShoppingCart className="w-4 h-4 md:w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
