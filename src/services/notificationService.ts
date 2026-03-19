import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function sendKeywordMatchNotification(keyword: string, listingTitle: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🔔 Keyword alert: "${keyword}"`,
      body: `New listing matched: ${listingTitle}`,
      sound: true,
    },
    trigger: null, // fire immediately
  });
}
