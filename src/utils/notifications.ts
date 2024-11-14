import { doc, setDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { nanoid } from 'nanoid';

interface NotificationData {
  type: 'invite' | 'payment_request' | 'payment_received' | 'squad_closed' | 'squad_reopened' | 'squad_completed';
  title: string;
  message: string;
  userId: string;
  partyId?: string;
}

export async function addNotification(data: NotificationData) {
  try {
    const userNotificationsRef = doc(db, 'notifications', data.userId);
    
    const notification = {
      id: nanoid(),
      ...data,
      timestamp: Timestamp.now(),
      read: false
    };

    await setDoc(userNotificationsRef, {
      items: arrayUnion(notification)
    }, { merge: true });

    return notification;
  } catch (err) {
    console.error('Error adding notification:', err);
    throw err;
  }
}