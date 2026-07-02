import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserSettings, Surah, Reciter, FastingRecord, FamilyGroup } from '../types';
import { getData, storeData, removeData, KEYS } from '../utils/storage';
import { get, post } from '../utils/api';
import { ENDPOINTS } from '../constants/api';
import { t } from '../i18n/translations';
import { getThemeColors, applyRuntimeColors, applyGradientTheme } from '../constants/colors';
import { getAllSurahs as getOfflineSurahs } from '../data/surahs';

const FALLBACK_RECITERS: Reciter[] = [
  { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy', arabicName: 'مشاري راشد العفاسي', style: 'Murattal', country: 'Kuwait' },
  { id: 'ar.abdurrahmaansudais', name: 'Abdur-Rahman As-Sudais', arabicName: 'عبد الرحمن السديس', style: 'Murattal', country: 'Saudi Arabia' },
  { id: 'ar.saoodshuraym', name: 'Saood Ash-Shuraym', arabicName: 'سعود الشريم', style: 'Murattal', country: 'Saudi Arabia' },
  { id: 'ar.husary', name: 'Mahmoud Khalil Al-Husary', arabicName: 'محمود خليل الحصري', style: 'Murattal', country: 'Egypt' },
  { id: 'ar.husarymujawwad', name: 'Mahmoud Khalil Al-Husary (Mujawwad)', arabicName: 'محمود خليل الحصري (المجود)', style: 'Mujawwad', country: 'Egypt' },
  { id: 'ar.abdulbasitmurattal', name: 'Abdul Basit Abdus Samad', arabicName: 'عبد الباسط عبد الصمد', style: 'Murattal', country: 'Egypt' },
  { id: 'ar.abdulsamad', name: 'Abdul Basit Abdus Samad (Mujawwad)', arabicName: 'عبد الباسط عبد الصمد (المجود)', style: 'Mujawwad', country: 'Egypt' },
  { id: 'ar.hudhaify', name: 'Ali Al-Hudhaify', arabicName: 'علي بن عبد الرحمن الحذيفي', style: 'Murattal', country: 'Saudi Arabia' },
  { id: 'ar.muhammadayyoub', name: 'Muhammad Ayyoub', arabicName: 'محمد أيوب', style: 'Murattal', country: 'Saudi Arabia' },
  { id: 'ar.shaatree', name: 'Abu Bakr Ash-Shaatree', arabicName: 'أبو بكر الشاطري', style: 'Murattal', country: 'Saudi Arabia' },
  { id: 'ar.ahmedajamy', name: 'Ahmed ibn Ali al-Ajamy', arabicName: 'أحمد بن علي العجمي', style: 'Murattal', country: 'Saudi Arabia' },
  { id: 'ar.mahermuaiqly', name: 'Maher Al-Muaiqly', arabicName: 'ماهر المعيقلي', style: 'Murattal', country: 'Saudi Arabia' },
  { id: 'ar.abdullahbasfar', name: 'Abdullah Basfar', arabicName: 'عبد الله بصفر', style: 'Murattal', country: 'Saudi Arabia' },
  { id: 'ar.minshawi', name: 'Mohamed Siddiq Al-Minshawi', arabicName: 'محمد صديق المنشاوي', style: 'Murattal', country: 'Egypt' },
  { id: 'ar.minshawimujawwad', name: 'Mohamed Siddiq Al-Minshawi (Mujawwad)', arabicName: 'محمد صديق المنشاوي (المجود)', style: 'Mujawwad', country: 'Egypt' },
  { id: 'ar.ibrahimakhbar', name: 'Ibrahim Al-Akhdar', arabicName: 'إبراهيم الأخضر', style: 'Murattal', country: 'Saudi Arabia' },
  { id: 'ar.hanirifai', name: 'Hani Ar-Rifai', arabicName: 'هاني الرفاعي', style: 'Murattal', country: 'Kuwait' },
  { id: 'ar.muhammadjibreel', name: 'Muhammad Jibreel', arabicName: 'محمد جبريل', style: 'Murattal', country: 'Saudi Arabia' },
  { id: 'ar.aymanswoaid', name: 'Ayman Sowaid', arabicName: 'أيمن سويد', style: 'Murattal', country: 'Syria' },
  { id: 'ar.nasserelqatami', name: 'Nasser Al Qatami', arabicName: 'ناصر القطامي', style: 'Murattal', country: 'Saudi Arabia', customAudioUrlTemplate: 'https://alfurqan.online/api/v1/audio/nasser-alqatami/{ayahNumber}' },
  { id: 'ar.parhizgar', name: 'Parhizgar', arabicName: 'شهریار پرهیزگار', style: 'Murattal', country: 'Iran', audioId: 'ar.parhizgar' },

];

interface AppContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<void>;
  updateAvatar: (avatarUri: string) => Promise<void>;
  removeAvatar: () => Promise<void>;

  allSurahs: Surah[];
  reciters: Reciter[];
  selectedReciter: string;
  setSelectedReciter: (id: string) => void;
  dailyStreak: number;
  totalDhikr: number;
  setTotalDhikr: (count: number) => void;
  totalTasbih: number;
  setTotalTasbih: (count: number) => void;
  incrementStreak: () => void;
  hasCompletedOnboarding: boolean;
  setOnboardingComplete: () => void;
  isOnline: boolean;

  language: 'ar' | 'en';
  toggleLanguage: () => Promise<void>;
  t: (key: string) => string;

  theme: 'dark' | 'light' | 'amoled';
  setTheme: (theme: 'dark' | 'light' | 'amoled') => Promise<void>;

  activeColors: Record<string, string>;
  customColors: Record<string, string> | null;
  setCustomColors: (colors: Record<string, string> | null) => Promise<void>;
  themeVersion: number;

  error: string | null;
  clearError: () => void;

  // New features context
  fastingRecords: FastingRecord[];
  setFastingRecords: (records: FastingRecord[]) => void;
  familyGroup: FamilyGroup | null;
  setFamilyGroup: (group: FamilyGroup | null) => void;
  children: { childName: string }[];
  setChildren: (children: { childName: string }[]) => void;
  isRamadanMode: boolean;
  setRamadanMode: (mode: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

function initRTL(lang: 'ar' | 'en') {
  if (Platform.OS !== 'web') {
    const isRtl = lang === 'ar';
    if (I18nManager.isRTL !== isRtl) {
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(isRtl);
    }
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allSurahs, setAllSurahs] = useState<Surah[]>([]);
  const [reciters, setReciters] = useState<Reciter[]>(FALLBACK_RECITERS);
  const [selectedReciter, setSelectedReciter] = useState('ar.alafasy');
  const [dailyStreak, setDailyStreak] = useState(0);
  const [totalDhikr, setTotalDhikr] = useState(0);
  const [totalTasbih, setTotalTasbih] = useState(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [language, setLanguage] = useState<'ar' | 'en'>('en');
  const [theme, setThemeState] = useState<'dark' | 'light' | 'amoled'>('light');
  const [fastingRecords, setFastingRecords] = useState<FastingRecord[]>([]);
  const [familyGroup, setFamilyGroup] = useState<FamilyGroup | null>(null);
  const [childrenList, setChildrenList] = useState<{ childName: string }[]>([]);
  const [isRamadanMode, setIsRamadanMode] = useState(false);
  const [themeVersion, setThemeVersion] = useState(0);
  const [customColors, setCustomColorsState] = useState<Record<string, string> | null>(null);

  const initializeApp = useCallback(async () => {
    try {
      setIsLoading(true);

      const [
        onboarded,
        storedToken,
        storedUser,
        storedAvatar,
        savedLang,
        savedTheme,
        savedReciter,
        streak,
        dhikr,
        tasbih,
        cached,
        savedCustomColors,
        storedFasting,
      ] = await Promise.all([
        getData<boolean>(KEYS.ONBOARDING_DONE, false),
        getData<string>(KEYS.TOKEN),
        getData<User>(KEYS.USER),
        getData<string>(KEYS.USER_AVATAR),
        getData<'ar' | 'en'>(KEYS.LANGUAGE, 'en'),
        getData<'dark' | 'light' | 'amoled'>('aiqan_theme', 'light'),
        getData<string>('aiqan_reciter', 'ar.alafasy'),
        getData<number>(KEYS.STREAK, 0),
        getData<number>(KEYS.DHIKR_TOTAL, 0),
        getData<number>(KEYS.TASBIH_TOTAL, 0),
        getData<Surah[]>(KEYS.CACHED_SURAHS),
        getData<Record<string, string>>('aiqan_custom_colors'),
        getData<FastingRecord[]>(KEYS.FASTING, []),
      ]);

      setHasCompletedOnboarding(onboarded ?? false);

      if (storedToken) {
        setToken(storedToken);
      }

      if (storedUser) {
        // Migrate: if storedUser has embedded avatar (old code) but KEYS.USER_AVATAR wasn't set,
        // extract it so avatar survives the next updateProfile/updateSettings that strips it.
        const embeddedAvatar = (storedUser as Record<string, unknown>).avatar;
        if (embeddedAvatar && typeof embeddedAvatar === 'string' && !storedAvatar) {
          await storeData(KEYS.USER_AVATAR, embeddedAvatar);
          storedAvatar = embeddedAvatar as string;
          const cleaned = { ...storedUser };
          delete (cleaned as Record<string, unknown>).avatar;
          await storeData(KEYS.USER, cleaned);
          storedUser = cleaned;
        }
        setUser(storedAvatar ? { ...storedUser, avatar: storedAvatar } : storedUser);
      } else if (storedToken) {
        console.warn('[RECOVERY] KEYS.USER is null/corrupted but KEYS.TOKEN exists. Re-creating guest user.');
        const recoveredUser: User = {
          id: 'guest_' + Date.now(),
          name: (savedLang === 'ar' ? 'ضيف' : 'Guest'),
          email: '',
          createdAt: new Date().toISOString(),
          isGuest: true,
          settings: {
            language: savedLang || 'en', quranFont: 'uthmani', translationLanguage: 'en.sahih',
            defaultReciter: 'ar.alafasy', notificationsEnabled: true, prayerNotifs: true,
            morningAzkarNotifs: true, eveningAzkarNotifs: true, fridayReminderNotifs: true,
            prayerMethod: 5, theme: savedTheme || 'light', accentColor: '#D4AF37',
            fontSize: 20, fontSizeTranslation: 14, animationSpeed: 'normal', adhanVoice: 'default',
          },
          progress: {
            dailyStreak: streak ?? 0, lastActiveDate: new Date().toISOString(),
            quranReadingProgress: {}, memorizedSurahs: [], azkarStreak: 0,
            totalDhikrCount: dhikr ?? 0, achievements: [], weeklyGoal: 1, weeklyCompleted: 0,
          },
        };
        setUser(storedAvatar ? { ...recoveredUser, avatar: storedAvatar } : recoveredUser);
        await storeData(KEYS.USER, recoveredUser);
      }

      setLanguage(savedLang ?? 'en');
      initRTL(savedLang ?? 'ar');

      setThemeState(savedTheme ?? 'light');
      setSelectedReciter(savedReciter ?? 'ar.alafasy');
      setDailyStreak(streak ?? 0);
      setTotalDhikr(dhikr ?? 0);
      setTotalTasbih(tasbih ?? 0);

      const offlineSurahsInit = getOfflineSurahs();
      if (cached && cached.length === 114) {
        setAllSurahs(cached);
      } else {
        if (cached) AsyncStorage.removeItem(KEYS.CACHED_SURAHS);
        if (offlineSurahsInit.length > 0) setAllSurahs(offlineSurahsInit);
      }

      if (savedCustomColors) setCustomColorsState(savedCustomColors);
      if (storedFasting && storedFasting.length > 0) setFastingRecords(storedFasting);

      fetchInitialData();
    } catch (err) {
      console.error('Init error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  const fetchInitialData = async () => {
    const offlineSurahs = getOfflineSurahs();
    if (offlineSurahs.length > 0 && allSurahs.length === 0) {
      setAllSurahs(offlineSurahs);
    }
    try {
      const recitersData = await get<Reciter[]>(ENDPOINTS.RECITERS_ALL);
      const customReciterIds = new Set(FALLBACK_RECITERS.filter(r => !recitersData.find((api: Reciter) => api.id === r.id)).map(r => r.id));
      if (customReciterIds.size > 0) {
        for (const r of FALLBACK_RECITERS) {
          if (customReciterIds.has(r.id)) recitersData.push(r);
        }
      }
      setReciters(recitersData);
      await storeData(KEYS.CACHED_RECITERS, recitersData);
    } catch {
      if (allSurahs.length === 0 && offlineSurahs.length > 0) {
        setAllSurahs(offlineSurahs);
      }
      setReciters(FALLBACK_RECITERS);
      setIsOnline(false);
    }
  };

  const toggleLanguageFn = async () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
    await storeData(KEYS.LANGUAGE, newLang);
    initRTL(newLang);
  };

  const handleSetTheme = async (newTheme: 'dark' | 'light' | 'amoled') => {
    setThemeState(newTheme);
    setThemeVersion(v => v + 1);
    await storeData('aiqan_theme', newTheme);
  };

  const login = async (email: string, password: string) => {
    try {
      const data = await post<{ user: User; token: string }>(ENDPOINTS.AUTH_LOGIN, { email, password });
      setUser(data.user);
      setToken(data.token);
      const tokOk = await storeData(KEYS.TOKEN, data.token);
      const usrOk = await storeData(KEYS.USER, data.user);
      if (!tokOk || !usrOk) throw new Error('Failed to persist login data');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const data = await post<{ user: User; token: string }>(ENDPOINTS.AUTH_REGISTER, { name, email, password });
      setUser(data.user);
      setToken(data.token);
      const tokOk = await storeData(KEYS.TOKEN, data.token);
      const usrOk = await storeData(KEYS.USER, data.user);
      if (!tokOk || !usrOk) throw new Error('Failed to persist registration data');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    }
  };

  const loginAsGuest = async () => {
    const guestUser: User = {
      id: 'guest_' + Date.now(),
      name: language === 'ar' ? 'ضيف' : 'Guest',
      email: '',
      createdAt: new Date().toISOString(),
      isGuest: true,
      settings: {
        language,
        quranFont: 'uthmani',
        translationLanguage: 'en.sahih',
        defaultReciter: 'ar.alafasy',
        notificationsEnabled: true,
        prayerNotifs: true,
        morningAzkarNotifs: true,
        eveningAzkarNotifs: true,
        fridayReminderNotifs: true,
        prayerMethod: 5,
        theme: 'dark',
        accentColor: '#D4AF37',
        fontSize: 20,
        fontSizeTranslation: 14,
        animationSpeed: 'normal',
        adhanVoice: 'default',
      },
      progress: {
        dailyStreak: 0,
        lastActiveDate: new Date().toISOString(),
        quranReadingProgress: {},
        memorizedSurahs: [],
        azkarStreak: 0,
        totalDhikrCount: 0,
        achievements: [],
        weeklyGoal: 1,
        weeklyCompleted: 0,
      },
    };
    const guestToken = 'guest_token_' + Date.now();
    setUser(guestUser);
    setToken(guestToken);
    const tokOk = await storeData(KEYS.TOKEN, guestToken);
    const usrOk = await storeData(KEYS.USER, guestUser);
    if (!tokOk || !usrOk) {
      throw new Error('Failed to persist guest session');
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.multiRemove([KEYS.TOKEN, KEYS.USER, KEYS.USER_AVATAR]);
  };

  const updateSettings = async (settings: Partial<UserSettings>) => {
    if (!user) return;
    const updatedSettings = { ...user.settings, ...settings };
    const updatedUser = { ...user, settings: updatedSettings };
    setUser(updatedUser);
    const userForStorage = Object.assign({}, updatedUser);
    delete (userForStorage as Record<string, unknown>).avatar;
    const ok = await storeData(KEYS.USER, userForStorage);
    if (!ok) throw new Error('Failed to save settings');

    await storeData(KEYS.SETTINGS, updatedSettings);
    try {
      await post(ENDPOINTS.AUTH_SETTINGS, settings);
    } catch {
      // Settings saved locally even if API fails
    }
  };

  const updateProfile = async (data: { name?: string; email?: string }) => {
    if (!user) return;
    const updated = { ...user };
    if (data.name !== undefined) updated.name = data.name;
    if (data.email !== undefined) updated.email = data.email;
    setUser(updated);
    const userForStorage = Object.assign({}, updated);
    delete (userForStorage as Record<string, unknown>).avatar;
    const ok = await storeData(KEYS.USER, userForStorage);
    if (!ok) throw new Error('Failed to save profile');
    try {
      await post(ENDPOINTS.AUTH_PROFILE, data);
    } catch {
      // Profile saved locally even if API fails
    }
  };

  const updateAvatar = async (avatarUri: string) => {
    if (!user) return;
    const updated = { ...user, avatar: avatarUri };
    setUser(updated);
    const ok = await storeData(KEYS.USER_AVATAR, avatarUri);
    if (!ok) throw new Error('Failed to save avatar');
  };

  const removeAvatar = async () => {
    if (!user) return;
    const updated = { ...user };
    delete updated.avatar;
    setUser(updated);
    await removeData(KEYS.USER_AVATAR);
  };

  const handleSetSelectedReciter = useCallback((id: string) => {
    setSelectedReciter(id);
    storeData('aiqan_reciter', id);
  }, []);

  const incrementStreak = useCallback(() => {
    setDailyStreak(prev => {
      const newStreak = prev + 1;
      storeData(KEYS.STREAK, newStreak);
      return newStreak;
    });
  }, []);

  const setOnboardingComplete = useCallback(async () => {
    await storeData(KEYS.ONBOARDING_DONE, true);
    setHasCompletedOnboarding(true);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const activeColors = useMemo(() => {
    const colors = getThemeColors(theme, customColors);
    try {
      applyRuntimeColors(colors);
      applyGradientTheme(theme);
    } catch {
      // ignore
    }
    return colors;
  }, [theme, customColors]);

  const handleSetCustomColors = useCallback(async (colors: Record<string, string> | null) => {
    setCustomColorsState(colors);
    setThemeVersion(v => v + 1);
    await storeData('aiqan_custom_colors', colors);
  }, []);

  const tCallback = useCallback((key: string) => t(key, language), [language]);

  const contextValue = useMemo(() => ({
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    login,
    register,
    loginAsGuest,
    logout,
    updateSettings,
    updateProfile,
    updateAvatar,
    removeAvatar,
    allSurahs,
    reciters,
    selectedReciter,
    setSelectedReciter: handleSetSelectedReciter,
    dailyStreak,
    totalDhikr,
    setTotalDhikr,
    totalTasbih,
    setTotalTasbih,
    incrementStreak,
    hasCompletedOnboarding,
    setOnboardingComplete,
    isOnline,
    language,
    toggleLanguage: toggleLanguageFn,
    t: tCallback,
    activeColors,
    customColors,
    setCustomColors: handleSetCustomColors,
    themeVersion,
    theme,
    setTheme: handleSetTheme,
    error,
    clearError,
    fastingRecords,
    setFastingRecords,
    familyGroup,
    setFamilyGroup,
    children: childrenList,
    setChildren: setChildrenList,
    isRamadanMode,
    setRamadanMode: setIsRamadanMode,
  }), [
    user, token, isLoading, allSurahs, reciters, selectedReciter,
    dailyStreak, totalDhikr, totalTasbih, hasCompletedOnboarding,
    isOnline, language, theme, activeColors, customColors, themeVersion,
    error, fastingRecords, familyGroup, childrenList, isRamadanMode,
    login, register, loginAsGuest, logout, updateSettings, updateProfile,
    updateAvatar, removeAvatar,
    handleSetSelectedReciter, setTotalDhikr, setTotalTasbih,
    incrementStreak, setOnboardingComplete, toggleLanguageFn,
    tCallback, handleSetCustomColors, handleSetTheme, clearError,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
