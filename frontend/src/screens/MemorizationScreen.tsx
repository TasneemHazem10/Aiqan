import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, StatusBar, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { get } from '../utils/api';
import { ENDPOINTS } from '../constants/api';
import { getData, storeData, KEYS } from '../utils/storage';
import { Surah, SurahWithAyahs } from '../types';
import { COLORS } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { FadeIn, AnimatedPressable } from '../components/AnimatedComponents';
import LogoDecoration from '../components/LogoDecoration';

type AyahStatus = 'hidden' | 'revealed' | 'missed';

export default function MemorizationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { surahNumber = 1 } = route.params || {};
  const { allSurahs, language } = useApp();
  const isRtl = language === 'ar';

  const [mode, setMode] = useState<'select' | 'memorize'>('select');
  const [selectedSurah, setSelectedSurah] = useState<number>(surahNumber);
  const [loading, setLoading] = useState(false);
  const [surahData, setSurahData] = useState<SurahWithAyahs | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [ayahStatuses, setAyahStatuses] = useState<AyahStatus[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [checking, setChecking] = useState(false);
  const [memorizedCount, setMemorizedCount] = useState(0);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const activeIndexRef = useRef(0);

  const currentSurah = allSurahs.find((s: Surah) => s.number === selectedSurah);

  useEffect(() => {
    loadMemorizationProgress();
  }, []);

  const loadMemorizationProgress = async () => {
    const count = await getData<number>(KEYS.MEMORIZATION, 0);
    if (count) setMemorizedCount(count);
  };

  const startMemorization = async () => {
    setLoading(true);
    try {
      const data = await get<SurahWithAyahs>(ENDPOINTS.QURAN_SURAH(selectedSurah));
      setSurahData(data);
      setActiveIndex(0);
      activeIndexRef.current = 0;
      setAyahStatuses(data.ayahs.map(() => 'hidden' as AyahStatus));
      setMode('memorize');
    } catch {
      Alert.alert(isRtl ? 'خطأ' : 'Error', isRtl ? 'فشل تحميل بيانات السورة' : 'Failed to load surah data');
    } finally {
      setLoading(false);
    }
  };

  const ayahs = surahData?.ayahs || [];

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = rec;
      setIsRecording(true);
    } catch {
      Alert.alert(isRtl ? 'خطأ' : 'Error', isRtl ? 'فشل بدء التسجيل' : 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    const rec = recordingRef.current;
    if (!rec) return;
    setIsRecording(false);
    try {
      await rec.stopAndUnloadAsync();
      recordingRef.current = null;
      const uri = rec.getURI();
      if (uri) await processRecording(uri);
    } catch {
      Alert.alert(isRtl ? 'خطأ' : 'Error', isRtl ? 'فشل معالجة التسجيل' : 'Failed to process recording');
    }
  };

  const processRecording = async (_uri: string) => {
    if (!surahData) return;
    const idx = activeIndexRef.current;
    const ayah = surahData.ayahs[idx];
    if (!ayah) return;

    setChecking(false);
    Alert.alert(
      isRtl ? 'هل تليت الآية صحيحة؟' : 'Did you recite correctly?',
      isRtl ? 'استمع لتسجيلك وقارنه بالنص. هل كانت التلاوة صحيحة؟' : 'Listen to your recording and compare with the text. Was your recitation correct?',
      [
        {
          text: isRtl ? 'نعم' : 'Yes',
          onPress: () => {
            setAyahStatuses(prev => {
              const next = [...prev];
              next[idx] = 'revealed';
              return next;
            });
            const newCount = memorizedCount + 1;
            setMemorizedCount(newCount);
            storeData(KEYS.MEMORIZATION, newCount);
            advanceToNext(idx);
          },
        },
        {
          text: isRtl ? 'لا' : 'No',
          onPress: () => {
            setAyahStatuses(prev => {
              const next = [...prev];
              next[idx] = 'missed';
              return next;
            });
            advanceToNext(idx);
          },
          style: 'destructive',
        },
      ]
    );
  };

  const advanceToNext = (currentIdx: number) => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= ayahs.length) {
      setAyahStatuses(prev => {
        const final = [...prev];
        final.forEach((s, i) => {
          if (s === 'hidden') final[i] = 'missed';
        });
        return final;
      });
      Alert.alert(
        isRtl ? 'أحسنت!' : 'Well done!',
        isRtl ? 'لقد أكملت جميع آيات هذه السورة' : 'You completed all ayahs in this surah'
      );
      return;
    }
    setActiveIndex(nextIdx);
    activeIndexRef.current = nextIdx;
  };

  const jumpToAyah = (idx: number) => {
    setActiveIndex(idx);
    activeIndexRef.current = idx;
  };

  const getWords = (text: string) => text.split(/\s+/).filter(Boolean);

  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },

    selectHeader: { backgroundColor: '#0a0a0a', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
    selectHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    selectBack: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
    selectTitle: { fontSize: 16, color: '#fff', fontWeight: '600' },
    selectContent: { padding: 16 },
    statsCard: { alignItems: 'center', paddingVertical: 20, marginBottom: 8 },
    statsNumber: { fontSize: 36, color: colors.gold, fontWeight: '700' },
    statsLabel: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
    surahRow: {
      flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12,
      borderRadius: 12, marginBottom: 4,
    },
    surahRowActive: { backgroundColor: 'rgba(212,162,70,0.08)' },
    surahNumCircle: {
      width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.06)',
      alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    surahNumCircleActive: { backgroundColor: colors.gold },
    surahNumText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
    surahRowInfo: { flex: 1 },
    surahRowName: { fontSize: 15, color: '#fff', fontWeight: '600' },
    surahRowSub: { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
    startMemorizeBtn: {
      backgroundColor: colors.gold, borderRadius: 14, paddingVertical: 16,
      alignItems: 'center', marginTop: 24,
    },
    startMemorizeBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },

    // ── Memorize screen ──
    safeTop: { backgroundColor: '#000' },
    memHeader: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 8,
    },
    memBackBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
    memHeaderCenter: { flex: 1, alignItems: 'center' },
    memSurahName: { fontSize: 15, color: colors.gold, fontWeight: '600' },
    memProgress: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 },

    ayahScroll: { flex: 1, paddingHorizontal: 16 },
    ayahScrollContent: { paddingVertical: 16, paddingBottom: 40 },
    ayahRow: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      marginVertical: 2,
    },
    ayahRowActive: {
      backgroundColor: 'rgba(212,162,70,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(212,162,70,0.3)',
    },
    ayahMarker: {
      color: colors.gold,
      fontSize: 14,
      marginBottom: 4,
    },
    ayahText: {
      fontSize: 22,
      lineHeight: 48,
      writingDirection: 'rtl',
      fontFamily: Platform.OS === 'ios' ? 'Scheherazade New' : 'serif',
    },
    ayahRevealed: { color: '#fff' },
    ayahMissed: { color: '#EF4444' },
    ayahHidden: {
      color: 'rgba(255,255,255,0.1)',
      fontSize: 22,
      lineHeight: 48,
      textAlign: 'right',
      fontFamily: Platform.OS === 'ios' ? 'Scheherazade New' : 'serif',
    },
    ayahPlaceholder: {
      color: 'rgba(255,255,255,0.08)',
      fontSize: 22,
      lineHeight: 48,
      writingDirection: 'rtl',
      fontFamily: Platform.OS === 'ios' ? 'Scheherazade New' : 'serif',
    },

    footer: {
      borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
      paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8,
    },
    controlsRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20,
    },
    sideBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.06)',
      alignItems: 'center', justifyContent: 'center',
    },
    sideBtnDisabled: { opacity: 0.4 },
    micBtn: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: 'rgba(212,162,70,0.12)',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: colors.gold,
    },
    micBtnActive: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
    bottomMeta: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      marginTop: 8, gap: 6,
    },
    statusText: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
    progressDots: { flexDirection: 'row', gap: 3, flexWrap: 'wrap', justifyContent: 'center' },
    progDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)' },
    progDotActive: { backgroundColor: colors.gold, width: 7, height: 7, borderRadius: 4 },
    progDotRevealed: { backgroundColor: '#1B6B43' },
    progDotMissed: { backgroundColor: '#EF4444' },
    bottomSafe: { backgroundColor: '#000' },
  }), [mode]);

  // ═══════════════════════════════════════════
  // Surah Picker
  // ═══════════════════════════════════════════
  if (mode === 'select') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.selectHeader}>
          <SafeAreaView edges={['top']}>
            <View style={styles.selectHeaderRow}>
              <AnimatedPressable onPress={() => navigation.goBack()} style={styles.selectBack}>
                <Ionicons name="close" size={22} color="#fff" />
              </AnimatedPressable>
              <Text style={styles.selectTitle}>
                {isRtl ? 'اختر سورة للحفظ' : 'Select a Surah to Memorize'}
              </Text>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>
        </View>
        <ScrollView contentContainerStyle={styles.selectContent} showsVerticalScrollIndicator={false}>
          <View style={styles.statsCard}>
            <Text style={styles.statsNumber}>{memorizedCount}</Text>
            <Text style={styles.statsLabel}>
              {isRtl ? 'آية محفوظة' : 'Ayahs Memorized'}
            </Text>
          </View>
          {allSurahs.map((s: Surah) => {
            const isSelected = selectedSurah === s.number;
            return (
              <AnimatedPressable
                key={s.number}
                style={[styles.surahRow, isSelected && styles.surahRowActive]}
                onPress={() => setSelectedSurah(s.number)}
              >
                <View style={[styles.surahNumCircle, isSelected && styles.surahNumCircleActive]}>
                  <Text style={[styles.surahNumText, isSelected && { color: '#000' }]}>{s.number}</Text>
                </View>
                <View style={styles.surahRowInfo}>
                  <Text style={[styles.surahRowName, isSelected && { color: COLORS.gold }]}>
                    {s.name}
                  </Text>
                  <Text style={styles.surahRowSub}>
                    {s.englishName} · {s.numberOfAyahs} {isRtl ? 'آية' : 'ayahs'}
                  </Text>
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={22} color={COLORS.gold} />}
              </AnimatedPressable>
            );
          })}
          <AnimatedPressable style={styles.startMemorizeBtn} onPress={startMemorization}>
            <Text style={styles.startMemorizeBtnText}>
              {isRtl ? 'ابدأ الحفظ' : 'Start Memorizing'}
            </Text>
          </AnimatedPressable>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // ═══════════════════════════════════════════
  // Loading
  // ═══════════════════════════════════════════
  if (loading || !surahData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  // ═══════════════════════════════════════════
  // Memorize Screen — all ayahs hidden, reveal on recite
  // ═══════════════════════════════════════════
  return (
    <View style={styles.container}>
      <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.memHeader}>
          <AnimatedPressable onPress={() => { setMode('select'); setSurahData(null); }} style={styles.memBackBtn}>
            <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.6)" />
          </AnimatedPressable>
          <View style={styles.memHeaderCenter}>
            <Text style={styles.memSurahName}>{currentSurah?.name}</Text>
            <Text style={styles.memProgress}>
              {ayahStatuses.filter(s => s !== 'hidden').length} / {ayahs.length} {isRtl ? 'آية' : 'ayahs'}
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.ayahScroll}
        contentContainerStyle={styles.ayahScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {ayahs.map((ayah, idx) => {
          const status = ayahStatuses[idx] || 'hidden';
          const isActive = idx === activeIndex;

          return (
            <AnimatedPressable
              key={ayah.number}
              activeOpacity={0.7}
              onPress={() => jumpToAyah(idx)}
              style={[styles.ayahRow, isActive && styles.ayahRowActive]}
            >
              <Text style={styles.ayahMarker}>
                {String.fromCharCode(0xFD3F)}{ayah.numberInSurah}{String.fromCharCode(0xFD3E)}
              </Text>

              {status === 'revealed' && (
                <Text style={[styles.ayahText, styles.ayahRevealed]}>{ayah.text}</Text>
              )}
              {status === 'missed' && (
                <Text style={[styles.ayahText, styles.ayahMissed]}>{ayah.text}</Text>
              )}
              {status === 'hidden' && isActive && (
                <Text style={styles.ayahPlaceholder}>
                  {'━━━ '.repeat(Math.min(getWords(ayah.text).length, 8))}
                </Text>
              )}
              {status === 'hidden' && !isActive && (
                <Text style={styles.ayahHidden}>
                  {isRtl ? '—' : '—'}
                </Text>
              )}
            </AnimatedPressable>
          );
        })}
      </ScrollView>

      {(isRecording || checking) && (
        <View style={{ alignItems: 'center', paddingVertical: 4 }}>
          {isRecording ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' }} />
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                {isRtl ? 'جاري التسجيل...' : 'Recording...'}
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ActivityIndicator size="small" color={COLORS.gold} />
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                {isRtl ? 'جاري التحقق...' : 'Checking...'}
              </Text>
            </View>
          )}
        </View>
      )}

      <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
        <View style={styles.footer}>
          <View style={styles.controlsRow}>
            <AnimatedPressable
              style={[styles.sideBtn, activeIndex <= 0 && styles.sideBtnDisabled]}
              onPress={() => jumpToAyah(Math.max(0, activeIndex - 1))}
              disabled={activeIndex <= 0}
            >
              <Ionicons
                name={isRtl ? 'chevron-forward' : 'chevron-back'}
                size={22}
                color={activeIndex <= 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)'}
              />
            </AnimatedPressable>

            <AnimatedPressable
              style={[styles.micBtn, isRecording && styles.micBtnActive]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={checking}
            >
              <Ionicons
                name={isRecording ? 'stop' : 'mic'}
                size={28}
                color={isRecording ? '#000' : COLORS.gold}
              />
            </AnimatedPressable>

            <AnimatedPressable
              style={[styles.sideBtn, activeIndex >= ayahs.length - 1 && styles.sideBtnDisabled]}
              onPress={() => jumpToAyah(Math.min(ayahs.length - 1, activeIndex + 1))}
              disabled={activeIndex >= ayahs.length - 1}
            >
              <Ionicons
                name={isRtl ? 'chevron-back' : 'chevron-forward'}
                size={22}
                color={activeIndex >= ayahs.length - 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)'}
              />
            </AnimatedPressable>
          </View>

          <View style={styles.bottomMeta}>
            <Text style={styles.statusText}>
              {isRtl ? 'الآية' : 'Ayah'} {activeIndex + 1}
            </Text>
            <View style={styles.progressDots}>
              {ayahs.slice(0, Math.min(ayahs.length, 60)).map((_, i) => {
                const s = ayahStatuses[i] || 'hidden';
                return (
                  <AnimatedPressable
                    key={i}
                    style={[
                      styles.progDot,
                      s === 'revealed' && styles.progDotRevealed,
                      s === 'missed' && styles.progDotMissed,
                      i === activeIndex && s === 'hidden' && styles.progDotActive,
                    ]}
                    onPress={() => jumpToAyah(i)}
                  />
                );
              })}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
