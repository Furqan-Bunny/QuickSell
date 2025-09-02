# Vercel Deployment Guide

## Prerequisites
1. Install Vercel CLI: `npm install -g vercel`
2. Create a Vercel account at https://vercel.com

## Environment Variables Needed

You'll need to add these in Vercel Dashboard after deployment:

```
FIREBASE_SERVICE_ACCOUNT = (Your entire Firebase service account JSON as a string)
JWT_SECRET = your-secret-key-here
CLIENT_URL = https://your-app.vercel.app
```

## How to Get FIREBASE_SERVICE_ACCOUNT

1. Go to Firebase Console
2. Project Settings > Service Accounts
3. Generate New Private Key
4. Copy the entire JSON content
5. Stringify it: JSON.stringify(jsonContent)
6. Add as environment variable in Vercel

## Deployment Steps

1. **First-time deployment:**
   ```bash
   cd E:\Quicksell
   vercel
   ```

2. **Follow prompts:**
   - Set up and deploy? **Yes**
   - Which scope? **Select your account**
   - Link to existing project? **No**
   - Project name? **quicksell**
   - Directory? **./** (current directory)
   - Override settings? **No**

3. **Add Environment Variables:**
   - Go to https://vercel.com/dashboard
   - Select your project
   - Go to Settings > Environment Variables
   - Add the variables listed above

4. **Redeploy after adding env vars:**
   ```bash
   vercel --prod
   ```

## Limitations on Vercel

⚠️ **No Real-time Features:**
- Socket.io won't work (no real-time bidding)
- No WebSocket connections

⚠️ **Function Timeouts:**
- 10 seconds on free plan
- 30 seconds on paid plans

⚠️ **File Uploads:**
- Must upload directly to Firebase Storage
- Cannot store files on server

## Testing Locally

To test Vercel functions locally:
```bash
vercel dev
```

## Redeployment

To redeploy after changes:
```bash
vercel --prod
```

## Custom Domain

To add custom domain:
1. Go to project settings in Vercel
2. Navigate to Domains
3. Add your domain
4. Update DNS records as instructed