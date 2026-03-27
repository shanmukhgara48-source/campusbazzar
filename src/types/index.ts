// ─── Primitive unions ────────────────────────────────────────────────────────
export type UserRole         = 'buyer' | 'seller' | 'admin';
export type ItemCondition    = 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';
export type ItemCategory     = 'Books' | 'Laptops' | 'Calculators' | 'Electronics' | 'Other';
export type PaymentMethod    = 'Cash' | 'UPI' | 'Bank Transfer' | 'Razorpay';
export type MeetupLocation   = 'Library' | 'Canteen' | 'Admin Gate' | 'Main Block' | 'Hostel Block';
export type NotificationType = 'message' | 'offer' | 'review' | 'listing_view' | 'sale' | 'wishlist_match' | 'system';
export type OfferStatus      = 'pending' | 'accepted' | 'declined' | 'countered';

export type ListingStatus =
  | 'active'
  | 'reserved'
  | 'sold'
  | 'hidden'
  | 'flagged'
  | 'pending_review';

export type VerificationStatus = 'unverified' | 'email_verified' | 'id_verified' | 'pending_id';

export type TransactionStatus =
  | 'initiated'
  | 'accepted'
  | 'reserved'
  | 'meetup_set'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export type ReportReason =
  | 'spam'
  | 'fake_item'
  | 'wrong_price'
  | 'prohibited_item'
  | 'inappropriate'
  | 'scam'
  | 'other';

// ─── Core models ─────────────────────────────────────────────────────────────
export interface User {
  id:                  string;
  name:                string;
  email:               string;
  avatar?:             string;
  department:          string;
  year:                string;
  college:             string;
  rollNumber?:         string;
  role:                UserRole;
  isVerified:          boolean;
  verificationStatus:  VerificationStatus;
  idCardUrl?:          string;
  rating:              number;
  reviewCount:         number;
  memberSince:         string;
  totalSales:          number;
  responseTime:        string;
  isBanned?:           boolean;
  reportCount?:        number;
}

export interface Listing {
  id:               string;
  title:            string;
  description:      string;
  price:            number;
  originalPrice?:   number;
  /** Negotiated price written when a seller accepts an offer. Use this for checkout. */
  finalPrice?:      number;
  acceptedOfferId?: string;
  category:         ItemCategory;
  condition:        ItemCondition;
  images:           string[];
  sellerId:         string;
  seller:           User;
  department:       string;
  status:           ListingStatus;
  createdAt:        string;
  views:            number;
  isFeatured?:      boolean;
  tags?:            string[];
  isFavourited?:    boolean;
  flagReason?:      string;
  reservedFor?:     string;
}

export interface Message {
  id:             string;
  conversationId: string;
  senderId:       string;
  text:           string;
  timestamp:      string;
  isRead:         boolean;
  type:           'text' | 'offer' | 'system';
  offerAmount?:   number;
}

export interface Conversation {
  id:           string;
  participants: string[];
  listing:      Listing;
  lastMessage:  Message;
  unreadCount:  number;
  otherUser:    User;
}

export interface Notification {
  id:        string;
  userId:    string;
  type:      NotificationType;
  title:     string;
  body:      string;
  isRead:    boolean;
  timestamp: string;
  data?:     Record<string, unknown>;
}

export interface Review {
  id:              string;
  reviewerId:      string;
  reviewerName:    string;
  reviewerAvatar?: string;
  sellerId:        string;
  listingId:       string;
  rating:          number;
  comment:         string;
  timestamp:       string;
  transactionId?:  string;
}

export interface Offer {
  id:             string;
  listingId:      string;
  buyerId:        string;
  sellerId:       string;
  amount:         number;
  status:         OfferStatus;
  message?:       string;
  timestamp:      string;
  counterAmount?: number;
}

// ─── Transaction lifecycle ───────────────────────────────────────────────────
export interface Transaction {
  id:               string;
  listingId:        string;
  listing:          Listing;
  buyerId:          string;
  buyer:            User;
  sellerId:         string;
  seller:           User;
  offerId:          string;
  finalPrice:       number;
  paymentMethod:    PaymentMethod;
  meetupLocation:   MeetupLocation;
  meetupTime:       string;
  status:           TransactionStatus;
  createdAt:        string;
  completedAt?:     string;
  buyerConfirmed:   boolean;
  sellerConfirmed:  boolean;
  reviewLeft:       boolean;
  upiTxnId?:        string;
}

// ─── Favourites ──────────────────────────────────────────────────────────────
export interface Favourite {
  id:        string;
  userId:    string;
  listingId: string;
  listing:   Listing;
  savedAt:   string;
}

// ─── Wishlist ────────────────────────────────────────────────────────────────
export interface WishlistItem {
  id:         string;
  userId:     string;
  keyword:    string;
  category?:  ItemCategory;
  maxPrice?:  number;
  createdAt:  string;
  matchCount: number;
}

// ─── Report ──────────────────────────────────────────────────────────────────
export interface Report {
  id:          string;
  reporterId:  string;
  targetId:    string;
  targetType:  'listing' | 'user';
  reason:      ReportReason;
  description: string;
  status:      'pending' | 'reviewed' | 'resolved';
  createdAt:   string;
}

// ─── ID Verification ─────────────────────────────────────────────────────────
export interface IDVerification {
  id:            string;
  userId:        string;
  idCardUrl:     string;
  selfieUrl?:    string;
  status:        'pending' | 'approved' | 'rejected';
  submittedAt:   string;
  reviewedAt?:   string;
  rejectReason?: string;
}
