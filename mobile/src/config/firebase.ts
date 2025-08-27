// Firebase configuration file for React Native
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  getReactNativePersistence 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const firebaseConfig = {
  apiKey: "AIzaSyA9THl_SNKyazeQAEBV_PQUE10y9PqvGR4",
  authDomain: "quicksell-80aad.firebaseapp.com",
  projectId: "quicksell-80aad",
  storageBucket: "quicksell-80aad.firebasestorage.app",
  messagingSenderId: "268405827471",
  appId: "1:268405827471:web:60468bf66f1f1100670dfa"
};

// Initialize Firebase only if not already initialized
let app;
let auth;
let db;
let storage;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    
    // Initialize Auth with React Native persistence
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } else {
    app = getApp();
    auth = getAuth(app);
  }
  
  // Initialize Firestore and Storage
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
  
  // Fallback to basic initialization
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };

// Export getter functions for compatibility
export function getFirebaseApp() {
  return app;
}

export function getFirebaseAuth() {
  return auth;
}

export function getFirebaseDb() {
  return db;
}

export function getFirebaseStorage() {
  return storage;
}

export default app;