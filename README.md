# CampusBazaar

A smart marketplace for college students — buy, sell, and trade used books, laptops, calculators, and more.

## Features

- **Buyer view** — Browse listings with category filters, saved items, secure messaging
- **Seller view** — Dashboard with stats, list items, manage your listings
- **Admin view** — Platform overview, all listings, user management, flagged item moderation

## Getting Started

### Prerequisites
- Node.js 16+ and npm installed

### Install & run

```bash
npm install
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000).

### Build for production

```bash
npm run build
```

## Project Structure

```
src/
  components/
    Sidebar.jsx / .module.css       — Role switcher + navigation
    Topbar.jsx / .module.css        — Search bar + topbar actions
    Browse.jsx / .module.css        — Buyer: browse & filter listings
    Messages.jsx / .module.css      — Secure messaging thread
    Saved.jsx / .module.css         — Buyer: saved/bookmarked items
    ListItem.jsx / .module.css      — Seller: list a new item form
    SellerDash.jsx / .module.css    — Seller: dashboard + my listings
    AdminOverview.jsx / .module.css — Admin: stats + recent activity
    AdminListings.jsx / .module.css — Admin: all listings table
    AdminUsers.jsx / .module.css    — Admin: user management
    AdminFlagged.jsx / .module.css  — Admin: flagged item moderation
  data.js          — Shared mock data & constants
  App.js           — Root component, routing logic
  App.css          — Layout styles
  index.js         — Entry point
  index.css        — Global CSS variables & resets
```

## Next Steps (to make it production-ready)

1. **Authentication** — Add college email verification (`.ac.in` / `.edu` domain check) using Firebase Auth or Supabase Auth
2. **Backend / Database** — Replace mock data with Supabase or Firebase Firestore
3. **Real messaging** — Use Firebase Realtime Database or Supabase Realtime for live chat
4. **Image uploads** — Integrate Cloudinary or Supabase Storage for listing photos
5. **Search** — Add full-text search with Algolia or Supabase's built-in full-text search
6. **Notifications** — Push notifications via Firebase Cloud Messaging

## Tech Stack

- React 18
- CSS Modules
- Google Fonts (Lora + Inter)
