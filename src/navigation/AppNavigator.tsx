import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { registerForPushNotifications } from '../services/pushService';

// Show notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldPlaySound:  true,
    shouldSetBadge:   true,
    shouldShowBanner: true,
    shouldShowList:   true,
  }),
});

const Stack = createNativeStackNavigator<{ Auth: undefined; Main: undefined }>();

export default function AppNavigator() {
  const { isAuthenticated, user } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const notifListener    = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // Register push token when user logs in
  useEffect(() => {
    if (isAuthenticated && user?.uid) {
      registerForPushNotifications(user.uid).catch(console.warn);
    }
  }, [isAuthenticated, user?.uid]);

  // Listen for notifications received while app is open (foreground)
  useEffect(() => {
    notifListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Push] Received in foreground:', notification.request.content.title);
    });

    // Handle tap on notification (app in background or killed)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, string> | undefined;
      if (!data || !navigationRef.current) return;

      console.log('[Push] Tapped notification, data:', data);

      // Navigate based on notification type
      const nav = navigationRef.current;
      switch (data.type) {
        case 'message':
          if (data.chatId && data.otherUserId && data.otherUserName) {
            nav.navigate('Main', {
              screen: 'Messages',
              params: {
                screen: 'FirebaseChat',
                params: {
                  chatId:        data.chatId,
                  otherUserId:   data.otherUserId,
                  otherUserName: data.otherUserName,
                  listingTitle:  data.listingTitle ?? '',
                },
              },
            });
          }
          break;
        case 'offer':
        case 'offer_accepted':
        case 'offer_rejected':
          nav.navigate('Main', { screen: 'Notifications' });
          break;
        case 'purchase':
          if (data.transactionId) {
            nav.navigate('Main', {
              screen: 'Home',
              params: {
                screen: 'Transaction',
                params: { transactionId: data.transactionId },
              },
            });
          }
          break;
        default:
          nav.navigate('Main', { screen: 'Notifications' });
      }
    });

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
