import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, Modal, FlatList,
  TextInput, StatusBar, Platform, Animated, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useApp } from '../context/AppContext';
import { COLORS, GRADIENTS, SHADOWS } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';
import { storeData, getData, KEYS } from '../utils/storage';
import { get } from '../utils/api';
import { ENDPOINTS, API_BASE } from '../constants/api';
import { Surah, SurahWithAyahs, VoiceRecordingData } from '../types';
import { getOfflineSurah } from '../services/offlineQuran';
import { addDownload } from '../utils/downloads';
import { FadeIn, SlideUp, AnimatedPressable, ScaleIn } from '../components/AnimatedComponents';
import LogoDecoration from '../components/LogoDecoration';
import {
  syncRecordings, uploadRecording, deleteCloudRecording,
  renameCloudRecording, fetchCloudRecordings, downloadCloudRecording,
} from '../services/recordingSync';

type RecordingStatus = 'idle' | 'recording' | 'paused';
type TabName = 'record' | 'recordings';

const RECORDINGS_DIR = FileSystem.documentDirectory + 'recordings/';
const WAVE_BARS = 5;

// ─── Waveform Component ─────────────────────────────────────────────
function Waveform({ active }: { active: boolean }) {
  const amplitudes = useRef(
    Array.from({ length: WAVE_BARS }, () => new Animated.Value(8))
  ).current;
  const rafRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) {
      if (rafRef.current) clearInterval(rafRef.current);
      amplitudes.forEach((a) => a.setValue(8));
      return;
    }
    const animate = () => {
      amplitudes.forEach((amp) => {
        const target = 8 + Math.random() * 40;
        Animated.spring(amp, {
          toValue: target,
          friction: 4,
          tension: 80,
          useNativeDriver: false,
        }).start();
      });
    };
    animate();
    rafRef.current = setInterval(animate, 300);
    return () => {
      if (rafRef.current) clearInterval(rafRef.current);
    };
  }, [active]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, height: 48 }}>
      {amplitudes.map((amp, i) => (
        <Animated.View
          key={i}
          style={{
            width: 4,
            borderRadius: 2,
            backgroundColor: active ? '#EF4444' : COLORS.gold,
            height: amp.interpolate({
              inputRange: [0, 48],
              outputRange: [4, 48],
            }),
            opacity: active ? 0.9 : 0.3,
          }}
        />
      ))}
    </View>
  );
}

// ─── Pulsing Dot ────────────────────────────────────────────────────
function PulsingDot() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={{
        width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444',
        opacity, marginRight: 6,
      }}
    />
  );
}

