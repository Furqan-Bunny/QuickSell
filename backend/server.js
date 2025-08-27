const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { db } = require('./config/firebase');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Trust proxy - required for Render and other cloud services
app.set('trust proxy', true);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting in development
  skip: (req) => process.env.NODE_ENV === 'development'
});

// Middleware
app.use(helmet());
app.use(compression());
// Configure CORS for multiple origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://quicksell-80aad.web.app',
  'https://quicksell-80aad--quicksell-5ar9e0y8.web.app',
  'https://quicksell-80aad.firebaseapp.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Origin not allowed by CORS:', origin);
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/', limiter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Firebase is initialized in config/firebase.js
if (!db) {
  console.error('Firebase Firestore database not available');
  process.exit(1);
}

// Import routes
const authRoutes = require('./routes/auth');
// const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products-simple'); // Temporary simple version
const affiliateRoutes = require('./routes/affiliate');
// const bidRoutes = require('./routes/bids');
// const orderRoutes = require('./routes/orders');
// const categoryRoutes = require('./routes/categories');
const paymentRoutes = require('./routes/payments');
// const adminRoutes = require('./routes/admin');
// const notificationRoutes = require('./routes/notifications');

// Routes
app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/affiliate', affiliateRoutes);
// app.use('/api/bids', bidRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/categories', categoryRoutes);
app.use('/api/payments', paymentRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/notifications', notificationRoutes);

// Socket.io for real-time bidding
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join-auction', (auctionId) => {
    socket.join(`auction-${auctionId}`);
  });

  socket.on('place-bid', (bidData) => {
    io.to(`auction-${bidData.productId}`).emit('new-bid', bidData);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Make io accessible to routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});