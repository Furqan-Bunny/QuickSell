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
// Set to the number of proxies between the server and the client
app.set('trust proxy', 1);

// Rate limiting - disable validation to prevent startup crash
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  validate: false, // Disable validation to prevent trust proxy error
  // Custom key generator that safely handles proxy scenarios
  keyGenerator: (req) => {
    // Get the real IP from X-Forwarded-For or fall back to connection IP
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      // Take the first IP if there are multiple (client IP is first)
      return forwarded.split(',')[0].trim();
    }
    return req.connection.remoteAddress || req.socket.remoteAddress || req.ip || 'unknown';
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
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
const userRoutes = require('./routes/users-firebase');
const productRoutes = require('./routes/products-firebase'); // Use Firebase version with image upload
const affiliateRoutes = require('./routes/affiliate');
const bidRoutes = require('./routes/bids-firebase');
const orderRoutes = require('./routes/orders-firebase');
const categoryRoutes = require('./routes/categories-firebase');
const paymentRoutes = require('./routes/payments');
const payfastRoutes = require('./routes/payments-payfast');
const walletRoutes = require('./routes/payments-wallet');
const flutterwaveRoutes = require('./routes/payments-flutterwave');
const paymentVerificationRoutes = require('./routes/payments-verification');
const adminRoutes = require('./routes/admin-firebase');
// const notificationRoutes = require('./routes/notifications'); // Need to convert to Firebase

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payments/payfast', payfastRoutes);
app.use('/api/payments/wallet', walletRoutes);
app.use('/api/payments/flutterwave', flutterwaveRoutes);
app.use('/api/payments/verification', paymentVerificationRoutes);
app.use('/api/admin', adminRoutes);
// app.use('/api/notifications', notificationRoutes);

// Initialize Socket.io service
const socketService = require('./services/socketService');
socketService.initialize(server);

// Make socket service accessible to routes
app.set('socketService', socketService);

// Initialize Auction Scheduler
const auctionScheduler = require('./services/auctionScheduler');
auctionScheduler.start();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling middleware - ensure CORS headers are set
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  // Ensure CORS headers are set even on errors
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  res.status(err.status || 500).json({ 
    error: err.message || 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});