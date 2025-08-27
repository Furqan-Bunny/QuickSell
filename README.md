# Quicksell - Online Auction Platform

Quicksell is a modern online auction marketplace built for South Africa, enabling users to buy and sell items through real-time bidding.

## 🚀 Features

- **Real-time Auctions**: Live bidding with Socket.io
- **User Authentication**: Secure Firebase authentication
- **Affiliate Program**: Earn R5 for each successful referral
- **Payment Integration**: Ready for PayFast and Flutterwave
- **Email Notifications**: Automated emails via Brevo
- **Mobile App**: React Native application
- **Admin Dashboard**: Manage auctions, users, and transactions

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Zustand for state management
- Firebase for authentication

### Backend
- Node.js & Express
- Firebase Admin SDK
- Socket.io for real-time features
- Nodemailer with Brevo

### Mobile
- React Native with Expo
- Firebase integration
- Native features support

## 📦 Installation

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Firebase account
- Brevo account (for emails)

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/quicksell.git
cd quicksell
```

2. **Install dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Mobile (optional)
cd ../mobile
npm install
```

3. **Environment Variables**

Create `.env` files in both backend and frontend directories:

Backend `.env`:
```
PORT=5000
FIREBASE_SERVICE_ACCOUNT=your_service_account_json
FRONTEND_URL=http://localhost:3000
BREVO_API_KEY=your_brevo_api_key
BREVO_SMTP_LOGIN=your_smtp_login
BREVO_SMTP_PASSWORD=your_smtp_password
```

4. **Run the application**

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

## 🚀 Deployment

### Frontend (Firebase Hosting)
```bash
cd frontend
npm run deploy
```

### Backend (Render/Railway/Heroku)
- Push to GitHub
- Connect repository to your hosting service
- Deploy automatically

## 📱 Mobile App

```bash
cd mobile
npm start
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

Minzolor

## 🌐 Live Demo

- Frontend: https://quicksell-80aad.web.app
- API: (Deploy backend to get URL)

---

Built with ❤️ for South Africa's online marketplace