# URGENT: Set Firebase Environment Variables in Railway

## The bidding error is happening because Firebase is NOT configured in Railway!

### Steps to fix:

1. **Go to Railway Dashboard**
   - Open your project: https://railway.app/dashboard
   - Click on your service
   - Go to "Variables" tab

2. **Add these REQUIRED environment variables:**

### Copy these EXACTLY from your `.env` file:

```bash
# MOST IMPORTANT - Must be valid JSON on ONE LINE
FIREBASE_SERVICE_ACCOUNT=(Copy the entire JSON from your backend/.env file)

# Storage bucket
FIREBASE_STORAGE_BUCKET=quicksell-80aad.firebasestorage.app

# JWT Secret
JWT_SECRET=(Copy from your .env file)

# URLs
CLIENT_URL=https://quicksell-80aad.web.app
SERVER_URL=https://quicksell-production.up.railway.app
FRONTEND_URL=https://quicksell-80aad.web.app
```

3. **Other required variables (copy from your .env file):**
```bash
# Email (Copy all values from your .env)
BREVO_API_KEY=(Your Brevo API key)
BREVO_SENDER_EMAIL=(Your sender email)
BREVO_SENDER_NAME=Minzolor
BREVO_SMTP_LOGIN=(Your SMTP login)
BREVO_SMTP_PASSWORD=(Your SMTP password)

# Payment (Copy all values from your .env)
FLUTTERWAVE_PUBLIC_KEY=(Your public key)
FLUTTERWAVE_SECRET_KEY=(Your secret key)
FLUTTERWAVE_ENCRYPTION_KEY=(Your encryption key)
FLUTTERWAVE_MERCHANT_ID=(Your merchant ID)
FLUTTERWAVE_TEST_MODE=true
```

## IMPORTANT NOTES:

1. **FIREBASE_SERVICE_ACCOUNT must be on ONE LINE**
   - Use this tool to minify: https://www.jsonformatter.org/json-minify
   - Copy the entire JSON from your .env file
   - Minify it
   - Paste as one line

2. **After adding variables:**
   - Railway will automatically redeploy
   - Wait 2-3 minutes for deployment
   - Check logs for "Firebase Admin SDK initialized successfully"

3. **Test after deployment:**
   ```bash
   curl https://quicksell-production.up.railway.app/health
   ```

## Without these variables, you'll get:
- 500 errors on all API calls
- "Failed to save bid" errors
- Database unavailable errors

## This is the ONLY thing preventing bidding from working!