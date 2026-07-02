import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: 'aiqan_token',
  USER: 'aiqan_user',
  SETTINGS: 'aiqan_settings',
  BOOKMARKS: 'aiqan_bookmarks',
  QURAN_PROGRESS: 'aiqan_quran_progress',
  MEMORIZATION: 'aiqan_memorization',
  AZKAR_COUNTS: 'aiqan_azkar_counts',
  DHIKR_TOTAL: 'aiqan_dhikr_total',
  STREAK: 'aiqan_streak',
  LAST_ACTIVE: 'aiqan_last_active',
  ONBOARDING_DONE: 'aiqan_onboarding',
  PRAYER_LOCATION: 'aiqan_prayer_location',
  CACHED_SURAHS: 'aiqan_cached_surahs',
  CACHED_RECITERS: 'aiqan_cached_reciters',
  NOTES: 'aiqan_notes',
  FAVORITES: 'aiqan_favorites',
  LANGUAGE: 'aiqan_language',
  FASTING: 'aiqan_fasting',
  FAMILY_GROUP: 'aiqan_family_group',
  CLOUD_BACKUP: 'aiqan_cloud_backup',
  CHILDREN: 'aiqan_children',
  CHALLENGES: 'aiqan_challenges',
  CACHED_EVENTS: 'aiqan_cached_events',
  FAVORITE_RECITERS: 'aiqan_favorite_reciters',
  TRAVEL_LOCATIONS: 'aiqan_travel_locations',
  MEMORIZATION_SESSIONS: 'aiqan_memorization_sessions',
  MEMORIZATION_HISTORY: 'aiqan_memorization_history',
  VOICE_RECORDINGS: 'aiqan_voice_recordings',
  DOWNLOADS: 'aiqan_downloads',
  FRIDAY_REMINDER: 'aiqan_friday_reminder',
  TASBIH_TOTAL: 'aiqan_tasbih_total',
  ACHIEVEMENTS: 'aiqan_achievements',
  USER_AVATAR: 'aiqan_user_avatar',
};

export { KEYS };

export async function storeData(key: string, value: unknown): Promise<boolean> {
  try {
    const jsonValue = JSON.stringify(value);
    if (jsonValue.length > 1024 * 1024) {
      console.warn(`[STORAGE] Large write (${(jsonValue.length / 1024).toFixed(0)}KB) for key "${key}"`);
    }
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error(`[STORAGE FAILED] key="${key}" size=${JSON.stringify(value).length}B error=`, error);
    return false;
  }
}

export async function getData<T>(key: string, defaultValue?: T): Promise<T | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    if (jsonValue === null) return defaultValue ?? null;
    return JSON.parse(jsonValue) as T;
  } catch (error) {
    console.error(`Read error for key ${key}:`, error);
    return defaultValue ?? null;
  }
}

export async function removeData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Remove error for key ${key}:`, error);
  }
}

export async function multiRemoveData(keys: string[]): Promise<void> {
  try {
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Multi remove error:', error);
  }
}

export async function clearAll(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Clear storage error:', error);
  }
}

export async function saveBookmark(surahNum: number, ayahNum: number, note?: string) {
  const bookmarks = await getData<Array<{surah: number; ayah: number; note?: string; date: string}>>(
    KEYS.BOOKMARKS, []
  ) ?? [];
  const existing = bookmarks.findIndex(b => b.surah === surahNum && b.ayah === ayahNum);
  if (existing !== -1) {
    bookmarks.splice(existing, 1);
  } else {
    bookmarks.push({ surah: surahNum, ayah: ayahNum, note, date: new Date().toISOString() });
  }
  await storeData(KEYS.BOOKMARKS, bookmarks);
  return { bookmarks, isBookmarked: existing === -1 };
}

export async function removeBookmark(surahNum: number, ayahNum: number) {
  const bookmarks = await getData<Array<{surah: number; ayah: number; note?: string; date: string}>>(
    KEYS.BOOKMARKS, []
  ) ?? [];
  const filtered = bookmarks.filter(b => !(b.surah === surahNum && b.ayah === ayahNum));
  await storeData(KEYS.BOOKMARKS, filtered);
  return filtered;
}

export async function isBookmarked(surahNum: number, ayahNum: number): Promise<boolean> {
  const bookmarks = await getData<Array<{surah: number; ayah: number}>>(KEYS.BOOKMARKS, []) ?? [];
  return bookmarks.some(b => b.surah === surahNum && b.ayah === ayahNum);
}

export async function saveQuranProgress(surahNum: number, ayahNum: number) {
  const progress = await getData<Record<string, {ayah: number; date: string}>>(KEYS.QURAN_PROGRESS, {}) ?? {};
  progress[`s${surahNum}`] = { ayah: ayahNum, date: new Date().toISOString() };
  await storeData(KEYS.QURAN_PROGRESS, progress);
}

export async function incrementTasbih(count = 1): Promise<number> {
  const current = await getData<number>(KEYS.TASBIH_TOTAL, 0) ?? 0;
  const newTotal = current + count;
  await storeData(KEYS.TASBIH_TOTAL, newTotal);
  return newTotal;
}

export async function getQuranProgress(surahNum: number): Promise<{ ayah: number; date: string } | null> {
  const progress = await getData<Record<string, {ayah: number; date: string}>>(KEYS.QURAN_PROGRESS, {}) ?? {};
  return progress[`s${surahNum}`] ?? null;
}

export async function incrementDhikr(count = 1): Promise<number> {
  const current = await getData<number>(KEYS.DHIKR_TOTAL, 0) ?? 0;
  const newTotal = current + count;
  await storeData(KEYS.DHIKR_TOTAL, newTotal);
  return newTotal;
}

export async function updateStreak(): Promise<{ streak: number; isNew: boolean }> {
  const today = new Date().toISOString().split('T')[0];
  const lastActive = await getData<string>(KEYS.LAST_ACTIVE);
  const currentStreak = await getData<number>(KEYS.STREAK, 0) ?? 0;

  if (lastActive === today) {
    return { streak: currentStreak, isNew: false };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  let newStreak = 1;
  if (lastActive === yesterdayStr) {
    newStreak = currentStreak + 1;
  }

  await storeData(KEYS.STREAK, newStreak);
  await storeData(KEYS.LAST_ACTIVE, today);

  return { streak: newStreak, isNew: true };
}

export async function saveFavoriteAyah(surahNum: number, ayahNum: number) {
  const favorites = await getData<Array<{surah: number; ayah: number; date: string}>>(KEYS.FAVORITES, []) ?? [];
  const exists = favorites.some(f => f.surah === surahNum && f.ayah === ayahNum);
  if (!exists) {
    favorites.push({ surah: surahNum, ayah: ayahNum, date: new Date().toISOString() });
    await storeData(KEYS.FAVORITES, favorites);
  }
  return favorites;
}

export async function removeFavoriteAyah(surahNum: number, ayahNum: number) {
  const favorites = await getData<Array<{surah: number; ayah: number; date: string}>>(KEYS.FAVORITES, []) ?? [];
  const filtered = favorites.filter(f => !(f.surah === surahNum && f.ayah === ayahNum));
  await storeData(KEYS.FAVORITES, filtered);
  return filtered;
}

export async function isFavoriteAyah(surahNum: number, ayahNum: number): Promise<boolean> {
  const favorites = await getData<Array<{surah: number; ayah: number}>>(KEYS.FAVORITES, []) ?? [];
  return favorites.some(f => f.surah === surahNum && f.ayah === ayahNum);
}
