import React from 'react';
import { Tag as TagIcon } from 'lucide-react';
import { useLanguage } from '../../contexts';
import { Category, Tag } from '../../types';

interface FilterSidebarProps {
  categories: Category[];
  brands: string[];
  selectedCategoryId: string;
  setSelectedCategoryId: (c: string) => void;
  selectedBrand: string;
  setSelectedBrand: (b: string) => void;
  priceRange: [number, number];
  setPriceRange: (r: [number, number]) => void;
  tags: Tag[];
  selectedTagId: string;
  setSelectedTagId: (id: string) => void;
}

export const FilterSidebar = ({ 
  categories, 
  brands, 
  selectedCategoryId, 
  setSelectedCategoryId, 
  selectedBrand, 
  setSelectedBrand, 
  priceRange, 
  setPriceRange,
  tags,
  selectedTagId,
  setSelectedTagId
}: FilterSidebarProps) => {
  const { t } = useLanguage();

  return (
    <div className="w-64 flex-shrink-0 space-y-8 pr-8 border-r border-gray-100 hidden md:block">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">{t({ en: 'Tags', ar: 'الوسوم' })}</h3>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setSelectedTagId('')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${selectedTagId === '' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            {t({ en: 'All', ar: 'الكل' })}
          </button>
          {tags.map(tag => (
            <button 
              key={tag.id}
              onClick={() => setSelectedTagId(tag.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${selectedTagId === tag.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              <TagIcon className="w-3 h-3" />
              {t(tag.title)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">{t({ en: 'Categories', ar: 'الفئات' })}</h3>
        <div className="space-y-2">
          <button 
            onClick={() => setSelectedCategoryId('')}
            className={`block text-sm ${selectedCategoryId === '' ? 'font-bold text-black' : 'text-gray-500 hover:text-black'}`}
          >
            {t({ en: 'All Categories', ar: 'جميع الفئات' })}
          </button>
          {categories.map(c => (
            <button 
              key={c.id}
              onClick={() => setSelectedCategoryId(c.id)}
              className={`block text-sm ${selectedCategoryId === c.id ? 'font-bold text-black' : 'text-gray-500 hover:text-black'}`}
            >
              {t(c.locals.title)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">{t({ en: 'Brands', ar: 'العلامات التجارية' })}</h3>
        <div className="space-y-2">
          <button 
            onClick={() => setSelectedBrand('')}
            className={`block text-sm ${selectedBrand === '' ? 'font-bold text-black' : 'text-gray-500 hover:text-black'}`}
          >
            {t({ en: 'All Brands', ar: 'جميع الماركات' })}
          </button>
          {brands.map(b => (
            <button 
              key={b}
              onClick={() => setSelectedBrand(b)}
              className={`block text-sm ${selectedBrand === b ? 'font-bold text-black' : 'text-gray-500 hover:text-black'}`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">{t({ en: 'Price Range', ar: 'نطاق السعر' })}</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              placeholder="Min"
              value={priceRange[0] || 0}
              onChange={(e) => setPriceRange([parseFloat(e.target.value) || 0, priceRange[1]])}
              className="w-full p-2 bg-gray-50 rounded-lg text-xs border-none focus:ring-1 focus:ring-black"
            />
            <span className="text-gray-300">-</span>
            <input 
              type="number" 
              placeholder="Max"
              value={priceRange[1] || 0}
              onChange={(e) => setPriceRange([priceRange[0], parseFloat(e.target.value) || 1000])}
              className="w-full p-2 bg-gray-50 rounded-lg text-xs border-none focus:ring-1 focus:ring-black"
            />
          </div>
          <input 
            type="range" 
            min="0"
            max="1000"
            step="10"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseFloat(e.target.value)])}
            className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-black"
          />
        </div>
      </div>
    </div>
  );
};
