import React, { useState, useEffect, useContext } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { Product } from '../../../types';
import { useLanguage } from '../../../contexts';
import { OperationType, handleFirestoreError } from '../../../lib/error';
import { ShoppingBag, Heart, Star, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { config } from '../../../lib/config';

export const ProductGrid = ({ 
  products, 
  onSelect 
}: { 
  products: Product[], 
  onSelect: (p: Product) => void 
}) => {
  const { t, lang } = useLanguage();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
      {products.map(product => (
        <motion.div 
          key={product.id}
          layoutId={`product-${product.id}`}
          onClick={() => onSelect(product)}
          className="group bg-white rounded-[40px] md:rounded-[56px] p-4 md:p-8 border border-gray-100 hover:border-black transition-all cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-black/5 flex flex-col"
        >
          <div className="relative aspect-square mb-6 md:mb-10 flex items-center justify-center bg-gray-50 rounded-[32px] md:rounded-[48px] overflow-hidden">
            <motion.img 
              layoutId={`product-image-${product.id}`}
              src={product.image} 
              alt={t(product.locals.name)} 
              className="w-full h-full object-contain p-4 md:p-8 transition-transform duration-700 group-hover:scale-110"
            />
            {product.discount && (
              <div className="absolute top-4 left-4 md:top-6 md:left-6 px-3 py-1 md:px-4 md:py-2 bg-red-500 text-white text-[8px] md:text-[10px] font-black rounded-full shadow-lg shadow-red-200 uppercase tracking-widest">
                -{product.discount}%
              </div>
            )}
            <button className="absolute top-4 right-4 md:top-6 md:right-6 p-2 md:p-3 bg-white/80 backdrop-blur-md rounded-2xl text-gray-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
              <Heart className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-1 md:gap-2 mb-2 md:mb-3">
              <div className="flex items-center gap-0.5 md:gap-1 text-amber-500">
                <Star className="w-2 h-2 md:w-3 md:h-3 fill-current" />
                <span className="text-[8px] md:text-[10px] font-black">4.8</span>
              </div>
              <span className="text-[8px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest">
                {product.categories[0]}
              </span>
            </div>
            <h3 className="text-sm md:text-xl font-black tracking-tight leading-tight mb-2 md:mb-4 group-hover:text-emerald-600 transition-colors">
              {t(product.locals.name)}
            </h3>
            <p className="text-gray-400 text-[10px] md:text-xs font-medium line-clamp-2 mb-4 md:mb-8">
              {t(product.locals.description)}
            </p>
          </div>

          <div className="flex items-center justify-between mt-auto">
            <div className="flex flex-col">
              <span className="text-lg md:text-2xl font-black tracking-tighter">
                {product.price.toFixed(2)} {t(config.currency.symbol)}
              </span>
              {product.discount && (
                <span className="text-[10px] md:text-xs text-gray-300 line-through font-bold">
                  {(product.price / (1 - product.discount / 100)).toFixed(2)}
                </span>
              )}
            </div>
            <button className="w-10 h-10 md:w-14 md:h-14 bg-black text-white rounded-2xl md:rounded-3xl flex items-center justify-center transition-all hover:bg-emerald-500 hover:scale-110 shadow-xl shadow-black/10 active:scale-95">
              <Plus className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
