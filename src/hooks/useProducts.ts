import { useState, useCallback } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Product, Party, CatalogProduct } from '../types';

export function useProducts(partyId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addProduct = useCallback(async (
    catalogProduct: CatalogProduct,
    variant: { size: string; color: string },
    userId: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Find the specific variant
      const selectedVariant = catalogProduct.variants.find(v => 
        (v.size === variant.size || variant.size === 'Default') &&
        (v.color === variant.color || variant.color === 'Default')
      ) || catalogProduct.variants[0]; // Fallback to first variant if no match

      if (!selectedVariant) {
        throw new Error('No variant available for this product');
      }

      const newProduct: Product = {
        id: crypto.randomUUID(),
        title: catalogProduct.title,
        price: selectedVariant.price || catalogProduct.basePrice,
        images: catalogProduct.images,
        description: catalogProduct.body,
        vendor: catalogProduct.vendor,
        productType: catalogProduct.productType,
        selectedVariant: {
          size: variant.size === 'Default' ? selectedVariant.size || 'One Size' : variant.size,
          color: variant.color === 'Default' ? selectedVariant.color || 'Default' : variant.color
        },
        addedBy: userId,
        addedAt: Timestamp.now()
      };

      const partyRef = doc(db, 'parties', partyId);
      await updateDoc(partyRef, {
        products: arrayUnion(newProduct)
      });

      return newProduct;
    } catch (err) {
      console.error('Error adding product:', err);
      setError(err instanceof Error ? err.message : 'Failed to add product');
      return null;
    } finally {
      setLoading(false);
    }
  }, [partyId]);

  const removeProduct = useCallback(async (productId: string, party: Party) => {
    setLoading(true);
    setError(null);

    try {
      const productToRemove = party.products.find(p => p.id === productId);
      if (!productToRemove) {
        throw new Error('Product not found');
      }

      const partyRef = doc(db, 'parties', partyId);
      await updateDoc(partyRef, {
        products: arrayRemove(productToRemove)
      });

      return true;
    } catch (err) {
      console.error('Error removing product:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove product');
      return false;
    } finally {
      setLoading(false);
    }
  }, [partyId]);

  return {
    loading,
    error,
    addProduct,
    removeProduct
  };
}