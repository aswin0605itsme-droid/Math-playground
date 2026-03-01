import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, setLogLevel } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDtbA8bUzJ9n14FDDStrbrEy9hO0AW7UiU",
  authDomain: "gen-lang-client-0757151463.firebaseapp.com",
  projectId: "gen-lang-client-0757151463",
  storageBucket: "gen-lang-client-0757151463.firebasestorage.app",
  messagingSenderId: "951559109907",
  appId: "1:951559109907:web:64e28762c55fde5f0faee6",
  measurementId: "G-TCPVSVQVYD"
};

export const isFirebaseConfigured = true;

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Suppress internal Firestore connection warnings
setLogLevel('silent');

// Initialize Firestore with offline persistence enabled
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
});
