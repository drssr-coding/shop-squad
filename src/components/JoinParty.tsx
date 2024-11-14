import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { useParties } from '../hooks/useParties';
import { Party } from '../types';
import { ShoppingBag } from 'lucide-react';
import { AuthModal } from './AuthModal';

export function JoinParty() {
  const { partyId } = useParams<{ partyId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [party, setParty] = useState<Party | null>(null);
  const [joining, setJoining] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState<'signin' | 'signup' | null>(null);

  useEffect(() => {
    async function fetchParty() {
      if (!partyId) return;

      try {
        const partyRef = doc(db, 'parties', partyId);
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

        // If user is logged in, check if they're already a participant
        if (user) {
          const isParticipant = partyData.participants?.some(p => p.id === user.uid);
          if (isParticipant) {
            navigate(`/party/${partyId}`, {
              replace: true,
              state: { party: partyData }
            });
            return;
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching party:', err);
        setError('Failed to load squad');
        setLoading(false);
      }
    }

    fetchParty();
  }, [partyId, user, navigate]);

  const handleJoin = async () => {
    if (!party || !user || joining) return;

    try {
      setJoining(true);

      // Add user to participants with email
      const newParticipant = {
        id: user.uid,
        name: user.displayName || 'Anonymous',
        email: user.email || '',
        avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'Anonymous')}`
      };

      // Update the party document
      const partyRef = doc(db, 'parties', party.id);
      await updateDoc(partyRef, {
        participants: arrayUnion(newParticipant)
      });

      // Navigate with the complete updated party data
      const updatedPartyDoc = await getDoc(partyRef);
      const updatedPartyData = {
        id: updatedPartyDoc.id,
        ...updatedPartyDoc.data()
      } as Party;

      navigate(`/party/${party.id}`, {
        replace: true,
        state: { party: updatedPartyData }
      });
    } catch (err) {
      console.error('Error joining party:', err);
      setError('Failed to join squad');
      setJoining(false);
    }
  };

  // If user is not logged in, show auth modal
  if (!user && !loading && !error) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-transparent bg-clip-text mb-4">
              Join Shopping Squad
            </h2>
            <p className="text-gray-600 mb-6">
              Sign in or create an account to join this shopping squad
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setShowAuthModal('signin')}
                className="w-full bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Sign In
              </button>
              <button
                onClick={() => setShowAuthModal('signup')}
                className="w-full bg-white text-gray-900 py-3 px-4 rounded-xl font-medium border border-gray-200 hover:border-[#FF4D8D] transition-all"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>

        {showAuthModal && (
          <AuthModal
            isOpen={true}
            onClose={() => setShowAuthModal(null)}
            mode={showAuthModal}
            onSwitchMode={() => setShowAuthModal(showAuthModal === 'signin' ? 'signup' : 'signin')}
          />
        )}
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4D8D] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !party) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ShoppingBag className="h-12 w-12 text-[#FF4D8D] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-600">{error || 'Something went wrong'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-transparent bg-clip-text mb-2">
            {party.title}
          </h2>
          <p className="text-gray-600">Squad Leader: {party.organizer}</p>
          <p className="text-gray-500 mt-2">{party.location}</p>
        </div>

        <div className="space-y-4">
          <p className="text-center text-gray-600">
            You've been invited to join this shopping squad!
          </p>

          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full bg-gradient-to-r from-[#FF4D8D] to-[#FF8D6B] text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
          >
            {joining ? 'Joining...' : 'Join Squad'}
          </button>
        </div>
      </div>
    </div>
  );
}