import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface ProductSearchParams {
  searchQuery: string;
  categorySlugs: string[];
  selectedBrand: string;
  minPrice: number;
  maxPrice: number;
  sortOption: string;
  selectedTagId: string;
}

export function useProductSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get('q') || '';
  const selectedBrand = searchParams.get('brand') || '';
  const minPrice = Number(searchParams.get('minPrice')) || 0;
  const maxPrice = Number(searchParams.get('maxPrice')) || 10000;
  const sortOption = searchParams.get('sort') || 'newest';
  const selectedTagId = searchParams.get('tag') || '';

  const categorySlugs = useMemo(() => {
    const cats = searchParams.get('categories') || searchParams.get('category') || '';
    return cats ? cats.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const updateParams = useCallback((updates: Partial<Record<string, string | string[] | number | null>>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        newParams.delete(key);
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          newParams.set(key, value.join(','));
        } else {
          newParams.delete(key);
        }
      } else {
        newParams.set(key, value.toString());
      }
    });

    // Handle special cases
    if (updates.categorySlugs !== undefined) {
      const slugs = updates.categorySlugs as string[];
      if (slugs.length > 0) {
        newParams.set('categories', slugs.join(','));
      } else {
        newParams.delete('categories');
      }
      newParams.delete('category'); // Ensure old singular key is removed
    }

    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const clearAllFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  return {
    params: {
      searchQuery,
      categorySlugs,
      selectedBrand,
      minPrice,
      maxPrice,
      sortOption,
      selectedTagId,
    },
    updateParams,
    clearAllFilters,
    setSearchQuery: (q: string) => updateParams({ q }),
    setCategorySlugs: (slugs: string[]) => updateParams({ categorySlugs: slugs }),
    setSelectedBrand: (brand: string) => updateParams({ brand }),
    setPriceRange: (min: number, max: number) => updateParams({ minPrice: min, maxPrice: max }),
    setSortOption: (sort: string) => updateParams({ sort }),
    setSelectedTagId: (tag: string) => updateParams({ tag }),
  };
}
