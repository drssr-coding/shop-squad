import { useState, useEffect } from 'react';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { CatalogProduct } from '../types';

export function useCatalog() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = async () => {
    try {
      const catalogRef = doc(collection(db, 'catalog'), 'products');
      const catalogDoc = await getDoc(catalogRef);
      
      if (catalogDoc.exists()) {
        setProducts(catalogDoc.data().products || []);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Error fetching catalog:', err);
      setError('Failed to load product catalog');
    } finally {
      setLoading(false);
    }
  };

  const deleteAllProducts = async () => {
    try {
      setLoading(true);
      const catalogRef = doc(collection(db, 'catalog'), 'products');
      await setDoc(catalogRef, { products: [] });
      setProducts([]);
      return true;
    } catch (err) {
      console.error('Error deleting products:', err);
      setError('Failed to delete products');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  return { products, loading, error, deleteAllProducts, fetchCatalog };
}