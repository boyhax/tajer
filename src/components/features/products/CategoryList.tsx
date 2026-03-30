import React, { useState, useEffect, useContext } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { Category } from '../../../types';
import { useLanguage } from '../../../contexts';
import { OperationType, handleFirestoreError } from '../../../lib/error';

export const CategoryList = ({ 
  selectedCategory, 
  onSelect 
}: { 
  selectedCategory: string, 
  onSelect: (c: string) => void 
}) => {
  const { t, lang } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'categories'));
    return unsub;
  }, []);

  return (
    <div className="flex gap-4 md:gap-8 overflow-x-auto pb-8 md:pb-12 scrollbar-hide px-2">
      <button 
        onClick={() => onSelect('all')}
        className={`flex flex-col items-center gap-4 group transition-all shrink-0 ${selectedCategory === 'all' ? 'scale-110' : 'hover:scale-105'}`}
      >
        <div className={`w-16 h-16 md:w-24 md:h-24 rounded-[32px] md:rounded-[40px] flex items-center justify-center text-2xl md:text-4xl transition-all shadow-xl ${selectedCategory === 'all' ? 'bg-black text-white shadow-black/20' : 'bg-white border-2 border-gray-100 text-gray-400 hover:border-black hover:text-black'}`}>
          📦
        </div>
        <span className={`text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all ${selectedCategory === 'all' ? 'text-black' : 'text-gray-300 group-hover:text-black'}`}>
          {t({ en: 'All', ar: 'الكل' })}
        </span>
      </button>
      {categories.map(cat => (
        <button 
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`flex flex-col items-center gap-4 group transition-all shrink-0 ${selectedCategory === cat.id ? 'scale-110' : 'hover:scale-105'}`}
        >
          <div className={`w-16 h-16 md:w-24 md:h-24 rounded-[32px] md:rounded-[40px] flex items-center justify-center text-2xl md:text-4xl transition-all shadow-xl ${selectedCategory === cat.id ? 'bg-black text-white shadow-black/20' : 'bg-white border-2 border-gray-100 text-gray-400 hover:border-black hover:text-black'}`}>
            {cat.icon || '🛒'}
          </div>
          <span className={`text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all ${selectedCategory === cat.id ? 'text-black' : 'text-gray-300 group-hover:text-black'}`}>
            {cat.title[lang]}
          </span>
        </button>
      ))}
    </div>
  );
};
