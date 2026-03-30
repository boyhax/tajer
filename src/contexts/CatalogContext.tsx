import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Category, Tag } from '../types';
import { handleFirestoreError, OperationType } from '../services/firebaseService';
import { useLanguage } from './LanguageContext';

interface CatalogContextType {
  products: Product[];
  categories: Category[];
  tags: Tag[];
  // Filter state
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  selectedBrand: string;
  setSelectedBrand: (b: string) => void;
  selectedTagId: string;
  setSelectedTagId: (id: string) => void;
  priceRange: [number, number];
  setPriceRange: (r: [number, number]) => void;
  sortOption: string;
  setSortOption: (s: string) => void;
  // Derived
  filteredProducts: Product[];
  brands: string[];
  featuredCategories: Category[];
  clearFilters: () => void;
}

export const CatalogContext = createContext<CatalogContextType>({
  products: [],
  categories: [],
  tags: [],
  searchQuery: '',
  setSearchQuery: () => {},
  selectedCategoryId: '',
  setSelectedCategoryId: () => {},
  selectedBrand: '',
  setSelectedBrand: () => {},
  selectedTagId: '',
  setSelectedTagId: () => {},
  priceRange: [0, 10000],
  setPriceRange: () => {},
  sortOption: 'newest',
  setSortOption: () => {},
  filteredProducts: [],
  brands: [],
  featuredCategories: [],
  clearFilters: () => {},
});

export const CatalogProvider = ({ children }: { children: React.ReactNode }) => {
  const { t } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedTagId, setSelectedTagId] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortOption, setSortOption] = useState('newest');

  // Firestore realtime listeners
  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'products'), where('status', '==', 'published'), orderBy('createdAt', 'desc')),
      (snap) => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product))),
      (error) => handleFirestoreError(error, OperationType.LIST, 'products'),
    );
  }, []);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'categories'), orderBy('createdAt', 'desc')),
      (snap) => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category))),
      (error) => handleFirestoreError(error, OperationType.LIST, 'categories'),
    );
  }, []);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'tags'), orderBy('createdAt', 'desc')),
      (snap) => setTags(snap.docs.map(d => ({ id: d.id, ...d.data() } as Tag))),
      (error) => handleFirestoreError(error, OperationType.LIST, 'tags'),
    );
  }, []);

  // Derived data
  const brands: string[] = Array.from(new Set(products.map(p => p.brand).filter(Boolean)));
  const featuredCategories = categories.filter(c => c.isFeatured);

  const filteredProducts = products
    .filter(p => {
      const name = t(p.locals.name);
      const brand = p.brand;
      const description = t(p.locals.description);
      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategoryId === '' || p.categories.includes(selectedCategoryId);
      const matchesBrand = selectedBrand === '' || p.brand === selectedBrand;
      const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      const matchesTag = selectedTagId === '' || (p.tags && p.tags.includes(selectedTagId));
      return matchesSearch && matchesCategory && matchesBrand && matchesPrice && matchesTag;
    })
    .sort((a, b) => {
      if (sortOption === 'price-low') return a.price - b.price;
      if (sortOption === 'price-high') return b.price - a.price;
      return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
    });

  const clearFilters = () => {
    setSelectedCategoryId('');
    setSelectedBrand('');
    setSelectedTagId('');
    setSearchQuery('');
    setPriceRange([0, 10000]);
  };

  return (
    <CatalogContext.Provider value={{
      products, categories, tags,
      searchQuery, setSearchQuery,
      selectedCategoryId, setSelectedCategoryId,
      selectedBrand, setSelectedBrand,
      selectedTagId, setSelectedTagId,
      priceRange, setPriceRange,
      sortOption, setSortOption,
      filteredProducts, brands, featuredCategories,
      clearFilters,
    }}>
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => useContext(CatalogContext);
