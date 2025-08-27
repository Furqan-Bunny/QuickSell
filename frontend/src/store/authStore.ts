import { create } from 'zustand'
import axios from 'axios'
import toast from 'react-hot-toast'
import firebaseAuth from '../services/firebaseAuth'
import { auth } from '../config/firebase'

interface User {
  id: string
  uid?: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: 'user' | 'admin'
  avatar?: string
  balance: number
  emailVerified: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
  initAuth: () => void
  updateUser: (user: User) => void
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  initAuth: () => {
    // Listen to Firebase auth state changes
    firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken(true) // Force refresh token
          const userProfile = await firebaseAuth.getCurrentUser()
          
          if (userProfile) {
            const formattedUser: User = {
              id: userProfile.uid,
              uid: userProfile.uid,
              username: userProfile.username,
              email: userProfile.email,
              firstName: userProfile.firstName,
              lastName: userProfile.lastName,
              role: userProfile.role,
              balance: userProfile.balance,
              emailVerified: userProfile.emailVerified,
              avatar: userProfile.avatar
            }
            
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(formattedUser))
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            
            // Refresh token every 50 minutes (Firebase tokens expire after 1 hour)
            setInterval(async () => {
              try {
                const refreshedToken = await firebaseUser.getIdToken(true)
                localStorage.setItem('token', refreshedToken)
                axios.defaults.headers.common['Authorization'] = `Bearer ${refreshedToken}`
              } catch (error) {
                console.error('Error refreshing token:', error)
              }
            }, 50 * 60 * 1000)
            
            set({
              user: formattedUser,
              token,
              isAuthenticated: true,
              isLoading: false
            })
          } else {
            set({ isLoading: false })
          }
        } catch (error) {
          console.error('Error initializing auth:', error)
          set({ isLoading: false })
        }
      } else {
        // No user logged in
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        delete axios.defaults.headers.common['Authorization']
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        })
      }
    })
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true })
    try {
      // Use Firebase authentication
      const response = await firebaseAuth.login(email, password)
      const { token, user } = response
      
      // Format user object to match our interface
      const formattedUser: User = {
        id: user.uid,
        uid: user.uid,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        balance: user.balance,
        emailVerified: user.emailVerified,
        avatar: user.avatar
      }
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(formattedUser))
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      set({
        user: formattedUser,
        token,
        isAuthenticated: true,
        isLoading: false
      })
      
      toast.success('Login successful!')
    } catch (error: any) {
      set({ isLoading: false })
      const errorMessage = error.message.includes('auth/') 
        ? error.message.replace('Firebase: ', '').replace(/\(auth\/[^)]+\)/, '').trim()
        : error.message
      toast.error(errorMessage || 'Login failed')
      throw error
    }
  },

  register: async (data: any) => {
    set({ isLoading: true })
    try {
      // Use Firebase authentication
      const response = await firebaseAuth.register(data)
      const { token, user } = response
      
      // Format user object to match our interface
      const formattedUser: User = {
        id: user.uid,
        uid: user.uid,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        balance: user.balance,
        emailVerified: user.emailVerified,
        avatar: user.avatar
      }
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(formattedUser))
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      set({
        user: formattedUser,
        token,
        isAuthenticated: true,
        isLoading: false
      })
      
      toast.success('Registration successful! Please check your email to verify your account.')
    } catch (error: any) {
      set({ isLoading: false })
      const errorMessage = error.message.includes('auth/') 
        ? error.message.replace('Firebase: ', '').replace(/\(auth\/[^)]+\)/, '').trim()
        : error.message
      toast.error(errorMessage || 'Registration failed')
      throw error
    }
  },

  logout: async () => {
    try {
      await firebaseAuth.logout()
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      delete axios.defaults.headers.common['Authorization']
      
      set({
        user: null,
        token: null,
        isAuthenticated: false
      })
      
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to logout')
    }
  },

  updateUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  }
}))