// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCUxOk-sc2-gfUBk_UW_oRE3JbUtXnAxso',
  authDomain: 'autointell-aa9d6.firebaseapp.com',
  projectId: 'autointell-aa9d6',
  storageBucket: 'autointell-aa9d6.firebasestorage.app',
  messagingSenderId: '929737920656',
  appId: '1:929737920656:web:851688659f9f5977cd4815',
  measurementId: 'G-CZ2CD8Q1XJ',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
