export interface User {
  id: string;
  name?: string;
  email: string;
  passwordHash?: string;
  createdAt: string;
  settings?: UserSettings;
  progress?: UserProgress;
}

export interface UserSettings {
  language: string;
  quranFont: string;
  translationLanguage: string;
  defaultReciter: string;
  notificationsEnabled: boolean;
  prayerMethod: number;
  theme: string;
  accentColor: string;
  fontSize: number;
}

export interface UserProgress {
  dailyStreak: number;
  lastActiveDate: string;
  quranReadingProgress: Record<string, number>;
  memorizedSurahs: number[];
  azkarStreak: number;
  totalDhikrCount: number;
  achievements: string[];
  weeklyGoal: number;
  weeklyCompleted: number;
}

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean;
}

export interface SurahWithAyahs extends Surah {
  ayahs: Ayah[];
}

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
  Firstthird: string;
  Lastthird: string;
}

export interface AzkarItem {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  count: number;
  virtue?: string;
  source?: string;
}

export interface AzkarCategory {
  id: string;
  name: string;
  arabicName: string;
  icon: string;
  color: string;
  azkar: AzkarItem[];
}

export interface DuaItem {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  source?: string;
  benefits?: string;
  timing?: string;
  audio?: string;
}

export interface DuaCategory {
  id: string;
  name: string;
  arabicName: string;
  icon: string;
  color: string;
  duas: DuaItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthPayload {
  userId: string;
  email: string;
}

export interface Reciter {
  id: string;
  name: string;
  arabicName: string;
  style: string;
  audioBaseUrl: string;
}
