// Comprehensive API Service for QuickSell Mobile App
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

// Helper function to get auth token from AsyncStorage
const getAuthToken = async () => {
  try {
    // Get token from AsyncStorage (stored by authService)
    const token = await AsyncStorage.getItem('token');
    console.log('AsyncStorage token check:', token ? 'Found' : 'Not found');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Helper function for API requests
const apiRequest = async (
  endpoint: string,
  method: string = 'GET',
  body?: any,
  customHeaders?: any
) => {
  try {
    const token = await getAuthToken();
    console.log('Token retrieved:', token ? 'Yes' : 'No', token ? token.substring(0, 20) + '...' : 'None');
    
    const headers: any = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Authorization header set');
    } else {
      console.log('No token, skipping Authorization header');
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const url = `${API_BASE_URL}/api${endpoint}`;
    console.log('API Request:', method, url);
    
    const response = await fetch(url, config);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      data = { error: 'Server returned non-JSON response' };
    }

    if (!response.ok) {
      console.error('API Error:', response.status, data);
      console.error('Auth header was:', headers['Authorization'] ? 'Present' : 'Missing');
      throw new Error(data.error || data.message || `API request failed: ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error('API Request Error:', {
      endpoint,
      method,
      error: error.message,
      stack: error.stack
    });
    
    // Check if it's a network error
    if (error.message === 'Network request failed') {
      throw new Error('Cannot connect to server. Please check if backend is running on ' + API_BASE_URL);
    }
    
    throw error;
  }
};

// Authentication APIs
export const authAPI = {
  register: async (userData: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    referralCode?: string;
  }) => {
    return apiRequest('/auth/register', 'POST', userData);
  },

  login: async (email: string, password: string) => {
    return apiRequest('/auth/login', 'POST', { email, password });
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', 'POST');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local storage even if API call fails
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      return { success: true };
    }
  },

  getCurrentUser: async () => {
    return apiRequest('/users/profile');
  },

  updateProfile: async (profileData: any) => {
    return apiRequest('/users/profile', 'PUT', profileData);
  },
};

// Products APIs
export const productsAPI = {
  getAll: async (params?: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    return apiRequest(`/products?${queryParams.toString()}`);
  },

  getById: async (productId: string) => {
    return apiRequest(`/products/${productId}`);
  },

  getCategories: async () => {
    return apiRequest('/categories');
  },

  search: async (query: string) => {
    return apiRequest(`/products?search=${encodeURIComponent(query)}`);
  },
};

// Bidding APIs
export const bidsAPI = {
  placeBid: async (productId: string, amount: number) => {
    return apiRequest('/bids', 'POST', { productId, amount });
  },

  getMyBids: async () => {
    return apiRequest('/bids/my-bids');
  },

  getBidHistory: async (productId: string) => {
    return apiRequest(`/bids/product/${productId}`);
  },
};

// Orders APIs
export const ordersAPI = {
  create: async (orderData: {
    productId: string;
    type: 'buy_now' | 'auction_win';
    shippingAddress: any;
    paymentMethod: string;
  }) => {
    return apiRequest('/orders', 'POST', orderData);
  },

  getMyOrders: async (type?: string) => {
    const endpoint = type ? `/orders/my-orders?type=${type}` : '/orders/my-orders';
    return apiRequest(endpoint);
  },

  getOrderById: async (orderId: string) => {
    return apiRequest(`/orders/${orderId}`);
  },

  cancelOrder: async (orderId: string) => {
    return apiRequest(`/orders/${orderId}/cancel`, 'POST');
  },
};

// Wishlist APIs
export const wishlistAPI = {
  getWishlist: async () => {
    return apiRequest('/users/watchlist');
  },

  toggleWishlist: async (productId: string) => {
    return apiRequest(`/users/watchlist/${productId}`, 'POST');
  },

  removeFromWishlist: async (productId: string) => {
    return apiRequest(`/users/watchlist/${productId}`, 'DELETE');
  },
};

// Payment APIs
export const paymentAPI = {
  processWalletPayment: async (orderId: string, amount: number) => {
    return apiRequest('/payments/wallet', 'POST', { orderId, amount });
  },

  initializePayfast: async (orderId: string) => {
    return apiRequest('/payments/payfast/initialize', 'POST', { orderId });
  },

  initializeFlutterwave: async (orderId: string) => {
    return apiRequest('/payments/flutterwave/initialize', 'POST', { orderId });
  },

  getPaymentStatus: async (paymentId: string) => {
    return apiRequest(`/payments/status/${paymentId}`);
  },
};

// Dashboard APIs
export const dashboardAPI = {
  getDashboardData: async () => {
    return apiRequest('/users/dashboard');
  },

  getActiveBids: async () => {
    return apiRequest('/bids/active');
  },

  getWonAuctions: async () => {
    return apiRequest('/orders/my-orders?type=auction_win');
  },

  getRecentActivity: async () => {
    return apiRequest('/users/activity');
  },
};

// Notifications APIs
export const notificationsAPI = {
  getAll: async () => {
    return apiRequest('/notifications');
  },

  markAsRead: async (notificationId: string) => {
    return apiRequest(`/notifications/${notificationId}/read`, 'POST');
  },

  markAllAsRead: async () => {
    return apiRequest('/notifications/mark-all-read', 'POST');
  },

  updatePreferences: async (preferences: any) => {
    return apiRequest('/users/notification-preferences', 'POST', preferences);
  },
};

// Referral/Affiliate APIs
export const affiliateAPI = {
  getAffiliateData: async () => {
    return apiRequest('/users/affiliate');
  },

  getReferralCode: async () => {
    return apiRequest('/users/referral-code');
  },

  trackReferral: async (referralCode: string) => {
    return apiRequest('/users/track-referral', 'POST', { referralCode });
  },
};

// Withdrawal APIs
export const withdrawalAPI = {
  requestWithdrawal: async (amount: number, method: string, details: any) => {
    return apiRequest('/withdrawals/request', 'POST', { amount, method, details });
  },

  getWithdrawalHistory: async () => {
    return apiRequest('/withdrawals/history');
  },

  getBalance: async () => {
    return apiRequest('/users/balance');
  },
};

// Export all APIs
export default {
  auth: authAPI,
  products: productsAPI,
  bids: bidsAPI,
  orders: ordersAPI,
  wishlist: wishlistAPI,
  payment: paymentAPI,
  dashboard: dashboardAPI,
  notifications: notificationsAPI,
  affiliate: affiliateAPI,
  withdrawal: withdrawalAPI,
};