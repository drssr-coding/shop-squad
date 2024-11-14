import React, { useState } from 'react';
import { AlertCircle, DollarSign, X, CheckCircle } from 'lucide-react';
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency } from '../utils/formatters';
import { PaypalButton } from './PaypalButton';
import { addNotification } from '../utils/notifications';
import { SuccessModal } from './SuccessModal';
import type { Party, Payment } from '../types';

interface PaymentPanelProps {
  party: Party;
  onUpdate: (updatedParty: Party) => void;
}

interface ParticipantAmount {
  participant: {
    id: string;
    name: string;
    email: string;
  };
  products: any[];
  amount: number;
}

export function PaymentPanel({ party, onUpdate }: PaymentPanelProps) {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPayPal, setShowPayPal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPaymentConfirmModal, setShowPaymentConfirmModal] = useState(false);

  if (!user) return null;

  const isOrganizer = party.organizerId === user.uid;
  const totalAmount = party.products.reduce((sum, product) => sum + product.price, 0);

  // Calculate amounts per participant based on their products
  const participantAmounts: ParticipantAmount[] = party.participants.map(participant => {
    const participantProducts = party.products.filter(p => p.addedBy === participant.id);
    return {
      participant,
      products: participantProducts,
      amount: participantProducts.reduce((sum, p) => sum + p.price, 0)
    };
  });

  const userPayment = party.payments?.find(p => p.userId === user.uid);
  const organizerPayment = party.payments?.find(p => p.userId === party.organizerId);
  const completedPayments = party.payments?.filter(p => p.status === 'completed') || [];

  // Only show if there are products and we're not in completed state
  if (party.products.length === 0 || party.status === 'completed') {
    return null;
  }

  const handleInitiatePayments = async () => {
    if (!isOrganizer || processing) return;

    try {
      setProcessing(true);
      const partyRef = doc(db, 'parties', party.id);
      await updateDoc(partyRef, {
        status: 'in_payment',
        totalAmount: totalAmount
      });

      // Send notifications to all participants
      for (const { participant } of participantAmounts) {
        if (participant.id !== user.uid) {
          await addNotification({
            type: 'payment_request',
            title: 'Payment Request',
            message: `${user.displayName || 'Squad Leader'} has started collecting payments for "${party.title}"`,
            userId: participant.id,
            partyId: party.id
          });
        }
      }

      const updatedParty = {
        ...party,
        status: 'in_payment',
        totalAmount: totalAmount
      };
      onUpdate(updatedParty);
      
      // Show PayPal button for organizer after initiating payments
      setShowPayPal(true);
    } catch (err) {
      console.error('Error initiating payments:', err);
      setError('Failed to initiate payments');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      setProcessing(true);
      const payment: Payment = {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        amount: participantAmounts.find(p => p.participant.id === user.uid)?.amount || 0,
        timestamp: Timestamp.now(),
        status: 'completed',
        type: 'preorder'
      };

      const partyRef = doc(db, 'parties', party.id);
      await updateDoc(partyRef, {
        payments: arrayUnion(payment)
      });

      // Send notification to organizer if not the payer
      if (user.uid !== party.organizerId) {
        await addNotification({
          type: 'payment_received',
          title: 'Payment Received',
          message: `${user.displayName || 'A member'} has completed their payment for "${party.title}"`,
          userId: party.organizerId,
          partyId: party.id
        });
      }

      const updatedParty = {
        ...party,
        payments: [...(party.payments || []), payment]
      };
      onUpdate(updatedParty);
      
      setShowPayPal(false);
      setSuccessMessage('Payment completed successfully!');
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Error processing payment:', err);
      setError('Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    setError('Payment failed. Please try again.');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Payment Status</h2>
          
          {/* Payment Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Leader's Payment Initiation */}
            {isOrganizer && !organizerPayment?.status && (
              <>
                {showPayPal ? (
                  <PaypalButton
                    amount={participantAmounts.find(p => p.participant.id === user.uid)?.amount || 0}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                ) : (
                  <button
                    onClick={handleInitiatePayments}
                    disabled={processing}
                    className="bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 inline-flex items-center text-sm"
                  >
                    <DollarSign className="h-4 w-4 mr-1.5" />
                    Start Payment Collection
                  </button>
                )}
              </>
            )}

            {/* Member's Payment Button */}
            {!isOrganizer && organizerPayment?.status && !userPayment?.status && (
              <button
                onClick={() => setShowPaymentConfirmModal(true)}
                className="bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-white px-4 py-2 rounded-xl inline-flex items-center hover:shadow-lg transition-all text-sm"
              >
                <DollarSign className="h-4 w-4 mr-1.5" />
                Pay Your Share
              </button>
            )}
          </div>
        </div>
        
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-1">Total Amount</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(totalAmount)}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-1">Your Share</div>
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(participantAmounts.find(p => p.participant.id === user.uid)?.amount || 0)}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-1">Payments Completed</div>
            <div className="text-lg font-semibold text-gray-900">
              {completedPayments.length} / {party.participants.length}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Payment Status List */}
          <div className="space-y-4">
            {party.participants.map((participant) => {
              const payment = party.payments?.find(p => p.userId === participant.id);
              const amount = participantAmounts.find(p => p.participant.id === participant.id)?.amount || 0;
              
              return (
                <div
                  key={participant.id}
                  className="flex items-center justify-between bg-gray-50 rounded-xl p-4"
                >
                  <div className="flex items-center">
                    <img
                      src={participant.avatar}
                      alt={participant.name}
                      className="h-8 w-8 rounded-full"
                    />
                    <span className="ml-3 font-medium text-gray-900">
                      {participant.name}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-3 text-gray-600">
                      {formatCurrency(amount)}
                    </span>
                    {payment?.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSuccessModal && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          message={successMessage}
        />
      )}

      {showPaymentConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowPaymentConfirmModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#FF4D8D] bg-opacity-10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-[#FF4D8D]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Start Payment Process
              </h2>
              <p className="text-gray-600">
                You are about to start the payment process for your share of {formatCurrency(participantAmounts.find(p => p.participant.id === user.uid)?.amount || 0)}. 
                Would you like to proceed with PayPal?
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentConfirmModal(false)}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPaymentConfirmModal(false);
                  setShowPayPal(true);
                }}
                className="flex-1 px-4 py-3 bg-[#FF4D8D] text-white rounded-xl hover:bg-[#FF3D7D] transition-colors"
              >
                Proceed to PayPal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}