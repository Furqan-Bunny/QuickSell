# Mobile App - Website Feature Alignment

## Current Status (After Updates)

### ✅ FIXED - Bidding System
- **No balance check during bidding** - Users can bid any amount above minimum
- **Minimum bid validation** - Only checks current price + increment
- **Payment happens at checkout** - Winners pay when they checkout

### ✅ FIXED - Buy Now
- **No balance check** - Direct navigation to checkout
- **Same as website** - User selects payment method at checkout

### ✅ FIXED - Authentication
- **JWT token support added** - Backend now accepts both JWT and Firebase tokens
- **Login works correctly** - Custom login creates JWT tokens

### ⚠️ TO VERIFY - Checkout & Payment
- **Wallet payment** - Should check balance ONLY when wallet is selected
- **PayFast integration** - Should redirect to PayFast for SA payments
- **Flutterwave** - Should redirect for international payments

## Key Principles (Matching Website)

1. **No Upfront Balance Requirements**
   - Users can bid without having money in wallet
   - Balance is only checked when using wallet as payment method
   - Other payment methods (PayFast, Flutterwave) don't require balance

2. **Payment Flow**
   - Bid → Win → Checkout → Choose Payment Method → Pay
   - NOT: Check Balance → Bid (This is wrong!)

3. **User Experience**
   - Allow maximum participation
   - Remove barriers to bidding
   - Payment flexibility when winning

## Mobile App Specific Features Working

- Real-time socket updates ✅
- Push notifications ready
- Offline support with AsyncStorage
- Native navigation
- Camera/gallery integration ready

## Services Running

- Backend: Port 5000 ✅
- Mobile: Expo on Port 8083 ✅
- Socket.io: Real-time updates ✅