import React, { useState } from 'react';
import { Ticket, X, AlertCircle, CheckCircle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Party, Product } from '../types';

interface CouponFormProps {
  party: Party;
  onUpdate: (updatedParty: Party) => void;
}

const COUPONS = {
  'KICKOFF': {
    discount: 'fixed',
    value: 0.01,
    description: 'All products for €0.01 each!'
  }
};

export function CouponForm({ party, onUpdate }: CouponFormProps) {
  const [couponCode, setCouponCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Show form only if no coupon is applied and either the party is upcoming or in payment process
  if (party.appliedCoupon || (party.status !== 'upcoming' && party.status !== 'in_payment')) {
    if (party.appliedCoupon) {
      return (
        <div className="bg-green-50 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">
              Coupon {party.appliedCoupon} applied!
            </p>
            <p className="text-sm text-green-600">
              {COUPONS[party.appliedCoupon as keyof typeof COUPONS]?.description}
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const code = couponCode.trim().toUpperCase();
    const coupon = COUPONS[code as keyof typeof COUPONS];

    if (!coupon) {
      setError('Invalid coupon code');
      setLoading(false);
      return;
    }

    try {
      // Apply discount to all products
      const updatedProducts: Product[] = party.products.map(product => ({
        ...product,
        originalPrice: product.price, // Store original price
        price: coupon.value // Set new price
      }));

      const partyRef = doc(db, 'parties', party.id);
      await updateDoc(partyRef, {
        products: updatedProducts,
        appliedCoupon: code
      });

      const updatedParty = {
        ...party,
        products: updatedProducts,
        appliedCoupon: code
      };
      onUpdate(updatedParty);

      setSuccess(coupon.description);
      setCouponCode('');
    } catch (err) {
      console.error('Error applying coupon:', err);
      setError('Failed to apply coupon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Have a coupon code?
          </label>
          <div className="relative">
            <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="pl-10 w-full rounded-lg border border-gray-200 focus:border-[#FF4D8D] focus:ring focus:ring-[#FF4D8D] focus:ring-opacity-50"
              placeholder="Enter code"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 text-green-600 rounded-lg flex items-center gap-2 text-sm">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !couponCode.trim()}
          className="w-full bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-white py-2 px-4 rounded-lg text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
        >
          {loading ? 'Applying...' : 'Apply Coupon'}
        </button>
      </form>
    </div>
  );
}