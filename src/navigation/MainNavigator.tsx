import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList, HomeStackParamList, MessagesStackParamList, ProfileStackParamList } from './types';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { useUserChats } from '../services/chatService';
import { useNotifications } from '../services/notificationsService';

import HomeScreen from '../screens/home/HomeScreen';
import ListingDetailScreen from '../screens/listing/ListingDetailScreen';
import OfferScreen from '../screens/offers/OfferScreen';
import MeetupScreen from '../screens/meetup/MeetupScreen';
import RatingsScreen from '../screens/ratings/RatingsScreen';
import TransactionScreen from '../screens/transaction/TransactionScreen';
import QRScannerScreen   from '../screens/transaction/QRScannerScreen';
import WishlistScreen from '../screens/wishlist/WishlistScreen';

import MessagesScreen from '../screens/messages/MessagesScreen';
import ChatScreen from '../screens/messages/ChatScreen';
import FirebaseChatScreen from '../screens/messages/FirebaseChatScreen';

import SellScreen from '../screens/listing/SellScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import PublicProfileScreen from '../screens/profile/PublicProfileScreen';
import SavedItemsScreen from '../screens/profile/SavedItemsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import SellerDashboardScreen from '../screens/dashboard/SellerDashboardScreen';
import AdminPanelScreen from '../screens/admin/AdminPanelScreen';
import IDVerificationScreen from '../screens/verification/IDVerificationScreen';
import TermsScreen from '../screens/legal/TermsScreen';
import ProhibitedItemsScreen from '../screens/legal/ProhibitedItemsScreen';
import TransactionHistoryScreen from '../screens/transaction/TransactionHistoryScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const MessagesStack = createNativeStackNavigator<MessagesStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain"      component={HomeScreen} />
      <HomeStack.Screen name="ListingDetail" component={ListingDetailScreen} />
      <HomeStack.Screen name="Offer"         component={OfferScreen} />
      <HomeStack.Screen name="Meetup"        component={MeetupScreen} />
      <HomeStack.Screen name="Ratings"       component={RatingsScreen} />
      <HomeStack.Screen name="Transaction"   component={TransactionScreen} />
      <HomeStack.Screen name="QRScanner"     component={QRScannerScreen} />
      <HomeStack.Screen name="Wishlist"      component={WishlistScreen} />
      <HomeStack.Screen name="FirebaseChat"  component={FirebaseChatScreen} />
      <HomeStack.Screen name="PublicProfile" component={PublicProfileScreen} />
    </HomeStack.Navigator>
  );
}

function MessagesStackNavigator() {
  return (
    <MessagesStack.Navigator screenOptions={{ headerShown: false }}>
      <MessagesStack.Screen name="ConversationList" component={MessagesScreen} />
      <MessagesStack.Screen name="Chat"             component={ChatScreen} />
      <MessagesStack.Screen name="FirebaseChat"     component={FirebaseChatScreen} />
    </MessagesStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain"        component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile"        component={EditProfileScreen} />
      <ProfileStack.Screen name="SavedItems"         component={SavedItemsScreen} />
      <ProfileStack.Screen name="Settings"           component={SettingsScreen} />
      <ProfileStack.Screen name="SellerDashboard"    component={SellerDashboardScreen} />
      <ProfileStack.Screen name="AdminPanel"         component={AdminPanelScreen} />
      <ProfileStack.Screen name="IDVerification"     component={IDVerificationScreen} />
      <ProfileStack.Screen name="Terms"              component={TermsScreen} />
      <ProfileStack.Screen name="ProhibitedItems"    component={ProhibitedItemsScreen} />
      <ProfileStack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
    </ProfileStack.Navigator>
  );
}

export default function MainNavigator() {
  const { user } = useAuth();
  const { unreadCount: msgUnread }  = useUserChats(user?.uid);
  const { unreadCount: notifUnread } = useNotifications(user?.uid);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          paddingTop: 6,
          height: 62,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color }) => {
          const icons: Record<string, [string, string]> = {
            Home:          ['home',          'home-outline'],
            Messages:      ['chatbubbles',   'chatbubbles-outline'],
            Sell:          ['add-circle',    'add-circle-outline'],
            Notifications: ['notifications', 'notifications-outline'],
            Profile:       ['person',        'person-outline'],
          };
          const [active, inactive] = icons[route.name] || ['ellipse', 'ellipse-outline'];
          if (route.name === 'Sell') {
            return (
              <View style={[styles.sellIcon, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>
                <Ionicons name="add" size={28} color={colors.textInverse} />
              </View>
            );
          }
          return <Ionicons name={(focused ? active : inactive) as any} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen
        name="Messages"
        component={MessagesStackNavigator}
        options={{ tabBarBadge: msgUnread > 0 ? msgUnread : undefined }}
      />
      <Tab.Screen name="Sell" component={SellScreen} options={{ tabBarLabel: '' }} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ tabBarBadge: notifUnread > 0 ? notifUnread : undefined }}
      />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  sellIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
