import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView,
  StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { storeData, getData, KEYS } from '../utils/storage';
import { Surah, SurahWithAyahs } from '../types';
import { COLORS, SHADOWS, GRADIENTS } from '../constants/colors';
import { FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { getOfflineSurah } from '../services/offlineQuran';
import { FadeIn, AnimatedPressable } from '../components/AnimatedComponents';
import LogoDecoration from '../components/LogoDecoration';

type SessionPhase = 'setup' | 'active' | 'summary';
type MemorizationTarget = 'new' | 'revision' | 'mixed';

const TIMER_OPTIONS = [
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
];

const TARGET_OPTIONS: { value: MemorizationTarget; labelAr: string; labelEn: string }[] = [
  { value: 'new', labelAr: 'آيات جديدة', labelEn: 'New Ayahs' },
  { value: 'revision', labelAr: 'مراجعة', labelEn: 'Revision' },
  { value: 'mixed', labelAr: 'مختلط', labelEn: 'Mixed' },
];

interface SessionResult {
  surahNumber: number;
  surahName: string;
  duration: number;
  target: MemorizationTarget;
  ayahsMemorized: number;
  ayahsTarget: number;
  accuracy: number;
  date: string;
}

export default function TimedMemorizationScreen() {
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { padding: 16, paddingBottom: 12 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: {
      width: 38, height: 38, borderRadius: RADIUS.round,
      backgroundColor: COLORS.glassDark, alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: 18, color: colors.textPrimary, fontWeight: '700' },
    content: { padding: 16 },
    sectionTitle: {
      fontSize: 16, color: colors.textPrimary, fontWeight: '700', marginBottom: 12, marginTop: 8,
    },
    surahGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
    surahChip: {
      backgroundColor: colors.card, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
      borderWidth: 1, borderColor: colors.border,
    },
    surahChipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
    surahChipText: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
    optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    optionChip: {
      backgroundColor: colors.card, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10,
      borderWidth: 1, borderColor: colors.border,
    },
    optionChipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
    optionChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
    optionChipTextActive: { color: colors.green },
    startBtn: {
      backgroundColor: colors.gold, borderRadius: 14, paddingVertical: 14,
      alignItems: 'center', ...SHADOWS.card,
    },
    startBtnText: { color: colors.green, fontSize: 15, fontWeight: '700' },

    activeContainer: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center' },
    timerSection: { alignItems: 'center', marginBottom: 32 },
    timerText: { fontSize: 56, color: colors.gold, fontFamily: FONTS.display, fontWeight: '700' },
    timerWarning: { color: colors.warning },
    timerDanger: { color: colors.error },
    progressBarBg: {
      width: '80%', height: 6, backgroundColor: colors.border,
      borderRadius: 3, marginTop: 12, overflow: 'hidden',
    },
    progressBarFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 3 },
    progressLabel: { fontSize: 14, color: colors.textSecondary, marginTop: 8 },

    ayahCard: {
      backgroundColor: colors.card, borderRadius: 16, padding: 24,
      borderWidth: 1, borderColor: colors.border, width: '100%',
      alignItems: 'center', marginBottom: 24,
    },
    surahLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 12 },
    ayahPlaceholder: {
      fontSize: 22, color: colors.textPrimary, textAlign: 'center',
      lineHeight: 40, fontFamily: 'serif',
    },

    actionRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    memorizedBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.success, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20,
    },
    memorizedBtnText: { color: colors.white, fontSize: 14, fontWeight: '700' },
    moreTimeBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.card, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20,
      borderWidth: 1, borderColor: colors.gold,
    },
    moreTimeBtnText: { color: colors.gold, fontSize: 14, fontWeight: '700' },
    accuracyText: { fontSize: 13, color: colors.textMuted, marginTop: 8 },

    summaryContainer: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
    summaryIconWrap: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: COLORS.glassGold, alignItems: 'center', justifyContent: 'center',
      marginBottom: 16,
    },
    summaryTitle: { fontSize: 24, color: colors.textPrimary, fontWeight: '700', marginBottom: 24 },
    summaryCard: {
      width: '100%', backgroundColor: colors.card,
      borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border,
      marginBottom: 24,
    },
    summaryActions: { width: '100%', gap: 12 },
    saveBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.gold, borderRadius: 14, paddingVertical: 14,
    },
    saveBtnText: { color: colors.green, fontSize: 15, fontWeight: '700' },
    newSessionBtn: {
      borderRadius: 14, paddingVertical: 14, alignItems: 'center',
      borderWidth: 1, borderColor: colors.gold,
    },
    newSessionBtnText: { color: colors.gold, fontSize: 15, fontWeight: '700' },
  }));

  const navigation = useNavigation<any>();
  const { allSurahs, language } = useApp();
  const [phase, setPhase] = useState<SessionPhase>('setup');
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [selectedDuration, setSelectedDuration] = useState(10);
  const [selectedTarget, setSelectedTarget] = useState<MemorizationTarget>('new');
  const [timeLeft, setTimeLeft] = useState(600);
  const [ayahsMemorized, setAyahsMemorized] = useState(0);
  const [ayahsTarget, setAyahsTarget] = useState(5);
  const [attempts, setAttempts] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [surahData, setSurahData] = useState<SurahWithAyahs | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRtl = language === 'ar';

  const currentSurah = allSurahs.find((s: Surah) => s.number === selectedSurah);

  useEffect(() => {
    const data = getOfflineSurah(selectedSurah);
    setSurahData(data);
  }, [selectedSurah]);

  const startSession = () => {
    const totalSeconds = selectedDuration * 60;
    setTimeLeft(totalSeconds);
    setAyahsMemorized(0);
    setAttempts(0);
    setAccuracy(100);
    setCurrentAyahIndex(0);
    setAyahsTarget(surahData ? surahData.ayahs.length : 5);
    setPhase('active');
  };

  useEffect(() => {
    if (phase !== 'active') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPhase('summary');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const handleMemorized = () => {
    setAyahsMemorized(prev => prev + 1);
    setCurrentAyahIndex(prev => prev + 1);
  };

  const handleNeedMoreTime = () => {
    setAttempts(prev => prev + 1);
    setAccuracy(prev => Math.max(50, prev - 5));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const saveSession = async () => {
    const result: SessionResult = {
      surahNumber: selectedSurah,
      surahName: currentSurah?.englishName || '',
      duration: selectedDuration,
      target: selectedTarget,
      ayahsMemorized,
      ayahsTarget,
      accuracy,
      date: new Date().toISOString(),
    };
    const existing = await getData<SessionResult[]>(KEYS.MEMORIZATION_SESSIONS, []) || [];
    existing.push(result);
    await storeData(KEYS.MEMORIZATION_SESSIONS, existing);
    Alert.alert(
      isRtl ? 'تم الحفظ' : 'Saved',
      isRtl ? 'تم حفظ الجلسة في سجل التقدم' : 'Session saved to progress'
    );
  };

  const renderSetup = () => (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>{isRtl ? 'اختر السورة' : 'Select Surah'}</Text>
      <View style={styles.surahGrid}>
        {allSurahs.map((s: Surah) => (
          <AnimatedPressable
            key={s.number}
            style={[styles.surahChip, selectedSurah === s.number && styles.surahChipActive]}
            onPress={() => setSelectedSurah(s.number)}
          >
            <Text style={[styles.surahChipText, selectedSurah === s.number && { color: COLORS.green }]}>
              {s.number}. {s.name}
            </Text>
          </AnimatedPressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>{isRtl ? 'المدة' : 'Duration'}</Text>
      <View style={styles.optionRow}>
        {TIMER_OPTIONS.map(opt => (
          <AnimatedPressable
            key={opt.value}
            style={[styles.optionChip, selectedDuration === opt.value && styles.optionChipActive]}
            onPress={() => setSelectedDuration(opt.value)}
          >
            <Text style={[styles.optionChipText, selectedDuration === opt.value && styles.optionChipTextActive]}>
              {opt.label}
            </Text>
          </AnimatedPressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>{isRtl ? 'الهدف' : 'Target'}</Text>
      <View style={styles.optionRow}>
        {TARGET_OPTIONS.map(opt => (
          <AnimatedPressable
            key={opt.value}
            style={[styles.optionChip, selectedTarget === opt.value && styles.optionChipActive]}
            onPress={() => setSelectedTarget(opt.value)}
          >
            <Text style={[styles.optionChipText, selectedTarget === opt.value && styles.optionChipTextActive]}>
              {isRtl ? opt.labelAr : opt.labelEn}
            </Text>
          </AnimatedPressable>
        ))}
      </View>

      <AnimatedPressable style={styles.startBtn} onPress={startSession}>
        <Text style={styles.startBtnText}>{isRtl ? 'ابدأ الجلسة' : 'Start Session'}</Text>
      </AnimatedPressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderActive = () => {
    const progress = ayahsTarget > 0 ? ayahsMemorized / ayahsTarget : 0;
    const currentAyah = surahData?.ayahs[currentAyahIndex];

    return (
      <View style={styles.activeContainer}>
        <View style={styles.timerSection}>
          <Text style={[
            styles.timerText,
            timeLeft < 60 && styles.timerWarning,
            timeLeft < 10 && styles.timerDanger,
          ]}>
            {formatTime(timeLeft)}
          </Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {ayahsMemorized} / {ayahsTarget} {isRtl ? 'آيات' : 'ayahs'}
          </Text>
        </View>

        <View style={styles.ayahCard}>
          <Text style={styles.surahLabel}>
            {currentSurah?.name} - {isRtl ? 'الآية' : 'Ayah'} {currentAyahIndex + 1}
          </Text>
          <Text style={styles.ayahPlaceholder}>
            {currentAyah?.text || (isRtl ? 'بسم الله الرحمن الرحيم' : 'In the name of Allah, the Most Gracious, the Most Merciful')}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <AnimatedPressable style={styles.memorizedBtn} onPress={handleMemorized}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.green} />
            <Text style={styles.memorizedBtnText}>
              {isRtl ? 'تم الحفظ ✓' : 'Memorized ✓'}
            </Text>
          </AnimatedPressable>
          <AnimatedPressable style={styles.moreTimeBtn} onPress={handleNeedMoreTime}>
            <Ionicons name="time-outline" size={24} color={COLORS.gold} />
            <Text style={styles.moreTimeBtnText}>
              {isRtl ? 'أحتاج وقتاً أكثر' : 'Need More Time'}
            </Text>
          </AnimatedPressable>
        </View>

        <Text style={styles.accuracyText}>
          {isRtl ? 'الدقة' : 'Accuracy'}: {accuracy}%
        </Text>
      </View>
    );
  };

  const renderSummary = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryIconWrap}>
        <Ionicons name="trophy" size={48} color={COLORS.gold} />
      </View>
      <Text style={styles.summaryTitle}>
        {isRtl ? 'انتهت الجلسة!' : 'Session Complete!'}
      </Text>

      <View style={styles.summaryCard}>
        <SummaryRow
          label={isRtl ? 'السورة' : 'Surah'}
          value={currentSurah?.name || ''}
        />
        <SummaryRow
          label={isRtl ? 'المدة' : 'Duration'}
          value={`${selectedDuration} min`}
        />
        <SummaryRow
          label={isRtl ? 'الهدف' : 'Target'}
          value={isRtl
            ? (selectedTarget === 'new' ? 'جديد' : selectedTarget === 'revision' ? 'مراجعة' : 'مختلط')
            : selectedTarget}
        />
        <SummaryRow
          label={isRtl ? 'تم الحفظ' : 'Memorized'}
          value={`${ayahsMemorized}/${ayahsTarget}`}
          isHighlight
        />
        <SummaryRow
          label={isRtl ? 'الدقة' : 'Accuracy'}
          value={`${accuracy}%`}
          isHighlight
        />
        <SummaryRow
          label={isRtl ? 'الوقت المستغرق' : 'Time Spent'}
          value={formatTime(selectedDuration * 60 - timeLeft)}
          isLast
        />
      </View>

      <View style={styles.summaryActions}>
        <AnimatedPressable style={styles.saveBtn} onPress={saveSession}>
          <Ionicons name="save" size={20} color={COLORS.green} />
          <Text style={styles.saveBtnText}>
            {isRtl ? 'حفظ في التقدم' : 'Save to Progress'}
          </Text>
        </AnimatedPressable>
        <AnimatedPressable
          style={styles.newSessionBtn}
          onPress={() => setPhase('setup')}
        >
          <Text style={styles.newSessionBtnText}>
            {isRtl ? 'جلسة جديدة' : 'New Session'}
          </Text>
        </AnimatedPressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={GRADIENTS.brand} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <AnimatedPressable onPress={() => {
              if (phase === 'active') {
                Alert.alert(
                  isRtl ? 'إنهاء الجلسة؟' : 'End Session?',
                  isRtl ? 'سيتم فقدان التقدم الحالي' : 'Current progress will be lost',
                  [
                    { text: isRtl ? 'إلغاء' : 'Cancel', style: 'cancel' },
                    { text: isRtl ? 'نعم' : 'Yes', style: 'destructive', onPress: () => navigation.goBack() },
                  ]
                );
              } else {
                navigation.goBack();
              }
            }} style={styles.backBtn}>
              <Ionicons name={isRtl ? 'chevron-forward' : 'chevron-back'} size={22} color={COLORS.gold} />
            </AnimatedPressable>
            <Text style={styles.title}>
              {isRtl ? 'الحفظ الموقوت' : 'Timed Memorization'}
            </Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {phase === 'setup' && renderSetup()}
      {phase === 'active' && renderActive()}
      {phase === 'summary' && renderSummary()}
    </View>
  );
}

function SummaryRow({
  label, value, isHighlight, isLast,
}: {
  label: string; value: string; isHighlight?: boolean; isLast?: boolean;
}) {
  const sStyles = useThemedStyles((colors) => ({
    row: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    rowLast: { borderBottomWidth: 0 },
    label: { fontSize: FONT_SIZES.small, color: colors.textSecondary, fontFamily: FONTS.body },
    value: { fontSize: FONT_SIZES.small, color: colors.textPrimary, fontFamily: FONTS.bodySemi },
    valueHighlight: { color: colors.gold, fontFamily: FONTS.bodyBold },
  }));

  return (
    <View style={[sStyles.row, isLast && sStyles.rowLast]}>
      <Text style={sStyles.label}>{label}</Text>
      <Text style={[sStyles.value, isHighlight && sStyles.valueHighlight]}>{value}</Text>
    </View>
  );
}


