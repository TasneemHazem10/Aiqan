import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView,
  StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { COLORS, SHADOWS, GRADIENTS } from '../constants/colors';
import { get } from '../utils/api';
import { ENDPOINTS } from '../constants/api';
import { getData, KEYS } from '../utils/storage';
import { ProgressStats } from '../types';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { FadeIn, SlideUp, AnimatedPressable } from '../components/AnimatedComponents';

export default function ProgressScreen() {
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
    header: { padding: 16, paddingBottom: 12 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 18, color: colors.textPrimary, fontWeight: '700' },
    content: { padding: 16 },
    statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
    statCard: { width: '30%', backgroundColor: colors.card, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border, ...SHADOWS.soft },
    statValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },
    statLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 15, color: colors.textPrimary, fontWeight: '700', marginBottom: 10 },
    weekCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
    weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
    weekDay: { alignItems: 'center', gap: 4 },
    weekDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    weekDotActive: { backgroundColor: colors.success, borderColor: colors.success },
    weekLabel: { fontSize: 11, color: colors.textMuted },
    weekProgress: { fontSize: 12, color: colors.textSecondary, marginTop: 12, textAlign: 'center' },
    weekBar: { height: 4, backgroundColor: colors.border, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
    weekBarFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 2 },
    goalCard: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    goalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    goalIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    goalTitle: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
    goalCount: { fontSize: 14, fontWeight: '700' },
    goalBar: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
    goalBarFill: { height: '100%', borderRadius: 3 },
    goalPct: { fontSize: 10, fontWeight: '600', marginTop: 4, textAlign: 'right' },
    progressCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
    progressLabel: { fontSize: 13, color: colors.textSecondary },
    progressValue: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  }));

  const navigation = useNavigation<any>();
  const { dailyStreak, totalDhikr, t, language } = useApp();
  const isRtl = language === 'ar';

  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await get<ProgressStats>(ENDPOINTS.PROGRESS_STATS);
      setStats(data);
    } catch {
      const [mem, progress, lastActiveDate] = await Promise.all([
        getData<number>(KEYS.MEMORIZATION, 0),
        getData<Record<string, { ayah: number; date: string }>>(KEYS.QURAN_PROGRESS, {}),
        getData<string>(KEYS.LAST_ACTIVE),
      ]);
      const surahsCount = progress ? Object.keys(progress).length : 0;
      const activeDates = new Set<string>();
      if (lastActiveDate) activeDates.add(lastActiveDate);
      Object.values(progress || {}).forEach((entry: any) => {
        if (entry?.date) activeDates.add(entry.date.split('T')[0]);
      });
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekActivity = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        return { label: dayNames[d.getDay()], completed: activeDates.has(dateStr), date: dateStr };
      });
      setStats({
        dailyStreak,
        totalDhikrCount: totalDhikr,
        lastActiveDate: lastActiveDate || null,
        quran: { surahsRead: surahsCount, totalAyahsRead: 0 },
        memorization: { surahsMemorized: 0, totalAyahsMemorized: mem ?? 0 },
        fasting: { totalFasted: 0, ramadanFasted: 0, sunnahFasted: 0, currentStreak: 0 },
        weeklyGoals: {
          quran: { target: 7, completed: surahsCount, unit: 'quran.ayahs' },
          fasting: { target: 3, completed: 0, unit: 'progress.days' },
          azkar: { target: 100, completed: totalDhikr, unit: 'progress.count' },
          prayer: { target: 35, completed: 0, unit: 'progress.prayers' },
        },
        weekActivity,
      });
    }
  }, [dailyStreak, totalDhikr]);

  useEffect(() => {
    setLoading(true);
    loadStats().finally(() => setLoading(false));
  }, [loadStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  const statCards = stats ? [
    { icon: 'flame', value: stats.dailyStreak.toString(), label: t('home.dailyStreak'), color: '#FF6B35' },
    { icon: 'book', value: stats.quran.totalAyahsRead.toString(), label: t('progress.ayahsRead'), color: COLORS.gold },
    { icon: 'checkmark-circle', value: stats.fasting.totalFasted.toString(), label: t('progress.fastedDays'), color: '#1B6B43' },
    { icon: 'sparkles', value: stats.memorization.totalAyahsMemorized.toString(), label: t('progress.ayahsMemorized'), color: '#9B59B6' },
  ] : [];

  const goalIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    quran: 'book',
    fasting: 'moon',
    azkar: 'chatbubbles',
    prayer: 'time',
  };

  const goalColors: Record<string, string> = {
    quran: COLORS.gold,
    fasting: '#1B6B43',
    azkar: '#129990',
    prayer: '#D4A017',
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  const activeDays = stats?.weekActivity.filter(d => d.completed).length || 0;
  const totalDays = stats?.weekActivity.length || 7;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={GRADIENTS.brand} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <AnimatedPressable onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name={isRtl ? 'chevron-forward' : 'chevron-back'} size={20} color={COLORS.gold} />
            </AnimatedPressable>
            <Text style={styles.title}>{t('progress.title')}</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <FadeIn><ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <SlideUp><View style={styles.statsRow}>
          {statCards.map((card, idx) => (
            <View key={idx} style={[styles.statCard, { borderTopColor: card.color, borderTopWidth: 2 }]}>
              <Ionicons name={card.icon as any} size={20} color={card.color} />
              <Text style={[styles.statValue, { color: card.color }]}>{card.value}</Text>
              <Text style={styles.statLabel}>{card.label}</Text>
            </View>
          ))}
        </View></SlideUp>

        {/* Weekly Activity */}
        <SlideUp delay={80}><View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('progress.weeklyGoal')}</Text>
          <View style={styles.weekCard}>
            <View style={styles.weekRow}>
              {stats?.weekActivity.map((day, idx) => (
                <View key={idx} style={styles.weekDay}>
                  <View style={[styles.weekDot, day.completed && styles.weekDotActive]}>
                    {day.completed && <Ionicons name="checkmark" size={14} color={COLORS.textPrimary} />}
                  </View>
                  <Text style={styles.weekLabel}>{day.label}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.weekProgress}>
              {activeDays}/{totalDays} {t('progress.daysActive')}
            </Text>
            <View style={styles.weekBar}>
              <View style={[styles.weekBarFill, { width: `${Math.min(100, (activeDays / Math.max(1, totalDays)) * 100)}%` }]} />
            </View>
          </View>
        </View></SlideUp>

        {/* Weekly Goals */}
        {stats?.weeklyGoals && (
          <SlideUp delay={160}><View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('progress.goals')}</Text>
            {Object.entries(stats.weeklyGoals).map(([key, goal]) => {
              const pct = goal.target > 0 ? Math.min(100, Math.round((goal.completed / goal.target) * 100)) : 0;
              return (
                <View key={key} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalTitleRow}>
                      <View style={[styles.goalIconWrap, { backgroundColor: goalColors[key] + '20' }]}>
                        <Ionicons name={goalIcons[key] as any} size={16} color={goalColors[key]} />
                      </View>
                      <Text style={styles.goalTitle}>{t(`progress.weekly${key.charAt(0).toUpperCase() + key.slice(1)}`)}</Text>
                    </View>
                    <Text style={[styles.goalCount, { color: pct >= 100 ? COLORS.success : colors.textPrimary }]}>
                      {goal.completed}/{goal.target}
                    </Text>
                  </View>
                  <View style={styles.goalBar}>
                    <View style={[styles.goalBarFill, { width: `${pct}%`, backgroundColor: goalColors[key] }]} />
                  </View>
                  <Text style={[styles.goalPct, { color: goalColors[key] }]}>{pct}%</Text>
                </View>
              );
            })}
          </View></SlideUp>
        )}

        {/* Quran Progress */}
        {stats?.quran && (
          <SlideUp delay={200}><View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('progress.quranProgress')}</Text>
            <View style={styles.progressCard}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>{t('progress.surahsRead')}</Text>
                <Text style={styles.progressValue}>{stats.quran.surahsRead}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>{t('progress.ayahsRead')}</Text>
                <Text style={styles.progressValue}>{stats.quran.totalAyahsRead}</Text>
              </View>
            </View>
          </View></SlideUp>
        )}

        {/* Fasting Progress */}
        {stats?.fasting && (
          <SlideUp delay={240}><View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('progress.fastingProgress')}</Text>
            <View style={styles.progressCard}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>{t('progress.fastedDays')}</Text>
                <Text style={styles.progressValue}>{stats.fasting.totalFasted}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>{t('progress.ramadanFasted')}</Text>
                <Text style={styles.progressValue}>{stats.fasting.ramadanFasted}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>{t('progress.sunnahFasted')}</Text>
                <Text style={styles.progressValue}>{stats.fasting.sunnahFasted}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>{t('fasting.currentStreak')}</Text>
                <Text style={styles.progressValue}>{stats.fasting.currentStreak}</Text>
              </View>
            </View>
          </View></SlideUp>
        )}

        {/* Memorization Progress */}
        {stats?.memorization && (
          <SlideUp delay={280}><View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('progress.memorizationProgress')}</Text>
            <View style={styles.progressCard}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>{t('progress.ayahsMemorized')}</Text>
                <Text style={styles.progressValue}>{stats.memorization.totalAyahsMemorized}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>{t('memorization.title')}</Text>
                <Text style={styles.progressValue}>{stats.memorization.surahsMemorized} {t('quran.surah')}</Text>
              </View>
            </View>
          </View></SlideUp>
        )}

        {/* Azkar Progress */}
        <SlideUp delay={320}><View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('progress.azkarProgress')}</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>{t('progress.totalDhikr')}</Text>
              <Text style={styles.progressValue}>{(stats?.totalDhikrCount || totalDhikr || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>{t('home.dailyStreak')}</Text>
              <Text style={styles.progressValue}>{stats?.dailyStreak || dailyStreak || 0}</Text>
            </View>
          </View>
        </View></SlideUp>

        <View style={{ height: 40 }} />
      </ScrollView></FadeIn>
    </View>
  );
}
