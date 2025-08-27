import io from 'socket.io-client'

// Get the base backend URL without /api
const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'https://quicksell-1-4020.onrender.com/api'
  // Remove /api from the end to get the base backend URL
  return apiUrl.replace(/\/api$/, '')
}

export const createSocket = () => {
  const socketUrl = getSocketUrl()
  console.log('Connecting to socket at:', socketUrl)
  
  return io(socketUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  })
}

export default createSocket