# Quicksell Mobile App - Connection Instructions

## The app is running successfully! 🎉

### To connect from your mobile device:

## Method 1: Direct URL Connection
1. Make sure your phone is on the **same WiFi network** as your computer
2. Find your computer's IP address:
   - Open Command Prompt
   - Run: `ipconfig`
   - Look for "IPv4 Address" under your WiFi adapter
3. Open **Expo Go** app on your phone
4. Enter URL: `exp://[YOUR-IP]:19000`
   - Example: `exp://192.168.1.100:19000`

## Method 2: Using Expo Dev Tools
1. Open your browser and go to: **http://localhost:19000**
2. The Expo Dev Tools interface should open
3. You'll see the QR code there
4. Scan it with Expo Go app

## Method 3: Manual QR Generation
Since the terminal isn't showing the QR code, you can:
1. Get your local IP address (from ipconfig)
2. Create the connection URL: `exp://[YOUR-IP]:19000`
3. Use any online QR generator to create a QR code for this URL
4. Scan with Expo Go

## Troubleshooting:
- **Can't connect?** Make sure Windows Firewall isn't blocking port 19000
- **Connection refused?** Ensure both devices are on the same network
- **Still issues?** Try running: `npx expo start --tunnel` (requires Expo account)

## Current Services Running:
- ✅ Backend API: http://localhost:5000
- ✅ Web Frontend: http://localhost:5173
- ✅ Mobile App: http://localhost:19000

## Test Credentials:
- Email: buyer@test.com
- Password: password123