// ─── Main Screen ────────────────────────────────────────────────────
export default function VoiceRecordingScreen() {
  const { language, allSurahs, t, isAuthenticated, user } = useApp();
  const isRtl = language === 'ar';

  const styles = useThemedStyles(() => ({}));

  // ── Tab ──
  const [activeTab, setActiveTab] = useState<TabName>('record');

  // ── Surah Selector ──
  const [showSurahPicker, setShowSurahPicker] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [surahData, setSurahData] = useState<SurahWithAyahs | null>(null);
  const [loadingSurah, setLoadingSurah] = useState(false);

  // ── Recording ──
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedElapsedRef = useRef<number>(0);
  const busyRef = useRef(false);

  // ── Recordings List ──
  const [recordings, setRecordings] = useState<VoiceRecordingData[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Rename Modal ──
  const [showRename, setShowRename] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  // ── Playback ──
  const [playingId, setPlayingId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // ── Init ──
  useEffect(() => {
    init();
    FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true }).catch(() => {});
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
        Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true }).catch(() => {});
      }
      if (soundRef.current) { soundRef.current.unloadAsync(); soundRef.current = null; }
    };
  }, []);

  const init = async () => {
    try {
      const local = await getData<VoiceRecordingData[]>(KEYS.VOICE_RECORDINGS, []) ?? [];
      setRecordings(local);
    } catch {}
    if (isAuthenticated) {
      setSyncing(true);
      try {
        const merged = await syncRecordings();
        setRecordings(merged);
      } catch {}
      setSyncing(false);
    }
  };

  // ── Load Surah (offline-first) ──
  const fetchSurah = async (number: number) => {
    setLoadingSurah(true);
    const offline = getOfflineSurah(number);
    if (offline) {
      setSurahData(offline);
      setLoadingSurah(false);
      // Background: try API for translations
      try {
        const apiData = await get<SurahWithAyahs>(ENDPOINTS.QURAN_SURAH(number));
        if (apiData?.ayahs && apiData.ayahs.length > 0) {
          setSurahData((prev) => {
            if (!prev || prev.number !== number) return prev;
            const offlineAyahs = offline.ayahs;
            const merged = offlineAyahs.map((oAyah) => {
              const apiAyah = apiData.ayahs.find((a: any) => a.number === oAyah.number);
              return apiAyah?.translation ? { ...oAyah, translation: apiAyah.translation } : oAyah;
            });
            return { ...prev, ayahs: merged as any };
          });
        }
      } catch {}
    } else {
      setLoadingSurah(false);
      Alert.alert(t('common.error'), isRtl ? 'فشل تحميل السورة' : 'Failed to load surah');
    }
  };

  const handleSelectSurah = (surah: Surah) => {
    setSelectedSurah(surah);
    setShowSurahPicker(false);
    fetchSurah(surah.number);
    setRecordingStatus('idle');
    setElapsedMs(0);
  };

  // ── Recording Controls ──
  const startRecording = async () => {
    if (busyRef.current || recordingRef.current) return;
    busyRef.current = true;
    try {
      const perm = await Audio.getPermissionsAsync();
      if (!perm.granted) {
        const req = await Audio.requestPermissionsAsync();
        if (!req.granted) {
          Alert.alert(
            t('common.error'),
            isRtl
              ? 'يجب منح صلاحية الميكروفون لبدء التسجيل'
              : 'Microphone permission is required to record',
          );
          return;
        }
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setRecordingStatus('recording');
      startTimeRef.current = Date.now();
      pausedElapsedRef.current = 0;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current);
      }, 50);
    } catch {
      Alert.alert(t('common.error'), isRtl ? 'فشل بدء التسجيل — تأكد من صلاحية الميكروفون' : 'Failed to start recording — check microphone permission');
    } finally {
      busyRef.current = false;
    }
  };

  const pauseRecording = async () => {
    if (!recordingRef.current || busyRef.current) return;
    busyRef.current = true;
    try {
      await recordingRef.current.pauseAsync();
      setRecordingStatus('paused');
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      pausedElapsedRef.current = elapsedMs;
    } catch {
      Alert.alert(t('common.error'), isRtl ? 'فشل إيقاف التسجيل مؤقتاً' : 'Failed to pause recording');
    } finally {
      busyRef.current = false;
    }
  };

  const resumeRecording = async () => {
    if (!recordingRef.current || busyRef.current) return;
    busyRef.current = true;
    try {
      await recordingRef.current.startAsync();
      setRecordingStatus('recording');
      startTimeRef.current = Date.now();
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setElapsedMs(pausedElapsedRef.current + (Date.now() - startTimeRef.current));
      }, 50);
    } catch {
      Alert.alert(t('common.error'), isRtl ? 'فشل استئناف التسجيل' : 'Failed to resume recording');
    } finally {
      busyRef.current = false;
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current || busyRef.current) return;
    busyRef.current = true;
    try {
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      if (uri) await saveRecording(uri);
      setRecordingStatus('idle');
      setElapsedMs(0);
    } catch {
      recordingRef.current = null;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setRecordingStatus('idle');
      setElapsedMs(0);
      Alert.alert(t('common.error'), isRtl ? 'فشل إيقاف التسجيل' : 'Failed to stop recording');
    } finally {
      busyRef.current = false;
    }
  };

  const saveRecording = async (uri: string) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 8);
    const filename = `${id}.wav`;
    const dest = RECORDINGS_DIR + filename;
    try {
      await FileSystem.moveAsync({ from: uri, to: dest });
    } catch {
      await FileSystem.copyAsync({ from: uri, to: dest });
    }
    const surahName = selectedSurah
      ? (isRtl ? selectedSurah.name : selectedSurah.englishName)
      : (isRtl ? 'تسجيل جديد' : 'Untitled Recording');
    const recording: VoiceRecordingData = {
      id,
      name: surahName,
      surahNumber: selectedSurah?.number ?? 0,
      surahName,
      uri: dest,
      duration: elapsedMs,
      createdAt: new Date().toISOString(),
    };
    const updated = [recording, ...recordings];
    setRecordings(updated);
    await storeData(KEYS.VOICE_RECORDINGS, updated);
    addDownload({
      id: recording.id, name: recording.name, url: recording.uri,
      localUri: recording.uri, date: recording.createdAt,
      size: undefined, type: 'audio',
    });
    if (isAuthenticated) {
      uploadRecording(recording);
    }
    setActiveTab('recordings');
  };

  // ── Delete ──
  const deleteRecording = (id: string) => {
    Alert.alert(
      isRtl ? 'حذف التسجيل' : 'Delete Recording',
      t('voiceRecorder.deleteConfirm'),
      [
        { text: t('voiceRecorder.cancel'), style: 'cancel' },
        {
          text: t('voiceRecorder.delete'), style: 'destructive',
          onPress: async () => {
            const rec = recordings.find(r => r.id === id);
            if (rec) {
              try { await FileSystem.deleteAsync(rec.uri, { idempotent: true }); } catch {}
            }
            const filtered = recordings.filter(r => r.id !== id);
            setRecordings(filtered);
            await storeData(KEYS.VOICE_RECORDINGS, filtered);
            if (isAuthenticated) deleteCloudRecording(id);
            if (playingId === id) {
              if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
              setPlayingId(null);
            }
          },
        },
      ]
    );
  };

  // ── Rename ──
  const openRename = (id: string, currentName: string) => {
    setRenameId(id);
    setRenameText(currentName);
    setShowRename(true);
  };

  const confirmRename = async () => {
    if (!renameId || !renameText.trim()) return;
    const updated = recordings.map(r =>
      r.id === renameId ? { ...r, name: renameText.trim() } : r
    );
    setRecordings(updated);
    await storeData(KEYS.VOICE_RECORDINGS, updated);
    if (isAuthenticated) renameCloudRecording(renameId, renameText.trim());
    setShowRename(false);
    setRenameId(null);
    setRenameText('');
  };

  // ── Playback ──
  const togglePlayback = async (rec: VoiceRecordingData) => {
    if (playingId === rec.id) {
      if (soundRef.current) { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); soundRef.current = null; }
      setPlayingId(null);
      return;
    }
    if (soundRef.current) { await soundRef.current.unloadAsync(); soundRef.current = null; }
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const source = rec.uri.startsWith('http') || rec.uri.startsWith('/')
        ? { uri: rec.uri.startsWith('/') ? API_BASE + rec.uri : rec.uri }
        : { uri: rec.uri };
      const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingId(rec.id);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && 'didJustFinish' in status && status.didJustFinish) {
          setPlayingId(null);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch {
      Alert.alert(t('common.error'), isRtl ? 'فشل تشغيل التسجيل' : 'Failed to play recording');
    }
  };

  // ── Refresh ──
  const onRefresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setRefreshing(true);
    try {
      const merged = await syncRecordings();
      setRecordings(merged);
    } catch {}
    setRefreshing(false);
  }, [isAuthenticated]);

  // ── Formatters ──
  const formatTime = (ms: number) => {
    const totalCs = Math.floor(ms / 10);
    const min = Math.floor(totalCs / 6000);
    const sec = Math.floor((totalCs % 6000) / 100);
    const cs = totalCs % 100;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  // ── Filtered Recordings ──
  const filteredRecordings = searchQuery
    ? recordings.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.surahName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : recordings;

  // ── Styles ──
  const s = {
    // Container
    container: { flex: 1, backgroundColor: COLORS.bg } as const,
    // Tabs
    tabRow: {
      flexDirection: 'row', marginHorizontal: SPACING.lg, marginTop: SPACING.md,
      backgroundColor: COLORS.glassDark, borderRadius: RADIUS.round, padding: 3, gap: 16,
    } as const,
    tab: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      paddingVertical: SPACING.sm, borderRadius: RADIUS.round, gap: 6,
    } as const,
    // Surah selector
    surahCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      marginHorizontal: SPACING.lg, marginTop: SPACING.md, marginBottom: SPACING.sm,
      padding: SPACING.base, borderRadius: RADIUS.xl,
      backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.borderSubtle,
      ...SHADOWS.soft,
    } as const,
    // Quran text
    quranScroll: { flex: 1 } as const,
    quranContent: { padding: SPACING.lg, paddingBottom: 160 } as const,
    bismillah: {
      fontFamily: FONTS.arabic, fontSize: FONT_SIZES.arabicXl,
      textAlign: 'center', marginBottom: SPACING.lg, color: COLORS.gold,
    } as const,
    ayahRow: {
      marginBottom: SPACING.md, flexDirection: 'row',
      alignItems: 'flex-start', flexWrap: 'wrap',
    } as const,
    ayahText: {
      fontFamily: FONTS.arabic, fontSize: FONT_SIZES.arabic,
      lineHeight: FONT_SIZES.arabic * 2, flex: 1,
      color: COLORS.textPrimary,
    } as const,
    ayahNum: {
      fontFamily: FONTS.arabic, fontSize: FONT_SIZES.md,
      marginLeft: 8, marginTop: 4, color: COLORS.gold,
    } as const,
    // Bottom controls
    controlsContainer: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingHorizontal: SPACING.lg, paddingTop: SPACING.md,
      paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.md,
    } as const,
    controlsCard: {
      borderRadius: RADIUS.xxl, padding: SPACING.lg,
      backgroundColor: COLORS.card, ...SHADOWS.elevated,
    } as const,
    controlsRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between',
    } as const,

    recordBtn: {
      width: 56, height: 56, borderRadius: 28,
      alignItems: 'center', justifyContent: 'center',
    } as const,
    smallBtn: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center',
    } as const,
    // Recordings list
    recordingsList: { padding: SPACING.lg, paddingBottom: 40 } as const,
    recordingCard: {
      flexDirection: 'row', alignItems: 'center',
      padding: SPACING.base, borderRadius: RADIUS.xl,
      backgroundColor: COLORS.card, borderWidth: 1,
      borderColor: COLORS.borderSubtle, marginBottom: SPACING.sm,
      ...SHADOWS.soft,
    } as const,
    recordingInfo: { flex: 1, marginRight: SPACING.sm } as const,
    recordingName: {
      fontFamily: FONTS.bodyBold, fontSize: FONT_SIZES.md,
      color: COLORS.textPrimary, marginBottom: 4,
    } as const,
    recordingMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' } as const,
    metaText: { fontSize: FONT_SIZES.caption, fontFamily: FONTS.body, color: COLORS.textMuted } as const,
    metaDot: { fontSize: FONT_SIZES.caption, color: COLORS.textMuted } as const,
    actionBtn: {
      width: 34, height: 34, borderRadius: 17,
      alignItems: 'center', justifyContent: 'center',
    } as const,
    // Empty state
    centerContent: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      padding: SPACING.xl, gap: 12,
    } as const,
    emptyText: {
      fontFamily: FONTS.bodyMed, fontSize: FONT_SIZES.md,
      color: COLORS.textMuted, textAlign: 'center',
    } as const,
    emptyHint: {
      fontFamily: FONTS.body, fontSize: FONT_SIZES.small,
      color: COLORS.textMuted, textAlign: 'center',
    } as const,
    // Modals
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    } as const,
    modalContent: {
      maxHeight: '75%', borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg,
      backgroundColor: COLORS.bg,
    } as const,
    modalHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', padding: SPACING.lg,
    } as const,
    modalTitle: {
      fontFamily: FONTS.bodyBold, fontSize: FONT_SIZES.lg,
      color: COLORS.textPrimary,
    } as const,
    surahItem: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg,
      borderBottomWidth: 1, borderBottomColor: COLORS.border,
    } as const,
    surahNumBadge: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: COLORS.goldPale,
      alignItems: 'center', justifyContent: 'center',
    } as const,
    surahItemName: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary } as const,
    // Rename modal
    renameModal: {
      margin: SPACING.lg, borderRadius: RADIUS.xl, padding: SPACING.xl,
      backgroundColor: COLORS.card,
    } as const,
    renameInput: {
      borderWidth: 1, borderRadius: RADIUS.md, padding: SPACING.md,
      fontFamily: FONTS.body, fontSize: FONT_SIZES.md,
      color: COLORS.textPrimary, borderColor: COLORS.border,
      backgroundColor: COLORS.bg,
    } as const,
    renameBtn: {
      flex: 1, alignItems: 'center', paddingVertical: SPACING.md,
      borderRadius: RADIUS.md,
    } as const,
    // Search
    searchBar: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
      padding: SPACING.sm, borderRadius: RADIUS.lg,
      backgroundColor: COLORS.card, borderWidth: 1,
      borderColor: COLORS.borderSubtle,
    } as const,
    searchInput: {
      flex: 1, fontFamily: FONTS.body, fontSize: FONT_SIZES.md,
      color: COLORS.textPrimary,
    } as const,
    // Header
    headerGradient: {
      paddingTop: Platform.OS === 'ios' ? 6 : SPACING.md,
      paddingBottom: SPACING.md,
    } as const,
    headerRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm,
    } as const,
    headerTitle: {
      fontFamily: FONTS.display, fontSize: FONT_SIZES.display,
      color: '#FFFFFF',
    } as const,
    syncBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: 'rgba(255,255,255,0.12)',
      paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs,
      borderRadius: RADIUS.round,
    } as const,
    syncText: {
      fontSize: FONT_SIZES.micro, color: 'rgba(255,255,255,0.7)',
      fontFamily: FONTS.bodyBold,
    } as const,
    emptyList: { flex: 1, justifyContent: 'center' } as const,
  };

  // ── Tab Bar ───────────────────────────────────────────────────────
  const renderTabs = () => (
    <View style={s.tabRow}>
      {(['record', 'recordings'] as TabName[]).map((tab) => {
        const isActive = activeTab === tab;
        const icons: Record<TabName, keyof typeof Ionicons.glyphMap> = {
          record: 'mic',
          recordings: 'folder',
        };
        const labels: Record<TabName, string> = {
          record: t('voiceRecorder.record'),
          recordings: t('voiceRecorder.recordings'),
        };
        return (
          <AnimatedPressable
            key={tab}
            style={[s.tab, isActive && { backgroundColor: COLORS.gold }]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={icons[tab]}
              size={16}
              color={isActive ? '#FFFFFF' : COLORS.textMuted}
            />
            <Text style={{
              fontFamily: FONTS.bodyBold, fontSize: FONT_SIZES.small,
              color: isActive ? '#FFFFFF' : COLORS.textMuted,
            }}>
              {labels[tab]}
            </Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );

  // ── Surah Picker Modal ───────────────────────────────────────────
  const renderSurahPicker = () => (
    <Modal visible={showSurahPicker} animationType="slide" transparent>
      <View style={s.modalOverlay}>
        <View style={s.modalContent}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{t('voiceRecorder.selectSurah')}</Text>
            <AnimatedPressable onPress={() => setShowSurahPicker(false)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </AnimatedPressable>
          </View>
          <FlatList
            data={allSurahs}
            keyExtractor={(item) => item.number.toString()}
            renderItem={({ item }) => (
              <AnimatedPressable
                style={s.surahItem}
                onPress={() => handleSelectSurah(item)}
              >
                <View style={s.surahNumBadge}>
                  <Text style={{ color: COLORS.gold, fontFamily: FONTS.bodyBold, fontSize: FONT_SIZES.small }}>
                    {item.number}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.surahItemName}>
                    {isRtl ? item.name : item.englishName}
                  </Text>
                  <Text style={{ color: COLORS.textMuted, fontSize: FONT_SIZES.caption }}>
                    {isRtl ? item.englishName : item.name}
                  </Text>
                </View>
                <Text style={{ color: COLORS.textMuted, fontSize: FONT_SIZES.caption, fontFamily: FONTS.body }}>
                  {item.numberOfAyahs} {isRtl ? 'آية' : 'ayahs'}
                </Text>
              </AnimatedPressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  // ── Record Tab ───────────────────────────────────────────────────
  const renderRecordTab = () => (
    <View style={{ flex: 1 }}>
      <AnimatedPressable
        style={s.surahCard}
        onPress={() => setShowSurahPicker(true)}
        activeOpacity={0.7}
      >
        <View style={[s.surahNumBadge, { width: 40, height: 40, borderRadius: 20 }]}>
          <Ionicons name="book" size={20} color={COLORS.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.surahItemName, { fontSize: FONT_SIZES.small }]}>
            {selectedSurah
              ? (isRtl ? selectedSurah.name : selectedSurah.englishName)
              : t('voiceRecorder.selectSurahHint')}
          </Text>
          <Text style={{ color: COLORS.textMuted, fontSize: FONT_SIZES.caption }}>
            {selectedSurah
              ? `${selectedSurah.numberOfAyahs} ${isRtl ? 'آية' : 'ayahs'}`
              : (isRtl ? 'اختر السورة التي تريد تسجيلها' : 'Choose surah to record')}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
      </AnimatedPressable>

      {loadingSurah ? (
        <View style={s.centerContent}>
          <Text style={{ color: COLORS.textMuted }}>{t('common.loading')}</Text>
        </View>
      ) : surahData ? (
        <ScrollView
          style={s.quranScroll}
          contentContainerStyle={s.quranContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.bismillah}>﷽</Text>
          {surahData.ayahs.map((ayah) => (
            <View key={ayah.number} style={s.ayahRow}>
              <Text style={s.ayahText}>{ayah.text}</Text>
              <Text style={s.ayahNum}>﴿{ayah.numberInSurah}﴾</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={s.centerContent}>
          <Ionicons name="mic-outline" size={48} color={COLORS.textMuted} />
          <Text style={s.emptyText}>
            {isRtl ? 'اختر سورة لبدء التسجيل' : 'Select a surah to start recording'}
          </Text>
        </View>
      )}

      {/* Bottom Controls */}
      <View style={s.controlsContainer} pointerEvents="box-none">
        <ScaleIn>
          <View style={s.controlsCard}>
            {/* Waveform + Timer */}
            <View style={{ alignItems: 'center', marginBottom: SPACING.base }}>
              <Waveform active={recordingStatus === 'recording'} />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                {recordingStatus === 'recording' && <PulsingDot />}
                <Text style={{
                  fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                  fontSize: FONT_SIZES.xl, letterSpacing: 1,
                  fontVariant: ['tabular-nums'],
                  color: recordingStatus === 'recording' ? '#EF4444'
                    : recordingStatus === 'paused' ? '#F59E0B'
                    : COLORS.textSecondary,
                }}>
                  {formatTime(elapsedMs)}
                </Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={s.controlsRow}>
              {recordingStatus === 'idle' && (
                <>
                  <View />
                  <AnimatedPressable
                    style={[s.recordBtn, { backgroundColor: '#EF4444', ...SHADOWS.gold }]}
                    onPress={startRecording}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="mic" size={26} color="#FFF" />
                  </AnimatedPressable>
                  <View />
                </>
              )}

              {recordingStatus === 'recording' && (
                <>
                  <AnimatedPressable
                    style={[s.smallBtn, { backgroundColor: '#F59E0B' }]}
                    onPress={pauseRecording}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="pause" size={22} color="#FFF" />
                  </AnimatedPressable>
                  <AnimatedPressable
                    style={[s.smallBtn, { backgroundColor: COLORS.gold, opacity: 0 }]}
                    activeOpacity={1}
                  >
                    <View />
                  </AnimatedPressable>
                  <AnimatedPressable
                    style={[s.smallBtn, { backgroundColor: '#EF4444' }]}
                    onPress={stopRecording}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="stop" size={22} color="#FFF" />
                  </AnimatedPressable>
                </>
              )}

              {recordingStatus === 'paused' && (
                <>
                  <AnimatedPressable
                    style={[s.smallBtn, { backgroundColor: '#EF4444', opacity: 0 }]}
                  >
                    <View />
                  </AnimatedPressable>
                  <AnimatedPressable
                    style={[s.recordBtn, { backgroundColor: COLORS.gold, ...SHADOWS.gold }]}
                    onPress={resumeRecording}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="play" size={26} color="#FFF" />
                  </AnimatedPressable>
                  <AnimatedPressable
                    style={[s.smallBtn, { backgroundColor: '#EF4444' }]}
                    onPress={stopRecording}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="stop" size={22} color="#FFF" />
                  </AnimatedPressable>
                </>
              )}
            </View>
          </View>
        </ScaleIn>
      </View>
    </View>
  );

  // ── Recordings Tab ───────────────────────────────────────────────
  const renderRecordingsTab = () => (
    <View style={{ flex: 1 }}>
      {/* Search */}
      <View style={s.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder={isRtl ? 'بحث في التسجيلات...' : 'Search recordings...'}
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <AnimatedPressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </AnimatedPressable>
        )}
      </View>

      <FlatList
        data={filteredRecordings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          filteredRecordings.length === 0 ? s.emptyList : s.recordingsList
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.gold}
            colors={[COLORS.gold]}
          />
        }
        ListEmptyComponent={
          <View style={s.centerContent}>
            <Ionicons name="mic-outline" size={48} color={COLORS.textMuted} />
            <Text style={s.emptyText}>
              {searchQuery
                ? (isRtl ? 'لا توجد نتائج' : 'No results found')
                : t('voiceRecorder.empty')}
            </Text>
            <Text style={s.emptyHint}>
              {searchQuery ? '' : t('voiceRecorder.emptyHint')}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <FadeIn delay={index * 40}>
            <View style={s.recordingCard}>
              <View style={{ marginRight: SPACING.sm }}>
                <View style={[s.surahNumBadge, { width: 40, height: 40, borderRadius: 20 }]}>
                  <Ionicons
                    name={playingId === item.id ? 'stop' : 'play'}
                    size={18}
                    color={COLORS.gold}
                  />
                </View>
              </View>
              <AnimatedPressable
                style={s.recordingInfo}
                onPress={() => togglePlayback(item)}
                activeOpacity={0.7}
              >
                <Text style={s.recordingName} numberOfLines={1}>{item.name}</Text>
                <View style={s.recordingMeta}>
                  <Text style={s.metaText}>{item.surahName}</Text>
                  <Text style={s.metaDot}>·</Text>
                  <Text style={s.metaText}>{formatTime(item.duration)}</Text>
                  <Text style={s.metaDot}>·</Text>
                  <Text style={s.metaText}>{formatDate(item.createdAt)}</Text>
                </View>
              </AnimatedPressable>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <AnimatedPressable
                  style={[s.actionBtn, { backgroundColor: COLORS.goldPale }]}
                  onPress={() => togglePlayback(item)}
                >
                  <Ionicons
                    name={playingId === item.id ? 'stop' : 'play'}
                    size={16}
                    color={COLORS.gold}
                  />
                </AnimatedPressable>
                <AnimatedPressable
                  style={[s.actionBtn, { backgroundColor: COLORS.glassWhite }]}
                  onPress={() => openRename(item.id, item.name)}
                >
                  <Ionicons name="pencil" size={14} color={COLORS.textSecondary} />
                </AnimatedPressable>
                <AnimatedPressable
                  style={[s.actionBtn, { backgroundColor: 'rgba(194,90,74,0.12)' }]}
                  onPress={() => deleteRecording(item.id)}
                >
                  <Ionicons name="trash" size={14} color={COLORS.error} />
                </AnimatedPressable>
              </View>
            </View>
          </FadeIn>
        )}
      />
    </View>
  );

  // ── Main Render ──────────────────────────────────────────────────
  return (
    <View style={s.container}>
      <LogoDecoration size={450} opacity={0.05} position="background" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

      {/* Gradient Header */}
      <LinearGradient colors={['#1A1A2E', '#16213E'] as const} style={s.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={s.headerRow}>
            <Text style={s.headerTitle}>
              {isRtl ? 'التسجيل الصوتي' : 'Voice Recording'}
            </Text>
            {isAuthenticated && (
              <View style={s.syncBadge}>
                <Ionicons
                  name={syncing ? 'sync' : 'cloud-done'}
                  size={12}
                  color={syncing ? '#F59E0B' : '#4ADE80'}
                />
                <Text style={s.syncText}>
                  {syncing
                    ? (isRtl ? 'مزامنة...' : 'Syncing...')
                    : (isRtl ? 'متزامن' : 'Synced')}
                </Text>
              </View>
            )}
          </View>
          {renderTabs()}
        </SafeAreaView>
      </LinearGradient>

      {/* Content */}
      {activeTab === 'record' ? renderRecordTab() : renderRecordingsTab()}

      {/* Surah Picker Modal */}
      {renderSurahPicker()}

      {/* Rename Modal */}
      <Modal visible={showRename} animationType="fade" transparent>
        <View style={s.modalOverlay}>
          <ScaleIn>
            <View style={s.renameModal}>
              <Text style={[s.modalTitle, { marginBottom: SPACING.md }]}>
                {t('voiceRecorder.rename')}
              </Text>
              <TextInput
                style={s.renameInput}
                value={renameText}
                onChangeText={setRenameText}
                autoFocus
                selectTextOnFocus
              />
              <View style={{ flexDirection: 'row', gap: 12, marginTop: SPACING.md }}>
                <AnimatedPressable
                  style={[s.renameBtn, { backgroundColor: COLORS.border }]}
                  onPress={() => setShowRename(false)}
                >
                  <Text style={{ color: COLORS.textPrimary, fontFamily: FONTS.bodyBold }}>
                    {t('voiceRecorder.cancel')}
                  </Text>
                </AnimatedPressable>
                <AnimatedPressable
                  style={[s.renameBtn, { backgroundColor: COLORS.gold, flex: 1 }]}
                  onPress={confirmRename}
                >
                  <Text style={{ color: '#FFF', fontFamily: FONTS.bodyBold }}>
                    {t('voiceRecorder.save')}
                  </Text>
                </AnimatedPressable>
              </View>
            </View>
          </ScaleIn>
        </View>
      </Modal>
    </View>
  );
}
