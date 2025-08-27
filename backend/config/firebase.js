const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Parse the service account JSON from environment variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    
    if (!serviceAccount.project_id) {
      console.error('Firebase service account not configured properly');
      return null;
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });

    console.log('Firebase Admin SDK initialized successfully');
    return admin;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return null;
  }
};

const firebaseAdmin = initializeFirebase();
const db = firebaseAdmin ? admin.firestore() : null;
const auth = firebaseAdmin ? admin.auth() : null;
const storage = firebaseAdmin ? admin.storage() : null;

module.exports = {
  admin: firebaseAdmin,
  db,
  auth,
  storage
};