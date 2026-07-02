import axios from 'axios';

const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

const PRAYER_ARABIC: Record<string, string> = {
  Fajr: '\u0627\u0644\u0641\u062C\u0631',
  Dhuhr: '\u0627\u0644\u0638\u0647\u0631',
  Asr: '\u0627\u0644\u0639\u0635\u0631',
  Maghrib: '\u0627\u0644\u0645\u063A\u0631\u0628',
  Isha: '\u0627\u0644\u0639\u0634\u0627\u0621',
};

export interface DeviceToken {
  token: string;
  userId: string;
  platform: 'ios' | 'android';
}

const deviceTokens = new Map<string, DeviceToken[]>();

export const notificationService = {
  registerToken: (userId: string, token: string, platform: 'ios' | 'android' = 'android') => {
    if (!deviceTokens.has(userId)) {
      deviceTokens.set(userId, []);
    }
    const tokens = deviceTokens.get(userId)!;
    if (!tokens.find(t => t.token === token)) {
      tokens.push({ token, userId, platform });
    }
  },

  removeToken: (userId: string, token: string) => {
    const tokens = deviceTokens.get(userId);
    if (tokens) {
      const filtered = tokens.filter(t => t.token !== token);
      if (filtered.length === 0) {
        deviceTokens.delete(userId);
      } else {
        deviceTokens.set(userId, filtered);
      }
    }
  },

  async sendNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<{ success: boolean; errors: string[] }> {
    if (tokens.length === 0) return { success: true, errors: [] };

    const messages = tokens.map(token => ({
      to: token,
      sound: 'default' as const,
      title,
      body,
      data: data || {},
      badge: 1,
    }));

    const errors: string[] = [];

    try {
      const response = await axios.post(EXPO_PUSH_API, messages, {
        headers: { 'Content-Type': 'application/json' },
      });

      const resultData = response.data;
      if (resultData?.data) {
        const ticketErrors: string[] = resultData.data
          .filter((t: any) => t.status === 'error')
          .map((t: any) => t.message);
        errors.push(...ticketErrors);
      }

      console.log(`Sent notifications to ${tokens.length} devices`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to send notifications:', msg);
      errors.push(msg);
    }

    return { success: errors.length === 0, errors };
  },

  getTokens: (userId: string): string[] => {
    return (deviceTokens.get(userId) || []).map(t => t.token);
  },

  schedulePrayerNotification: async (
    userId: string,
    prayerName: string,
    prayerTime: Date,
    reminderMinutes: number = 5
  ) => {
    const notificationTime = new Date(prayerTime.getTime() - reminderMinutes * 60000);
    const now = new Date();
    const delayMs = notificationTime.getTime() - now.getTime();

    if (delayMs > 0) {
      setTimeout(async () => {
        const tokens = notificationService.getTokens(userId);
        await notificationService.sendNotification(
          tokens,
          `${prayerName} Prayer Coming Up`,
          `${prayerName} (${PRAYER_ARABIC[prayerName] || prayerName}) is at ${prayerTime.toLocaleTimeString()}`,
          { prayerName, time: prayerTime.toISOString() }
        );
      }, delayMs);
    }
  },

  scheduleAzkarNotification: async (
    userId: string,
    category: string,
    time: Date
  ) => {
    const delayMs = time.getTime() - new Date().getTime();
    if (delayMs > 0) {
      setTimeout(async () => {
        const tokens = notificationService.getTokens(userId);
        await notificationService.sendNotification(
          tokens,
          'Azkar Reminder',
          `Time for ${category} Azkar. Let's glorify Allah!`,
          { category, type: 'azkar' }
        );
      }, delayMs);
    }
  },

  scheduleDailyQuranVerse: async (
    userId: string,
    time: Date,
    surah: number,
    ayah: number,
    text: string
  ) => {
    const delayMs = time.getTime() - new Date().getTime();
    if (delayMs > 0) {
      setTimeout(async () => {
        const tokens = notificationService.getTokens(userId);
        await notificationService.sendNotification(
          tokens,
          'Quran Verse of the Day',
          text.substring(0, 100) + '...',
          { surah, ayah, type: 'quran' }
        );
      }, delayMs);
    }
  },
};
