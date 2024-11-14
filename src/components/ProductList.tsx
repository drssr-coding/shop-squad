import React from 'react';
import { ShoppingBag, Plus, Trash2, Check, X } from 'lucide-react';
import type { Product, Participant } from '../types';
import { formatCurrency } from '../utils/formatters';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ProductListProps {
  products: Product[];
  participants: Participant[];
  partyId: string;
  onAddProduct: () => void;
  onRemoveProduct: (productId: string) => void;
  currentUserId: string;
  partyStatus: string;
  canAddProducts: boolean;
}

export function ProductList({ 
  products = [],
  participants, 
  onAddProduct, 
  onRemoveProduct,
  currentUserId,
  partyId,
  partyStatus,
  canAddProducts
}: ProductListProps) {
  const productsList = Array.isArray(products) ? products.map((product, index) => ({
    ...product,
    uniqueKey: `${product.id}-${index}`
  })) : [];

  const getTotalAmount = () => {
    return productsList.reduce((sum, product) => sum + (product.price || 0), 0);
  };

  const getParticipantTotal = (participantId: string) => {
    return productsList
      .filter(product => product.addedBy === participantId)
      .reduce((sum, product) => sum + (product.price || 0), 0);
  };

  const handleKeepProduct = async (productId: string) => {
    try {
      const partyRef = doc(db, 'parties', partyId);
      await updateDoc(partyRef, {
        [`products.${productId}.status`]: 'kept'
      });
    } catch (err) {
      console.error('Error updating product status:', err);
    }
  };

  const handleReturnProduct = async (productId: string) => {
    try {
      const partyRef = doc(db, 'parties', partyId);
      await updateDoc(partyRef, {
        [`products.${productId}.status`]: 'returned'
      });
    } catch (err) {
      console.error('Error updating product status:', err);
    }
  };

  if (productsList.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
        <div className="w-16 h-16 bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No products yet</h3>
        <p className="text-gray-500 mb-6">Start adding products to your shopping list!</p>
        {canAddProducts && (
          <button
            onClick={onAddProduct}
            className="bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-white px-6 py-3 rounded-xl inline-flex items-center hover:shadow-lg transition-all"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Product
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Shopping List</h2>
          <p className=" text-gray-500">Total: {formatCurrency(getTotalAmount())}</p>
        </div>
        {canAddProducts && (
          <button
            onClick={onAddProduct}
            className="bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-white px-4 py-2 rounded-xl inline-flex items-center hover:shadow-lg transition-all text-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Product
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Product</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Price</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Added By</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Variant</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {productsList.map((product) => (
                <tr key={product.uniqueKey} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">{product.title}</div>
                        {product.vendor && (
                          <div className="text-sm text-gray-500">{product.vendor}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {participants.find(p => p.id === product.addedBy)?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {product.selectedVariant && (
                      <div className="space-y-1">
                        {product.selectedVariant.size && (
                          <div className="text-sm">
                            <span className="font-medium">Size:</span> {product.selectedVariant.size}
                          </div>
                        )}
                        {product.selectedVariant.color && (
                          <div className="text-sm">
                            <span className="font-medium">Color:</span> {product.selectedVariant.color}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.status ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.status === 'kept' 
                          ? 'bg-green-100 text-green-800'
                          : product.status === 'returned'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {canAddProducts && product.addedBy === currentUserId && (
                        <button
                          onClick={() => onRemoveProduct(product.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                          title="Remove product"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                      {partyStatus === 'trying' && product.addedBy === currentUserId && !product.status && (
                        <>
                          <button
                            onClick={() => handleKeepProduct(product.id)}
                            className="text-gray-400 hover:text-green-500 transition-colors p-1 rounded-lg hover:bg-green-50"
                            title="Keep product"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleReturnProduct(product.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                            title="Return product"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Distribution</h3>
        <div className="space-y-3">
          {participants.map((participant) => {
            const total = getParticipantTotal(participant.id);
            const percentage = (total / getTotalAmount()) * 100 || 0;
            
            return (
              <div key={participant.id} className="flex items-center gap-3">
                <img
                  src={participant.avatar}
                  alt={participant.name}
                  className="h-8 w-8 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-900">{participant.name}</span>
                    <span className="text-sm text-gray-600">{formatCurrency(total)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B]"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}