import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ChevronLeft, Users, Share2, MessageCircle, Map } from 'lucide-react';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { useProducts } from '../hooks/useProducts';
import { ProductList } from './ProductList';
import { ProductCatalog } from './ProductCatalog';
import { InviteModal } from './InviteModal';
import { PaymentPanel } from './PaymentPanel';
import { ChatPanel } from './ChatPanel';
import { CouponForm } from './CouponForm';
import { ReopenConfirmationModal } from './ReopenConfirmationModal';
import { SuccessModal } from './SuccessModal';
import { formatDate, formatTime } from '../utils/dateUtils';
import { addNotification } from '../utils/notifications';
import type { Party } from '../types';

interface PartyDetailsProps {
  setSelectedParty: (party: Party | null) => void;
}

export function PartyDetails({ setSelectedParty }: PartyDetailsProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showProductCatalog, setShowProductCatalog] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { addProduct, removeProduct } = useProducts(id || '');

  useEffect(() => {
    async function fetchParty() {
      if (!id || !user) return;

      try {
        const partyRef = doc(db, 'parties', id);
        const partyDoc = await getDoc(partyRef);
        
        if (!partyDoc.exists()) {
          setError('Squad not found');
          setLoading(false);
          return;
        }

        const partyData = {
          id: partyDoc.id,
          ...partyDoc.data()
        } as Party;

        setParty(partyData);
        setSelectedParty(partyData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching party:', err);
        setError('Failed to load squad');
        setLoading(false);
      }
    }

    fetchParty();
  }, [id, user, setSelectedParty]);

  const handleAddProduct = async (catalogProduct: any, variant: { size: string; color: string }) => {
    if (!user || !party) return;

    const newProduct = await addProduct(catalogProduct, variant, user.uid);
    if (newProduct) {
      setParty(prev => {
        if (!prev) return null;
        return {
          ...prev,
          products: [...(prev.products || []), newProduct]
        };
      });
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!party || !id) return;

    try {
      const success = await removeProduct(productId, party);
      if (success) {
        setParty(prev => {
          if (!prev) return null;
          return {
            ...prev,
            products: prev.products.filter(p => p.id !== productId)
          };
        });
      }
    } catch (err) {
      console.error('Error removing product:', err);
    }
  };

  const handleRequestReopen = async () => {
    if (!user || !party) return;

    try {
      await addNotification({
        type: 'reopen_request',
        title: 'Squad Reopen Request',
        message: `${user.displayName || 'A member'} has requested to reopen "${party.title}"`,
        userId: party.organizerId,
        partyId: party.id,
        requesterId: user.uid,
        requesterName: user.displayName || 'Anonymous'
      });

      setSuccessMessage('Your request to reopen the squad has been sent to the leader.');
      setShowSuccessModal(true);
      setShowReopenModal(false);
    } catch (err) {
      console.error('Error requesting reopen:', err);
      setError('Failed to send reopen request');
    }
  };

  const handleReopenSquad = async () => {
    if (!user || !party) return;

    try {
      const partyRef = doc(db, 'parties', party.id);
      await updateDoc(partyRef, {
        status: 'upcoming'
      });

      // Notify all participants
      for (const participant of party.participants) {
        if (participant.id !== user.uid) {
          await addNotification({
            type: 'squad_reopened',
            title: 'Squad Reopened',
            message: `${party.title} has been reopened`,
            userId: participant.id,
            partyId: party.id
          });
        }
      }

      const updatedParty = {
        ...party,
        status: 'upcoming'
      };
      setParty(updatedParty);
      setSelectedParty(updatedParty);
      
      setSuccessMessage('Squad has been reopened successfully!');
      setShowSuccessModal(true);
      setShowReopenModal(false);
    } catch (err) {
      console.error('Error reopening squad:', err);
      setError('Failed to reopen squad');
    }
  };

  const handleOpenMaps = () => {
    if (!party) return;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(party.location)}`;
    window.open(mapsUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4D8D]"></div>
      </div>
    );
  }

  if (error || !party) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
        <p className="text-gray-600">{error || 'Something went wrong'}</p>
      </div>
    );
  }

  const isOrganizer = party.organizerId === user?.uid;
  const organizerPayment = party.payments?.find(p => p.userId === party.organizerId);
  const canInvite = !organizerPayment?.status;
  const canRequestReopen = !isOrganizer && party.status === 'completed';
  const canReopen = isOrganizer && party.status === 'completed';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button
            onClick={() => navigate('/squads')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-2"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back to Squads
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{party.title}</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {party.participants.slice(0, 3).map((participant) => (
              <img
                key={participant.id}
                src={participant.avatar}
                alt={participant.name}
                className="h-8 w-8 rounded-full ring-2 ring-white"
                title={participant.name}
              />
            ))}
            {party.participants.length > 3 && (
              <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white bg-[#FF4D8D] text-white text-sm font-medium">
                +{party.participants.length - 3}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowChat(true)}
            className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-xl inline-flex items-center hover:bg-gray-200 transition-all text-sm"
          >
            <MessageCircle className="h-4 w-4 mr-1.5" />
            Chat
          </button>
          
          {canInvite && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-white px-3 py-1.5 rounded-xl inline-flex items-center hover:shadow-lg transition-all text-sm"
            >
              <Share2 className="h-4 w-4 mr-1.5" />
              Invite
            </button>
          )}

          {canRequestReopen && (
            <button
              onClick={() => setShowReopenModal(true)}
              className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-xl inline-flex items-center hover:bg-gray-200 transition-all text-sm"
            >
              Request Squad Reopening
            </button>
          )}

          {canReopen && (
            <button
              onClick={() => setShowReopenModal(true)}
              className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-xl inline-flex items-center hover:bg-gray-200 transition-all text-sm"
            >
              Reopen Squad
            </button>
          )}
        </div>
      </div>

      {/* Meeting Point Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Meeting Point</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Date</h3>
                <p className="text-gray-600">{formatDate(party.date)}</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Time</h3>
                <p className="text-gray-600">{formatTime(party.date)}</p>
              </div>
            </div>

            <div className="flex items-start justify-between w-full">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Location</h3>
                <p className="text-gray-600">{party.location}</p>
              </div>
              <button
                onClick={handleOpenMaps}
                className="text-gray-600 hover:text-gray-900 transition-colors"
                title="Open in Maps"
              >
                <Map className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Coupon Form */}
      {party.status === 'upcoming' && (
        <CouponForm 
          party={party}
          onUpdate={(updatedParty) => {
            setParty(updatedParty);
            setSelectedParty(updatedParty);
          }}
        />
      )}

      {/* Payment Panel */}
      <PaymentPanel 
        party={party} 
        onUpdate={(updatedParty) => {
          setParty(updatedParty);
          setSelectedParty(updatedParty);
        }}
      />

      {/* Product List */}
      <ProductList
        products={party.products || []}
        participants={party.participants}
        onAddProduct={() => setShowProductCatalog(true)}
        onRemoveProduct={handleRemoveProduct}
        currentUserId={user?.uid || ''}
        partyId={party.id}
        partyStatus={party.status}
        canAddProducts={!organizerPayment?.status}
      />

      {/* Modals */}
      {showInviteModal && (
        <InviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          partyId={party.id}
          partyTitle={party.title}
        />
      )}

      {showProductCatalog && (
        <ProductCatalog
          onSelectProduct={handleAddProduct}
          onClose={() => setShowProductCatalog(false)}
        />
      )}

      {showChat && (
        <ChatPanel
          partyId={party.id}
          messages={party.messages || []}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      )}

      {showReopenModal && (
        <ReopenConfirmationModal
          isOpen={showReopenModal}
          onClose={() => setShowReopenModal(false)}
          onConfirm={isOrganizer ? handleReopenSquad : handleRequestReopen}
          type={isOrganizer ? 'approve' : 'request'}
          requesterName={user?.displayName}
        />
      )}

      {showSuccessModal && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          message={successMessage}
        />
      )}
    </div>
  );
}