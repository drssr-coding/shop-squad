import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export async function initializeDatabase() {
  try {
    // Just initialize Firebase connection
    const partiesSnapshot = await getDocs(collection(db, 'parties'));
    console.log(`Database connected, found ${partiesSnapshot.size} parties`);
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
}