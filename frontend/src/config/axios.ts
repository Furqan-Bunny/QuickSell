import axios from 'axios'

// Don't set a base URL - let the components handle full paths
// This avoids double /api issues

// Request interceptor to add auth token
axios.interceptors.request.use(
  (config) => {
    // If the URL doesn't start with http, prepend the base URL
    if (config.url && !config.url.startsWith('http')) {
      config.url = `http://localhost:5000${config.url}`
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