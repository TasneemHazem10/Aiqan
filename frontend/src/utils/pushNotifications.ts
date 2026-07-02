import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

// Set default notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register device for push notifications
 * Call this once on app startup or when user enables notifications
 */
export async function registerForPushNotifications(userId: string) {
  try {
    // Request notification permission
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    // Get Expo push token
    const token = (await Notifications.getExpoPushTokenAsync()).data;

    // Send token to backend
    await api.post('/notifications/register', {
      token,
      platform: 'android', // would be 'ios' on iOS
    });

    // Save locally
    await AsyncStorage.setItem('expoPushToken', token);
    console.log('✅ Push notifications registered:', token);

    return token;
  } catch (error) {
    console.error('❌ Failed to register push notifications:', error);
    return null;
  }
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  delaySeconds: number = 5
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        badge: 1,
        data: { timestamp: new Date().toISOString() },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: delaySeconds,
      },
    });
    console.log('✅ Notification scheduled');
  } catch (error) {
    console.error('❌ Failed to schedule notification:', error);
  }
}

/**
 * Add listener for when notification arrives while app is open
 */
export function setupNotificationListeners(onNotification?: (notification: any) => void) {
  // Listen for notifications when app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('📳 Notification received:', notification);
    onNotification?.(notification);
  });

  // Listen for notification tap
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('👆 Notification tapped:', response);
    const data = response.notification.request.content.data;
    // Navigate to relevant screen based on data
    if (data.type === 'prayer') {
      // Navigate to prayer screen
    } else if (data.type === 'quran') {
      // Navigate to quran screen
    }
  });

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Send test notification via backend
 */
export async function sendTestNotification() {
  try {
    const response = await api.post('/notifications/send-test', {});
    console.log('✅ Test notification sent');
    return response;
  } catch (error) {
    console.error('❌ Failed to send test notification:', error);
    throw error;
  }
}

/**
 * Schedule prayer time notifications for all prayers
 */
export async function schedulePrayerNotifications(prayerTimes: any) {
  try {
    // For each prayer, schedule notification 5 minutes before
    Object.entries(prayerTimes).forEach(([prayerName, timeStr]: any) => {
      if (prayerName === 'Sunrise') return; // Skip Sunrise

      // Parse time and schedule
      const [hours, minutes] = timeStr.split(':').map(Number);
      const prayerDate = new Date();
      prayerDate.setHours(hours, minutes, 0);

      const delayMs = prayerDate.getTime() - Date.now() - 5 * 60000; // 5 minutes before
      if (delayMs > 0) {
        scheduleLocalNotification(
          `${prayerName} Prayer Upcoming`,
          `Prayer time is at ${timeStr}`,
          delayMs / 1000
        );
      }
    });
  } catch (error) {
    console.error('Failed to schedule prayer notifications:', error);
  }
}

/**
 * Schedule Azkar reminders
 */
export async function scheduleAzkarReminder(
  category: string,
  hour: number = 6,
  minute: number = 0
) {
  try {
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(hour, minute, 0);

    // If time already passed today, schedule for tomorrow
    if (reminderTime < now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const delayMs = reminderTime.getTime() - now.getTime();

    await scheduleLocalNotification(
      `🤲 ${category} Azkar Time`,
      `Time to recite ${category} Azkar. Let's glorify Allah!`,
      delayMs / 1000
    );
  } catch (error) {
    console.error('Failed to schedule azkar reminder:', error);
  }
}

export default {
  registerForPushNotifications,
  scheduleLocalNotification,
  setupNotificationListeners,
  sendTestNotification,
  schedulePrayerNotifications,
  scheduleAzkarReminder,
};
