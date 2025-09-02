const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'quicksell-80aad.appspot.com'
    });
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
}

const db = admin.firestore();

// Configure CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://quicksell-80aad.web.app',
    'https://quicksell-80aad.vercel.app',
    'https://*.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Import routes
const authRoutes = require('../backend/routes/auth');
const userRoutes = require('../backend/routes/users-firebase');
const productRoutes = require('../backend/routes/products-firebase');
const bidRoutes = require('../backend/routes/bids-firebase');
const orderRoutes = require('../backend/routes/orders-firebase');
const categoryRoutes = require('../backend/routes/categories-firebase');
const paymentsRoutes = require('../backend/routes/payments-firebase');
const withdrawalRoutes = require('../backend/routes/withdrawals-firebase');
const affiliateRoutes = require('../backend/routes/affiliate');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/affiliate', affiliateRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Export for Vercel
module.exports = app;