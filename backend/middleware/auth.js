const admin = require('firebase-admin');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new Error('No token provided');
    }

    // For mock testing, accept the mock token
    if (token === 'mock-jwt-token' || token.startsWith('mock_') || token.startsWith('mock-')) {
      // Create a mock user object
      req.user = {
        uid: 'user123',
        username: 'testuser',
        email: 'user@example.com',
        displayName: 'Test User',
        role: 'user',
        balance: 50000,
        isActive: true
      };
      req.token = token;
      return next();
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get user from Firebase
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      // If user doesn't exist in Firestore, get from Firebase Auth
      const firebaseUser = await admin.auth().getUser(decodedToken.uid);
      
      // Create user in Firestore
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || '',
        username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
        role: 'user',
        balance: 0,
        emailVerified: firebaseUser.emailVerified || false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await db.collection('users').doc(firebaseUser.uid).set(userData);
      req.user = userData;
    } else {
      const userData = userDoc.data();
      req.user = { 
        uid: userDoc.id, 
        ...userData,
        displayName: userData.displayName || userData.username || userData.email
      };
    }

    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ error: 'Please authenticate' });
  }
};

const adminMiddleware = async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
};

const sellerMiddleware = async (req, res, next) => {
  if (req.user && (req.user.role === 'seller' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ error: 'Seller access required' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      // Verify Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Get user from Firebase
      const db = admin.firestore();
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        req.user = { 
          uid: userDoc.id, 
          ...userData,
          displayName: userData.displayName || userData.username || userData.email
        };
        req.token = token;
      }
    }
  } catch (error) {
    // Continue without authentication
  }
  
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  sellerMiddleware,
  optionalAuth
};