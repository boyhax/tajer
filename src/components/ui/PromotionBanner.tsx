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
import { Promotion } from '../../types';
import { useLanguage } from '../../contexts';
import { OperationType, handleFirestoreError } from '../../lib/error';
import { Sparkles, ChevronRight, ChevronLeft, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PromotionBanner = () => {
  const { t, lang } = useLanguage();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'promotions'), orderBy('createdAt', 'desc'), limit(5));
    const unsub = onSnapshot(q, (snap) => {
      setPromotions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Promotion)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'promotions'));
    return unsub;
  }, []);

  useEffect(() => {
    if (promotions.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [promotions]);

  if (promotions.length === 0) return null;

  const currentPromo = promotions[currentIndex];

  return (
    <div className="relative h-48 md:h-80 rounded-[40px] md:rounded-[64px] overflow-hidden group shadow-2xl shadow-black/10">
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          className="absolute inset-0"
        >
          <img 
            src={currentPromo.image || `https://picsum.photos/seed/${currentPromo.id}/1200/600`} 
            alt={currentPromo.title[lang]} 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <Gift className="w-6 h-6" />
              </div>
              <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                {t({ en: 'Special Offer', ar: 'عرض خاص' })}
              </span>
            </div>
            <h2 className="text-3xl md:text-6xl font-black text-white tracking-tighter mb-4 max-w-2xl leading-none">
              {currentPromo.title[lang]}
            </h2>
            <p className="text-white/80 text-sm md:text-xl font-medium max-w-xl line-clamp-2 mb-8">
              {currentPromo.body[lang]}
            </p>
            <button className="w-fit px-8 py-4 bg-white text-black rounded-2xl font-black text-sm hover:bg-emerald-500 hover:text-white transition-all shadow-xl flex items-center gap-3 group/btn">
              {t({ en: 'Shop Now', ar: 'تسوق الآن' })}
              <ChevronRight className={`w-5 h-5 transition-transform group-hover/btn:translate-x-1 ${lang === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {promotions.length > 1 && (
        <>
          <div className="absolute bottom-8 right-8 md:right-16 flex gap-2 z-10">
            {promotions.map((_, i) => (
              <button 
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2 rounded-full transition-all duration-500 ${currentIndex === i ? 'w-12 bg-emerald-500 shadow-lg shadow-emerald-200' : 'w-2 bg-white/40 hover:bg-white'}`}
              />
            ))}
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setCurrentIndex((prev) => (prev - 1 + promotions.length) % promotions.length)}
              className="p-4 bg-white/20 backdrop-blur-md rounded-3xl text-white hover:bg-white hover:text-black transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setCurrentIndex((prev) => (prev + 1) % promotions.length)}
              className="p-4 bg-white/20 backdrop-blur-md rounded-3xl text-white hover:bg-white hover:text-black transition-all"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
