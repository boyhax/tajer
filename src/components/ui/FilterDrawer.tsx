import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  CheckCircle2, 
  Tag as TagIcon 
} from 'lucide-react';
import { useLanguage } from '../../contexts';
import { Category, Tag } from '../../types';

interface FilterDrawerProps {
  onClose: () => void;
  categories: Category[];
  selectedCategoryId: string;
  setSelectedCategoryId: (c: string) => void;
  sortOption: string;
  setSortOption: (s: string) => void;
  tags: Tag[];
  selectedTagId: string;
  setSelectedTagId: (id: string) => void;
}

export const FilterDrawer = ({ 
  onClose,
  categories,
  selectedCategoryId,
  setSelectedCategoryId,
  sortOption,
  setSortOption,
  tags,
  selectedTagId,
  setSelectedTagId
}: FilterDrawerProps) => {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'sort' | 'categories' | 'tags'>('sort');

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ x: lang === 'ar' ? -400 : 400 }}
        animate={{ x: 0 }}
        exit={{ x: lang === 'ar' ? -400 : 400 }}
        className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col"
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold">{t({ en: 'Filters', ar: 'الفلاتر' })}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('sort')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'sort' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
          >
            {t({ en: 'Sort', ar: 'ترتيب' })}
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'categories' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
          >
            {t({ en: 'Categories', ar: 'الفئات' })}
          </button>
          <button 
            onClick={() => setActiveTab('tags')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'tags' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
          >
            {t({ en: 'Tags', ar: 'الوسوم' })}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'sort' && (
            <div className="space-y-3">
              {[
                { id: 'newest', label: { en: 'Newest', ar: 'الأحدث' } },
                { id: 'price-low', label: { en: 'Price: Low to High', ar: 'السعر: من الأقل للأعلى' } },
                { id: 'price-high', label: { en: 'Price: High to Low', ar: 'السعر: من الأعلى للأقل' } },
              ].map(opt => (
                <button 
                  key={opt.id}
                  onClick={() => setSortOption(opt.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${sortOption === opt.id ? 'border-black bg-black text-white' : 'border-gray-100 hover:border-gray-300'}`}
                >
                  <span className="font-bold text-sm">{t(opt.label)}</span>
                  {sortOption === opt.id && <CheckCircle2 className="w-4 h-4" />}
                </button>
              ))}
            </div>
          )}
          {activeTab === 'categories' && (
            <div className="space-y-2">
              <button 
                onClick={() => setSelectedCategoryId('')}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${selectedCategoryId === '' ? 'border-black bg-black text-white' : 'border-gray-100 hover:border-gray-300'}`}
              >
                <span className="font-bold text-sm">{t({ en: 'All Categories', ar: 'جميع الفئات' })}</span>
                {selectedCategoryId === '' && <CheckCircle2 className="w-4 h-4" />}
              </button>
              {categories.map(c => (
                <button 
                  key={c.id}
                  onClick={() => setSelectedCategoryId(c.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${selectedCategoryId === c.id ? 'border-black bg-black text-white' : 'border-gray-100 hover:border-gray-300'}`}
                >
                  <span className="font-bold text-sm">{t(c.locals.title)}</span>
                  {selectedCategoryId === c.id && <CheckCircle2 className="w-4 h-4" />}
                </button>
              ))}
            </div>
          )}
          {activeTab === 'tags' && (
            <div className="space-y-2">
              <button 
                onClick={() => setSelectedTagId('')}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${selectedTagId === '' ? 'border-black bg-black text-white' : 'border-gray-100 hover:border-gray-300'}`}
              >
                <span className="font-bold">{t({ en: 'All Tags', ar: 'جميع الوسوم' })}</span>
                {selectedTagId === '' && <CheckCircle2 className="w-5 h-5" />}
              </button>
              {tags.map(tag => (
                <button 
                  key={tag.id}
                  onClick={() => setSelectedTagId(tag.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${selectedTagId === tag.id ? 'border-black bg-black text-white' : 'border-gray-100 hover:border-gray-300'}`}
                >
                  <div className="flex items-center gap-2">
                    <TagIcon className="w-4 h-4" />
                    <span className="font-bold">{t(tag.title)}</span>
                  </div>
                  {selectedTagId === tag.id && <CheckCircle2 className="w-5 h-5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100">
          <button 
            onClick={onClose}
            className="w-full bg-black text-white py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all"
          >
            {t({ en: 'Apply Filters', ar: 'تطبيق الفلاتر' })}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
