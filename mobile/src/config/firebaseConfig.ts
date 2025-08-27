// Firebase configuration for React Native using compat mode
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA9THl_SNKyazeQAEBV_PQUE10y9PqvGR4",
  authDomain: "quicksell-80aad.firebaseapp.com",
  projectId: "quicksell-80aad",
  storageBucket: "quicksell-80aad.firebasestorage.app",
  messagingSenderId: "268405827471",
  appId: "1:268405827471:web:60468bf66f1f1100670dfa"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Export services
export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();

// Export firebase itself for additional functionality
export default firebase;