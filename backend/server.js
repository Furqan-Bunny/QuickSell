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

// Simple CORS configuration that always works
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200
}));

// Additional OPTIONS handler for preflight requests
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.sendStatus(200);
});

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
// const userRoutes = require('./routes/users'); // Need to convert to Firebase
const productRoutes = require('./routes/products-simple'); // Keep simple version for now
const affiliateRoutes = require('./routes/affiliate');
// const bidRoutes = require('./routes/bids'); // Need to convert to Firebase
// const orderRoutes = require('./routes/orders'); // Need to convert to Firebase
const categoryRoutes = require('./routes/categories-firebase');
const paymentRoutes = require('./routes/payments');
// const adminRoutes = require('./routes/admin'); // Need to convert to Firebase
// const notificationRoutes = require('./routes/notifications'); // Need to convert to Firebase

// Routes
app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/affiliate', affiliateRoutes);
// app.use('/api/bids', bidRoutes);
// app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
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