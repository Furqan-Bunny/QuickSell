# Payment Gateway Configuration - Production Mode

## ⚠️ IMPORTANT: Production Payment Configuration

This document outlines the payment gateway configuration for Quicksell. The system is now configured for **PRODUCTION/LIVE** payments.

## Current Configuration Status

### 1. PayFast (South African Payment Gateway)
- **Status**: ✅ PRODUCTION MODE
- **Merchant ID**: 24863159
- **Test Mode**: DISABLED
- **Sandbox**: DISABLED
- **Live URL**: https://www.payfast.co.za/eng/process

### 2. Flutterwave (International Payment Gateway)
- **Status**: ⚠️ NEEDS LIVE KEYS
- **Test Mode**: DISABLED (but still using test keys)
- **Current Keys**: TEST keys (need to be replaced with LIVE keys)

## Required Actions for Full Production Mode

### For Flutterwave:
1. Log in to your Flutterwave dashboard at https://dashboard.flutterwave.com
2. Navigate to Settings > API Keys
3. Copy your LIVE API keys:
   - Public Key (starts with `FLWPUBK-`)
   - Secret Key (starts with `FLWSECK-`)
   - Encryption Key
4. Update these keys in `backend/.env`:
   ```
   FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-[your-live-public-key]
   FLUTTERWAVE_SECRET_KEY=FLWSECK-[your-live-secret-key]
   FLUTTERWAVE_ENCRYPTION_KEY=[your-live-encryption-key]
   ```

### For PayFast:
- ✅ Already configured with production credentials
- Ensure your PayFast merchant account is approved and active
- Verify your business details are complete in PayFast dashboard

## Testing Production Payments

### Before Going Live:
1. **Verify merchant accounts** are approved and active
2. **Test with small amounts** first (R1-R10)
3. **Monitor first transactions** carefully
4. **Check webhook endpoints** are working
5. **Verify SSL certificates** are valid

### Payment Flow:
1. Customer selects payment method (PayFast/Flutterwave)
2. System generates payment request with production URLs
3. Customer is redirected to payment gateway
4. Payment is processed through live gateway
5. Customer returns to success/cancel page
6. Webhook confirms payment status

## Security Considerations

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Implement rate limiting** on payment endpoints
4. **Log all payment attempts** for audit trail
5. **Use HTTPS only** for production

## Support Contacts

### PayFast Support:
- Email: support@payfast.co.za
- Phone: 0861 PAYFAST (0861 729 3278)
- Dashboard: https://www.payfast.co.za/merchant

### Flutterwave Support:
- Email: support@flutterwave.com
- Dashboard: https://dashboard.flutterwave.com
- Documentation: https://developer.flutterwave.com

## Environment Variables Overview

```env
# PayFast - PRODUCTION
PAYFAST_MERCHANT_ID=24863159
PAYFAST_MERCHANT_KEY=szqalyn9ghk4k
PAYFAST_PASSPHRASE=Quicksell-Minzolor1
PAYFAST_TEST_MODE=false
PAYFAST_USE_SANDBOX=false

# Flutterwave - NEEDS LIVE KEYS
FLUTTERWAVE_PUBLIC_KEY=[REPLACE_WITH_LIVE_KEY]
FLUTTERWAVE_SECRET_KEY=[REPLACE_WITH_LIVE_KEY]
FLUTTERWAVE_ENCRYPTION_KEY=[REPLACE_WITH_LIVE_KEY]
FLUTTERWAVE_TEST_MODE=false
```

## Monitoring

- Check payment logs in Firebase Functions logs
- Monitor transaction success rates
- Set up alerts for failed payments
- Review daily transaction reports

---

**Last Updated**: December 2024
**Status**: PayFast LIVE | Flutterwave NEEDS LIVE KEYS