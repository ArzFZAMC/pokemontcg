# 🎴 PocketDex TCG

> Premium Pokémon TCG Collection Tracker — Dark gaming UI, PWA installable on Android

![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Node.js%20%2B%20MySQL-blueviolet)

---

## 🚀 Quick Start

### 1. Setup Database

```bash
# Login to MySQL and run the SQL file
mysql -u root -p < database.sql
```

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy env file
cp .env.example .env

# Edit .env with your MySQL credentials
nano .env

# Start development server
npm run dev
# → API runs on http://localhost:5000
```

**`.env` fields to update:**
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=pocketdex_tcg
JWT_SECRET=change_this_to_a_random_secret
POKEMON_TCG_API_KEY=   ← optional, get free key at pokemontcg.io
```

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
# → App runs on http://localhost:5173
```

---

## 🏗️ Project Structure

```
pocketdex/
├── database.sql                 ← Run this first!
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── index.js             ← Express server entry
│       ├── config/
│       │   └── database.js      ← MySQL pool
│       ├── middleware/
│       │   └── auth.js          ← JWT middleware
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── cardsController.js
│       │   ├── collectionController.js
│       │   ├── wishlistController.js
│       │   ├── deckController.js
│       │   └── achievementController.js
│       └── routes/
│           ├── auth.js
│           ├── cards.js
│           ├── collection.js
│           ├── wishlist.js
│           ├── decks.js
│           └── achievements.js
└── frontend/
    ├── index.html
    ├── vite.config.js           ← PWA configured
    ├── tailwind.config.js
    └── src/
        ├── App.jsx              ← Routing
        ├── main.jsx
        ├── index.css            ← Global dark theme
        ├── context/
        │   └── AuthContext.jsx  ← JWT session persistence
        ├── services/
        │   └── api.js           ← All Axios endpoints
        ├── layouts/
        │   └── AppLayout.jsx    ← Sidebar + bottom nav
        ├── components/
        │   ├── cards/
        │   │   └── CardItem.jsx ← Holographic card component
        │   ├── modals/
        │   │   └── CardDetailModal.jsx
        │   └── ui/
        │       ├── StatCard.jsx
        │       ├── Skeleton.jsx
        │       └── EmptyState.jsx
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── Dashboard.jsx
            ├── Collection.jsx
            ├── Search.jsx
            ├── Wishlist.jsx
            ├── DeckBuilder.jsx
            ├── PackSimulator.jsx
            ├── Achievements.jsx
            └── Profile.jsx
```

---

## 📱 PWA Installation (Android)

1. Open `http://YOUR_IP:5173` in Chrome on Android
2. Tap the **"Add to Home Screen"** banner or go to menu → "Install App"
3. App launches in standalone mode like a native app

For production build:
```bash
cd frontend && npm run build
# Serve the dist/ folder with any static server
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login + get JWT |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/profile | Update profile |
| GET | /api/cards | Search Pokémon TCG cards |
| GET | /api/cards/:id | Get card by ID |
| GET | /api/collection | Get user collection |
| GET | /api/collection/stats | Dashboard stats |
| POST | /api/collection | Add card |
| PUT | /api/collection/:id | Update card |
| DELETE | /api/collection/:id | Remove card |
| GET | /api/wishlist | Get wishlist |
| POST | /api/wishlist | Add to wishlist |
| DELETE | /api/wishlist/:id | Remove from wishlist |
| GET | /api/decks | Get all decks |
| POST | /api/decks | Create deck |
| POST | /api/decks/:id/cards | Add card to deck |
| DELETE | /api/decks/:id/cards/:cardId | Remove card from deck |
| GET | /api/achievements | Get user achievements |

---

## 🎨 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Routing | React Router DOM v6 |
| HTTP | Axios |
| Icons | React Icons |
| Toast | React Hot Toast |
| Backend | Node.js + Express |
| Database | MySQL 8 |
| Auth | JWT + bcryptjs |
| PWA | vite-plugin-pwa + Workbox |
| Card Data | Pokémon TCG API (pokemontcg.io) |

---

## 🔑 Optional: Pokémon TCG API Key

Without a key you get 1000 requests/day (enough for dev).
Get a free key at **https://pokemontcg.io** for higher limits.

Add to `backend/.env`:
```
POKEMON_TCG_API_KEY=your_key_here
```
