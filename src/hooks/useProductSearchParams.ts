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

  // Mapping internal names to URL parameter keys
  const keyMap: Record<string, string> = {
    searchQuery: 'q',
    categorySlugs: 'categories',
    selectedBrand: 'brand',
    minPrice: 'minPrice',
    maxPrice: 'maxPrice',
    sortOption: 'sort',
    selectedTagId: 'tag',
  };

  // Reverse mapping for reading
  const revMap: Record<string, string> = Object.fromEntries(
    Object.entries(keyMap).map(([k, v]) => [v, k])
  );

  const getParam = (key: string) => searchParams.get(keyMap[key] || key);

  const searchQuery = getParam('searchQuery') || '';
  const selectedBrand = getParam('selectedBrand') || '';
  const minPrice = Number(getParam('minPrice')) || 0;
  const maxPrice = Number(getParam('maxPrice')) || 10000;
  const sortOption = getParam('sortOption') || 'newest';
  const selectedTagId = getParam('selectedTagId') || '';

  const categorySlugs = useMemo(() => {
    const cats = searchParams.get('categories') || searchParams.get('category') || '';
    return cats ? cats.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const updateParams = useCallback((updates: Partial<Record<string, any>>) => {
    // Start with a fresh URLSearchParams from the CURRENT state to avoid lost updates
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      
      Object.entries(updates).forEach(([key, value]) => {
        const urlKey = keyMap[key] || key;
        
        if (value === null || value === undefined || value === '') {
          newParams.delete(urlKey);
        } else if (Array.isArray(value)) {
          if (value.length > 0) {
            newParams.set(urlKey, value.join(','));
          } else {
            newParams.delete(urlKey);
          }
        } else {
          newParams.set(urlKey, value.toString());
        }

        // Specific cleanup for categories
        if (urlKey === 'categories') {
          newParams.delete('category');
        }
      });
      
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

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
    setSearchQuery: (searchQuery: string) => updateParams({ searchQuery }),
    setCategorySlugs: (categorySlugs: string[]) => updateParams({ categorySlugs }),
    setSelectedBrand: (selectedBrand: string) => updateParams({ selectedBrand }),
    setPriceRange: (minPrice: number, maxPrice: number) => updateParams({ minPrice, maxPrice }),
    setSortOption: (sortOption: string) => updateParams({ sortOption }),
    setSelectedTagId: (selectedTagId: string) => updateParams({ selectedTagId }),
  };
}
