# Railway Deployment Guide for Quicksell

## Prerequisites
- Railway account (https://railway.app)
- GitHub repository with your code
- Firebase project configured

## Step 1: Connect GitHub Repository

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your Quicksell repository
4. Railway will automatically detect the project

## Step 2: Configure Environment Variables

Click on your deployed service and go to "Variables" tab. Add all these environment variables:

### Required Variables:

```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Secret (Generate a secure one)
JWT_SECRET=your_secure_jwt_secret_here

# Client URLs (Update after frontend deployment)
CLIENT_URL=https://quicksell-80aad.web.app
SERVER_URL=https://your-app-name.railway.app
FRONTEND_URL=https://quicksell-80aad.web.app

# Firebase Admin SDK (IMPORTANT: Must be on one line)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"quicksell-80aad",...}
FIREBASE_STORAGE_BUCKET=quicksell-80aad.firebasestorage.app

# Payment Gateway - Flutterwave (Use your actual keys)
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxxxx
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TESTxxxxx
FLUTTERWAVE_MERCHANT_ID=100599724
FLUTTERWAVE_TEST_MODE=true

# PayFast Configuration
PAYFAST_MERCHANT_ID=24863159
PAYFAST_MERCHANT_KEY=your_key
PAYFAST_PASSPHRASE=your_passphrase
PAYFAST_TEST_MODE=false
PAYFAST_SANDBOX_MERCHANT_ID=10000100
PAYFAST_SANDBOX_MERCHANT_KEY=46f0cd694581a
PAYFAST_USE_SANDBOX=true

# Brevo Email
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_email@gmail.com
BREVO_SENDER_NAME=Quicksell
BREVO_SMTP_LOGIN=your_smtp_login
BREVO_SMTP_PASSWORD=your_smtp_password

# Admin
ADMIN_EMAIL=admin@quicksell.com
TEST_EMAIL=test@quicksell.com
```

## Step 3: Configure Build & Start Commands

Railway should automatically detect these from `railway.json`, but you can verify in Settings:

- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`

## Step 4: Deploy

1. Railway will automatically deploy when you push to your GitHub repository
2. Monitor the deployment logs in the Railway dashboard
3. Once deployed, you'll get a URL like: `https://your-app-name.railway.app`

## Step 5: Update Frontend Configuration

Update your frontend `.env.production` file:

```env
VITE_API_URL=https://your-app-name.railway.app/api
VITE_SOCKET_URL=https://your-app-name.railway.app
```

## Step 6: Update CORS Configuration

Make sure your backend CORS configuration includes your frontend URL. This is already configured in the code to use the `CLIENT_URL` environment variable.

## Troubleshooting

### "No start command" Error
- Make sure `package.json` has a `start` script
- Verify `railway.json` is in the root directory

### CORS Errors
- Check that `CLIENT_URL` environment variable matches your frontend URL
- Ensure the frontend URL is in the `allowedOrigins` array in `server.js`

### Firebase Errors
- Ensure `FIREBASE_SERVICE_ACCOUNT` is a valid JSON string on ONE line
- Verify the service account has the correct permissions

### Socket.io Connection Issues
- Railway supports WebSockets
- Make sure the frontend `VITE_SOCKET_URL` points to the Railway backend URL

## Monitoring

- Use Railway's built-in logs: Click on your service → "Logs"
- Monitor metrics in the "Metrics" tab
- Set up health checks by accessing: `https://your-app.railway.app/health`

## Costs

Railway offers:
- $5 free credits per month
- After that, pay-as-you-go pricing
- Typical costs for this app: ~$5-10/month

## Commands for Quick Deployment

```bash
# Push to GitHub (Railway auto-deploys)
git add .
git commit -m "Deploy to Railway"
git push origin main

# Check deployment status
# Go to https://railway.app/dashboard
```

## Support

- Railway Discord: https://discord.gg/railway
- Railway Docs: https://docs.railway.app
- GitHub Issues: Your repository issues page