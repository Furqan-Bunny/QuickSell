// Mock authentication service for demo purposes
// This works without MongoDB

interface MockUser {
  id: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  avatar?: string;
  balance: number;
  emailVerified: boolean;
}

// Mock users stored in localStorage
const MOCK_USERS_KEY = 'quicksell_mock_users';
const CURRENT_USER_KEY = 'quicksell_current_user';
const AUTH_TOKEN_KEY = 'quicksell_auth_token';

// Default mock users
const defaultUsers: MockUser[] = [
  {
    id: 'admin-001',
    username: 'admin',
    email: 'admin@quicksell.com',
    password: 'password123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    balance: 100000,
    emailVerified: true
  },
  {
    id: 'buyer-001',
    username: 'buyer1',
    email: 'buyer1@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
    balance: 5000,
    emailVerified: true
  },
  {
    id: 'buyer-002',
    username: 'buyer2',
    email: 'buyer2@example.com',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'user',
    balance: 8000,
    emailVerified: true
  }
];

class MockAuthService {
  constructor() {
    // Initialize mock users if not already in localStorage
    if (!localStorage.getItem(MOCK_USERS_KEY)) {
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(defaultUsers));
    }
  }

  private getUsers(): MockUser[] {
    const users = localStorage.getItem(MOCK_USERS_KEY);
    return users ? JSON.parse(users) : defaultUsers;
  }

  private saveUsers(users: MockUser[]): void {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
  }

  private generateToken(): string {
    return 'mock-jwt-token';
  }

  async login(email: string, password: string): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = this.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
          const token = this.generateToken();
          const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            balance: user.balance,
            emailVerified: user.emailVerified
          };
          
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
          localStorage.setItem(AUTH_TOKEN_KEY, token);
          
          resolve({
            token,
            user: userData
          });
        } else {
          reject(new Error('Invalid email or password'));
        }
      }, 500); // Simulate network delay
    });
  }

  async register(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = this.getUsers();
        
        // Check if user already exists
        if (users.find(u => u.email === data.email)) {
          reject(new Error('Email already registered'));
          return;
        }
        
        if (users.find(u => u.username === data.username)) {
          reject(new Error('Username already taken'));
          return;
        }
        
        // Create new user (always as buyer)
        const newUser: MockUser = {
          id: 'user-' + Date.now(),
          username: data.username,
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'user', // Always create as buyer
          balance: 0,
          emailVerified: false
        };
        
        users.push(newUser);
        this.saveUsers(users);
        
        const token = this.generateToken();
        const userData = {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          balance: newUser.balance,
          emailVerified: newUser.emailVerified
        };
        
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        
        resolve({
          token,
          user: userData
        });
      }, 500); // Simulate network delay
    });
  }

  async logout(): Promise<void> {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem(CURRENT_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  // Reset to default users (for demo purposes)
  resetToDefaults(): void {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(defaultUsers));
    this.logout();
  }
}

export default new MockAuthService();