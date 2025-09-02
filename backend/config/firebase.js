const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  try {
    // Parse the service account JSON from environment variable
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccountString) {
      console.error('FIREBASE_SERVICE_ACCOUNT environment variable is not set');
      console.error('Please add your Firebase service account JSON to Railway environment variables');
      return null;
    }
    
    const serviceAccount = JSON.parse(serviceAccountString);
    
    if (!serviceAccount.project_id) {
      console.error('Firebase service account JSON is invalid - missing project_id');
      return null;
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });

    console.log('Firebase Admin SDK initialized successfully');
    console.log('Project ID:', serviceAccount.project_id);
    return admin;
  } catch (error) {
    console.error('Error initializing Firebase:', error.message);
    if (error.message.includes('JSON')) {
      console.error('Make sure FIREBASE_SERVICE_ACCOUNT is valid JSON and on a single line');
    }
    return null;
  }
};

let firebaseAdmin = null;
let db = null;
let auth = null;
let storage = null;

try {
  firebaseAdmin = initializeFirebase();
  if (firebaseAdmin) {
    db = admin.firestore();
    auth = admin.auth();
    storage = admin.storage();
  }
} catch (error) {
  console.error('Failed to initialize Firebase services:', error.message);
}

module.exports = {
  admin: firebaseAdmin,
  db,
  auth,
  storage
};