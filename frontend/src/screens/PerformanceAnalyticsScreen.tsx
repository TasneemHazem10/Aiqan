import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  StatusBar, ActivityIndicator, RefreshControl, Modal, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, SHADOWS, GRADIENTS } from '../constants/colors';
import { FONTS } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { getData, storeData, KEYS } from '../utils/storage';
import { ACHIEVEMENT_DEFS, SURAH_AYAH_COUNTS, type AchievementDef } from '../constants/achievements';
import LogoDecoration from '../components/LogoDecoration';
import { FadeIn, AnimatedPressable } from '../components/AnimatedComponents';

const CARD_GAP = 12;

interface DailyEntry {
  date: string;
  count: number;
  label: string;
}

function buildWeekDays(): DailyEntry[] {
  const days: DailyEntry[] = [];
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().split('T')[0],
      count: 0,
      label: names[d.getDay()],
    });
  }
  return days;
}

function AnimatedCounter({
  value, duration = 1200, style,
}: { value: number; duration?: number; style?: any }) {
  const [displayed, setDisplayed] = useState(0);
  const animRef = useRef<number | undefined>(undefined);
  const prevValue = useRef(0);

  useEffect(() => {
    if (value === displayed) return;
    const startTime = Date.now();
    const startVal = prevValue.current;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.floor(startVal + (value - startVal) * eased));
      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      }
    };
    prevValue.current = value;
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [value]);

  return <Text style={style}>{displayed.toLocaleString()}</Text>;
}

