# Railway Deployment Troubleshooting

## "Application failed to respond" Error

### 1. Check Railway Logs
Go to Railway Dashboard → Your Service → "Logs" tab
Look for specific error messages.

### 2. Common Issues & Solutions

#### ✅ PORT Configuration
**Fixed:** Server now binds to `0.0.0.0` and uses Railway's dynamic PORT
```javascript
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';
server.listen(PORT, HOST, ...);
```

#### ⚠️ Firebase Service Account
**Most common issue!** Check in Railway Variables:

1. **Is FIREBASE_SERVICE_ACCOUNT set?**
   - Go to Variables tab
   - Make sure FIREBASE_SERVICE_ACCOUNT exists

2. **Is it valid JSON on ONE line?**
   - Copy your service account JSON
   - Remove ALL line breaks
   - Use a JSON minifier: https://www.jsonformatter.org/json-minify
   - Paste the minified version

3. **Example of correct format:**
   ```
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"quicksell-80aad","private_key_id":"xxx","private_key":"-----BEGIN PRIVATE KEY-----\nxxx\n-----END PRIVATE KEY-----\n","client_email":"xxx@xxx.iam.gserviceaccount.com","client_id":"xxx","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"xxx"}
   ```

#### ⚠️ Missing Environment Variables
Check these are ALL set in Railway Variables:
- [ ] JWT_SECRET
- [ ] FIREBASE_SERVICE_ACCOUNT
- [ ] FIREBASE_STORAGE_BUCKET
- [ ] CLIENT_URL
- [ ] SERVER_URL
- [ ] BREVO_API_KEY
- [ ] BREVO_SENDER_EMAIL

### 3. Quick Fix Commands

Push the latest changes:
```bash
git add .
git commit -m "Fix Railway deployment issues"
git push origin main
```

### 4. Test Endpoints After Deploy

Once deployed, test these:
```bash
# Health check
curl https://quicksell-production.up.railway.app/health

# API test
curl https://quicksell-production.up.railway.app/api/categories
```

### 5. If Still Not Working

1. **Check Build Logs:**
   - Look for npm install errors
   - Check for missing dependencies

2. **Verify Railway Config:**
   - Ensure railway.json is in root
   - Check build command: `cd backend && npm install`
   - Check start command: `cd backend && npm start`

3. **Memory Issues:**
   - Railway free tier has 512MB RAM limit
   - Check if app is crashing due to memory

4. **Firebase Specific:**
   - Double-check project_id in service account matches your Firebase project
   - Ensure storage bucket name is correct
   - Verify Firebase project is active

### 6. Emergency Fallback

If Firebase is the issue, you can temporarily disable it:

In `backend/server.js`, comment out line 91-93:
```javascript
// if (!db) {
//   console.error('Firebase Firestore database not available');
//   process.exit(1);
// }
```

This will let the server start without Firebase (for testing only).

### 7. Contact Support

If none of these work:
- Railway Discord: https://discord.gg/railway
- Check Railway Status: https://railway.app/status