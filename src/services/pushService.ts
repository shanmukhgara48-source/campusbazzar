/**
 * Push notification service — Expo push API only, no Firebase.
 * Push tokens are stored via the Worker API (users table: push_token column).
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { authApi } from './api';

export async function registerForPushNotifications(): Promise<void> {
  if (!Device.isDevice) return;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  // Store token via profile update (worker saves it)
  try {
    await authApi.updateProfile({ expoPushToken: token } as any);
  } catch (e) {
    console.warn('[push] token save non-fatal:', e);
  }
}

/** Send a push notification via Expo push API */
export async function sendPushToUser(
  _targetUid: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  // In production: call your Worker endpoint which looks up the target's push token
  // For now, this is a no-op — notifications are shown via in-app polling
  console.log('[push] sendPushToUser (no-op until Worker push endpoint added):', title, body);
}