export default function PerformanceAnalyticsScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const { allSurahs, language, activeColors } = useApp();
  const isRtl = language === 'ar';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [memorizedCount, setMemorizedCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [weekDays, setWeekDays] = useState<DailyEntry[]>(buildWeekDays());
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [completedSurahs, setCompletedSurahs] = useState(0);
  const [readingAyahs, setReadingAyahs] = useState(0);
  const [weakAyahs, setWeakAyahs] = useState<Array<{ surah: number; ayah: number; surahName: string; lastReviewed: string }>>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [activeDaysCount, setActiveDaysCount] = useState(0);
  const [totalDhikrCount, setTotalDhikrCount] = useState(0);
  const [totalTasbihCount, setTotalTasbihCount] = useState(0);
  const [selectedAch, setSelectedAch] = useState<(AchievementDef & { unlocked: boolean }) | null>(null);

  const loadData = useCallback(async () => {
    try {
      const memCount = await getData<number>(KEYS.MEMORIZATION, 0) ?? 0;
      setMemorizedCount(memCount);

      const storedStreak = await getData<number>(KEYS.STREAK, 0) ?? 0;
      setStreakCount(storedStreak);

      const quranProgress = await getData<Record<string, { ayah: number; date: string }>>(KEYS.QURAN_PROGRESS, {}) ?? {};
      const entries = Object.entries(quranProgress);
      setReadingAyahs(entries.length);

      const lastActive = await getData<string>(KEYS.LAST_ACTIVE);
      const history = await getData<Record<string, number>>(KEYS.MEMORIZATION_HISTORY, {}) ?? {};

      const days = buildWeekDays();
      let activeDays = 0;
      days.forEach(d => {
        const dayHistory = history[d.date] || 0;
        d.count = dayHistory;
        if (dayHistory > 0) activeDays++;
      });
      if (lastActive) days[days.length - 1].count = Math.max(days[days.length - 1].count, memCount > 0 ? 1 : 0);
      setWeekDays(days);
      setActiveDaysCount(activeDays);

      let completeCount = 0;
      entries.forEach(([key, val]) => {
        const surahNum = parseInt(key.replace('s', ''), 10);
        const ayahCount = SURAH_AYAH_COUNTS[surahNum] || 0;
        if (val.ayah >= ayahCount && ayahCount > 0) completeCount++;
      });
      setCompletedSurahs(completeCount);

      const dhikrTotal = await getData<number>(KEYS.DHIKR_TOTAL, 0) ?? 0;
      setTotalDhikrCount(dhikrTotal);

      const tasbihTotal = await getData<number>(KEYS.TASBIH_TOTAL, 0) ?? 0;
      setTotalTasbihCount(tasbihTotal);

      const sessions = await getData<Array<{ score: number; ayahNumber: number; surahNumber: number; timestamp: string }>>(KEYS.MEMORIZATION_SESSIONS, []) ?? [];
      setTotalSessions(sessions.length);
      if (sessions.length > 0) {
        const totalScore = sessions.reduce((sum, s) => sum + (s.score || 0), 0);
        setAccuracy(Math.round(totalScore / sessions.length));
      } else {
        setAccuracy(null);
      }

      const weak: Array<{ surah: number; ayah: number; surahName: string; lastReviewed: string }> = [];
      const now = Date.now();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      sessions.forEach(s => {
        if (s.score !== undefined && s.score < 70) {
          const surah = allSurahs.find(su => su.number === s.surahNumber);
          weak.push({
            surah: s.surahNumber,
            ayah: s.ayahNumber,
            surahName: surah?.englishName || `Surah ${s.surahNumber}`,
            lastReviewed: s.timestamp,
          });
        }
      });
      entries.forEach(([key, val]) => {
        const surahNum = parseInt(key.replace('s', ''), 10);
        const diff = now - new Date(val.date).getTime();
        if (diff >= sevenDays) {
          const exists = weak.some(w => w.surah === surahNum && w.ayah === val.ayah);
          if (!exists) {
            const surah = allSurahs.find(su => su.number === surahNum);
            weak.push({
              surah: surahNum,
              ayah: val.ayah,
              surahName: surah?.englishName || `Surah ${surahNum}`,
              lastReviewed: val.date,
            });
          }
        }
      });
      setWeakAyahs(weak.slice(0, 10));
    } finally {
      setLoading(false);
    }
  }, [allSurahs]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const difficultyLabel = (d: string) => {
    if (isRtl) return d === 'easy' ? 'سهل' : d === 'medium' ? 'متوسط' : 'صعب';
    return d === 'easy' ? 'EASY' : d === 'medium' ? 'MEDIUM' : 'HARD';
  };

  const achievements = useMemo(() =>
    ACHIEVEMENT_DEFS.map(def => ({
      ...def,
      unlocked: def.check(memorizedCount, streakCount, completedSurahs, readingAyahs, activeDaysCount, totalDhikrCount, totalTasbihCount, totalSessions),
    })),
    [memorizedCount, streakCount, completedSurahs, readingAyahs, activeDaysCount, totalDhikrCount, totalTasbihCount, totalSessions],
  );
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  useEffect(() => {
    const unlockedIds = achievements.filter(a => a.unlocked).map(a => a.id);
    storeData(KEYS.ACHIEVEMENTS, unlockedIds);
  }, [unlockedCount]);

  const maxBarCount = Math.max(...weekDays.map(d => d.count), 1);
  const weeklyTotal = weekDays.reduce((sum, d) => sum + d.count, 0);
  const weeklyGoal = 7;
  const progressFraction = Math.min(weeklyTotal / weeklyGoal, 1);

  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
    header: { padding: 16, paddingBottom: 12 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    backIcon: { fontSize: 18, color: colors.gold },
    title: { fontSize: 18, color: colors.textPrimary, fontWeight: '700' },
    content: { padding: 16 },

    heroCard: {
      borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16,
      borderWidth: 1, borderColor: `${colors.gold}30`, ...SHADOWS.gold,
    },
    heroNumber: { fontSize: 48, color: colors.gold, fontWeight: '800' },
    heroLabel: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },

    statsRow: { flexDirection: 'row', gap: CARD_GAP, marginBottom: CARD_GAP },
    statCard: {
      flex: 1, backgroundColor: colors.card, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3,
      ...SHADOWS.soft,
    },
    statValue: { fontSize: 22, fontWeight: '700', marginTop: 4 },
    statLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2 },

    section: { marginBottom: 16 },
    sectionTitle: { fontSize: 16, color: colors.textPrimary, fontWeight: '700', marginBottom: 4 },

    chartCard: {
      backgroundColor: colors.card, borderRadius: 14, padding: 16,
      borderWidth: 1, borderColor: colors.border,
    },
    chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160 },
    barColumn: { alignItems: 'center', flex: 1 },
    barCount: { fontSize: 11, color: colors.textMuted, marginBottom: 2 },
    bar: {
      width: 20, borderRadius: 4, backgroundColor: colors.gold,
      borderTopLeftRadius: 4, borderTopRightRadius: 4,
    },
    barLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
    barLabelActive: { color: colors.gold, fontWeight: '600' },

    goalCard: {
      backgroundColor: colors.card, borderRadius: 14, padding: 16,
      borderWidth: 1, borderColor: colors.border,
    },
    goalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    goalText: { fontSize: 13, color: colors.textSecondary },
    goalPercent: { fontSize: 13, color: colors.gold, fontWeight: '700' },
    goalBar: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
    goalBarFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 3 },

    weakCard: {
      backgroundColor: colors.card, borderRadius: 14, padding: 16,
      borderWidth: 1, borderColor: colors.border,
    },
    emptyText: { color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 12 },
    weakRow: {
      flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    weakIcon: { marginRight: 8 },
    weakInfo: { flex: 1 },
    weakName: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
    weakAyah: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
    weakDate: { fontSize: 10, color: colors.textMuted },

    achieveSub: { fontSize: 11, color: colors.textMuted, marginBottom: 8 },
    achieveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    achieveCard: {
      width: (screenWidth - 48) / 3 - 4, borderRadius: 16,
      padding: 12, alignItems: 'center', borderWidth: 1,
    },
    achieveUnlocked: {
      backgroundColor: `${colors.gold}10`, borderColor: `${colors.gold}40`,
      ...SHADOWS.soft,
    },
    achieveLocked: {
      backgroundColor: colors.glassDark, borderColor: colors.border,
    },
    achieveIcon: { fontSize: 26, marginBottom: 4 },
    achieveIconLocked: { opacity: 0.3 },
    achieveLabel: { fontSize: 11, color: colors.textPrimary, fontWeight: '500', textAlign: 'center' },
    achieveLabelLocked: { color: colors.textMuted },
    achieveDiffBadge: {
      fontSize: 10, fontWeight: '700', textTransform: 'uppercase',
      letterSpacing: 0.5, marginTop: 2,
    },
    achieveDiffEasy: { color: '#44CC88' },
    achieveDiffMedium: { color: '#FFB347' },
    achieveDiffHard: { color: '#FF6B6B' },
    filterRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
    filterChip: {
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: `${colors.gold}20`, borderColor: colors.gold,
    },
    filterChipText: { fontSize: 10, color: colors.textMuted },
    filterChipTextActive: { color: colors.gold, fontWeight: '600' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
    achDetailCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 24,
      width: '82%',
      alignItems: 'center',
      gap: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    achDetailIcon: { fontSize: 48, marginBottom: 4 },
    achDetailTitle: { fontSize: 20, color: colors.textPrimary, fontFamily: FONTS.display, fontWeight: '700', textAlign: 'center' },
    achDetailDesc: { fontSize: 13, color: colors.textSecondary, fontFamily: FONTS.body, textAlign: 'center', lineHeight: 20 },
    achDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
    achDetailDiff: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 20 },
    achDetailDiffText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    achDetailStatus: { fontSize: 13, fontFamily: FONTS.bodyBold },
  }), [screenWidth]);

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
        <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={GRADIENTS.brand} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <AnimatedPressable onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backIcon}>←</Text>
            </AnimatedPressable>
            <Text style={styles.title}>
              {isRtl ? 'تحليلات الأداء' : 'Performance Analytics'}
            </Text>
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
          <AnimatedCounter
            value={memorizedCount}
            style={styles.heroNumber}
          />
          <Text style={styles.heroLabel}>
            {isRtl ? 'آية محفوظة' : 'Ayahs Memorized'}
          </Text>
        </LinearGradient>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: '#FF6B35' }]}>
            <Ionicons name="flame" size={20} color="#FF6B35" />
            <AnimatedCounter value={streakCount} style={[styles.statValue, { color: '#FF6B35' }]} />
            <Text style={styles.statLabel}>{isRtl ? 'أيام متتالية' : 'Day Streak'}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: COLORS.info }]}>
            <Ionicons name="book" size={20} color={COLORS.info} />
            <Text style={[styles.statValue, { color: COLORS.info }]}>{completedSurahs}/{allSurahs.length}</Text>
            <Text style={styles.statLabel}>{isRtl ? 'سور مكتملة' : 'Surahs Done'}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: '#44CC88' }]}>
            <Ionicons name="layers" size={20} color="#44CC88" />
            <AnimatedCounter value={totalSessions} style={[styles.statValue, { color: '#44CC88' }]} />
            <Text style={styles.statLabel}>{isRtl ? 'جلسة مراجعة' : 'Sessions'}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: COLORS.gold }]}>
            <Ionicons name="sparkles" size={20} color={COLORS.gold} />
            <AnimatedCounter value={totalDhikrCount} style={[styles.statValue, { color: COLORS.gold }]} />
            <Text style={styles.statLabel}>{isRtl ? 'إجمالي الذكر' : 'Total Dhikr'}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#9B59B6' }]}>
            <Ionicons name="repeat" size={20} color="#9B59B6" />
            <AnimatedCounter value={totalTasbihCount} style={[styles.statValue, { color: '#9B59B6' }]} />
            <Text style={styles.statLabel}>{isRtl ? 'إجمالي التسبيح' : 'Total Tasbih'}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: COLORS.gold }]}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.gold} />
            <Text style={[styles.statValue, { color: COLORS.gold }]}>
              {accuracy !== null ? `${accuracy}%` : '—'}
            </Text>
            <Text style={styles.statLabel}>{isRtl ? 'دقة الحفظ' : 'Accuracy'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isRtl ? 'الحفظ الأسبوعي' : 'Weekly Memorization'}
          </Text>
          <View style={styles.chartCard}>
            <View style={styles.chartRow}>
              {weekDays.map((day, idx) => {
                const barH = maxBarCount > 0 ? (day.count / maxBarCount) * 120 : 0;
                return (
                  <View key={idx} style={styles.barColumn}>
                    <Text style={styles.barCount}>{day.count > 0 ? day.count : ''}</Text>
                    <View style={[styles.bar, { height: Math.max(barH, day.count > 0 ? 4 : 2) }]} />
                    <Text style={[styles.barLabel, day.count > 0 && styles.barLabelActive]}>{day.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isRtl ? 'الهدف اليومي' : 'Daily Revision Goal'}
          </Text>
          <View style={styles.goalCard}>
            <View style={styles.goalRow}>
              <Text style={styles.goalText}>
                {isRtl
                  ? `${weeklyTotal} / ${weeklyGoal} يوم هذا الأسبوع`
                  : `${weeklyTotal} / ${weeklyGoal} days this week`}
              </Text>
              <Text style={styles.goalPercent}>{Math.round(progressFraction * 100)}%</Text>
            </View>
            <View style={styles.goalBar}>
              <View style={[styles.goalBarFill, { width: `${progressFraction * 100}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isRtl ? 'آيات تحتاج مراجعة' : 'Ayahs Needing Revision'}
          </Text>
          <View style={styles.weakCard}>
            {weakAyahs.length === 0 ? (
              <Text style={styles.emptyText}>
                {isRtl ? 'لا توجد آيات للمراجعة حالياً' : 'No ayahs need revision right now'}
              </Text>
            ) : (
              weakAyahs.map((item, idx) => (
                <View key={idx} style={styles.weakRow}>
                  <View style={styles.weakIcon}>
                    <Ionicons name="alert-circle" size={14} color={COLORS.warning} />
                  </View>
                  <View style={styles.weakInfo}>
                    <Text style={styles.weakName}>{item.surahName} ({item.surah})</Text>
                    <Text style={styles.weakAyah}>
                      {isRtl ? `الآية ${item.ayah}` : `Ayah ${item.ayah}`}
                    </Text>
                  </View>
                  <Text style={styles.weakDate}>
                    {new Date(item.lastReviewed).toLocaleDateString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionTitle}>
              {isRtl ? 'الإنجازات' : 'Achievements'}
            </Text>
            <Text style={styles.achieveSub}>
              {isRtl
                ? `${unlockedCount} / ${achievements.length} مكتسبة`
                : `${unlockedCount} / ${achievements.length} unlocked`}
            </Text>
          </View>
          <View style={styles.achieveGrid}>
            {achievements.map((ach) => (
              <AnimatedPressable
                key={ach.id}
                onPress={() => setSelectedAch(ach)}
                activeOpacity={0.7}
                style={[
                  styles.achieveCard,
                  ach.unlocked ? styles.achieveUnlocked : styles.achieveLocked,
                ]}
              >
                <Text style={[styles.achieveIcon, !ach.unlocked && styles.achieveIconLocked]}>
                  {ach.icon}
                </Text>
                <Text style={[styles.achieveLabel, !ach.unlocked && styles.achieveLabelLocked]}>
                  {isRtl ? ach.labelAr : ach.labelEn}
                </Text>
                <Text style={[
                  styles.achieveDiffBadge,
                  ach.difficulty === 'easy' && styles.achieveDiffEasy,
                  ach.difficulty === 'medium' && styles.achieveDiffMedium,
                  ach.difficulty === 'hard' && styles.achieveDiffHard,
                  !ach.unlocked && { opacity: 0.4 },
                ]}>
                  {difficultyLabel(ach.difficulty)}
                </Text>
              </AnimatedPressable>
            ))}
          </View>
        </View>

        <View style={{ height: 48 }} />
        </FadeIn>
      </ScrollView>

      {/* Achievement Detail Modal */}
      <Modal visible={!!selectedAch} transparent animationType="fade" onRequestClose={() => setSelectedAch(null)}>
        <AnimatedPressable style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedAch(null)}>
          <AnimatedPressable activeOpacity={1} onPress={() => {}} style={styles.achDetailCard}>
            {selectedAch && (
              <>
                <Text style={styles.achDetailIcon}>{selectedAch.icon}</Text>
                <Text style={styles.achDetailTitle}>
                  {isRtl ? selectedAch.labelAr : selectedAch.labelEn}
                </Text>
                <Text style={styles.achDetailDesc}>
                  {isRtl ? selectedAch.descAr : selectedAch.descEn}
                </Text>
                <View style={styles.achDetailRow}>
                  <View style={[
                    styles.achDetailDiff,
                    { backgroundColor: selectedAch.difficulty === 'easy' ? '#44CC8820' : selectedAch.difficulty === 'medium' ? '#FFB34720' : '#FF6B6B20' },
                  ]}>
                    <Text style={[
                      styles.achDetailDiffText,
                      { color: selectedAch.difficulty === 'easy' ? '#44CC88' : selectedAch.difficulty === 'medium' ? '#FFB347' : '#FF6B6B' },
                    ]}>
                      {difficultyLabel(selectedAch.difficulty)}
                    </Text>
                  </View>
                  <Text style={[styles.achDetailStatus, { color: selectedAch.unlocked ? '#44CC88' : activeColors.textMuted }]}>
                    {selectedAch.unlocked
                      ? (isRtl ? '✓ مكتسبة' : '✓ Unlocked')
                      : (isRtl ? '🔒 مقفلة' : '🔒 Locked')}
                  </Text>
                </View>
              </>
            )}
          </AnimatedPressable>
        </AnimatedPressable>
      </Modal>
    </View>
  );
}


