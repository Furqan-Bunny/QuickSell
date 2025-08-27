// Mock Authentication Service for Testing
// This bypasses Firebase when there are network issues

export interface MockUser {
  uid: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  balance: number;
  emailVerified: boolean;
}

class MockAuthService {
  private currentUser: MockUser | null = null;
  private listeners: ((user: any) => void)[] = [];

  // Mock users database
  private mockUsers = [
    {
      email: 'buyer@test.com',
      password: 'password123',
      profile: {
        uid: 'mock-user-1',
        email: 'buyer@test.com',
        username: 'testbuyer',
        firstName: 'Test',
        lastName: 'Buyer',
        role: 'user' as const,
        balance: 5000,
        emailVerified: true
      }
    },
    {
      email: 'admin@test.com',
      password: 'admin123',
      profile: {
        uid: 'mock-admin-1',
        email: 'admin@test.com',
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin' as const,
        balance: 10000,
        emailVerified: true
      }
    }
  ];

  async register(
    email: string,
    password: string,
    username: string,
    firstName: string,
    lastName: string
  ) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if user already exists
    const existing = this.mockUsers.find(u => u.email === email);
    if (existing) {
      throw new Error('Email already in use');
    }

    // Create new user
    const newUser = {
      email,
      password,
      profile: {
        uid: `mock-user-${Date.now()}`,
        email,
        username,
        firstName,
        lastName,
        role: 'user' as const,
        balance: 0,
        emailVerified: false
      }
    };

    this.mockUsers.push(newUser);
    this.currentUser = newUser.profile;
    this.notifyListeners(this.currentUser);

    return { user: newUser.profile };
  }

  async login(email: string, password: string) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = this.mockUsers.find(
      u => u.email === email && u.password === password
    );

    if (!user) {
      throw new Error('Invalid email or password');
    }

    this.currentUser = user.profile;
    this.notifyListeners(this.currentUser);

    return { user: user.profile };
  }

  async logout() {
    await new Promise(resolve => setTimeout(resolve, 500));
    this.currentUser = null;
    this.notifyListeners(null);
  }

  async getCurrentUser(): Promise<MockUser | null> {
    return this.currentUser;
  }

  onAuthStateChanged(callback: (user: any) => void) {
    this.listeners.push(callback);
    // Immediately call with current state
    callback(this.currentUser);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(user: any) {
    this.listeners.forEach(listener => listener(user));
  }
}

export default new MockAuthService();