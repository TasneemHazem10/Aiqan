import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, StatusBar, Animated, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { getCached } from '../utils/api';
import { ENDPOINTS } from '../constants/api';
import { PrayerTimesResponse, NextPrayer } from '../types';
import { SHADOWS } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';
import { getData, KEYS } from '../utils/storage';
import { FadeIn, SlideUp, ScaleIn, AnimatedPressable, StaggeredView } from '../components/AnimatedComponents';
import CardSurface from '../components/CardSurface';
import AvatarCircle from '../components/AvatarCircle';
import LogoDecoration from '../components/LogoDecoration';

type IoniconName = keyof typeof Ionicons.glyphMap;


function getGreeting(lang: 'ar' | 'en'): string {
  if (lang === 'ar') {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'صباح الخير';
    if (hour >= 12 && hour < 17) return 'مساء الخير';
    if (hour >= 17 && hour < 21) return 'مساء النور';
    return 'تصبح على خير';
  }
  return 'Aslam Alykom';
}

function formatTime(timeStr: string): string {
  if (!timeStr) return '--:--';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

function getNextPrayer(timings: Record<string, string>): NextPrayer {
  const prayerNames = [
    { key: 'Fajr', name: 'Fajr', arabic: 'الفجر' },
    { key: 'Dhuhr', name: 'Dhuhr', arabic: 'الظهر' },
    { key: 'Asr', name: 'Asr', arabic: 'العصر' },
    { key: 'Maghrib', name: 'Maghrib', arabic: 'المغرب' },
    { key: 'Isha', name: 'Isha', arabic: 'العشاء' },
  ];
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  for (const prayer of prayerNames) {
    const timeStr = timings[prayer.key];
    if (!timeStr) continue;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const prayerTime = new Date(`${todayStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
    if (prayerTime > now) {
      const diffMs = prayerTime.getTime() - now.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffH = Math.floor(diffSeconds / 3600);
      const diffM = Math.floor((diffSeconds % 3600) / 60);
      return {
        name: prayer.name, arabicName: prayer.arabic, time: formatTime(timeStr),
        countdown: diffH > 0 ? `${diffH}h ${diffM}m` : `${diffM}m`,
        countdownSeconds: diffSeconds,
      };
    }
  }
  return {
    name: 'Fajr', arabicName: 'الفجر', time: formatTime(timings['Fajr'] || ''),
    countdown: 'Tomorrow', countdownSeconds: 0,
  };
}

const DAILY_INSPIRATIONS = [
  { arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', translation: 'Verily, in the remembrance of Allah do hearts find rest.', reference: 'الرعد ٢٨' },
  { arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', translation: 'Indeed, with hardship comes ease.', reference: 'الشرح ٥' },
  { arabic: 'وَاللَّهُ يُحِبُّ الصَّابِرِينَ', translation: 'And Allah loves the patient ones.', reference: 'آل عمران ١٤٦' },
  { arabic: 'وَتَوَكَّلْ عَلَى اللَّهِ ۚ وَكَفَىٰ بِاللَّهِ وَكِيلًا', translation: 'Put your trust in Allah. And Allah is sufficient as a Trustee.', reference: 'الأحزاب ٣' },
  { arabic: 'وَلَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ', translation: 'And do not despair of the mercy of Allah.', reference: 'الزمر ٥٣' },
];

const QUICK_ACTIONS: Array<{
  labelAr: string; labelEn: string; icon: IoniconName;
  gradient: [string, string]; screen: string; subScreen?: string;
}> = [
  { labelAr: 'القرآن', labelEn: 'Quran', icon: 'book', gradient: ['#2C2C2E', '#1C1C1E'] as [string, string], screen: 'Quran' },
  { labelAr: 'الصلاة', labelEn: 'Prayer', icon: 'time', gradient: ['#2C2C2E', '#1C1C1E'] as [string, string], screen: 'Prayer' },
  { labelAr: 'الأذكار', labelEn: 'Azkar', icon: 'sparkles', gradient: ['#2C2C2E', '#1C1C1E'] as [string, string], screen: 'Azkar' },
  { labelAr: 'الأدعية', labelEn: 'Duas', icon: 'hand-left', gradient: ['#2C2C2E', '#1C1C1E'] as [string, string], screen: 'Azkar', subScreen: 'DuaHome' },
  { labelAr: 'القبلة', labelEn: 'Qibla', icon: 'compass', gradient: ['#2C2C2E', '#1C1C1E'] as [string, string], screen: 'More', subScreen: 'Qibla' },
  { labelAr: 'تقدمي', labelEn: 'Progress', icon: 'bar-chart', gradient: ['#2C2C2E', '#1C1C1E'] as [string, string], screen: 'More', subScreen: 'Progress' },
  { labelAr: 'أيقان AI', labelEn: 'Aiqan AI', icon: 'chatbubble-ellipses', gradient: ['#D4AF37', '#B8860B'] as [string, string], screen: 'More', subScreen: 'AiAssistant' },
];

const PRAYERS_DISPLAY = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const PRAYER_AR: Record<string, string> = {
  Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء',
};

export default function HomeScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.offWhite },

    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm,
    },
    headerLeft: { flex: 1, gap: 2 },
    greeting: {
      fontSize: FONT_SIZES.small, color: colors.gold, fontFamily: FONTS.bodyMed,
      letterSpacing: 0.5,
    },
    userName: {
      fontSize: FONT_SIZES.hero, color: colors.darkGreen, fontFamily: FONTS.display,
      fontWeight: '700',
    },
    dateBar: {
      flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
      marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
      backgroundColor: colors.cardDark, borderRadius: RADIUS.round,
      paddingVertical: SPACING.xs, paddingHorizontal: SPACING.base,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: `${colors.gold}20`,
      ...SHADOWS.soft,
    },
    hijriDate: { fontSize: FONT_SIZES.small, color: colors.gold, fontFamily: FONTS.bodyMed },
    dateDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.border },
    gregorianDate: { fontSize: FONT_SIZES.small, color: colors.textMuted, fontFamily: FONTS.body },

    content: { paddingHorizontal: SPACING.lg },

    prayerHero: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      padding: SPACING.xl, borderRadius: RADIUS.xxl, overflow: 'hidden',
      marginTop: SPACING.md, marginBottom: SPACING.base, ...SHADOWS.gold,
    },
    prayerHeroBg: {
      ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.15)',
    },
    prayerHeroContent: { gap: 4 },
    prayerHeroLabel: {
      fontSize: FONT_SIZES.caption, color: colors.darkGreen, fontFamily: FONTS.bodyBold,
      opacity: 0.7, letterSpacing: 1.2, textTransform: 'uppercase',
    },
    prayerHeroName: {
      fontSize: FONT_SIZES.mega, color: colors.darkGreen, fontFamily: FONTS.display,
      fontWeight: '700', marginTop: 2,
    },
    countdownBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6,
      backgroundColor: 'rgba(0,0,0,0.10)', borderRadius: RADIUS.round,
      paddingHorizontal: SPACING.sm, paddingVertical: 3, alignSelf: 'flex-start',
    },
    countdownText: { fontSize: FONT_SIZES.small, color: colors.darkGreen, fontFamily: FONTS.bodyMed },
    prayerHeroTime: { alignItems: 'flex-end', gap: SPACING.xs },
    prayerHeroTimeText: {
      fontSize: FONT_SIZES.hero, color: colors.darkGreen, fontFamily: FONTS.bodyBold,
      fontWeight: '700',
    },
    viewAllChip: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.08)',
      borderRadius: RADIUS.round, paddingHorizontal: SPACING.sm, paddingVertical: 3, gap: 2,
    },
    viewAllText: { fontSize: FONT_SIZES.micro, color: colors.darkGreen, fontFamily: FONTS.bodyMed },

    statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
    statCard: {
      flex: 1, backgroundColor: colors.cardDark, borderRadius: RADIUS.xl,
      padding: SPACING.base, alignItems: 'center', gap: SPACING.xs,
      ...SHADOWS.soft,
    },
    statIconWrap: {
      width: 40, height: 40, borderRadius: RADIUS.md,
      alignItems: 'center', justifyContent: 'center',
    },
    statValue: {
      fontSize: FONT_SIZES.xl, color: colors.textPrimary, fontFamily: FONTS.bodyBold,
      fontWeight: '700',
    },
    statLabel: { fontSize: FONT_SIZES.caption, color: colors.textMuted, fontFamily: FONTS.body },

    section: { marginBottom: SPACING.xl, paddingHorizontal: SPACING.lg },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.base },
    sectionTitle: {
      fontSize: FONT_SIZES.md, color: colors.textPrimary, fontFamily: FONTS.display,
      fontWeight: '700',
    },
    sectionGoldLine: {
      flex: 1, height: 1, backgroundColor: colors.border,
    },
    moreBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    moreBtnText: { fontSize: FONT_SIZES.small, color: colors.gold, fontFamily: FONTS.bodyMed },

    inspirationCard: {
      backgroundColor: colors.cardDark, borderRadius: RADIUS.xxl, padding: SPACING.xl,
      alignItems: 'center', gap: SPACING.base, borderWidth: 1, borderColor: colors.border,
      ...SHADOWS.card,
    },
    inspirationArabic: {
      fontSize: FONT_SIZES.arabicLg, color: colors.textPrimary, textAlign: 'center',
      lineHeight: FONT_SIZES.arabicLg * 1.9, fontFamily: FONTS.arabic,
    },
    inspirationLine: { width: 40, height: 2, backgroundColor: colors.gold, borderRadius: 1 },
    inspirationTranslation: {
      fontSize: FONT_SIZES.small, color: colors.textSecondary, textAlign: 'center',
      lineHeight: FONT_SIZES.small * 1.8, fontFamily: FONTS.body, fontStyle: 'italic',
    },
    inspirationFooter: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs,
    },
    inspirationRef: { fontSize: FONT_SIZES.caption, color: colors.gold, fontFamily: FONTS.bodyMed },

    quickGrid: {
      flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm,
      justifyContent: 'center',
    },
    quickCard: {
      width: '100%',
      borderRadius: RADIUS.xxl, padding: SPACING.md,
      alignItems: 'center', justifyContent: 'center', gap: SPACING.xs,
      minHeight: 88,
      backgroundColor: colors.cardDark,
      borderWidth: 1,
      borderColor: `${colors.gold}20`,
      ...SHADOWS.card,
    },
    quickIconWrap: {
      width: 40, height: 40, borderRadius: RADIUS.sm,
      backgroundColor: `${colors.gold}15`,
      alignItems: 'center', justifyContent: 'center',
    },
    quickLabel: {
      fontSize: FONT_SIZES.caption, color: colors.textPrimary,
      fontFamily: FONTS.bodyMed, textAlign: 'center',
    },

    prayerCard: {
      backgroundColor: colors.cardDark, borderRadius: RADIUS.xxl, overflow: 'hidden',
      ...SHADOWS.card,
    },
    prayerRow: {
      flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
      paddingVertical: SPACING.base, paddingHorizontal: SPACING.base,
      borderBottomWidth: 1, borderBottomColor: colors.borderSubtle,
    },
    prayerRowActive: { backgroundColor: colors.goldMedium },
    prayerRowLast: { borderBottomWidth: 0 },
    prayerActiveDot: {
      width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold,
    },
    prayerName: {
      flex: 1, fontSize: FONT_SIZES.base, color: colors.textSecondary, fontFamily: FONTS.bodyMed,
    },
    prayerNameActive: { color: colors.textPrimary, fontFamily: FONTS.bodyBold },
    nextBadge: {
      backgroundColor: colors.gold, borderRadius: RADIUS.round,
      paddingHorizontal: SPACING.sm, paddingVertical: 2,
    },
    nextBadgeText: {
      fontSize: FONT_SIZES.micro, color: colors.white, fontFamily: FONTS.bodyBold,
    },
    prayerTime: {
      fontSize: FONT_SIZES.base, color: colors.textPrimary, fontFamily: FONTS.bodySemi,
    },
    prayerTimeActive: { color: colors.textPrimary, fontWeight: '700' },

    continueCard: {
      flexDirection: 'row', alignItems: 'center', padding: SPACING.base,
      gap: SPACING.md, borderRadius: RADIUS.xxl, backgroundColor: colors.cardDark,
      ...SHADOWS.card,
    },
    continueIconWrap: {
      width: 52, height: 52, borderRadius: RADIUS.md,
      backgroundColor: 'rgba(255,255,255,0.10)',
      alignItems: 'center', justifyContent: 'center',
    },
    continueTextWrap: { flex: 1, gap: 2 },
    continueSurah: {
      fontSize: FONT_SIZES.md, color: colors.gold, fontFamily: FONTS.bodyBold,
    },
    continueAyah: {
      fontSize: FONT_SIZES.small, color: 'rgba(250,247,242,0.70)', fontFamily: FONTS.body,
    },

  }));

  const navigation = useNavigation<any>();
  const { user, dailyStreak, allSurahs, totalDhikr, totalTasbih, language, theme, activeColors } = useApp();
  const [prayerData, setPrayerData] = useState<PrayerTimesResponse | null>(null);
  const [nextPrayer, setNextPrayer] = useState<NextPrayer | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRead, setLastRead] = useState<{ surah: number; ayah: number } | null>(null);
  const [inspiration] = useState(() => DAILY_INSPIRATIONS[new Date().getDay() % DAILY_INSPIRATIONS.length]);
  const isRtl = language === 'ar';

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.85, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const loadPrayerTimes = useCallback(async () => {
    try {
      const location = await getData<{ city: string; country: string }>(KEYS.PRAYER_LOCATION);
      const city = location?.city || 'Cairo';
      const country = location?.country || 'Egypt';
      const data = await getCached<PrayerTimesResponse>(ENDPOINTS.PRAYER_TIMES, { city, country }, 300000);
      setPrayerData(data);
      setNextPrayer(getNextPrayer(data.timings));
    } catch { /* offline */ }
  }, []);

  const loadLastRead = useCallback(async () => {
    const quranProgress = await getData<Record<string, { ayah: number; date: string }>>(KEYS.QURAN_PROGRESS, {});
    if (quranProgress && Object.keys(quranProgress).length > 0) {
      const entries = Object.entries(quranProgress).sort(
        (a, b) => new Date(b[1].date).getTime() - new Date(a[1].date).getTime()
      );
      const [key, val] = entries[0];
      setLastRead({ surah: parseInt(key.replace('s', '')), ayah: val.ayah });
    }
  }, []);

  useEffect(() => { loadPrayerTimes(); loadLastRead(); }, [loadPrayerTimes, loadLastRead]);

  useEffect(() => {
    if (!prayerData) return;
    const interval = setInterval(() => setNextPrayer(getNextPrayer(prayerData.timings)), 10000);
    return () => clearInterval(interval);
  }, [prayerData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadPrayerTimes(), loadLastRead()]);
    setRefreshing(false);
  }, [loadPrayerTimes, loadLastRead]);

  const navigateAction = (screen: string, subScreen?: string) => {
    if (subScreen) navigation.navigate(screen, { screen: subScreen });
    else navigation.navigate(screen);
  };

  return (
    <View style={styles.container}>
      <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={activeColors.offWhite} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={activeColors.gold} colors={[activeColors.gold]}
            progressBackgroundColor={activeColors.offWhite}
          />
        }
      >
        <SafeAreaView edges={['top']}>
          <LogoDecoration size={280} opacity={0.03} position="top-right" />
          <FadeIn>
            <View style={styles.header}>
              <View style={[styles.headerLeft, isRtl && { alignItems: 'flex-end' }]}>
                <Text style={styles.greeting}>{isRtl ? 'السلام عليكم' : getGreeting(language)}</Text>
                <Text style={styles.userName}>{user?.name || (isRtl ? 'الحبيب' : 'Beloved')}</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('More', { screen: 'Profile', params: { fromHome: true } })} activeOpacity={0.8}>
                <AvatarCircle name={user?.name || 'أ'} size={48} imageUri={user?.avatar} variant="ring" />
              </TouchableOpacity>
            </View>
          </FadeIn>

          {prayerData?.date?.hijri && (
            <FadeIn delay={100}>
              <View style={styles.dateBar}>
                <Ionicons name="moon" size={14} color={activeColors.gold} />
                <Text style={styles.hijriDate}>
                  {prayerData.date.hijri.day} {isRtl ? prayerData.date.hijri.month.ar : prayerData.date.hijri.month.en} {prayerData.date.hijri.year} هـ
                </Text>
                <View style={styles.dateDot} />
                <Text style={styles.gregorianDate}>{prayerData.date.gregorian.day} {prayerData.date.gregorian.month.en}</Text>
              </View>
            </FadeIn>
          )}
        </SafeAreaView>

        <View style={styles.content}>
          <StaggeredView baseDelay={150} staggerBy={100}>
            {nextPrayer && (
              <SlideUp delay={0}>
                <AnimatedPressable onPress={() => navigation.navigate('Prayer')} scaleTo={0.98}>
                  <LinearGradient colors={[activeColors.gold, activeColors.goldLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.prayerHero}
                  >
                    <View style={styles.prayerHeroBg} />
                    <View style={styles.prayerHeroContent}>
                      <Text style={styles.prayerHeroLabel}>{isRtl ? 'الصلاة القادمة' : 'Next Prayer'}</Text>
                      <Text style={styles.prayerHeroName}>{isRtl ? nextPrayer.arabicName : nextPrayer.name}</Text>
                      <Animated.View style={[styles.countdownBadge, { transform: [{ scale: pulseAnim }] }]}>
                        <Ionicons name="time-outline" size={12} color={activeColors.darkGreen} />
                        <Text style={styles.countdownText}>{nextPrayer.countdown}</Text>
                      </Animated.View>
                    </View>
                    <View style={styles.prayerHeroTime}>
                      <Text style={styles.prayerHeroTimeText}>{nextPrayer.time}</Text>
                      <View style={styles.viewAllChip}>
                        <Text style={styles.viewAllText}>{isRtl ? 'جميع الأوقات' : 'All Times'}</Text>
                        <Ionicons name={isRtl ? 'chevron-back' : 'chevron-forward'} size={12} color={activeColors.darkGreen} />
                      </View>
                    </View>
                  </LinearGradient>
                </AnimatedPressable>
              </SlideUp>
            )}

            <SlideUp delay={0}>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View style={[styles.statIconWrap, { backgroundColor: `${activeColors.greenDeep}12` }]}>
                    <Ionicons name="flame" size={20} color={activeColors.greenDeep} />
                  </View>
                  <Text style={styles.statValue}>{String(dailyStreak)}</Text>
                  <Text style={styles.statLabel}>{isRtl ? 'سلسلة' : 'Streak'}</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={[styles.statIconWrap, { backgroundColor: `${activeColors.gold}12` }]}>
                    <Ionicons name="sparkles" size={20} color={activeColors.gold} />
                  </View>
                  <Text style={styles.statValue}>{totalDhikr > 999 ? `${(totalDhikr / 1000).toFixed(1)}k` : String(totalDhikr)}</Text>
                  <Text style={styles.statLabel}>{isRtl ? 'الذكر' : 'Dhikr'}</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={[styles.statIconWrap, { backgroundColor: `${activeColors.teal}12` }]}>
                    <Ionicons name="repeat" size={20} color={activeColors.teal} />
                  </View>
                  <Text style={styles.statValue}>{totalTasbih > 999 ? `${(totalTasbih / 1000).toFixed(1)}k` : String(totalTasbih)}</Text>
                  <Text style={styles.statLabel}>{isRtl ? 'التسبيح' : 'Tasbih'}</Text>
                </View>
                <View style={styles.statCard}>
                  <View style={[styles.statIconWrap, { backgroundColor: `${activeColors.greenForest}12` }]}>
                    <Ionicons name="book" size={20} color={activeColors.greenForest} />
                  </View>
                  <Text style={styles.statValue}>{allSurahs.length > 0 ? '114' : '...'}</Text>
                  <Text style={styles.statLabel}>{isRtl ? 'سورة' : 'Surahs'}</Text>
                </View>
              </View>
            </SlideUp>

            <SlideUp delay={0}>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{isRtl ? 'آية اليوم' : "Today's Verse"}</Text>
                  <View style={styles.sectionGoldLine} />
                </View>
                <CardSurface variant="logo" radius={RADIUS.xxl} shadow="card">
                  <Text style={styles.inspirationArabic}>{inspiration.arabic}</Text>
                  <View style={styles.inspirationLine} />
                  <Text style={styles.inspirationTranslation}>{inspiration.translation}</Text>
                  <View style={styles.inspirationFooter}>
                    <Ionicons name="book-outline" size={12} color={activeColors.gold} />
                    <Text style={styles.inspirationRef}>{inspiration.reference}</Text>
                  </View>
                </CardSurface>
              </View>
            </SlideUp>

            <SlideUp delay={0}>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{isRtl ? 'الوصول السريع' : 'Quick Access'}</Text>
                  <View style={styles.sectionGoldLine} />
                </View>
                <View style={styles.quickGrid}>
                  {QUICK_ACTIONS.map((action, idx) => (
                    <ScaleIn key={action.labelEn} delay={idx * 60} style={{ width: (screenWidth - SPACING.lg * 2 - SPACING.sm * 2) / 3 }}>
                      <AnimatedPressable onPress={() => navigateAction(action.screen, action.subScreen)} scaleTo={0.95}>
                        <View style={styles.quickCard}>
                          <View style={styles.quickIconWrap}>
                            <Ionicons name={action.icon} size={22} color={activeColors.gold} />
                          </View>
                          <Text style={styles.quickLabel}>{isRtl ? action.labelAr : action.labelEn}</Text>
                        </View>
                      </AnimatedPressable>
                    </ScaleIn>
                  ))}
                </View>
              </View>
            </SlideUp>

            {prayerData && (
              <SlideUp delay={0}>
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{isRtl ? 'أوقات الصلاة' : 'Prayer Times'}</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Prayer')} style={styles.moreBtn}>
                      <Text style={styles.moreBtnText}>{isRtl ? 'المزيد' : 'More'}</Text>
                      <Ionicons name="chevron-forward" size={12} color={activeColors.gold} />
                    </TouchableOpacity>
                  </View>
                  <CardSurface variant="default" radius={RADIUS.xxl} padding={0} shadow="card">
                    {PRAYERS_DISPLAY.map((name, idx) => {
                      const isNext = nextPrayer?.name === name;
                      return (
                        <View key={name} style={[styles.prayerRow, isNext && styles.prayerRowActive, idx === PRAYERS_DISPLAY.length - 1 && styles.prayerRowLast]}>
                          {isNext && <View style={styles.prayerActiveDot} />}
                          <Text style={[styles.prayerName, isNext && styles.prayerNameActive]}>
                            {isRtl ? PRAYER_AR[name] : name}
                          </Text>
                          {isNext && (
                            <View style={styles.nextBadge}>
                              <Text style={styles.nextBadgeText}>{isRtl ? 'التالي' : 'Next'}</Text>
                            </View>
                          )}
                          <Text style={[styles.prayerTime, isNext && styles.prayerTimeActive]}>
                            {formatTime(prayerData.timings[name as keyof typeof prayerData.timings] || '')}
                          </Text>
                        </View>
                      );
                    })}
                  </CardSurface>
                </View>
              </SlideUp>
            )}

            {lastRead && allSurahs.length > 0 && (
              <SlideUp delay={0}>
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{isRtl ? 'تابع القراءة' : 'Continue Reading'}</Text>
                    <View style={styles.sectionGoldLine} />
                  </View>
                  <AnimatedPressable onPress={() => navigation.navigate('Quran', { screen: 'SurahReader', params: { surahNumber: lastRead.surah, surahName: allSurahs.find(s => s.number === lastRead.surah)?.englishName || '', startAyah: lastRead.ayah } })} scaleTo={0.98}>
                    <View style={styles.continueCard}>
                      <View style={styles.continueIconWrap}>
                        <Ionicons name="book" size={26} color={activeColors.gold} />
                      </View>
                      <View style={styles.continueTextWrap}>
                        <Text style={styles.continueSurah}>
                          {allSurahs.find(s => s.number === lastRead.surah)?.name || allSurahs.find(s => s.number === lastRead.surah)?.englishName}
                        </Text>
                        <Text style={styles.continueAyah}>{isRtl ? `الآية ${lastRead.ayah}` : `Ayah ${lastRead.ayah}`}</Text>
                      </View>
                      <Ionicons name={isRtl ? 'chevron-back' : 'chevron-forward'} size={20} color={activeColors.gold} />
                    </View>
                  </AnimatedPressable>
                </View>
              </SlideUp>
            )}
          </StaggeredView>

          <View style={{ height: 100 }} />
        </View>
        <LogoDecoration size={200} opacity={0.02} position="bottom-left" />
      </ScrollView>
    </View>
  );
}
