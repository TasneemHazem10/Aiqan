export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  settings: UserSettings;
  progress: UserProgress;
  isGuest?: boolean;
  avatar?: string;
}

export interface UserSettings {
  language: 'ar' | 'en';
  quranFont: string;
  translationLanguage: string;
  defaultReciter: string;
  notificationsEnabled: boolean;
  prayerNotifs: boolean;
  morningAzkarNotifs: boolean;
  eveningAzkarNotifs: boolean;
  fridayReminderNotifs: boolean;
  prayerMethod: number;
  theme: 'dark' | 'light' | 'amoled';
  accentColor: string;
  fontSize: number;
  fontSizeTranslation: number;
  animationSpeed: 'slow' | 'normal' | 'fast';
  adhanVoice: string;
}

export interface UserProgress {
  dailyStreak: number;
  lastActiveDate: string;
  quranReadingProgress: Record<string, SurahProgress>;
  memorizedSurahs: number[];
  azkarStreak: number;
  totalDhikrCount: number;
  achievements: string[];
  weeklyGoal: number;
  weeklyCompleted: number;
}

export interface SurahProgress {
  surahNumber: number;
  lastAyah: number;
  lastReadAt: string;
  completed: boolean;
}

export interface PageProgress {
  lastPage: number;
  lastAyahNumber?: number;
  lastReadAt: string;
}

export interface QuranPageAyah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | { id: number; recommended: boolean; obligatory: boolean };
  surahNumber: number;
  surahName: string;
  surahEnglishName: string;
  surahEnglishNameTranslation: string;
  isFirstInSurah: boolean;
  translation?: string | null;
}

export interface QuranPage {
  pageNumber: number;
  juzNumber: number;
  surahs: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
  }[];
  ayahs: QuranPageAyah[];
}

export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
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
  sajda: boolean | { id: number; recommended: boolean; obligatory: boolean };
  surah?: Surah;
  audio?: string;
  translation?: string;
}

export interface SurahWithAyahs extends Surah {
  ayahs: Ayah[];
}

export interface PrayerTimes {
  [key: string]: string;
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Sunset: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Midnight: string;
}

export interface PrayerTimesResponse {
  timings: PrayerTimes;
  date: {
    readable: string;
    timestamp: string;
    hijri: {
      date: string;
      month: { number: number; en: string; ar: string };
      year: string;
      day: string;
      weekday: { en: string; ar: string };
    };
    gregorian: {
      date: string;
      month: { number: number; en: string };
      year: string;
      day: string;
      weekday: { en: string };
    };
  };
  meta: {
    latitude: number;
    longitude: number;
    timezone: string;
    method: { id: number; name: string };
  };
}

export interface NextPrayer {
  name: string;
  arabicName: string;
  time: string;
  countdown: string;
  countdownSeconds: number;
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
  azkar?: AzkarItem[];
  azkarCount?: number;
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
}

export interface DuaCategory {
  id: string;
  name: string;
  arabicName: string;
  icon: string;
  color: string;
  duas?: DuaItem[];
  duaCount?: number;
}

export interface Reciter {
  id: string;
  name: string;
  arabicName: string;
  style: string;
  country: string;
  audioId?: string;
  customAudioUrlTemplate?: string;
}

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  Auth: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Quran: undefined;
  Prayer: undefined;
  Azkar: undefined;
  More: undefined;
};

export type QuranStackParamList = {
  QuranHome: undefined;
  SurahList: undefined;
  SurahReader: { surahNumber: number; surahName: string; startAyah?: number };
  QuranPageReader: { initialPage?: number; surahNumber?: number; ayahNumber?: number };
  Memorization: { surahNumber?: number };
  Search: undefined;
  QuranSearch: undefined;
};

export type AzkarStackParamList = {
  AzkarHome: undefined;
  AzkarDetail: { categoryId: string; title: string };
  DuaHome: undefined;
  DuaDetail: { categoryId: string; title: string };
};

export type MoreStackParamList = {
  MoreHome: undefined;
  HifzCoach: undefined;
  Qibla: undefined;
  Profile: { fromHome?: boolean } | undefined;
  Settings: undefined;
  Notifications: undefined;
  Progress: undefined;
  HijriCalendar: undefined;
  RamadanMode: undefined;
  FastingTracker: undefined;
  ZakatCalculator: undefined;
  PerformanceAnalytics: undefined;
  AiAssistant: undefined;
  CloudBackup: undefined;
  FridayReminders: undefined;
  IslamicEvents: undefined;
  VideoGenerator: undefined;
  Downloads: undefined;
  ColorPicker: undefined;
  TimedMemorization: { surahNumber?: number } | undefined;
  TravelSupport: undefined;
  AdhanCustomization: undefined;
  VoiceRecorder: undefined;
};

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface MemorizationSession {
  surahNumber: number;
  ayahNumber: number;
  mode: 'hidden_words' | 'hidden_ayat' | 'fill_blanks' | 'repeat_after';
  score: number;
  attempts: number;
  completed: boolean;
  timestamp: string;
}

