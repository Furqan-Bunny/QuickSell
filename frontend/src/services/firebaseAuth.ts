import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
  sendEmailVerification
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import axios from 'axios';

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
  createdAt: any;
  updatedAt: any;
}

class FirebaseAuthService {
  async register(data: {
    email: string;
    password: string;
    username: string;
    firstName: string;
    lastName: string;
  }) {
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: data.username
      });

      // Send verification email
      await sendEmailVerification(user);

      // Create user profile in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: data.email,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'user', // Default role for new users
        balance: 0,
        emailVerified: user.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);

      // Also register with backend for compatibility
      const token = await user.getIdToken();
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      try {
        await axios.post('/api/auth/register', {
          email: data.email,
          password: data.password,
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName
        });
      } catch (backendError) {
        console.log('Backend registration skipped:', backendError);
      }

      return {
        user: userProfile,
        token
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message);
    }
  }

  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      
      const user = userCredential.user;
      const token = await user.getIdToken();
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      let userProfile: UserProfile;
      
      if (!userDoc.exists()) {
        // Create profile if it doesn't exist (for users created outside the app)
        userProfile = {
          uid: user.uid,
          email: user.email || '',
          username: user.displayName || user.email?.split('@')[0] || 'user',
          firstName: '',
          lastName: '',
          role: 'user',
          balance: 0,
          emailVerified: user.emailVerified,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(doc(db, 'users', user.uid), userProfile);
      } else {
        userProfile = userDoc.data() as UserProfile;
      }

      return {
        user: userProfile,
        token
      };
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message);
    }
  }

  async logout() {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser) {
      return null;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        return null;
      }

      return userDoc.data() as UserProfile;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async updateUserProfile(uid: string, data: Partial<UserProfile>) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return auth.onAuthStateChanged(callback);
  }
}

export default new FirebaseAuthService();