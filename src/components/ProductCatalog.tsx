import React, { useState } from 'react';
import { Search, Filter, ShoppingBag, X } from 'lucide-react';
import { useCatalog } from '../hooks/useCatalog';
import { formatCurrency } from '../utils/formatters';
import { ProductModal } from './ProductModal';
import type { CatalogProduct } from '../types';

interface ProductCatalogProps {
  onSelectProduct: (product: CatalogProduct, variant: { size: string; color: string }) => void;
  onClose: () => void;
}

export function ProductCatalog({ onSelectProduct, onClose }: ProductCatalogProps) {
  const { products, loading } = useCatalog();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [filters, setFilters] = useState({
    categories: [] as string[],
    brands: [] as string[],
    priceRange: { min: 0, max: 1000 }
  });
  const [appliedFilters, setAppliedFilters] = useState({
    categories: [] as string[],
    brands: [] as string[],
    priceRange: { min: 0, max: 1000 }
  });

  // Get unique categories and brands
  const categories = Array.from(new Set(products.map(p => p.productType).filter(Boolean)));
  const brands = Array.from(new Set(products.map(p => p.vendor).filter(Boolean)));

  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const toggleBrand = (brand: string) => {
    setFilters(prev => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter(b => b !== brand)
        : [...prev.brands, brand]
    }));
  };

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    const numValue = parseInt(value) || 0;
    setFilters(prev => ({
      ...prev,
      priceRange: {
        ...prev.priceRange,
        [type]: numValue
      }
    }));
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
    setShowFilters(false);
  };

  const resetFilters = () => {
    const emptyFilters = {
      categories: [],
      brands: [],
      priceRange: { min: 0, max: 1000 }
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  const handleProductSelect = (product: CatalogProduct, variant: { size: string; color: string }) => {
    onSelectProduct(product, variant);
    setSelectedProduct(null); // Close the product modal but keep the catalog open
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = (product.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (product.vendor?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = appliedFilters.categories.length === 0 || 
                          appliedFilters.categories.includes(product.productType || '');
    const matchesBrand = appliedFilters.brands.length === 0 || 
                        appliedFilters.brands.includes(product.vendor || '');
    const matchesPrice = product.basePrice >= appliedFilters.priceRange.min && 
                        product.basePrice <= appliedFilters.priceRange.max;
    
    return matchesSearch && matchesCategory && matchesBrand && matchesPrice;
  });

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4D8D]"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-transparent bg-clip-text">
                Add Products
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Search and Filter Toggle */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full rounded-xl border border-gray-200 focus:border-[#FF4D8D] focus:ring focus:ring-[#FF4D8D] focus:ring-opacity-50"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
                  showFilters
                    ? 'border-[#FF4D8D] text-[#FF4D8D] bg-pink-50'
                    : 'border-gray-200 text-gray-700 hover:border-[#FF4D8D] hover:text-[#FF4D8D]'
                }`}
              >
                <Filter className="h-5 w-5" />
                Filters
                {(appliedFilters.categories.length > 0 || appliedFilters.brands.length > 0) && (
                  <span className="ml-1 bg-[#FF4D8D] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {appliedFilters.categories.length + appliedFilters.brands.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Categories */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Categories</h3>
                  <div className="space-y-2">
                    {categories.map(category => (
                      <label key={category} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.categories.includes(category)}
                          onChange={() => toggleCategory(category)}
                          className="rounded border-gray-300 text-[#FF4D8D] focus:ring-[#FF4D8D]"
                        />
                        <span className="ml-2 text-gray-600">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Brands */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Brands</h3>
                  <div className="space-y-2">
                    {brands.map(brand => (
                      <label key={brand} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.brands.includes(brand)}
                          onChange={() => toggleBrand(brand)}
                          className="rounded border-gray-300 text-[#FF4D8D] focus:ring-[#FF4D8D]"
                        />
                        <span className="ml-2 text-gray-600">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Price Range</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-600">Min Price</label>
                      <input
                        type="number"
                        min="0"
                        value={filters.priceRange.min}
                        onChange={(e) => handlePriceChange('min', e.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-200 focus:border-[#FF4D8D] focus:ring focus:ring-[#FF4D8D] focus:ring-opacity-50"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Max Price</label>
                      <input
                        type="number"
                        min="0"
                        value={filters.priceRange.max}
                        onChange={(e) => handlePriceChange('max', e.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-200 focus:border-[#FF4D8D] focus:ring focus:ring-[#FF4D8D] focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={applyFilters}
                  className="bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <div className="text-sm text-[#FF4D8D] font-medium mb-1">{product.vendor}</div>
                    <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">{product.title}</h3>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.body}</p>
                    <div className="font-semibold text-gray-900">{formatCurrency(product.basePrice)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onSelect={handleProductSelect}
        />
      )}
    </>
  );
}