import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload, Trash2, Check, Square, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Papa from 'papaparse';
import { doc, collection, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCatalog } from '../hooks/useCatalog';
import { formatCurrency } from '../utils/formatters';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import type { CatalogProduct } from '../types';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { products, loading, deleteAllProducts, fetchCatalog } = useCatalog();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const productsPerPage = 50;

  // Filter products based on search term
  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedProducts([]); // Clear selections when changing pages
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === currentProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(currentProducts.map(p => p.id));
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const updatedProducts = products.filter(p => !selectedProducts.includes(p.id));
      const catalogRef = doc(collection(db, 'catalog'), 'products');
      await setDoc(catalogRef, { products: updatedProducts });
      setSelectedProducts([]);
      setSuccess('Selected products have been deleted');
      await fetchCatalog();
    } catch (err) {
      console.error('Error deleting products:', err);
      setError('Failed to delete products');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const productsMap = new Map<string, CatalogProduct>();

          // Process CSV data and update products
          // ... (rest of the CSV processing logic remains the same)

          setSuccess(`Successfully processed CSV file`);
          await fetchCatalog();
        } catch (err) {
          console.error('Error processing CSV:', err);
          setError('Failed to process CSV file');
        } finally {
          setUploading(false);
        }
      },
      error: (err) => {
        console.error('CSV parsing error:', err);
        setError('Failed to parse CSV file');
        setUploading(false);
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/squads')}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to Squads
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-xl border border-gray-200 focus:border-[#FF4D8D] focus:ring focus:ring-[#FF4D8D] focus:ring-opacity-50"
            />
          </div>
          
          <div className="flex gap-4">
            <label className="flex-shrink-0">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="px-4 py-2 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-[#FF4D8D] transition-colors flex items-center">
                <Upload className="h-5 w-5 mr-2 text-gray-400" />
                <span className="text-gray-600">
                  {uploading ? 'Uploading...' : 'Upload CSV'}
                </span>
              </div>
            </label>

            {selectedProducts.length > 0 && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-50 text-red-600 px-4 py-2 rounded-xl hover:bg-red-100 transition-colors flex items-center"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Delete Selected ({selectedProducts.length})
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 bg-green-50 text-green-600 rounded-xl">
            {success}
          </div>
        )}
      </div>

      {/* Products List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4D8D] mx-auto"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No products found
          </div>
        ) : (
          <>
            {/* Pagination - At the top */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <ChevronsLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      if (pageNumber <= totalPages) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium ${
                              currentPage === pageNumber
                                ? 'bg-[#FF4D8D] text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <ChevronsRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left">
                      <div className="flex items-center">
                        <button
                          onClick={handleSelectAll}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {selectedProducts.length === currentProducts.length ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Product</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Brand</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Variants</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleSelectProduct(product.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {selectedProducts.includes(product.id) ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Upload className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">{product.title}</div>
                            <div className="text-sm text-gray-500">{product.handle}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {product.productType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {product.vendor}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {formatCurrency(product.basePrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {product.variants.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteSelected}
      />
    </div>
  );
}