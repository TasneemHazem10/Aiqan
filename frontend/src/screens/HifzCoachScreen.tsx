import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { get, post } from '../utils/api';
import { ENDPOINTS } from '../constants/api';
import { COLORS, SHADOWS, GRADIENTS } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { FadeIn, AnimatedPressable } from '../components/AnimatedComponents';
import LogoDecoration from '../components/LogoDecoration';

interface WeakAyah {
  surahNumber: number;
  ayahNumber: number;
  strength: number;
  lastReviewed: string;
  reviewCount: number;
}

interface DailyTask {
  surahNumber: number;
  ayahRange: string;
  reps: number;
  completed: boolean;
}

interface DailyPlan {
  date: string;
  tasks: DailyTask[];
}

interface HifzStats {
  totalAyahsMemorized: number;
  weakAyahsCount: number;
  totalWeakAyahs: number;
  averageStrength: number;
  streak: number;
  currentLevel: string;
  weeklyGoal: number;
}

const LEVEL_LABELS: Record<string, { en: string; ar: string }> = {
  beginner: { en: 'Beginner', ar: 'مبتدئ' },
  intermediate: { en: 'Intermediate', ar: 'متوسط' },
  hafiz: { en: 'Hafiz', ar: 'حافظ' },
};

export default function HifzCoachScreen() {
  const navigation = useNavigation<any>();
  const { t, language, allSurahs } = useApp();
  const isRtl = language === 'ar';

  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { padding: 16, paddingBottom: 12 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    backIcon: { fontSize: 18, color: colors.gold },
    title: { fontSize: 18, color: colors.textPrimary, fontWeight: '700' },
    refreshBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    content: { padding: 16 },
    sectionTitle: { fontSize: 16, color: colors.textPrimary, fontWeight: '700', marginBottom: 12, marginTop: 8 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    statCard: {
      width: '47%', backgroundColor: colors.card, borderRadius: 14, padding: 16,
      borderWidth: 1, borderColor: colors.border, ...SHADOWS.soft,
      alignItems: 'center',
    },
    statValue: { fontSize: 26, color: colors.gold, fontWeight: '700' },
    statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
    generateBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.gold, borderRadius: 14, paddingVertical: 14,
      marginBottom: 16, ...SHADOWS.card,
    },
    generateBtnDisabled: { opacity: 0.6 },
    generateBtnText: { color: colors.green, fontSize: 15, fontWeight: '700' },
    planCard: { backgroundColor: colors.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.border, ...SHADOWS.soft, marginBottom: 16 },
    taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
    checkbox: { width: 28, alignItems: 'center' },
    taskInfo: { flex: 1 },
    taskTitle: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
    taskDetail: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    taskDone: { opacity: 0.5, textDecorationLine: 'line-through' },
    reviewBtn: { backgroundColor: COLORS.goldPale, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
    reviewBtnText: { fontSize: 12, color: colors.gold, fontWeight: '600' },
    emptyCard: { backgroundColor: colors.card, borderRadius: 14, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 16, gap: 8 },
    emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
    weakRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: colors.card, borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: colors.border },
    strengthBar: { width: 60, height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
    strengthFill: { height: 6, borderRadius: 3 },
    weakText: { flex: 1, fontSize: 13, color: colors.textPrimary, fontWeight: '500' },
    weakStrength: { fontSize: 12, color: colors.textMuted, fontWeight: '600', minWidth: 36, textAlign: 'right' },
    moreText: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 12 },
    reviewNowBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.gold, borderRadius: 14, paddingVertical: 14,
      marginTop: 8, ...SHADOWS.card,
    },
    reviewNowText: { color: colors.green, fontSize: 15, fontWeight: '700' },
  }));

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState<HifzStats | null>(null);
  const [weakAyahs, setWeakAyahs] = useState<WeakAyah[]>([]);
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayPlan = dailyPlans.find(d => d.date === todayStr);

  const surahName = (num: number) => {
    const s = allSurahs.find((s: any) => s.number === num);
    return s ? (isRtl ? s.name : s.englishName) : `Surah ${num}`;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, weakData, planData] = await Promise.all([
        get<HifzStats>(ENDPOINTS.HIFZ_STATS),
        get<{ weakAyahs: WeakAyah[] }>(ENDPOINTS.HIFZ_WEAK_AYAHS),
        get<{ dailyPlans: DailyPlan[] }>(ENDPOINTS.HIFZ_PLAN).catch(() => ({ dailyPlans: [] })),
      ]);
      setStats(statsData);
      setWeakAyahs(weakData.weakAyahs);
      setDailyPlans(planData.dailyPlans || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const data = await post<{ dailyPlans: DailyPlan[] }>(ENDPOINTS.HIFZ_PLAN_GENERATE);
      setDailyPlans(data.dailyPlans);
      Alert.alert(
        isRtl ? 'تم إنشاء الخطة' : 'Plan Generated',
        isRtl ? 'تم إنشاء خطة المراجعة للأيام القادمة' : 'Your revision plan has been created for the coming days'
      );
    } catch {
      Alert.alert(isRtl ? 'خطأ' : 'Error', isRtl ? 'فشل إنشاء الخطة' : 'Failed to generate plan');
    } finally {
      setGenerating(false);
    }
  };

  const completeTask = async (taskIndex: number) => {
    try {
      const data = await post<{ dailyPlans: DailyPlan[] }>(ENDPOINTS.HIFZ_TASK_COMPLETE, { taskIndex, date: todayStr });
      setDailyPlans(data.dailyPlans);
    } catch {
      Alert.alert(isRtl ? 'خطأ' : 'Error', isRtl ? 'فشل تحديث المهمة' : 'Failed to update task');
    }
  };

  const levelLabel = stats ? (isRtl ? LEVEL_LABELS[stats.currentLevel]?.ar : LEVEL_LABELS[stats.currentLevel]?.en) : '';

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={GRADIENTS.brand} style={styles.header}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <AnimatedPressable onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Text style={styles.backIcon}>←</Text>
              </AnimatedPressable>
              <Text style={styles.title}>{isRtl ? 'مدرب الحفظ الذكي' : 'AI Hifz Coach'}</Text>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 60 }} />
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
            <Text style={styles.title}>{isRtl ? 'مدرب الحفظ الذكي' : 'AI Hifz Coach'}</Text>
            <AnimatedPressable onPress={fetchData} style={styles.refreshBtn}>
              <Ionicons name="refresh" size={18} color={COLORS.gold} />
            </AnimatedPressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Dashboard */}
        <Text style={styles.sectionTitle}>{isRtl ? 'لوحة الإحصائيات' : 'Dashboard'}</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{levelLabel}</Text>
            <Text style={styles.statLabel}>{isRtl ? 'المستوى' : 'Level'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.totalAyahsMemorized || 0}</Text>
            <Text style={styles.statLabel}>{isRtl ? 'الآيات المحفوظة' : 'Ayahs Memorized'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.totalWeakAyahs || 0}</Text>
            <Text style={styles.statLabel}>{isRtl ? 'الآيات الضعيفة' : 'Weak Ayahs'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.streak || 0}</Text>
            <Text style={styles.statLabel}>{isRtl ? 'أيام الاستمرار' : 'Streak'}</Text>
          </View>
        </View>

        {/* Generate Plan */}
        <AnimatedPressable
          style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
          onPress={generatePlan}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator color={COLORS.green} />
          ) : (
            <>
              <Ionicons name="calendar" size={20} color={COLORS.green} />
              <Text style={styles.generateBtnText}>
                {isRtl ? 'إنشاء خطة مراجعة' : 'Generate Revision Plan'}
              </Text>
            </>
          )}
        </AnimatedPressable>

        {/* Today's Plan */}
        <Text style={styles.sectionTitle}>{isRtl ? 'خطة اليوم' : "Today's Plan"}</Text>
        {todayPlan && todayPlan.tasks.length > 0 ? (
          <View style={styles.planCard}>
            {todayPlan.tasks.map((task, idx) => (
              <View key={idx} style={styles.taskRow}>
                <AnimatedPressable
                  style={styles.checkbox}
                  onPress={() => completeTask(idx)}
                >
                  <Ionicons
                    name={task.completed ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={task.completed ? COLORS.success : COLORS.textMuted}
                  />
                </AnimatedPressable>
                <View style={styles.taskInfo}>
                  <Text style={[styles.taskTitle, task.completed && styles.taskDone]}>
                    {surahName(task.surahNumber)}
                  </Text>
                  <Text style={[styles.taskDetail, task.completed && styles.taskDone]}>
                    {isRtl ? 'آية' : 'Ayah'} {task.ayahRange} · {task.reps}x
                  </Text>
                </View>
                <AnimatedPressable
                  style={styles.reviewBtn}
                  onPress={() => {
                    const first = parseInt(task.ayahRange.split('-')[0]);
                    navigation.navigate('SurahReader', { surahNumber: task.surahNumber, surahName: surahName(task.surahNumber) });
                  }}
                >
                  <Text style={styles.reviewBtnText}>{isRtl ? 'مراجعة' : 'Review'}</Text>
                </AnimatedPressable>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={32} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {isRtl ? 'لا توجد مهام لليوم. اضغط على "إنشاء خطة مراجعة" أعلاه.' : 'No tasks for today. Tap "Generate Revision Plan" above.'}
            </Text>
          </View>
        )}

        {/* Weak Ayahs */}
        <Text style={styles.sectionTitle}>{isRtl ? 'الآيات الضعيفة' : 'Weak Ayahs'}</Text>
        {weakAyahs.length > 0 ? (
          <>
            {weakAyahs.slice(0, 10).map((w, idx) => (
              <View key={idx} style={styles.weakRow}>
                <View style={styles.strengthBar}>
                  <View style={[styles.strengthFill, { width: `${w.strength}%`, backgroundColor: w.strength < 30 ? COLORS.error : w.strength < 60 ? COLORS.warning : COLORS.success }]} />
                </View>
                <Text style={styles.weakText}>
                  {surahName(w.surahNumber)} · {isRtl ? 'آية' : 'Ayah'} {w.ayahNumber}
                </Text>
                <Text style={styles.weakStrength}>{w.strength}%</Text>
              </View>
            ))}
            {weakAyahs.length > 10 && (
              <Text style={styles.moreText}>
                {isRtl ? `و ${weakAyahs.length - 10} أخرى...` : `And ${weakAyahs.length - 10} more...`}
              </Text>
            )}
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
            <Text style={styles.emptyText}>
              {isRtl ? 'لا توجد آيات ضعيفة! أحسنت الحفظ.' : 'No weak ayahs! Great memorization.'}
            </Text>
          </View>
        )}

        {/* Review Now */}
        {weakAyahs.length > 0 && (
          <AnimatedPressable
            style={styles.reviewNowBtn}
            onPress={() => {
              const weakest = weakAyahs[0];
              navigation.navigate('SurahReader', {
                surahNumber: weakest.surahNumber,
                surahName: surahName(weakest.surahNumber),
              });
            }}
          >
            <Ionicons name="play" size={20} color={COLORS.green} />
            <Text style={styles.reviewNowText}>{isRtl ? 'بدء المراجعة' : 'Review Now'}</Text>
          </AnimatedPressable>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}


