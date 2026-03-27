-- CampusBazaar D1 Schema
-- Run: npx wrangler d1 execute campusbazaar --file=./schema.sql --remote

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL DEFAULT '',
  email        TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar       TEXT DEFAULT '',
  department   TEXT DEFAULT '',
  year         TEXT DEFAULT '',
  college      TEXT DEFAULT '',
  roll_number  TEXT DEFAULT '',
  role         TEXT DEFAULT 'buyer',
  is_verified  INTEGER DEFAULT 0,
  rating       REAL DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  total_sales  INTEGER DEFAULT 0,
  response_time TEXT DEFAULT 'Usually within a day',
  is_banned    INTEGER DEFAULT 0,
  created_at   TEXT DEFAULT (datetime('now'))
);

-- ─── Listings ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS listings (
  id               TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  price            REAL NOT NULL,
  original_price   REAL,
  final_price      REAL,
  accepted_offer_id TEXT,
  category         TEXT NOT NULL,
  condition        TEXT NOT NULL,
  images           TEXT NOT NULL DEFAULT '[]',   -- JSON array of R2 URLs
  seller_id        TEXT NOT NULL,
  department       TEXT DEFAULT '',
  status           TEXT DEFAULT 'active',         -- active|reserved|sold|hidden|flagged
  views            INTEGER DEFAULT 0,
  is_featured      INTEGER DEFAULT 0,
  tags             TEXT DEFAULT '[]',             -- JSON array
  reserved_for     TEXT,
  created_at       TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);

-- ─── Offers ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS offers (
  id             TEXT PRIMARY KEY,
  listing_id     TEXT NOT NULL,
  buyer_id       TEXT NOT NULL,
  seller_id      TEXT NOT NULL,
  amount         REAL NOT NULL,
  status         TEXT DEFAULT 'pending',   -- pending|accepted|declined|countered
  message        TEXT DEFAULT '',
  counter_amount REAL,
  created_at     TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (listing_id) REFERENCES listings(id),
  FOREIGN KEY (buyer_id)   REFERENCES users(id),
  FOREIGN KEY (seller_id)  REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_offers_listing ON offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer   ON offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_seller  ON offers(seller_id);

-- ─── Transactions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id                   TEXT PRIMARY KEY,
  listing_id           TEXT NOT NULL,
  listing_title        TEXT NOT NULL,
  listing_image        TEXT DEFAULT '',
  listing_price        REAL NOT NULL,
  buyer_id             TEXT NOT NULL,
  buyer_name           TEXT NOT NULL,
  seller_id            TEXT NOT NULL,
  seller_name          TEXT NOT NULL,
  amount               REAL NOT NULL,
  item_price           REAL NOT NULL,
  platform_fee         REAL NOT NULL,
  gst                  REAL NOT NULL,
  convenience_fee      REAL NOT NULL,
  convenience_fee_paid INTEGER DEFAULT 0,
  qr_code_data         TEXT DEFAULT '',
  is_delivered         INTEGER DEFAULT 0,
  meetup_location      TEXT DEFAULT '',
  meetup_time          TEXT DEFAULT '',
  payment_method       TEXT DEFAULT '',
  razorpay_payment_id  TEXT DEFAULT '',
  delivery_otp         TEXT DEFAULT '',
  status               TEXT DEFAULT 'pending',  -- pending|accepted|meetup_set|completed|cancelled|disputed
  buyer_confirmed      INTEGER DEFAULT 0,
  seller_confirmed     INTEGER DEFAULT 0,
  delivered_at         TEXT,
  created_at           TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (listing_id) REFERENCES listings(id),
  FOREIGN KEY (buyer_id)   REFERENCES users(id),
  FOREIGN KEY (seller_id)  REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_tx_buyer  ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_tx_seller ON transactions(seller_id);

-- ─── Conversations ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id            TEXT PRIMARY KEY,
  listing_id    TEXT NOT NULL,
  listing_title TEXT DEFAULT '',
  participant_1 TEXT NOT NULL,   -- always the smaller uid alphabetically
  participant_2 TEXT NOT NULL,
  last_message  TEXT DEFAULT '',
  last_message_at TEXT DEFAULT (datetime('now')),
  unread_1      INTEGER DEFAULT 0,  -- unread count for participant_1
  unread_2      INTEGER DEFAULT 0,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conv_unique ON conversations(listing_id, participant_1, participant_2);
CREATE INDEX IF NOT EXISTS idx_conv_p1 ON conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conv_p2 ON conversations(participant_2);

-- ─── Messages ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id       TEXT NOT NULL,
  text            TEXT NOT NULL,
  type            TEXT DEFAULT 'text',   -- text|offer|system
  offer_amount    REAL,
  is_read         INTEGER DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at);

-- ─── Notifications ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  is_read    INTEGER DEFAULT 0,
  data       TEXT DEFAULT '{}',   -- JSON
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, created_at);

-- ─── Reviews ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id             TEXT PRIMARY KEY,
  reviewer_id    TEXT NOT NULL,
  seller_id      TEXT NOT NULL,
  listing_id     TEXT NOT NULL,
  transaction_id TEXT,
  rating         INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment        TEXT DEFAULT '',
  created_at     TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reviews_seller ON reviews(seller_id);

-- ─── Favourites ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS favourites (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  listing_id TEXT NOT NULL,
  saved_at   TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_fav_user ON favourites(user_id);
