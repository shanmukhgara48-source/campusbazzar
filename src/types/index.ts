export type UserRole = 'buyer' | 'seller' | 'admin';
export type ItemCondition = 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';
export type ItemCategory = 'Books' | 'Laptops' | 'Calculators' | 'Electronics' | 'Other';
export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer';
export type MeetupLocation = 'Library' | 'Canteen' | 'Admin Gate' | 'Main Block' | 'Hostel Block';
export type NotificationType = 'message' | 'offer' | 'review' | 'listing_view' | 'sale';
export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'countered';
export type ListingStatus = 'active' | 'sold' | 'pending' | 'flagged';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  department: string;
  year: string;
  college: string;
  role: UserRole;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  memberSince: string;
  totalSales: number;
  responseTime: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: ItemCategory;
  condition: ItemCondition;
  images: string[];
  sellerId: string;
  seller: User;
  department: string;
  status: ListingStatus;
  createdAt: string;
  views: number;
  isFeatured?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  type: 'text' | 'offer' | 'system';
  offerAmount?: number;
}

export interface Conversation {
  id: string;
  participants: string[];
  listing: Listing;
  lastMessage: Message;
  unreadCount: number;
  otherUser: User;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  sellerId: string;
  listingId: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  status: OfferStatus;
  message?: string;
  timestamp: string;
  counterAmount?: number;
}
