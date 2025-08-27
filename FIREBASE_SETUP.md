# Firebase Setup Guide for Quicksell

This guide will walk you through setting up Firebase for the Quicksell auction platform.

## Prerequisites

- A Google account
- Node.js and npm installed
- Access to Firebase Console

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `quicksell-auction` (or your preferred name)
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In Firebase Console, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Enable the following sign-in methods:
   - Email/Password
   - Google (optional)
   - Phone (optional for SMS verification)

## Step 3: Set up Firestore Database

1. Go to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in production mode" for security
4. Select your preferred location (preferably closest to South Africa)
5. Click "Create"

### Firestore Security Rules

Add these rules in Firestore Rules tab:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read payment intents
    match /payment_intents/{document} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.token.admin == true);
      allow write: if request.auth != null && 
        request.auth.token.admin == true;
    }
    
    // Allow authenticated users to read their wallet topups
    match /wallet_topups/{document} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow write: if request.auth != null && 
        request.auth.token.admin == true;
    }
    
    // Admin only access to refunds
    match /refunds/{document} {
      allow read, write: if request.auth != null && 
        request.auth.token.admin == true;
    }
    
    // Real-time bidding data
    match /auctions/{auctionId}/bids/{bidId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if false;
    }
  }
}
```

## Step 4: Set up Firebase Storage

1. Go to "Storage" in the left sidebar
2. Click "Get started"
3. Choose "Start in production mode"
4. Select the same location as your Firestore
5. Click "Done"

### Storage Security Rules

Add these rules in Storage Rules tab:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow users to upload their own avatars
    match /avatars/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow sellers to upload product images
    match /products/{productId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Step 5: Get Firebase Configuration

### For Frontend (Web App)

1. In Firebase Console, click the gear icon ⚙️ > "Project settings"
2. Scroll down to "Your apps" section
3. Click "Add app" and select "Web" (</>)
4. Register app with nickname "Quicksell Web"
5. Copy the configuration object:

```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
  measurementId: "..."
};
```

6. Add these to your `frontend/.env` file:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### For Backend (Admin SDK)

1. In Firebase Console, go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save the downloaded JSON file securely
4. Convert the JSON to a single line string (you can use an online tool)
5. Add to your `backend/.env` file:

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...entire JSON content...}
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

## Step 6: Enable Firebase APIs

In Google Cloud Console (linked from Firebase):

1. Enable Cloud Firestore API
2. Enable Firebase Authentication API
3. Enable Cloud Storage API
4. Enable Identity Toolkit API

## Step 7: Set up Custom Claims for Admin Users

Run this script to set admin privileges for a user:

```javascript
// admin-setup.js
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function setAdminClaim(email) {
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { admin: true });
  console.log(`Admin claim set for ${email}`);
}

// Replace with your admin user's email
setAdminClaim('admin@quicksell.com');
```

## Step 8: Test the Setup

1. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

2. Start the servers:
```bash
# Backend
npm run dev

# Frontend (new terminal)
npm run dev
```

3. Test authentication:
   - Register a new user
   - Check Firebase Console > Authentication to see the user
   - Try logging in

4. Test Firestore:
   - Make a payment
   - Check Firestore Database for payment_intents collection

5. Test Storage:
   - Upload a product image
   - Check Storage for the uploaded file

## Payment Gateway Setup

### Flutterwave

1. Sign up at [Flutterwave Dashboard](https://dashboard.flutterwave.com)
2. Get your API keys from Settings > API
3. Add webhook URL: `https://yourdomain.com/api/payments/flutterwave/webhook`
4. Add to `.env`:
```env
FLUTTERWAVE_PUBLIC_KEY=your_public_key
FLUTTERWAVE_SECRET_KEY=your_secret_key
FLUTTERWAVE_SECRET_HASH=your_secret_hash
```

### Payfast

1. Sign up at [PayFast](https://www.payfast.co.za)
2. Get merchant details from Settings
3. Add notify URL: `https://yourdomain.com/api/payments/payfast/webhook`
4. Add to `.env`:
```env
PAYFAST_MERCHANT_ID=your_merchant_id
PAYFAST_MERCHANT_KEY=your_merchant_key
PAYFAST_PASSPHRASE=your_passphrase
PAYFAST_TEST_MODE=true
```

## Troubleshooting

### Firebase Auth Issues
- Ensure Firebase project is active
- Check API keys are correct
- Verify domain is authorized in Authentication > Settings

### Firestore Issues
- Check security rules
- Ensure indexes are created for complex queries
- Verify service account has correct permissions

### Storage Issues
- Check bucket name is correct
- Verify CORS configuration if needed
- Ensure file size limits are appropriate

## Production Checklist

- [ ] Remove test mode from Payfast
- [ ] Update Firebase security rules for production
- [ ] Enable App Check for additional security
- [ ] Set up Firebase Performance Monitoring
- [ ] Configure Firebase Crashlytics
- [ ] Set up backup for Firestore
- [ ] Enable audit logs in Google Cloud Console
- [ ] Update CORS settings for production domains
- [ ] Set up monitoring and alerts

## Support

For Firebase issues: https://firebase.google.com/support
For Flutterwave: https://developer.flutterwave.com/docs
For Payfast: https://developers.payfast.co.za/docs