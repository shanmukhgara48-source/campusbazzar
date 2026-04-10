# CampusBazaar

A smart mobile marketplace for college students — buy, sell, and trade used books, laptops, calculators, and more. Built with React Native (Expo) and Firebase.

## Features

- **Authentication** — Phone/OTP login, college email verification, profile setup
- **Buyer view** — Browse listings with category filters, saved/wishlist items, secure in-app messaging
- **Seller view** — Dashboard with stats, list items with image uploads, manage your listings
- **Admin view** — Platform overview, all listings, user management, flagged item moderation
- **Payments** — Razorpay & UPI payment integration
- **Meetup & Safety** — Meetup scheduling and SOS button for safe exchanges
- **Offers & Negotiation** — Make/receive offers on listings
- **Ratings & Reviews** — Post-transaction buyer/seller reviews
- **Notifications** — Push notifications via Expo & Firebase
- **Offline Support** — Offline banner and graceful degradation with NetInfo
- **Verification** — Student verification badges on profiles

## Tech Stack

- **React Native** (Expo SDK 54)
- **TypeScript**
- **Firebase** (Auth, Firestore, Storage)
- **React Navigation** (Stack + Bottom Tabs)
- **Expo modules** — Camera, Image Picker, Image Manipulator, Notifications, Linear Gradient, File System
- **Razorpay** — Payments
- **QR Code** — `react-native-qrcode-svg`

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (for quick testing) or a simulator

### Install & run

```bash
npm install
npm start          # starts Expo dev server
npm run android    # run on Android
npm run ios        # run on iOS
```

### Environment / Config
Copy your Firebase config and API keys into `src/config.ts` (never commit secrets).

## Project Structure

```
src/
  screens/
    auth/            — Login, OTP, SignUp, ProfileSetup
    home/            — HomeScreen
    listing/         — Listing detail & creation
    messages/        — Chat threads
    dashboard/       — Seller dashboard
    admin/           — Admin panel screens
    checkout/        — Checkout & payment flow
    offers/          — Offer management
    order/           — Order tracking
    profile/         — User profile
    ratings/         — Reviews & ratings
    settings/        — App settings
    notifications/   — Notification center
    transaction/     — Transaction history
    verification/    — Student verification flow
    meetup/          — Meetup scheduling
    wishlist/        — Saved/wishlist items
    legal/           — Terms & Privacy

  services/
    firebase.ts           — Firebase init
    authService.ts        — Auth helpers
    listingService.ts     — Listing CRUD
    chatService.ts        — Messaging
    offerService.ts       — Offer flow
    transactionService.ts — Transaction logic
    razorpayService.ts    — Razorpay payments
    upiService.ts         — UPI payments
    r2Service.ts          — Cloud storage (R2)
    notificationsService.ts — Push notifications
    reviewService.ts      — Ratings & reviews
    savedItemsService.ts  — Wishlist
    userService.ts        — User profile
    imageService.ts       — Image upload/compression
    pricingService.ts     — Dynamic pricing helpers
    storageService.ts     — Local async storage

  components/           — Reusable UI components
  navigation/           — Navigation config
  context/              — React context providers
  hooks/                — Custom hooks
  data/                 — Static data & constants
  theme/                — Colors, typography, spacing
  types/                — TypeScript type definitions
```

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes and open a PR

## License

MIT
