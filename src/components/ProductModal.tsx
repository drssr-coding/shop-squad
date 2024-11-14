import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import type { CatalogProduct } from '../types';

interface ProductModalProps {
  product: CatalogProduct;
  onClose: () => void;
  onSelect: (product: CatalogProduct, variant: { size: string; color: string }) => void;
}

export function ProductModal({ product, onClose, onSelect }: ProductModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [showFullDescription, setShowFullDescription] = useState(false);

  const hasMultipleImages = product.images.length > 1;

  // Get unique sizes and colors from variants
  const sizes = Array.from(new Set(
    product.variants
      .map(v => v.size)
      .filter(Boolean)
  ));

  const colors = Array.from(new Set(
    product.variants
      .map(v => v.color)
      .filter(Boolean)
  ));

  // Set initial selections
  useEffect(() => {
    if (sizes.length > 0) setSelectedSize(sizes[0]);
    if (colors.length > 0) setSelectedColor(colors[0]);
  }, [product]);

  // Get current variant price
  const getCurrentVariantPrice = () => {
    const variant = product.variants.find(v => 
      (!selectedSize || v.size === selectedSize) &&
      (!selectedColor || v.color === selectedColor)
    );
    return variant?.price || product.basePrice;
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
        {/* Image Section */}
        <div className="relative w-full md:w-1/2 h-[200px] sm:h-[250px] md:h-auto">
          {product.images.length > 0 && (
            <img
              src={product.images[currentImageIndex]}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          )}
          
          {hasMultipleImages && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-1.5 sm:p-2 shadow-lg hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6 text-gray-600" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-1.5 sm:p-2 shadow-lg hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6 text-gray-600" />
              </button>

              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                      index === currentImageIndex
                        ? 'bg-[#FF4D8D] w-3 sm:w-4'
                        : 'bg-white opacity-50 hover:opacity-75'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Details Section */}
        <div className="w-full md:w-1/2 p-3 sm:p-4 md:p-6 flex flex-col h-[calc(95vh-200px)] sm:h-[calc(95vh-250px)] md:h-[95vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-3 sm:mb-4 md:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">{product.title}</h2>
              <div className="text-base sm:text-lg font-semibold text-[#FF4D8D]">
                {formatCurrency(getCurrentVariantPrice())}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>

          <div className="space-y-3 sm:space-y-4 md:space-y-6 flex-1 overflow-y-auto">
            {/* Colors */}
            {colors.length > 0 && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-colors ${
                        selectedColor === color
                          ? 'border-[#FF4D8D] bg-pink-50 text-[#FF4D8D]'
                          : 'border-gray-200 text-gray-600 hover:border-[#FF4D8D]'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {sizes.length > 0 && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Size
                </label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg border text-xs sm:text-sm font-medium transition-colors ${
                        selectedSize === size
                          ? 'border-[#FF4D8D] bg-pink-50 text-[#FF4D8D]'
                          : 'border-gray-200 text-gray-600 hover:border-[#FF4D8D]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Description</h3>
              <div 
                className={`text-xs sm:text-sm text-gray-600 prose prose-sm max-w-none ${!showFullDescription ? 'line-clamp-4' : ''}`}
                dangerouslySetInnerHTML={{ __html: product.body }}
              />
              {product.body.length > 200 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-[#FF4D8D] text-xs sm:text-sm mt-2 hover:text-[#FF8D6B] transition-colors"
                >
                  {showFullDescription ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => onSelect(product, {
              size: selectedSize || 'Default',
              color: selectedColor || 'Default'
            })}
            className="mt-3 sm:mt-4 w-full bg-gradient-to-r from-[#FF4D8D] to-[#FF8D8B] text-white py-2 sm:py-3 px-4 rounded-lg sm:rounded-xl text-sm font-medium hover:shadow-lg transition-all sticky bottom-0"
          >
            Add to Squad List
          </button>
        </div>
      </div>
    </div>
  );
}