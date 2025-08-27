// Firebase lazy initialization for React Native
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA9THl_SNKyazeQAEBV_PQUE10y9PqvGR4",
  authDomain: "quicksell-80aad.firebaseapp.com",
  projectId: "quicksell-80aad",
  storageBucket: "quicksell-80aad.firebasestorage.app",
  messagingSenderId: "268405827471",
  appId: "1:268405827471:web:60468bf66f1f1100670dfa"
};

class FirebaseService {
  private static instance: FirebaseService;
  private app: any = null;
  private authInstance: any = null;
  private dbInstance: any = null;
  private storageInstance: any = null;

  private constructor() {}

  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  getApp() {
    if (!this.app) {
      if (getApps().length === 0) {
        this.app = initializeApp(firebaseConfig);
      } else {
        this.app = getApps()[0];
      }
    }
    return this.app;
  }

  getAuth() {
    if (!this.authInstance) {
      this.authInstance = getAuth(this.getApp());
    }
    return this.authInstance;
  }

  getDb() {
    if (!this.dbInstance) {
      this.dbInstance = getFirestore(this.getApp());
    }
    return this.dbInstance;
  }

  getStorage() {
    if (!this.storageInstance) {
      this.storageInstance = getStorage(this.getApp());
    }
    return this.storageInstance;
  }
}

const firebaseService = FirebaseService.getInstance();

export const getFirebaseApp = () => firebaseService.getApp();
export const getFirebaseAuth = () => firebaseService.getAuth();
export const getFirebaseDb = () => firebaseService.getDb();
export const getFirebaseStorage = () => firebaseService.getStorage();

export default firebaseService;