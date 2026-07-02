// API Base URL configuration (priority order):
// 1. EXPO_PUBLIC_API_URL environment variable (set in .env or EAS Build secrets)
// 2. app.json "extra.apiBaseUrl" field (runtime configurable)
// 3. Hardcoded fallback for local development
//
// For local testing:
//   Android emulator -> http://10.0.2.2:5000/api
//   iOS simulator    -> http://localhost:5000/api
//   Physical device  -> http://YOUR_LOCAL_IP:5000/api
import Constants from 'expo-constants';

const envApiUrl: string | undefined =
  (process.env as Record<string, string | undefined>).EXPO_PUBLIC_API_URL;
const configApiUrl: string | undefined =
  (Constants.expoConfig as Record<string, any>)?.extra?.apiBaseUrl;
const defaultUrl = 'http://localhost:5000/api';

export const API_BASE_URL = envApiUrl || configApiUrl || defaultUrl;

export const ENDPOINTS = {
  // Auth
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGIN: '/auth/login',
  AUTH_ME: '/auth/me',
  AUTH_GUEST: '/auth/guest',
  AUTH_SETTINGS: '/auth/settings',
  AUTH_PROFILE: '/auth/profile',

  // Quran
  QURAN_SURAHS: '/quran/data/surahs',
  QURAN_SURAH: (n: number) => `/quran/data/surah/${n}`,
  QURAN_SURAH_TRANSLATION: (n: number) => `/quran/surah/${n}/with-translation`,
  QURAN_SEARCH: '/quran/data/search',
  QURAN_AYAH: (ref: string) => `/quran/data/ayah/${ref}`,
  QURAN_EDITIONS: '/quran/editions',
  QURAN_PAGE: (n: number) => `/quran/data/page/${n}`,
  QURAN_SURAH_PAGES: '/quran/data/surah-pages',
  QURAN_JUZ_PAGES: '/quran/data/juz-pages',

  // Prayer
  PRAYER_TIMES: '/prayer/times',
  PRAYER_TIMES_COORDS: '/prayer/times-by-coords',
  PRAYER_MONTHLY: '/prayer/monthly',
  PRAYER_HIJRI: '/prayer/hijri',
  PRAYER_QIBLA: '/prayer/qibla',
  PRAYER_METHODS: '/prayer/methods',
  PRAYER_LOCATIONS: '/prayer/locations',

  // Azkar
  AZKAR_ALL: '/azkar',
  AZKAR_CATEGORY: (id: string) => `/azkar/${id}`,

  // Dua
  DUA_ALL: '/dua',
  DUA_CATEGORY: (id: string) => `/dua/${id}`,
  DUA_SEARCH: '/dua/search',

  // Reciters
  RECITERS_ALL: '/reciters',
  RECITER_AUDIO: (id: string, surah: number) => `/reciters/${id}/audio/${surah}`,

  // Progress
  PROGRESS: '/progress',
  PROGRESS_QURAN: '/progress/quran',
  PROGRESS_MEMORIZATION: '/progress/memorization',
  PROGRESS_DHIKR: '/progress/dhikr',
  PROGRESS_STREAK: '/progress/streak',
  PROGRESS_STATS: '/progress/stats',

  // Islamic Lifestyle
  HIJRI_CALENDAR: (year: number, month: number) => `/islamic/hijri-calendar/${year}/${month}`,
  HIJRI_TODAY: '/islamic/hijri-today',
  ISLAMIC_EVENTS: '/islamic/events',
  FASTING: '/islamic/fasting',
  FASTING_STATS: '/islamic/fasting/stats',
  ZAKAT_CALCULATE: '/islamic/zakat/calculate',

  // Family
  FAMILY_CREATE: '/family/create',
  FAMILY_JOIN: '/family/join',
  FAMILY_MY: '/family/my',
  FAMILY_CHILD_ADD: '/family/child/add',
  FAMILY_CHILDREN: '/family/children',
  FAMILY_CHILD_PROGRESS: '/family/child/progress',
  FAMILY_HALAQAT_CREATE: '/family/halaqat/create',
  FAMILY_HALAQAT_JOIN: '/family/halaqat/join',
  FAMILY_HALAQAT_MY: '/family/halaqat/my',

  // Community
  CHALLENGE_CREATE: '/community/challenge/create',
  CHALLENGE_JOIN: (id: string) => `/community/challenge/join/${id}`,
  CHALLENGES: '/community/challenges',
  CHALLENGE_DETAIL: (id: string) => `/community/challenge/${id}`,
  CHALLENGE_PROGRESS: (id: string) => `/community/challenge/${id}/progress`,
  LEADERBOARD: '/community/leaderboard',

  // AI Enhanced
  AI_ASSISTANT: '/ai/assistant',
  AI_RECS: '/ai/recs',
  SADAQAH: '/ai/sadaqah',

  // Video
  VIDEO_CREATE: '/video/create',
  VIDEO_GENERATE: '/video/generate',
  VIDEO_JOB: (id: string) => `/video/job/${id}`,

  // Tafsir
  TAFSIR_JUZ: (n: number) => `/tafsir/juz/${n}`,
  TAFSIR_SURAH: (n: number) => `/tafsir/surah/${n}`,
  TAFSIR_AYAH: (surah: number, ayah: number) => `/tafsir/ayah/${surah}/${ayah}`,

  // AI Hifz Coach
  HIFZ_WEAK_AYAH: '/ai/hifz/weak-ayah',
  HIFZ_WEAK_AYAHS: '/ai/hifz/weak-ayahs',
  HIFZ_PLAN_GENERATE: '/ai/hifz/plan/generate',
  HIFZ_PLAN: '/ai/hifz/plan',
  HIFZ_TASK_COMPLETE: '/ai/hifz/plan/task/complete',
  HIFZ_STATS: '/ai/hifz/stats',

  // Recordings
  RECORDINGS: '/recordings',
  RECORDING: (id: string) => `/recordings/${id}`,
  RECORDING_FILE: (id: string) => `/recordings/file/${id}`,

  // Backup
  BACKUP_CREATE: '/backup/create',
  BACKUP_LIST: '/backup/list',
  BACKUP_RESTORE: (id: string) => `/backup/restore/${id}`,
  BACKUP_DELETE: (id: string) => `/backup/${id}`,
};

