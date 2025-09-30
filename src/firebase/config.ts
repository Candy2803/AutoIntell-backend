import { initializeApp, getApp, getApps } from 'firebase/app';
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

const app = !getApps.length ? initializeApp(firebaseConfig): getApp()

export const auth = getAuth(app);
export const db = getFirestore(app);
