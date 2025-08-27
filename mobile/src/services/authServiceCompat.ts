import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { auth, db } from '../config/firebaseConfig';
import mockAuthService from './mockAuthService';

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  balance: number;
  emailVerified: boolean;
  avatar?: string;
  createdAt?: any;
  updatedAt?: any;
}

// Use real Firebase for production
const USE_MOCK = false;

class AuthService {
  async register(
    email: string,
    password: string,
    username: string,
    firstName: string,
    lastName: string
  ) {
    if (USE_MOCK) {
      return mockAuthService.register(email, password, username, firstName, lastName);
    }
    
    try {
      // Create user with email and password
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (!user) {
        throw new Error('Failed to create user');
      }

      // Update display name
      await user.updateProfile({
        displayName: username
      });

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email,
        username,
        firstName,
        lastName,
        role: 'user',
        balance: 0,
        emailVerified: user.emailVerified,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('users').doc(user.uid).set(userProfile);

      return { user: userProfile };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async login(email: string, password: string) {
    if (USE_MOCK) {
      return mockAuthService.login(email, password);
    }
    
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (!user) {
        throw new Error('Login failed');
      }

      // Get user profile from Firestore
      const userDoc = await db.collection('users').doc(user.uid).get();
      
      let userProfile: UserProfile;
      
      if (!userDoc.exists) {
        // Create profile if it doesn't exist
        userProfile = {
          uid: user.uid,
          email: user.email || '',
          username: user.displayName || user.email?.split('@')[0] || 'user',
          firstName: '',
          lastName: '',
          role: 'user',
          balance: 0,
          emailVerified: user.emailVerified,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await db.collection('users').doc(user.uid).set(userProfile);
      } else {
        userProfile = userDoc.data() as UserProfile;
      }

      return { user: userProfile };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async logout() {
    if (USE_MOCK) {
      return mockAuthService.logout();
    }
    
    try {
      await auth.signOut();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    if (USE_MOCK) {
      return mockAuthService.getCurrentUser() as any;
    }
    
    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
      return null;
    }

    try {
      const userDoc = await db.collection('users').doc(firebaseUser.uid).get();

      if (!userDoc.exists) {
        return null;
      }

      return userDoc.data() as UserProfile;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  onAuthStateChanged(callback: (user: firebase.User | null) => void) {
    if (USE_MOCK) {
      return mockAuthService.onAuthStateChanged(callback as any);
    }
    return auth.onAuthStateChanged(callback);
  }
}

export default new AuthService();