import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  OTP: {
    email: string;
    fullName: string;
    rollNumber: string;
    collegeName: string;
    collegeDomain: string;
  };
  ProfileSetup: {
    email: string;
    fullName: string;
    rollNumber: string;
    collegeName: string;
  };
};

export type HomeStackParamList = {
  HomeMain: undefined;
  ListingDetail: { listingId: string };
  Offer: { listingId: string };
  Meetup: { listingId: string };
  Ratings: { userId: string };
};

export type MessagesStackParamList = {
  ConversationList: undefined;
  Chat: { conversationId: string; otherUserName: string; listingTitle: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  SellerDashboard: undefined;
  AdminPanel: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Messages: undefined;
  Sell: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type HomeScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>,
  BottomTabNavigationProp<MainTabParamList>
>;

export type ListingDetailRouteProp = RouteProp<HomeStackParamList, 'ListingDetail'>;
export type OfferRouteProp = RouteProp<HomeStackParamList, 'Offer'>;
export type MeetupRouteProp = RouteProp<HomeStackParamList, 'Meetup'>;
export type RatingsRouteProp = RouteProp<HomeStackParamList, 'Ratings'>;
export type ChatRouteProp = RouteProp<MessagesStackParamList, 'Chat'>;
