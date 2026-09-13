import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyA2MsSLmWd6ljuPn35X1WtF2z2fleKjHo4",
  authDomain: "dbmover-31ca6.firebaseapp.com",
  databaseURL: "https://dbmover-31ca6-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dbmover-31ca6",
  storageBucket: "dbmover-31ca6.firebasestorage.app",
  messagingSenderId: "620567747335",
  appId: "1:620567747335:web:67aa7f4a32937ed77a83a2"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);