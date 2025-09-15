import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from './apiService';

export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  balance: number;
  emailVerified: boolean;
  avatar?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
}

class AuthService {
  private currentUser: UserProfile | null = null;
  private authStateListeners: ((user: UserProfile | null) => void)[] = [];

  async register(
    email: string,
    password: string,
    username: string,
    firstName: string,
    lastName: string,
    referralCode?: string
  ) {
    try {
      const response = await authAPI.register({
        email,
        password,
        username,
        firstName,
        lastName,
        referralCode
      });

      if (response.token && response.user) {
        await AsyncStorage.setItem('token', response.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
        
        this.currentUser = response.user;
        this.notifyAuthStateChange(response.user);
        
        return { user: response.user, token: response.token };
      }
      
      throw new Error('Registration failed');
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  }

  async login(email: string, password: string) {
    try {
      const response = await authAPI.login(email, password);
      
      if (response.token && response.user) {
        await AsyncStorage.setItem('token', response.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
        
        this.currentUser = response.user;
        this.notifyAuthStateChange(response.user);
        
        return { user: response.user, token: response.token };
      }
      
      throw new Error('Login failed');
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  }

  async logout() {
    try {
      await authAPI.logout();
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      this.currentUser = null;
      this.notifyAuthStateChange(null);
    } catch (error: any) {
      throw new Error(error.message || 'Logout failed');
    }
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      // First check cached user
      if (this.currentUser) {
        return this.currentUser;
      }

      // Check AsyncStorage
      const savedUser = await AsyncStorage.getItem('user');
      const savedToken = await AsyncStorage.getItem('token');
      
      if (savedUser && savedToken) {
        this.currentUser = JSON.parse(savedUser);
        return this.currentUser;
      }

      // If we have a token but no user, fetch from API
      if (savedToken) {
        const response = await authAPI.getCurrentUser();
        if (response.user) {
          this.currentUser = response.user;
          await AsyncStorage.setItem('user', JSON.stringify(response.user));
          return response.user;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async updateProfile(profileData: Partial<UserProfile>) {
    try {
      const response = await authAPI.updateProfile(profileData);
      
      if (response.user) {
        this.currentUser = response.user;
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
        this.notifyAuthStateChange(response.user);
        return response.user;
      }
      
      throw new Error('Profile update failed');
    } catch (error: any) {
      throw new Error(error.message || 'Profile update failed');
    }
  }

  async checkAuthState() {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const user = await this.getCurrentUser();
        this.notifyAuthStateChange(user);
        return user;
      }
      this.notifyAuthStateChange(null);
      return null;
    } catch (error) {
      console.error('Error checking auth state:', error);
      this.notifyAuthStateChange(null);
      return null;
    }
  }

  onAuthStateChanged(callback: (user: UserProfile | null) => void) {
    this.authStateListeners.push(callback);
    
    // Check initial auth state
    this.checkAuthState();
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  private notifyAuthStateChange(user: UserProfile | null) {
    this.authStateListeners.forEach(listener => {
      listener(user);
    });
  }
}

export default new AuthService();