// API Configuration for QuickSell Mobile App

// Backend API URL - Use local for development, Railway for production
// For local development, use your computer's IP address (not localhost)
// Replace with your actual IP address from ipconfig/ifconfig
const IS_PRODUCTION = false;

// For Android emulator, use 10.0.2.2 instead of localhost
// For physical device, use your computer's IP address
const IS_EMULATOR = false; // Set to true if using Android emulator

export const API_BASE_URL = IS_PRODUCTION 
  ? 'https://quicksell-production.up.railway.app'
  : IS_EMULATOR 
    ? 'http://10.0.2.2:5000' // Android emulator localhost
    : 'http://192.168.100.24:5000'; // Your local IP address

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  
  // Products
  PRODUCTS: '/api/products',
  CATEGORIES: '/api/categories',
  
  // Bids
  BIDS: '/api/bids',
  MY_BIDS: '/api/bids/my-bids',
  
  // Orders
  ORDERS: '/api/orders',
  MY_ORDERS: '/api/orders/my-orders',
  
  // Users
  PROFILE: '/api/users/profile',
  WATCHLIST: '/api/users/watchlist',
  
  // Payments
  WALLET: '/api/payments/wallet',
  PAYFAST: '/api/payments/payfast',
  FLUTTERWAVE: '/api/payments/flutterwave',
  
  // Affiliate
  AFFILIATE: '/api/affiliate',
  
  // Notifications
  NOTIFICATIONS: '/api/notifications',
  
  // Withdrawals
  WITHDRAWALS: '/api/withdrawals',
};

// Socket.io URL
export const SOCKET_URL = API_BASE_URL;

// Image URL helper
export const getImageUrl = (path: string) => {
  if (!path) return 'https://via.placeholder.com/300';
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};

// API Headers
export const getAuthHeaders = async () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const token = await AsyncStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  SOCKET_URL,
  getImageUrl,
  getAuthHeaders,
};