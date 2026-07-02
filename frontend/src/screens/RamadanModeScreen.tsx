import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  StatusBar, ActivityIndicator, RefreshControl, Switch, Modal, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { COLORS, SHADOWS, GRADIENTS } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { get, post } from '../utils/api';
import { ENDPOINTS } from '../constants/api';
import { storeData, KEYS } from '../utils/storage';
import { PrayerTimesResponse, FastingRecord, AiAssistantResponse, SadaqahSuggestion } from '../types';
import { gregorianToHijri, hijriToGregorian } from '../utils/hijri';
import LogoDecoration from '../components/LogoDecoration';
import { FadeIn, AnimatedPressable } from '../components/AnimatedComponents';

const FASTING_DUA_AR = 'اللَّهُمَّ لَكَ صُمْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ';
const FASTING_DUA_TRANS = 'O Allah, I have fasted for You and with Your provision I break my fast';

function getRamadanDates(): { start: Date; end: Date } {
  const now = new Date();
  const todayHijri = gregorianToHijri(now);
  let ramadanYear = todayHijri.year;
  if (todayHijri.month > 9) {
    ramadanYear++;
  }
  const start = hijriToGregorian(ramadanYear, 9, 1);
  start.setHours(18, 0, 0, 0);
  start.setDate(start.getDate() - 1);
  const end = hijriToGregorian(ramadanYear, 9, 30);
  end.setHours(18, 0, 0, 0);
  end.setDate(end.getDate() - 1);
  return { start, end };
}

