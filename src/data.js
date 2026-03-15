export const LISTINGS = [
  { id: 1, t: 'Engineering Mathematics Vol. 3', cat: 'Books', price: '₹450', cond: 'Good', ico: '📚', seller: 'Arjun S.', dept: 'ECE', rating: 4.7, reviews: 18 },
  { id: 2, t: 'HP Laptop 15s i5 10th Gen', cat: 'Laptops', price: '₹28,000', cond: 'Good', ico: '💻', seller: 'Priya R.', dept: 'CSE', rating: 4.9, reviews: 32 },
  { id: 3, t: 'Casio fx-991ES Calculator', cat: 'Calculators', price: '₹350', cond: 'Fair', ico: '🧮', seller: 'Rohit M.', dept: 'Mech', rating: 4.5, reviews: 9 },
  { id: 4, t: 'Data Structures & Algorithms', cat: 'Books', price: '₹220', cond: 'Fair', ico: '📖', seller: 'Sneha K.', dept: 'CSE', rating: 4.2, reviews: 6 },
  { id: 5, t: 'Dell Latitude 5490 i7', cat: 'Laptops', price: '₹32,500', cond: 'Good', ico: '💻', seller: 'Vikram T.', dept: 'IT', rating: 4.8, reviews: 21 },
  { id: 6, t: 'Scientific Lab Coat (M)', cat: 'Other', price: '₹180', cond: 'Good', ico: '🥼', seller: 'Aisha B.', dept: 'Chem', rating: 4.4, reviews: 11 },
  { id: 7, t: 'Organic Chemistry – Atkins', cat: 'Books', price: '₹380', cond: 'Good', ico: '📗', seller: 'Devan P.', dept: 'Chem', rating: 4.6, reviews: 14 },
  { id: 8, t: 'TI-84 Plus Graphing Calc', cat: 'Calculators', price: '₹2,400', cond: 'Good', ico: '🔢', seller: 'Meera J.', dept: 'Maths', rating: 4.9, reviews: 27 },
];

export const NAV_CONFIG = {
  buyer: [
    { id: 'browse', ico: '🛍', lbl: 'Browse' },
    { id: 'messages', ico: '💬', lbl: 'Messages', badge: 3 },
    { id: 'saved', ico: '🔖', lbl: 'Saved items' },
    { id: 'notifications', ico: '🔔', lbl: 'Notifications', badge: 4 },
  ],
  seller: [
    { id: 'sdash', ico: '📊', lbl: 'Dashboard' },
    { id: 'list', ico: '+', lbl: 'List an item' },
    { id: 'mylist', ico: '📦', lbl: 'My listings' },
    { id: 'messages', ico: '💬', lbl: 'Messages', badge: 2 },
     { id: 'notifications', ico: '🔔', lbl: 'Notifications', badge: 3 },
  ],
  admin: [
    { id: 'aoverview', ico: '📈', lbl: 'Overview' },
    { id: 'alist', ico: '📋', lbl: 'All listings' },
    { id: 'ausers', ico: '👥', lbl: 'Users' },
    { id: 'aflag', ico: '⚑', lbl: 'Flagged', badge: 2 },
    { id: 'notifications', ico: '🔔', lbl: 'Notifications', badge: 5 },
  ],
};

export const DEFAULT_PAGE = { buyer: 'browse', seller: 'sdash', admin: 'aoverview' };

export const CONVERSATIONS = [
  { id: 1, name: 'Priya R.', prev: 'Is the laptop still available?', time: '2m', item: 'HP Laptop 15s', active: true },
  { id: 2, name: 'Arjun S.', prev: 'Can you do ₹400 for the book?', time: '1h', item: 'Engg Maths Vol.3' },
  { id: 3, name: 'Rohit M.', prev: "I'll pick it up tomorrow", time: '3h', item: 'Casio Calculator' },
];

export const MESSAGES = [
  { id: 1, text: 'Hi! Is the HP Laptop still available?', out: false, time: '10:24 AM' },
  { id: 2, text: 'Yes it is! What would you like to know?', out: true, time: '10:26 AM' },
  { id: 3, text: "What's the battery backup like? Any scratches?", out: false, time: '10:27 AM' },
  { id: 4, text: 'Battery gives ~4 hrs. Minor scuff on bottom, screen is perfect. Can share more photos!', out: true, time: '10:29 AM' },
  { id: 5, text: 'Sounds good. Can I come see it today on campus?', out: false, time: '10:31 AM' },
];

export const SELLER_LISTINGS = [
  { t: 'HP Laptop 15s i5', price: '₹28,000', ico: '💻', views: '34 views', msgs: '5 messages', status: 'Active', rating: 4.9, reviews: 32 },
  { t: 'Engg Mathematics Vol.3', price: '₹450', ico: '📚', views: '12 views', msgs: '2 messages', status: 'Active', rating: 4.7, reviews: 18 },
  { t: 'Casio fx-991ES', price: '₹350', ico: '🧮', views: '8 views', msgs: '1 message', status: 'Pending', rating: 4.5, reviews: 9 },
];

export const ADMIN_USERS = [
  { n: 'Priya Rao', r: '22CS0041', d: 'CSE', l: 3, t: 7, s: 'Active' },
  { n: 'Arjun Sharma', r: '21EC0078', d: 'ECE', l: 5, t: 12, s: 'Active' },
  { n: 'Rohit Mishra', r: '22ME0023', d: 'Mech', l: 1, t: 4, s: 'Active' },
  { n: 'unknown_user91', r: 'N/A', d: '?', l: 1, t: 0, s: 'Flagged' },
];

export const FLAGGED_ITEMS = [
  { ico: '📱', t: 'Cheap iPhone 12 — price anomaly', seller: 'unknown_user91', reason: 'Unverified seller, price far below market (₹3,000)', price: '₹3,000' },
  { ico: '💊', t: 'Study supplements bundle', seller: 'user_anon_44', reason: 'Non-academic item; restricted category', price: '₹1,200' },
];
