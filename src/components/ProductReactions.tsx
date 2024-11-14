import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import type { Product, ProductReaction } from '../types';
import { Timestamp } from 'firebase/firestore';

interface ProductReactionsProps {
  partyId: string;
  product: Product;
  onUpdate: (updatedProduct: Product) => void;
}

export function ProductReactions({ partyId, product, onUpdate }: ProductReactionsProps) {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!user) return null;

  const userReaction = product.reactions?.find(r => r.userId === user.uid);
  const likes = product.reactions?.filter(r => r.type === 'like').length || 0;
  const dislikes = product.reactions?.filter(r => r.type === 'dislike').length || 0;

  const handleReaction = async (type: 'like' | 'dislike') => {
    if (!user || isUpdating) return;

    try {
      setIsUpdating(true);
      const partyRef = doc(db, 'parties', partyId);
      const updatedReactions = [...(product.reactions || [])];
      const existingIndex = updatedReactions.findIndex(r => r.userId === user.uid);

      // Create new reaction object
      const newReaction: ProductReaction = {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        type,
        timestamp: Timestamp.now()
      };

      if (existingIndex >= 0) {
        const oldReaction = updatedReactions[existingIndex];
        
        // Remove existing reaction
        await updateDoc(partyRef, {
          [`products.${product.id}.reactions`]: arrayRemove(oldReaction)
        });

        if (oldReaction.type !== type) {
          // Add new reaction if changing type
          await updateDoc(partyRef, {
            [`products.${product.id}.reactions`]: arrayUnion(newReaction)
          });
          updatedReactions[existingIndex] = newReaction;
        } else {
          // Just remove if clicking same reaction
          updatedReactions.splice(existingIndex, 1);
        }
      } else {
        // Add new reaction
        await updateDoc(partyRef, {
          [`products.${product.id}.reactions`]: arrayUnion(newReaction)
        });
        updatedReactions.push(newReaction);
      }

      // Update local state through parent component
      onUpdate({
        ...product,
        reactions: updatedReactions
      });
    } catch (err) {
      console.error('Error updating reaction:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => handleReaction('like')}
        disabled={isUpdating}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
          userReaction?.type === 'like'
            ? 'bg-green-100 text-green-600'
            : 'hover:bg-gray-100 text-gray-600'
        } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <ThumbsUp className="h-4 w-4" />
        <span className="text-sm font-medium">{likes}</span>
      </button>

      <button
        onClick={() => handleReaction('dislike')}
        disabled={isUpdating}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
          userReaction?.type === 'dislike'
            ? 'bg-red-100 text-red-600'
            : 'hover:bg-gray-100 text-gray-600'
        } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <ThumbsDown className="h-4 w-4" />
        <span className="text-sm font-medium">{dislikes}</span>
      </button>
    </div>
  );
}