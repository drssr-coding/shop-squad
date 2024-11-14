import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA8z4NVu9Dvhyk6sUPQ-x_2D0GB21sb0xY",
  authDomain: "shoppingparty-net.firebaseapp.com",
  projectId: "shoppingparty-net",
  storageBucket: "shoppingparty-net.firebasestorage.app",
  messagingSenderId: "189937015172",
  appId: "1:189937015172:web:77f039518df9291e6f65d1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);