export interface Bookmark {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  note?: string;
  createdAt: string;
}

export interface HijriDate {
  date: string;
  format: string;
  day: string;
  weekday: { en: string; ar: string };
  month: { number: number; en: string; ar: string };
  year: string;
  designation: { abbreviated: string; expanded: string };
}

// Fasting
export interface FastingRecord {
  _id?: string;
  date: string;
  type: 'ramadan' | 'sunnah' | 'qada' | 'nazar';
  status: 'fasted' | 'missed' | 'partial' | 'planned';
  notes?: string;
}

export interface FastingStats {
  totalFasted: number;
  ramadanFasted: number;
  sunnahFasted: number;
  qadaFasted: number;
  nazarFasted: number;
  currentStreak: number;
  longestStreak: number;
}

// Zakat
export interface ZakatInput {
  cash: number;
  gold: number;
  silver: number;
  investments: number;
  property: number;
}

export interface ZakatResult {
  totalWealth: number;
  zakatDue: number;
  nisabThreshold: number;
  isAboveNisab: boolean;
  breakdown: { label: string; amount: number }[];
  prices?: {
    goldPerGram: number;
    silverPerGram: number;
    currency: string;
  };
}

// Family
export interface FamilyMember {
  userId?: string;
  name: string;
  role: 'admin' | 'member' | 'child';
  joinedAt: string;
}

export interface FamilyGroup {
  _id: string;
  name: string;
  type: 'family' | 'halaqat';
  admin: string;
  members: FamilyMember[];
  inviteCode: string;
  description?: string;
}

// Challenge
export interface Challenge {
  _id: string;
  creator: string;
  participants: {
    user: { _id: string; name: string };
    score: number;
    completed: boolean;
  }[];
  type: 'memorization' | 'reading' | 'dhikr' | 'streak';
  goal: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'cancelled';
}

// Islamic Event
export interface IslamicEvent {
  eventType: string;
  hijriDate: string;
  gregorianDate: string;
  name: { en: string; ar: string };
  description?: { en: string; ar: string };
}

// Backup
export interface BackupRecord {
  _id: string;
  data: any;
  version: string;
  size: number;
  platform: string;
  createdAt: string;
}

// Child Progress
export interface ChildProgress {
  childName: string;
  surahNumber: number;
  ayahNumber: number;
  status: string;
  lastPracticed?: string;
  notes?: string;
}

// Voice Recording
export interface VoiceRecordingData {
  id: string;
  name: string;
  surahNumber: number;
  surahName: string;
  uri: string;
  duration: number;
  createdAt: string;
}

// Video Generator
export interface VideoJobResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  outputUrl?: string;
  error?: string;
  input?: {
    surahNumber: number;
    fromAyah: number;
    toAyah: number;
    reciterId: string;
    theme: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface VideoGenerateRequest {
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
  reciterId: string;
  theme: string;
}

export interface VideoGenerateResponse {
  jobId: string;
  status: string;
  outputUrl?: string;
  error?: string;
}

// Progress
export interface WeeklyGoalItem {
  target: number;
  completed: number;
  unit: string;
}

export interface ProgressStats {
  dailyStreak: number;
  totalDhikrCount: number;
  lastActiveDate: string | null;
  quran: { surahsRead: number; totalAyahsRead: number };
  memorization: { surahsMemorized: number; totalAyahsMemorized: number };
  fasting: { totalFasted: number; ramadanFasted: number; sunnahFasted: number; currentStreak: number };
  weeklyGoals: {
    quran: WeeklyGoalItem;
    fasting: WeeklyGoalItem;
    azkar: WeeklyGoalItem;
    prayer: WeeklyGoalItem;
  };
  weekActivity: { label: string; completed: boolean; date: string }[];
}

// Sadaqah
export interface SadaqahSuggestion {
  category: string;
  title: string;
  description: string;
  reward?: string;
  estimatedCost?: string;
}

export interface SadaqahResponse {
  suggestions: SadaqahSuggestion[];
}

// AI Assistant
export interface AiAssistantResponse {
  surahs: { number: number; name: string; reason: string }[];
  ayat: { reference: string; text: string; explanation: string }[];
  duas: { title: string; arabic?: string; translation: string }[];
  message: string;
}
