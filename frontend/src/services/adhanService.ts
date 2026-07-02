import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';

interface PrayerTime {
  name: string;
  time: string;
}

const ADHAN_AUDIO_URLS: Record<string, string> = {
  'ar.alafasy': 'https://quran.com/resources/media/qcf_quran/mp3/001_ar_alafasy_64kbps.mp3',
  'default': 'https://cdn.islamic.network/quran/recitations/mp3/ar.alafasy/001.mp3',
};

const ATHAN_URL = 'https://cdn.islamic.network/quran/recitations/mp3/ar.alafasy/athan.mp3';

export class AdhanService {
  private soundObject: Audio.Sound | null = null;
  private playbackInstance: Audio.Sound | null = null;

  async initialize() {
    try {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });
    } catch (err) {
      console.error('Failed to initialize audio:', err);
    }
  }

  async playAdhan(voiceId?: string) {
    try {
      await this.stopAdhan();

      const soundObject = new Audio.Sound();
      this.soundObject = soundObject;

      await soundObject.loadAsync(
        require('../../assets/athan_default.mp3')
      ).catch(async () => {
        // Fallback to URL-based audio
        await soundObject.loadAsync({
          uri: ATHAN_URL,
          overridingExtension: 'mp3',
        });
      });

      await soundObject.playAsync();
      return true;
    } catch (err) {
      console.error('Failed to play adhan:', err);
      return false;
    }
  }

  async stopAdhan() {
    if (this.soundObject) {
      try {
        await this.soundObject.stopAsync();
        await this.soundObject.unloadAsync();
        this.soundObject = null;
      } catch (err) {
        console.error('Failed to stop adhan:', err);
      }
    }
  }

  isPrayerTimeNow(prayerTime: string): boolean {
    try {
      const [prayerHours, prayerMinutes] = prayerTime.split(':').map(Number);
      const prayerTimeInMinutes = prayerHours * 60 + prayerMinutes;

      const now = new Date();
      const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

      // Prayer time triggers within 1 minute window
      return Math.abs(currentTimeInMinutes - prayerTimeInMinutes) < 1;
    } catch {
      return false;
    }
  }

  async sendPrayerNotification(prayerName: string, isArabic: boolean) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: isArabic ? 'حان وقت الصلاة' : 'Prayer Time',
          body: isArabic ? `${prayerName} الآن` : `${prayerName} now`,
          sound: true,
        },
        trigger: null,
      });
    } catch (err) {
      console.error('Failed to send notification:', err);
    }
  }
}

export const adhanService = new AdhanService();
