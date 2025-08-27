import axios from 'axios'

// Don't set a base URL - let the components handle full paths
// This avoids double /api issues

// Determine the API URL based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://quicksell-1-4020.onrender.com/api';

// Request interceptor to add auth token
axios.interceptors.request.use(
  (config) => {
    // If the URL doesn't start with http, prepend the base URL
    if (config.url && !config.url.startsWith('http')) {
      // Remove leading /api if it exists to avoid double /api
      const cleanUrl = config.url.startsWith('/api') ? config.url.substring(4) : config.url;
      config.url = `${API_BASE_URL}${cleanUrl}`
    }
    
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect for now - just log the error
    console.error('API Error:', error.response?.status, error.response?.data)
    return Promise.reject(error)
  }
)

export default axios