function getDaysUntil(target: Date): number {
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function isDateBetween(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

export default function RamadanModeScreen() {
  const navigation = useNavigation<any>();
  const { t, language, isRamadanMode, setRamadanMode, fastingRecords, setFastingRecords } = useApp();
  const isRtl = language === 'ar';

  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const fastedToday = fastingRecords.some(r => r.date === todayStr && r.status === 'fasted');
  const [showDuaModal, setShowDuaModal] = useState(false);
  const [showSadaqahModal, setShowSadaqahModal] = useState(false);
  const [duaMood, setDuaMood] = useState<string | null>(null);
  const [duaResult, setDuaResult] = useState<AiAssistantResponse | null>(null);
  const [duaLoading, setDuaLoading] = useState(false);
  const [sadaqahCategory, setSadaqahCategory] = useState<string | null>(null);
  const [sadaqahResult, setSadaqahResult] = useState<SadaqahSuggestion[] | null>(null);
  const [sadaqahLoading, setSadaqahLoading] = useState(false);

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const chipWidth = Math.floor((screenWidth - 48 - 16) / 3);

  const ramadan = getRamadanDates();
  const isInRamadan = isDateBetween(new Date(), ramadan.start, ramadan.end);
  const daysUntilRamadan = getDaysUntil(ramadan.start);

  const fetchPrayerTimes = useCallback(async () => {
    try {
      const { getData, KEYS } = await import('../utils/storage');
      const location = await getData<{ city: string; country: string }>(KEYS.PRAYER_LOCATION);
      const data = await get<PrayerTimesResponse>(ENDPOINTS.PRAYER_TIMES, {
        city: location?.city || 'Cairo',
        country: location?.country || 'Egypt',
      });
      setPrayerTimes(data);
    } catch {
      setPrayerTimes(null);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPrayerTimes().finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPrayerTimes();
    setRefreshing(false);
  }, [fetchPrayerTimes]);

  const toggleFasted = async () => {
    if (fastedToday) {
      const updated = fastingRecords.filter(r => r.date !== todayStr);
      setFastingRecords(updated);
      await storeData(KEYS.FASTING, updated);
    } else {
      const newRecord: FastingRecord = { date: todayStr, type: 'ramadan', status: 'fasted' };
      const updated = [...fastingRecords.filter(r => r.date !== todayStr), newRecord];
      setFastingRecords(updated);
      await storeData(KEYS.FASTING, updated);
      try { await post(ENDPOINTS.FASTING, newRecord); } catch {}
    }
  };

  const MOODS = [
    { id: 'anxious', emoji: '😰', ar: 'قلق', en: 'Anxious' },
    { id: 'sad', emoji: '😢', ar: 'حزين', en: 'Sad' },
    { id: 'angry', emoji: '😤', ar: 'غاضب', en: 'Angry' },
    { id: 'tired', emoji: '😴', ar: 'متعب', en: 'Tired' },
    { id: 'grateful', emoji: '🤲', ar: 'شاكر', en: 'Grateful' },
    { id: 'guidance', emoji: '🕯️', ar: 'أحتاج توجيه', en: 'Need Guidance' },
  ];

  const LOCAL_DUAS: Record<string, { title: string; arabic: string; translation: string }[]> = {
    anxious: [
      { title: 'دعاء القلق', arabic: 'ٱللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ ٱلْهَمِّ وَٱلْحَزَنِ', translation: 'O Allah, I seek refuge in You from anxiety and grief' },
      { title: 'حسبنا الله', arabic: 'حَسْبُنَا ٱللَّهُ وَنِعْمَ ٱلْوَكِيلُ', translation: 'Sufficient for us is Allah, and He is the best Disposer of affairs' },
    ],
    sad: [
      { title: 'دعاء الحزن', arabic: 'ٱللَّهُمَّ إِنِّي عَبْدُكَ وَٱبْنُ عَبْدِكَ...', translation: 'O Allah, I am Your servant, son of Your servant...' },
      { title: 'دعاء يونس', arabic: 'لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ ٱلظَّٰلِمِينَ', translation: 'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers' },
    ],
    angry: [
      { title: 'دعاء الغضب', arabic: 'أَعُوذُ بِٱللَّهِ مِنَ ٱلشَّيْطَٰنِ ٱلرَّجِيمِ', translation: 'I seek refuge in Allah from the accursed Shaytan' },
    ],
    tired: [
      { title: 'دعاء القوة', arabic: 'ٱللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا', translation: 'O Allah, there is no ease except what You make easy' },
    ],
    grateful: [
      { title: 'دعاء الشكر', arabic: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ', translation: 'All praise is due to Allah, Lord of all the worlds' },
    ],
    guidance: [
      { title: 'دعاء الاستخارة', arabic: 'ٱللَّهُمَّ إِنِّىٓ أَسْتَخِيرُكَ بِعِلْمِكَ', translation: 'O Allah, I seek Your guidance through Your knowledge' },
      { title: 'دعاء العلم', arabic: 'رَّبِّ زِدْنِى عِلْمًا', translation: 'My Lord, increase me in knowledge' },
    ],
  };

  const SADAQAH_CATEGORIES = [
    { id: 'foodWater', icon: 'fast-food', ar: 'طعام وشراب', en: 'Food & Water' },
    { id: 'education', icon: 'school', ar: 'تعليم', en: 'Education' },
    { id: 'healthcare', icon: 'medkit', ar: 'رعاية صحية', en: 'Healthcare' },
    { id: 'masjid', icon: 'moon', ar: 'مساجد', en: 'Mosques' },
    { id: 'family', icon: 'people', ar: 'دعم عائلي', en: 'Family Support' },
    { id: 'environment', icon: 'leaf', ar: 'بيئة', en: 'Environment' },
    { id: 'general', icon: 'heart', ar: 'عام', en: 'General' },
  ];

  const LOCAL_SADAQAH: Record<string, SadaqahSuggestion[]> = {
    foodWater: [
      { category: 'foodWater', title: 'إفطار صائم', description: 'قدم إفطاراً أو سحوراً لمحتاج', reward: 'مثل أجر الصائم', estimatedCost: '١٠-٥٠ دولار' },
      { category: 'foodWater', title: 'بئر ماء', description: 'ساهم في حفر بئر في منطقة تعاني من العطش', reward: 'صدقة جارية', estimatedCost: '١٠٠-١٠٠٠ دولار' },
    ],
    education: [
      { category: 'education', title: 'كفالة طالب', description: 'كفل تعليم طالب علم شرعي', reward: 'علم ينتفع به', estimatedCost: '٢٠-٢٠٠ دولار/شهر' },
    ],
    healthcare: [
      { category: 'healthcare', title: 'صندوق طبي', description: 'وفّر علاجاً لمن لا يستطيع', reward: 'إنقاذ حياة', estimatedCost: '٥٠-٥٠٠ دولار' },
    ],
    masjid: [
      { category: 'masjid', title: 'بناء مسجد', description: 'ساهم في بناء أو ترميم مسجد', reward: 'كل صلاة فيه لك أجرها', estimatedCost: '١٠٠-١٠٠٠٠ دولار' },
    ],
    family: [
      { category: 'family', title: 'كفالة يتيم', description: 'اكفل يتيماً بدعم شهري', reward: 'رفقة النبي ﷺ في الجنة', estimatedCost: '٣٠-١٥٠ دولار/شهر' },
    ],
    environment: [
      { category: 'environment', title: 'ازرع شجرة', description: 'ازرع أشجاراً مثمرة للمجتمعات المحتاجة', reward: 'صدقة جارية', estimatedCost: '٥-٢٠ دولار للشجرة' },
    ],
    general: [
      { category: 'general', title: 'صدقة عامة', description: 'تبرع لجمعية خيرية موثوقة', reward: 'تساعد في المكان الأكثر حاجة', estimatedCost: 'أي مبلغ' },
      { category: 'general', title: 'الابتسامة صدقة', description: 'قال النبي ﷺ: تبسمك في وجه أخيك صدقة', reward: 'صدقة', estimatedCost: 'مجاني' },
    ],
  };

  const handleOpenDua = () => {
    setDuaMood(null);
    setDuaResult(null);
    setShowDuaModal(true);
  };

  const handleDuaMoodSelect = async (moodId: string) => {
    setDuaMood(moodId);
    setDuaLoading(true);
    setDuaResult(null);
    try {
      const res = await post<AiAssistantResponse>(ENDPOINTS.AI_ASSISTANT, {
        mood: moodId,
        query: isRtl ? `أدعية مناسبة لمن يشعر بـ ${MOODS.find(m => m.id === moodId)?.ar || moodId}` : `Give me duas appropriate for someone feeling ${moodId}`,
        language,
      });
      setDuaResult(res);
    } catch {
      const moodKey = moodId as keyof typeof LOCAL_DUAS;
      const local = LOCAL_DUAS[moodKey] || LOCAL_DUAS.guidance;
      setDuaResult({
        message: isRtl ? 'هذه الأدعية تناسب حالتك' : 'These duas suit your state',
        surahs: [],
        ayat: [],
        duas: local,
      });
    } finally {
      setDuaLoading(false);
    }
  };

  const handleOpenSadaqah = () => {
    setSadaqahCategory(null);
    setSadaqahResult(null);
    setShowSadaqahModal(true);
  };

  const handleSadaqahSelect = async (catId: string) => {
    setSadaqahCategory(catId);
    setSadaqahLoading(true);
    setSadaqahResult(null);
    try {
      const res = await post<{ suggestions: SadaqahSuggestion[] }>(ENDPOINTS.SADAQAH, {
        category: catId,
        language,
      });
      setSadaqahResult(res.suggestions);
    } catch {
      const catKey = catId as keyof typeof LOCAL_SADAQAH;
      setSadaqahResult(LOCAL_SADAQAH[catKey] || LOCAL_SADAQAH.general);
    } finally {
      setSadaqahLoading(false);
    }
  };

  const quickActions = [
    { icon: 'book' as const, label: isRtl ? 'قراءة القرآن' : 'Read Quran', onPress: () => navigation.navigate('Quran', { screen: 'QuranHome' }) },
    { icon: 'hand-left' as const, label: isRtl ? 'الدعاء' : 'Make Dua', onPress: handleOpenDua },
    { icon: 'gift' as const, label: isRtl ? 'صدقة' : 'Give Sadaqah', onPress: handleOpenSadaqah },
  ];

  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
    header: { padding: 16, paddingBottom: 24 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 18, color: colors.textPrimary, fontWeight: '700' },
    content: { padding: 16 },
    heroCard: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: colors.border, ...SHADOWS.gold },
    heroTitle: { fontSize: 24, color: colors.gold, fontWeight: '700', marginBottom: 4 },
    heroSubtitle: { fontSize: 16, color: colors.goldLight, marginBottom: 12 },
    heroDivider: { width: 60, height: 2, backgroundColor: colors.gold, marginBottom: 12 },
    heroPhase: { fontSize: 14, color: colors.textPrimary, textAlign: 'center' },
    countdownNum: { fontSize: 48, color: colors.gold, fontWeight: '700' },
    countdownLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
    modeToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, padding: 16, borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
    toggleLabel: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
    duaCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
    duaTitle: { fontSize: 14, color: colors.gold, fontWeight: '700', marginBottom: 10 },
    duaArabic: { fontSize: 18, color: colors.textPrimary, textAlign: 'center', lineHeight: 30, marginBottom: 8, fontFamily: 'serif' },
    duaTranslation: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic' },
    timesRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    timeCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border, ...SHADOWS.soft },
    timeLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
    timeValue: { fontSize: 22, color: colors.textPrimary, fontWeight: '700', marginTop: 4 },
    timeNote: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
    fastingToggle: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
    fastingToggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    fastingToggleLabel: { flex: 1, fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
    fastingBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: colors.glassGold, padding: 8, borderRadius: 8 },
    fastingBadgeText: { fontSize: 12, color: colors.gold, fontWeight: '500' },
    section: { marginBottom: 16 },
    sectionTitle: { fontSize: 14, color: colors.textPrimary, fontWeight: '700', marginBottom: 10 },
    actionsRow: { flexDirection: 'row', gap: 12 },
    actionCard: { flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border, ...SHADOWS.soft },
    actionIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.glassGold, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    actionLabel: { fontSize: 11, color: colors.textPrimary, fontWeight: '500', textAlign: 'center' },
    prepCard: { flexDirection: 'row', gap: 12, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    prepText: { flex: 1, fontSize: 12, color: colors.textPrimary, lineHeight: 18 },
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.cardWarm, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    modalTitle: { fontSize: 18, color: colors.textPrimary, fontWeight: '700' },
    modalClose: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    modalSubtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 16, textAlign: 'center' },
    modalLoading: { alignItems: 'center', paddingVertical: 40 },
    modalLoadingText: { fontSize: 13, color: colors.textSecondary, marginTop: 12 },
    modalScroll: { maxHeight: Math.floor(screenHeight * 0.6) },
    modalMessage: { fontSize: 14, color: colors.textPrimary, lineHeight: 22, marginBottom: 16, textAlign: 'center' },
    modalEmpty: { fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingVertical: 20 },
    modalRetry: { alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.gold, marginTop: 16 },
    modalRetryText: { fontSize: 13, color: colors.gold, fontWeight: '600' },
    moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
    moodChip: { alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, width: chipWidth },
    moodEmoji: { fontSize: 28, marginBottom: 6 },
    moodLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '500', textAlign: 'center' },
    aiDuaList: { gap: 12 },
    aiDuaCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
    aiDuaCardTitle: { fontSize: 14, color: colors.gold, fontWeight: '700', marginBottom: 8 },
    aiDuaArabic: { fontSize: 16, color: colors.textPrimary, textAlign: 'right', lineHeight: 28, marginBottom: 6, fontFamily: 'serif' },
    aiDuaTranslation: { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic' },
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
    catChip: { alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border, width: chipWidth },
    catLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '500', textAlign: 'center', marginTop: 4 },
    sadaqahList: { gap: 12 },
    sadaqahCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
    sadaqahIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    sadaqahTitle: { fontSize: 14, color: colors.textPrimary, fontWeight: '600', flex: 1 },
    sadaqahDesc: { fontSize: 12, color: colors.textSecondary, lineHeight: 18, marginBottom: 8 },
    sadaqahTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.glassGold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
    sadaqahTagText: { fontSize: 11, color: colors.gold, fontWeight: '500' },
    sadaqahCost: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  }), [chipWidth, screenHeight]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  const fajrTime = prayerTimes?.timings?.Fajr || '--:--';
  const maghribTime = prayerTimes?.timings?.Maghrib || '--:--';

  return (
    <View style={styles.container}>
      <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={GRADIENTS.brand} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <AnimatedPressable onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name={isRtl ? 'chevron-forward' : 'chevron-back'} size={20} color={COLORS.gold} />
            </AnimatedPressable>
            <Text style={styles.title}>{t('ramadan.title')}</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn>
        <LinearGradient colors={GRADIENTS.cardGold} style={styles.heroCard}>
          <Text style={styles.heroTitle}>{t('ramadan.ramadanKareem')}</Text>
          <Text style={styles.heroSubtitle}>رمضان كريم</Text>
          <View style={styles.heroDivider} />
          {isInRamadan ? (
            <Text style={styles.heroPhase}>{isRtl ? 'رمضان مبارك! تقبل الله صيامك' : 'Ramadan Mubarak! May Allah accept your fast'}</Text>
          ) : (
            <>
              <Text style={styles.countdownNum}>{daysUntilRamadan}</Text>
              <Text style={styles.countdownLabel}>{t('ramadan.daysUntilRamadan')}</Text>
            </>
          )}
        </LinearGradient>

        <View style={styles.modeToggle}>
          <Text style={styles.toggleLabel}>{isRtl ? 'تفعيل وضع رمضان' : 'Enable Ramadan Mode'}</Text>
          <Switch
            value={isRamadanMode}
            onValueChange={setRamadanMode}
            trackColor={{ false: COLORS.border, true: COLORS.green }}
            thumbColor={isRamadanMode ? COLORS.gold : COLORS.textMuted}
          />
        </View>

        {isInRamadan && (
          <View style={styles.duaCard}>
            <Text style={styles.duaTitle}>{t('ramadan.dua')}</Text>
            <Text style={styles.duaArabic}>{FASTING_DUA_AR}</Text>
            <Text style={styles.duaTranslation}>{FASTING_DUA_TRANS}</Text>
          </View>
        )}

        <View style={styles.timesRow}>
          <LinearGradient colors={['#0F2D1F', '#1A3C2A']} style={styles.timeCard}>
            <Ionicons name="moon" size={20} color={COLORS.gold} />
            <Text style={styles.timeLabel}>{t('ramadan.suhoor')}</Text>
            <Text style={styles.timeValue}>{fajrTime}</Text>
            <Text style={styles.timeNote}>{t('ramadan.preDawn')}</Text>
          </LinearGradient>
          <LinearGradient colors={['#2D1B0E', '#3A2A1A']} style={styles.timeCard}>
            <Ionicons name="sunny" size={20} color={COLORS.gold} />
            <Text style={styles.timeLabel}>{t('ramadan.iftar')}</Text>
            <Text style={styles.timeValue}>{maghribTime}</Text>
            <Text style={styles.timeNote}>{t('ramadan.sunset')}</Text>
          </LinearGradient>
        </View>

        {isInRamadan && (
          <View style={styles.fastingToggle}>
            <View style={styles.fastingToggleRow}>
              <Ionicons name={fastedToday ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={fastedToday ? COLORS.success : COLORS.textMuted} />
              <Text style={styles.fastingToggleLabel}>{t('ramadan.fastingToday')}</Text>
              <Switch
                value={fastedToday}
                onValueChange={toggleFasted}
                trackColor={{ false: COLORS.border, true: COLORS.green }}
                thumbColor={fastedToday ? COLORS.gold : COLORS.textMuted}
              />
            </View>
            {fastedToday && (
              <View style={styles.fastingBadge}>
                <Ionicons name="star" size={14} color={COLORS.gold} />
                <Text style={styles.fastingBadgeText}>{isRtl ? 'أتممت صيام اليوم 🌙' : "Today's fast completed 🌙"}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isRtl ? 'إجراءات سريعة' : 'Quick Actions'}</Text>
          <View style={styles.actionsRow}>
            {quickActions.map((action, idx) => (
              <AnimatedPressable key={idx} style={styles.actionCard} onPress={action.onPress} activeOpacity={0.7}>
                <View style={styles.actionIconWrap}>
                  <Ionicons name={action.icon} size={24} color={COLORS.gold} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </AnimatedPressable>
            ))}
          </View>
        </View>

        {!isInRamadan && (
          <LinearGradient colors={GRADIENTS.brand} style={styles.prepCard}>
            <Ionicons name="bulb" size={20} color={COLORS.info} />
            <Text style={styles.prepText}>
              {isRtl
                ? `استعد لرمضان! تبقى ${daysUntilRamadan} يوم. ابدأ بقراءة القرآن و صيام الأيام البيض`
                : `Prepare for Ramadan! Only ${daysUntilRamadan} days left. Start reading Quran and fasting white days.`}
            </Text>
          </LinearGradient>
        )}

        <View style={{ height: 40 }} />
        </FadeIn>
      </ScrollView>

      {/* Dua AI Modal */}
      <Modal visible={showDuaModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('ramadan.makeDua')}</Text>
              <AnimatedPressable onPress={() => setShowDuaModal(false)} style={styles.modalClose}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </AnimatedPressable>
            </View>
            {!duaMood ? (
              <>
                <Text style={styles.modalSubtitle}>{t('ramadan.howDoYouFeel')}</Text>
                <View style={styles.moodGrid}>
                  {MOODS.map(mood => (
                    <AnimatedPressable key={mood.id} style={styles.moodChip} onPress={() => handleDuaMoodSelect(mood.id)} activeOpacity={0.7}>
                      <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                      <Text style={styles.moodLabel}>{isRtl ? mood.ar : mood.en}</Text>
                    </AnimatedPressable>
                  ))}
                </View>
              </>
            ) : duaLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={COLORS.gold} />
                <Text style={styles.modalLoadingText}>{t('ramadan.loadingDuas')}</Text>
              </View>
            ) : duaResult ? (
              <ScrollView style={styles.modalScroll}>
                {duaResult.message ? (
                  <Text style={styles.modalMessage}>{duaResult.message}</Text>
                ) : null}
                {duaResult.duas && duaResult.duas.length > 0 ? (
                  <View style={styles.aiDuaList}>
                    {duaResult.duas.map((dua, idx) => (
                      <View key={idx} style={styles.aiDuaCard}>
                        <Text style={styles.aiDuaCardTitle}>{dua.title}</Text>
                        {dua.arabic ? <Text style={styles.aiDuaArabic}>{dua.arabic}</Text> : null}
                        <Text style={styles.aiDuaTranslation}>{dua.translation}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.modalEmpty}>{isRtl ? 'لا توجد أدعية متاحة' : 'No duas available'}</Text>
                )}
                <AnimatedPressable style={styles.modalRetry} onPress={() => { setDuaMood(null); setDuaResult(null); }}>
                  <Text style={styles.modalRetryText}>{t('ramadan.tryAgain')}</Text>
                </AnimatedPressable>
                <View style={{ height: 20 }} />
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Sadaqah AI Modal */}
      <Modal visible={showSadaqahModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('ramadan.sadaqah')}</Text>
              <AnimatedPressable onPress={() => setShowSadaqahModal(false)} style={styles.modalClose}>
                <Ionicons name="close" size={22} color={COLORS.textSecondary} />
              </AnimatedPressable>
            </View>
            {!sadaqahCategory ? (
              <>
                <Text style={styles.modalSubtitle}>{t('ramadan.sadaqahDesc')}</Text>
                <View style={styles.catGrid}>
                  {SADAQAH_CATEGORIES.map(cat => (
                    <AnimatedPressable key={cat.id} style={styles.catChip} onPress={() => handleSadaqahSelect(cat.id)} activeOpacity={0.7}>
                      <Ionicons name={cat.icon as any} size={20} color={COLORS.gold} />
                      <Text style={styles.catLabel}>{isRtl ? cat.ar : cat.en}</Text>
                    </AnimatedPressable>
                  ))}
                </View>
              </>
            ) : sadaqahLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={COLORS.gold} />
                <Text style={styles.modalLoadingText}>{t('ramadan.loadingSadaqah')}</Text>
              </View>
            ) : sadaqahResult ? (
              <ScrollView style={styles.modalScroll}>
                <View style={styles.sadaqahList}>
                  {sadaqahResult.map((item, idx) => (
                    <View key={idx} style={styles.sadaqahCard}>
                      <View style={styles.sadaqahIconRow}>
                        <Ionicons name="gift" size={16} color={COLORS.gold} />
                        <Text style={styles.sadaqahTitle}>{item.title}</Text>
                      </View>
                      <Text style={styles.sadaqahDesc}>{item.description}</Text>
                      {item.reward ? (
                        <View style={styles.sadaqahTag}>
                          <Ionicons name="star" size={12} color={COLORS.gold} />
                          <Text style={styles.sadaqahTagText}>{item.reward}</Text>
                        </View>
                      ) : null}
                      {item.estimatedCost ? (
                        <Text style={styles.sadaqahCost}>{item.estimatedCost}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
                <AnimatedPressable style={styles.modalRetry} onPress={() => { setSadaqahCategory(null); setSadaqahResult(null); }}>
                  <Text style={styles.modalRetryText}>{t('ramadan.tryAgain')}</Text>
                </AnimatedPressable>
                <View style={{ height: 20 }} />
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}


