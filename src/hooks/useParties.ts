import { collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp, onSnapshot } from 'firebase/firestore';
import { useState, useCallback, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import { toFirestoreTimestamp } from '../utils/dateUtils';
import type { Party } from '../types';

export const useParties = () => {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Set up real-time listener for parties
  useEffect(() => {
    if (!user) {
      setParties([]);
      return;
    }

    setLoading(true);
    
    // Create two queries to handle both old and new participant structures
    const participantQueries = [
      query(
        collection(db, 'parties'),
        where('participants', 'array-contains', {
          id: user.uid,
          name: user.displayName || 'Anonymous',
          email: user.email || '',
          avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'Anonymous')}`
        })
      ),
      query(
        collection(db, 'parties'),
        where('participants', 'array-contains', {
          id: user.uid,
          name: user.displayName || 'Anonymous',
          avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'Anonymous')}`
        })
      )
    ];

    // Set up listeners for both queries
    const unsubscribes = participantQueries.map(q => 
      onSnapshot(q, 
        (snapshot) => {
          const fetchedParties = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date,
            // Ensure all participants have email field
            participants: doc.data().participants.map((p: any) => ({
              ...p,
              email: p.email || (p.id === user.uid ? user.email : '')
            }))
          })) as Party[];

          // Merge parties from both queries and remove duplicates
          setParties(prev => {
            const allParties = [...prev, ...fetchedParties];
            const uniqueParties = Array.from(
              new Map(allParties.map(party => [party.id, party])).values()
            );
            // Sort parties by date, most recent first
            return uniqueParties.sort((a, b) => b.date.seconds - a.date.seconds);
          });
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching parties:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch parties');
          setLoading(false);
        }
      )
    );

    // Cleanup all subscriptions on unmount
    return () => unsubscribes.forEach(unsubscribe => unsubscribe());
  }, [user]);

  const fetchParties = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const participantQueries = [
        query(
          collection(db, 'parties'),
          where('participants', 'array-contains', {
            id: user.uid,
            name: user.displayName || 'Anonymous',
            email: user.email || '',
            avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'Anonymous')}`
          })
        ),
        query(
          collection(db, 'parties'),
          where('participants', 'array-contains', {
            id: user.uid,
            name: user.displayName || 'Anonymous',
            avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'Anonymous')}`
          })
        )
      ];
      
      const querySnapshots = await Promise.all(
        participantQueries.map(q => getDocs(q))
      );

      const allParties = querySnapshots.flatMap(snapshot => 
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date,
          // Ensure all participants have email field
          participants: doc.data().participants.map((p: any) => ({
            ...p,
            email: p.email || (p.id === user.uid ? user.email : '')
          }))
        })) as Party[]
      );

      // Remove duplicates and sort
      const uniqueParties = Array.from(
        new Map(allParties.map(party => [party.id, party])).values()
      );
      uniqueParties.sort((a, b) => b.date.seconds - a.date.seconds);
      
      setParties(uniqueParties);
    } catch (err) {
      console.error('Error fetching parties:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch parties');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createParty = useCallback(async (partyData: { 
    title: string; 
    date: Date; 
    location: string;
    status?: string;
    payments?: any[];
    messages?: any[];
  }) => {
    if (!user) {
      setError('You must be logged in to create a party');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const newParty = {
        title: partyData.title,
        date: toFirestoreTimestamp(partyData.date),
        location: partyData.location,
        organizerId: user.uid,
        organizer: user.displayName || user.email || 'Anonymous',
        participants: [{
          id: user.uid,
          name: user.displayName || 'Anonymous',
          email: user.email || '',
          avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'Anonymous')}`
        }],
        products: [],
        messages: partyData.messages || [],
        status: partyData.status || 'upcoming',
        payments: partyData.payments || [],
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'parties'), newParty);
      const createdParty = { ...newParty, id: docRef.id } as Party;
      return createdParty;
    } catch (err) {
      console.error('Error creating party:', err);
      setError(err instanceof Error ? err.message : 'Failed to create party');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateParty = useCallback(async (partyId: string, updates: Partial<Party>) => {
    if (!user) return false;

    try {
      const partyRef = doc(db, 'parties', partyId);
      await updateDoc(partyRef, updates);
      return true;
    } catch (err) {
      console.error('Error updating party:', err);
      return false;
    }
  }, [user]);

  return {
    parties,
    loading,
    error,
    createParty,
    updateParty,
    fetchParties,
  };
};