import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit 
} from 'firebase/firestore';
import { db } from '../../../firebase';
import { Product } from '../../../types';
import { useLanguage } from '../../../contexts';
import { ProductCard } from './ProductCard';

interface CategoryProductsProps {
  categoryId: string;
  onSelectProduct: (p: Product) => void;
}

export const CategoryProducts = ({ categoryId, onSelectProduct }: CategoryProductsProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(
          collection(db, 'products'),
          where('categories', 'array-contains', categoryId),
          where('status', '==', 'published'),
          limit(4)
        );
        const snap = await getDocs(q);
        setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryId]);

  if (loading) return <div className="h-20 flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div></div>;
  if (products.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-4">
      {products.map(p => (
        <div key={p.id}>
          <ProductCard product={p} onSelect={onSelectProduct} variant="minimal" />
        </div>
      ))}
    </div>
  );
};
