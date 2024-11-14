import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export function formatDate(timestamp: any): string {
  if (!timestamp) {
    return 'Date not set';
  }

  try {
    // Handle plain object with seconds and nanoseconds
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
      const date = new Date(timestamp.seconds * 1000);
      return format(date, 'MMMM d, yyyy');
    }

    // Handle Firestore Timestamp
    if (timestamp instanceof Timestamp) {
      const date = timestamp.toDate();
      return format(date, 'MMMM d, yyyy');
    }

    return 'Date not set';
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date not set';
  }
}

export function formatTime(timestamp: any): string {
  if (!timestamp) {
    return 'Time not set';
  }

  try {
    // Handle plain object with seconds and nanoseconds
    if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
      const date = new Date(timestamp.seconds * 1000);
      return format(date, 'h:mm a');
    }

    // Handle Firestore Timestamp
    if (timestamp instanceof Timestamp) {
      const date = timestamp.toDate();
      return format(date, 'h:mm a');
    }

    return 'Time not set';
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Time not set';
  }
}

export function toFirestoreTimestamp(date: Date): Timestamp {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided to toFirestoreTimestamp');
  }
  return Timestamp.fromDate(date);
}

export function fromFirestoreTimestamp(timestamp: any): Date {
  // Handle plain object with seconds and nanoseconds
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
    return new Date(timestamp.seconds * 1000);
  }

  // Handle Firestore Timestamp
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }

  throw new Error('Invalid timestamp format');
}

export function isValidTimestamp(timestamp: any): boolean {
  return (
    (timestamp instanceof Timestamp) ||
    (typeof timestamp === 'object' && 
     timestamp !== null && 
     'seconds' in timestamp && 
     'nanoseconds' in timestamp &&
     typeof timestamp.seconds === 'number' &&
     typeof timestamp.nanoseconds === 'number')
  );
}