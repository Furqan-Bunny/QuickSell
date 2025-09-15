// Firebase configuration file for React Native - Using compat for better React Native support
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

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
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app();
}

// Get services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

export { app, auth, db, storage, firebase };

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

export default firebase;