// Available Quran translations
export const TRANSLATIONS = [
  { id: 'en.sahih', name: 'Saheeh International', language: 'English' },
  { id: 'en.pickthall', name: 'Pickthall', language: 'English' },
  { id: 'en.yusufali', name: 'Yusuf Ali', language: 'English' },
  { id: 'fr.hamidullah', name: 'Hamidullah', language: 'French' },
  { id: 'ar.muyassar', name: 'Al-Muyassar (Arabic)', language: 'Arabic' },
  { id: 'ur.ahmedali', name: 'Ahmed Ali', language: 'Urdu' },
  { id: 'tr.diyanet', name: 'Diyanet Isleri', language: 'Turkish' },
  { id: 'de.aburida', name: 'Abu Rida Muhammad', language: 'German' },
  { id: 'id.indonesian', name: 'Indonesian Ministry', language: 'Indonesian' },
  { id: 'ru.kuliev', name: 'Kuliev', language: 'Russian' },
];

// Prayer calculation methods
export const PRAYER_METHODS: Record<number, string> = {
  1: 'University of Islamic Sciences, Karachi',
  2: 'Islamic Society of North America (ISNA)',
  3: 'Muslim World League',
  4: 'Umm Al-Qura University, Makkah',
  5: 'Egyptian General Authority of Survey',
  8: 'Gulf Region',
  9: 'Kuwait',
  10: 'Qatar',
  11: 'Majlis Ugama Islam Singapura',
  15: 'Moonsighting Committee Worldwide',
  16: 'Dubai',
};
