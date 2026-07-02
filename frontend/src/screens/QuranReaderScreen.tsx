import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TextInput, ActivityIndicator, StatusBar, Alert, Modal,
  Dimensions, Platform, ScrollView, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useApp } from '../context/AppContext';
import { COLORS, GRADIENTS } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { get, post, api } from '../utils/api';
import { ENDPOINTS, TRANSLATIONS } from '../constants/api';
import { saveQuranProgress, saveBookmark, removeBookmark, isBookmarked, getData, storeData, KEYS } from '../utils/storage';
import { Ayah, SurahWithAyahs, Reciter } from '../types';
import { getOfflineSurah } from '../services/offlineQuran';
import LogoDecoration from '../components/LogoDecoration';
import BrandedLoading from '../components/BrandedLoading';
import { FadeIn, AnimatedPressable } from '../components/AnimatedComponents';

type ReaderRoute = RouteProp<{ QuranReader: { surahNumber: number; surahName: string; startAyah?: number } }, 'QuranReader'>;

type SmartMode = 'read' | 'listen' | 'read_listen';
type RepeatOption = 1 | 3 | 5 | 10;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function TajweedText({ text, fontSize, arabicTextStyle }: { text: string; fontSize: number; arabicTextStyle: any }) {
  const appliedSize = Math.min(Math.max(fontSize || 22, 18), 32);
  return (
    <Text style={[arabicTextStyle, { fontSize: appliedSize, lineHeight: appliedSize * 2.4 }]}>
      {text}
    </Text>
  );
}

function AyahView({
  ayah, surahNumber, translation, fontSize, showTranslation,
  isPlaying, isSelected, isBookmarked, hasNote, progressValue,
  showTajweed, nightMode, smartMode, repeatMode, t: tFn,
  onPlay, onPause, onStop, onBookmark, onNote,
  words, currentWordIndex, onWordPress,
  styles,
}: {
  ayah: Ayah; surahNumber: number; translation?: Ayah;
  fontSize: number; showTranslation: boolean;
  isPlaying: boolean; isSelected: boolean;
  isBookmarked: boolean; hasNote: boolean;
  progressValue?: number; showTajweed: boolean;
  nightMode: boolean; smartMode: SmartMode;
  repeatMode: RepeatOption;
  t: (key: string) => string;
  onPlay: () => void; onPause: () => void; onStop: () => void;
  onBookmark: () => void; onNote: () => void;
  words?: string[]; currentWordIndex?: number; onWordPress?: (wordIndex: number) => void;
  styles: any;
}) {
  const showAudioControls = smartMode !== 'read';
  const showWordMode = (smartMode === 'listen' || smartMode === 'read_listen') && words && words.length > 0;
  const appliedFontSize = Math.min(Math.max(fontSize || 22, 18), 32);

  return (
    <AnimatedPressable
      activeOpacity={0.8}
      style={[
        styles.ayahContainer,
        isSelected && styles.ayahSelected,
        isPlaying && styles.ayahPlaying,
        nightMode && styles.ayahNight,
      ]}
    >
      <View style={styles.ayahHeader}>
        <View style={styles.ayahLeft}>
          <View style={[styles.ayahNumBadge, isPlaying && styles.ayahNumBadgePlaying]}>
            <Text style={[styles.ayahNumText, isPlaying && { color: COLORS.green }, { fontSize: Math.max(appliedFontSize - 2, 12) }]}>
              {ayah.numberInSurah}
            </Text>
          </View>
          {hasNote && <Text style={styles.noteDot}>📝</Text>}
          {ayah.sajda && (
            <View style={styles.sajdaMini}>
              <Text style={styles.sajdaMiniText}>۩</Text>
            </View>
          )}
        </View>
        {showAudioControls && (
          <View style={styles.audioActions}>
            {isPlaying ? (
              <>
                <AnimatedPressable style={styles.smallBtn} onPress={onPause}>
                  <Text style={styles.smallBtnText}>⏸</Text>
                </AnimatedPressable>
                <AnimatedPressable style={[styles.smallBtn, { backgroundColor: '#EF4444' }]} onPress={onStop}>
                  <Text style={styles.smallBtnText}>⏹</Text>
                </AnimatedPressable>
              </>
            ) : (
              <AnimatedPressable style={styles.playSmall} onPress={onPlay}>
                <Text style={styles.playSmallText}>▶</Text>
              </AnimatedPressable>
            )}
          </View>
        )}
      </View>

      {showWordMode ? (
        <View style={styles.wordContainer}>
          {words.map((word, idx) => (
            <AnimatedPressable
              key={idx}
              onPress={() => onWordPress?.(idx)}
              style={[
                styles.wordWrapper,
                idx === currentWordIndex && styles.wordHighlighted,
              ]}
              activeOpacity={0.6}
            >
              <Text
                style={[
                  styles.wordText,
                  { fontSize: fontSize + 4 },
                  idx === currentWordIndex && styles.wordHighlightedText,
                ]}
              >
                {word}
              </Text>
            </AnimatedPressable>
          ))}
        </View>
      ) : (
        <TajweedText text={ayah.text} fontSize={fontSize} arabicTextStyle={styles.arabicText} />
      )}

      {isPlaying && progressValue !== undefined && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressValue}%` }]} />
        </View>
      )}

      {showTranslation && translation && (
        <Text style={[styles.translationText, { fontSize: fontSize - 2 }, nightMode && { color: COLORS.textMuted }]}>
          {translation.text}
        </Text>
      )}

      <View style={styles.ayahFooter}>
        <Text style={[styles.ayahMeta, nightMode && { color: COLORS.textMuted }]}>
          {tFn('quran.juz')} {ayah.juz} · {tFn('quran.page')} {ayah.page}
        </Text>
        <View style={styles.ayahFooterActions}>
          <AnimatedPressable onPress={onNote} style={styles.footerBtn}>
            <Text style={[styles.footerBtnText, hasNote && { color: COLORS.gold }]}>
              {hasNote ? '📝' : '📄'}
            </Text>
          </AnimatedPressable>
          <AnimatedPressable onPress={onBookmark} style={styles.footerBtn}>
            <Text style={styles.footerBtnText}>{isBookmarked ? '🔖' : '🏷️'}</Text>
          </AnimatedPressable>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export default function QuranReaderScreen() {
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    containerNight: { backgroundColor: '#050F0B' },
    centerContainer: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
    loadingText: { color: colors.textSecondary, marginTop: 12, fontSize: 14 },
    errorText: { color: colors.error, fontSize: 16 },
    retryBtn: { marginTop: 16, backgroundColor: colors.gold, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
    retryBtnText: { color: colors.green, fontWeight: '700' },
    header: { paddingHorizontal: 12, paddingBottom: 8 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 8 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    backIcon: { fontSize: 18, color: colors.gold },
    headerCenter: { alignItems: 'center', flex: 1, marginHorizontal: 8 },
    headerTitle: { fontSize: 17, color: colors.textPrimary, fontWeight: '700' },
    headerArabic: { fontSize: 14, color: colors.gold, marginTop: 2 },
    fullPlayBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(201,168,76,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.gold },
    fullPlayBtnActive: { backgroundColor: colors.gold },
    fullPlayBtnText: { fontSize: 16, color: colors.gold },
    controlsRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
    controlChip: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
    controlChipLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '500' },
    controlChipValue: { fontSize: 12, color: colors.textPrimary, fontWeight: '600', marginTop: 1 },
    modeRow: { marginBottom: 4 },
    modeChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)' },
    modeChipActive: { backgroundColor: colors.gold },
    modeChipText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
    toolbar: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 6, paddingHorizontal: 10 },
    toolbarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    toolBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)' },
    toolBtnText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
    fontBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    fontBtnText: { color: colors.textPrimary, fontSize: 12, fontWeight: '600' },
    fontValue: { color: colors.gold, fontSize: 12, fontWeight: '700', minWidth: 20, textAlign: 'center' },
    repeatChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
    repeatChipText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
    searchNavBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(201,168,76,0.15)' },
    searchNavText: { fontSize: 11, color: colors.gold, fontWeight: '600' },
    searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, marginHorizontal: 10, marginTop: 6, marginBottom: 4, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10 },
    searchInput: { flex: 1, color: colors.textPrimary, fontSize: 13, paddingVertical: 8 },
    searchClear: { padding: 4 },
    searchClearText: { color: colors.textMuted, fontSize: 14 },
    listContent: { paddingHorizontal: 10, paddingTop: 4 },
    bismillahContainer: { alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 8 },
    bismillahText: { color: colors.gold, textAlign: 'center', fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Amiri' : 'serif' },
    bismillahTrans: { color: colors.textSecondary, textAlign: 'center', marginTop: 6, fontStyle: 'italic' },
    ayahContainer: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    ayahSelected: { borderColor: colors.gold, borderWidth: 1.5 },
    ayahPlaying: { backgroundColor: `${colors.gold}12`, borderColor: colors.gold },
    ayahNight: { backgroundColor: '#0A1510', borderColor: '#1A2A20' },
    ayahHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    ayahLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    ayahNumBadge: { width: 34, height: 34, borderRadius: 8, backgroundColor: `${colors.gold}20`, borderWidth: 1, borderColor: `${colors.gold}40`, alignItems: 'center', justifyContent: 'center' },
    ayahNumBadgePlaying: { backgroundColor: colors.gold, borderColor: colors.gold },
    ayahNumText: { fontSize: 12, color: colors.gold, fontWeight: '700' },
    noteDot: { fontSize: 16 },
    sajdaMini: { backgroundColor: `${colors.info}20`, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    sajdaMiniText: { fontSize: 14, color: colors.info },
    audioActions: { flexDirection: 'row', gap: 6 },
    smallBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
    smallBtnText: { fontSize: 12, color: colors.green, fontWeight: '700' },
    playSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
    playSmallText: { fontSize: 12, color: colors.green, fontWeight: '700' },
    arabicText: { color: colors.textPrimary, textAlign: 'right', lineHeight: 48, fontFamily: Platform.OS === 'ios' ? 'Amiri' : 'serif', writingDirection: 'rtl' },
    translationText: { color: colors.textSecondary, marginTop: 10, lineHeight: 22, fontStyle: 'italic' },
    progressBar: { height: 3, backgroundColor: colors.border, borderRadius: 2, marginTop: 8, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 2 },
    ayahFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    ayahMeta: { fontSize: 10, color: colors.textMuted },
    ayahFooterActions: { flexDirection: 'row', gap: 6 },
    footerBtn: { padding: 2 },
    footerBtnText: { fontSize: 16 },
    wordContainer: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      marginTop: 4,
    },
    wordWrapper: {
      paddingHorizontal: 3,
      paddingVertical: 2,
      marginHorizontal: 1,
      marginVertical: 2,
      borderRadius: 6,
    },
    wordHighlighted: {
      backgroundColor: colors.gold,
      borderRadius: 8,
      paddingHorizontal: 4,
      paddingVertical: 3,
    },
    wordHighlightedText: {
      color: colors.green,
    },
    wordText: {
      color: colors.textPrimary,
      fontFamily: Platform.OS === 'ios' ? 'Amiri' : 'serif',
      writingDirection: 'rtl',
      lineHeight: 48,
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalSheet: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', paddingBottom: 30 },
    modalHandle: { width: 40, height: 4, backgroundColor: colors.textMuted, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 8 },
    modalTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 12, paddingHorizontal: 16 },
    modalClose: { paddingVertical: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4 },
    modalCloseText: { color: colors.gold, fontSize: 15, fontWeight: '600' },
    pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
    pickerItemName: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
    pickerItemArabic: { fontSize: 12, color: colors.gold, marginTop: 2 },
    pickerItemSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
    pickerCheck: { color: colors.gold, fontSize: 18, fontWeight: '700' },
    modalCard: { backgroundColor: colors.card, borderRadius: 16, padding: 20, width: '88%', borderWidth: 1, borderColor: colors.border, alignSelf: 'center', marginTop: 'auto', marginBottom: 'auto' },
    noteInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.textPrimary, marginBottom: 14, textAlignVertical: 'top', minHeight: 100, fontSize: 14 },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    modalActionBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.gold },
    modalActionText: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
  }));

  const navigation = useNavigation<any>();
  const route = useRoute<ReaderRoute>();
  const { surahNumber, surahName, startAyah } = route.params;
  const { selectedReciter, setSelectedReciter, reciters, user, language, t } = useApp();

  const [surah, setSurah] = useState<SurahWithAyahs | null>(null);
  const [translation, setTranslation] = useState<SurahWithAyahs | null>(null);
  const [loading, setLoading] = useState(true);

  const [smartMode, setSmartMode] = useState<SmartMode>('read_listen');
  const [repeatMode, setRepeatMode] = useState<RepeatOption>(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showTranslation, setShowTranslation] = useState(true);
  const [nightMode, setNightMode] = useState(false);
  const [showTajweed, setShowTajweed] = useState(false);
  const [fontSize, setFontSize] = useState(user?.settings?.fontSize || 22);
  const [searchText, setSearchText] = useState('');
  const [selectedAyah, setSelectedAyah] = useState<number | null>(null);
  const [translationLang, setTranslationLang] = useState(user?.settings?.translationLanguage || 'en.sahih');

  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [isPlayingFull, setIsPlayingFull] = useState(false);
  const [progress, setProgress] = useState<Record<number, number>>({});
  const soundRef = useRef<Audio.Sound | null>(null);
  const playCountRef = useRef(0);

  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  const [activeWordAyah, setActiveWordAyah] = useState<number | null>(null);
  const [ayahWordsMap, setAyahWordsMap] = useState<Record<number, string[]>>({});

  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [currentAyahForNote, setCurrentAyahForNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [showReciterPicker, setShowReciterPicker] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);

  const { height: screenHeight } = useWindowDimensions();
  const flatListRef = useRef<FlatList<Ayah>>(null);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const prevModeRef = useRef<SmartMode>(smartMode);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDimensions(window));
    return () => sub?.remove();
  }, []);

  const isLandscapeMode = dimensions.width > 600;
  const bookmarkKey = (s: number, a: number) => `${s}:${a}`;

  useEffect(() => {
    const prev = prevModeRef.current;
    prevModeRef.current = smartMode;
    if (prev !== smartMode && (smartMode === 'listen' || smartMode === 'read_listen')) {
      if (!playingAyah && !isPlayingFull && surah?.ayahs?.length) {
        const target = selectedAyah || surah.ayahs[0].numberInSurah;
        playAyah(target);
      }
    }
  }, [smartMode]);

  useEffect(() => {
    loadSurah();
    loadBookmarkState();
    loadNotes();
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, [surahNumber, translationLang]);

  const loadBookmarkState = async () => {
    const stored = await getData<Array<{ surah: number; ayah: number }>>(KEYS.BOOKMARKS, []);
    if (stored) {
      setBookmarkedAyahs(new Set(stored.map(b => bookmarkKey(b.surah, b.ayah))));
    }
  };

  const loadNotes = async () => {
    const stored = await getData<Record<string, string>>(KEYS.NOTES, {});
    if (stored) setNotes(stored);
  };

  const splitAyahIntoWords = (text: string): string[] =>
    text.split(/\s+/).filter(w => w.trim().length > 0);

  const loadSurah = async () => {
    try {
      setLoading(true);

      const offline = getOfflineSurah(surahNumber);
      if (!offline) {
        throw new Error('Failed to load surah');
      }

      setSurah(offline);

      if (offline?.ayahs) {
        const wordsMap: Record<number, string[]> = {};
        offline.ayahs.forEach((a: Ayah) => {
          wordsMap[a.numberInSurah] = splitAyahIntoWords(a.text);
        });
        setAyahWordsMap(wordsMap);
      }

      (async () => {
        try {
          const transRes = await api.get<any>(`/quran/surah/${surahNumber}/with-translation`, {
            params: { lang: translationLang },
          });
          const transData = transRes.data?.data || transRes.data || transRes;
          setTranslation(transData.translation || transData);
        } catch {
          const cachedTrans = await getData<any>(`translation_${surahNumber}_${translationLang}`);
          setTranslation(cachedTrans);
        }
      })();

      if (startAyah && offline?.ayahs) {
        const idx = offline.ayahs.findIndex((a: Ayah) => a.numberInSurah === startAyah);
        if (idx >= 0) {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: idx, viewPosition: 0.3, animated: true });
          }, 500);
        }
      }
    } catch (err: any) {
      console.error('loadSurah error', err);
      Alert.alert('Error', err.message || 'Failed to load surah');
    } finally {
      setLoading(false);
    }
  };

  const getGlobalAyahNumber = (surah: number, ayah: number): number => {
    const ayahCounts: Record<number, number> = {
      1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
      11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135,
      21: 112, 22: 78, 23: 118, 24: 64, 25: 77, 26: 227, 27: 93, 28: 88, 29: 69, 30: 60,
      31: 34, 32: 30, 33: 73, 34: 54, 35: 45, 36: 83, 37: 182, 38: 88, 39: 75, 40: 85,
      41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38, 48: 29, 49: 18, 50: 45,
      51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29, 58: 22, 59: 24, 60: 13,
      61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44,
      71: 28, 72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42,
      81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20,
      91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
      101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 4, 109: 6, 110: 3,
      111: 5, 112: 4, 113: 5, 114: 6,
    };
    let globalNum = ayah;
    for (let i = 1; i < surah; i++) {
      globalNum += ayahCounts[i] || 0;
    }
    return globalNum;
  };

  const getAudioId = (): string => {
    const reciter = reciters.find((r: Reciter) => r.id === selectedReciter);
    return reciter?.audioId || selectedReciter;
  };

  const getAyahAudioUri = async (globalAyahNumber: number): Promise<string> => {
    const audioId = getAudioId();
    const localPath = `${FileSystem.documentDirectory}reciter_audio/${audioId}/${globalAyahNumber}.mp3`;
    try {
      const info = await FileSystem.getInfoAsync(localPath);
      if (info.exists) return localPath;
    } catch {}
    return `https://cdn.islamic.network/quran/audio/128/${audioId}/${globalAyahNumber}.mp3`;
  };

  const buildSurahAudioUrl = () =>
    `https://cdn.islamic.network/quran/audio-surah/128/${getAudioId()}/${String(surahNumber).padStart(3, '0')}.mp3`;

  const handleWordPress = async (wordIndex: number) => {
    if (!soundRef.current || !playingAyah) return;
    try {
      const words = ayahWordsMap[playingAyah];
      if (!words || words.length === 0) return;

      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded || !status.durationMillis) return;

      const wordDur = status.durationMillis / words.length;
      await soundRef.current.setPositionAsync(wordIndex * wordDur);
      setCurrentWordIndex(wordIndex);
    } catch (err) {
      console.warn('handleWordPress error:', err);
    }
  };

  const playAyah = async (ayahNumber: number) => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      if (playingAyah === ayahNumber) {
        setPlayingAyah(null);
        setActiveWordAyah(null);
        setCurrentWordIndex(-1);
        return;
      }

      const globalNum = getGlobalAyahNumber(surahNumber, ayahNumber);
      const audioUrl = await getAyahAudioUri(globalNum);
      setPlayingAyah(ayahNumber);
      setActiveWordAyah(ayahNumber);
      setCurrentWordIndex(-1);
      playCountRef.current = 0;

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true, progressUpdateIntervalMillis: 100, rate: playbackSpeed }
      );
      soundRef.current = sound;

      const ayah = surah?.ayahs?.find((a: Ayah) => a.numberInSurah === ayahNumber);
      const words = ayah ? ayahWordsMap[ayahNumber] || splitAyahIntoWords(ayah.text) : [];

      const ayahIndex = surah?.ayahs?.findIndex((a: Ayah) => a.numberInSurah === ayahNumber) ?? -1;
      if (ayahIndex >= 0 && flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: ayahIndex, viewPosition: 0.4, animated: true });
      }

      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) {
          playCountRef.current++;
          if (playCountRef.current < repeatMode) {
            sound.replayAsync().catch(() => {});
          } else {
            setPlayingAyah(null);
            setActiveWordAyah(null);
            setCurrentWordIndex(-1);
            if (smartMode === 'listen' && surah?.ayahs) {
              const nextAyah = surah.ayahs.find((a: Ayah) => a.numberInSurah > ayahNumber);
              if (nextAyah && nextAyah.numberInSurah <= (surah?.numberOfAyahs || 0)) {
                playAyah(nextAyah.numberInSurah);
              }
            }
          }
        }
        if (status.isLoaded && status.durationMillis) {
          setProgress(prev => ({
            ...prev,
            [ayahNumber]: (status.positionMillis / status.durationMillis) * 100,
          }));

          if (words.length > 0) {
            const wordDur = status.durationMillis / words.length;
            const idx = Math.min(
              Math.floor(status.positionMillis / wordDur),
              words.length - 1
            );
            setCurrentWordIndex(idx);
          }
        }
      });

      await saveQuranProgress(surahNumber, ayahNumber);
    } catch (err: any) {
      console.warn('playAyah error:', err);
      setPlayingAyah(null);
      setActiveWordAyah(null);
      setCurrentWordIndex(-1);
      Alert.alert('Audio Error', 'Could not play audio. Please check your connection.');
    }
  };

  const playFullSurah = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      if (isPlayingFull) {
        setIsPlayingFull(false);
        setActiveWordAyah(null);
        setCurrentWordIndex(-1);
        return;
      }

      const audioUrl = buildSurahAudioUrl();
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true, rate: playbackSpeed }
      );
      soundRef.current = sound;
      setIsPlayingFull(true);
      setActiveWordAyah(null);
      setCurrentWordIndex(-1);

      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingFull(false);
          setActiveWordAyah(null);
          setCurrentWordIndex(-1);
        }
      });
    } catch {
      setIsPlayingFull(false);
      Alert.alert('Audio Error', 'Failed to play surah audio.');
    }
  };

  const pauseAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setPlayingAyah(null);
    }
  };

  const stopAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      setPlayingAyah(null);
      setIsPlayingFull(false);
      setActiveWordAyah(null);
      setCurrentWordIndex(-1);
      playCountRef.current = 0;
    }
  };

  const toggleBookmark = async (ayahNumber: number) => {
    const key = bookmarkKey(surahNumber, ayahNumber);
    try {
      const result = await saveBookmark(surahNumber, ayahNumber);
      setBookmarkedAyahs(new Set(
        result.bookmarks.map((b: { surah: number; ayah: number }) => bookmarkKey(b.surah, b.ayah))
      ));
    } catch (err: any) {
      Alert.alert('Error', 'Failed to toggle bookmark');
    }
  };

  const openNoteModal = (ayahNumber: number) => {
    const key = bookmarkKey(surahNumber, ayahNumber);
    setCurrentAyahForNote(key);
    setNoteText(notes[key] || '');
    setShowNoteModal(true);
  };

  const saveNote = async () => {
    if (!currentAyahForNote) return;
    try {
      const newNotes = { ...notes };
      if (noteText.trim()) {
        newNotes[currentAyahForNote] = noteText;
      } else {
        delete newNotes[currentAyahForNote];
      }
      setNotes(newNotes);
      await storeData(KEYS.NOTES, newNotes);
      setShowNoteModal(false);
      setCurrentAyahForNote(null);
      setNoteText('');
    } catch {
      Alert.alert('Error', 'Failed to save note');
    }
  };

  const selectedReciterName = useMemo(() => {
    const found = reciters.find((r: Reciter) => r.id === selectedReciter);
    return found?.name || selectedReciter;
  }, [reciters, selectedReciter]);

  const selectedLangName = useMemo(() => {
    const found = TRANSLATIONS.find(t => t.id === translationLang);
    return found?.name || translationLang;
  }, [translationLang]);

  const filteredAyahs = useMemo(() => {
    if (!surah?.ayahs) return [];
    if (!searchText.trim()) return surah.ayahs;
    const q = searchText.toLowerCase();
    return surah.ayahs.filter((a: Ayah) =>
      a.text.includes(q) || (translation?.ayahs?.find((t: Ayah) => t.numberInSurah === a.numberInSurah)?.text || '').toLowerCase().includes(q)
    );
  }, [surah, translation, searchText]);

  const renderAyah = useCallback(({ item }: { item: Ayah }) => {
    const trans = translation?.ayahs?.find((t: Ayah) => t.numberInSurah === item.numberInSurah);
    const bkKey = bookmarkKey(surahNumber, item.numberInSurah);
    const isBookmarkedFlag = bookmarkedAyahs.has(bkKey);
    const hasNoteFlag = !!notes[bkKey];
    const showWordMode = smartMode === 'listen' || smartMode === 'read_listen';
    const ayahWords = showWordMode
      ? (ayahWordsMap[item.numberInSurah] || splitAyahIntoWords(item.text))
      : undefined;
    const wordIndex = activeWordAyah === item.numberInSurah ? currentWordIndex : -1;

    return (
      <AyahView
        ayah={item}
        surahNumber={surahNumber}
        translation={trans}
        fontSize={fontSize}
        showTranslation={showTranslation}
        isPlaying={playingAyah === item.numberInSurah}
        isSelected={selectedAyah === item.numberInSurah}
        isBookmarked={isBookmarkedFlag}
        hasNote={hasNoteFlag}
        progressValue={progress[item.numberInSurah]}
        showTajweed={showTajweed}
        nightMode={nightMode}
        smartMode={smartMode}
        repeatMode={repeatMode}
        t={t}
        words={ayahWords}
        currentWordIndex={wordIndex}
        onWordPress={handleWordPress}
        onPlay={() => {
          setSelectedAyah(item.numberInSurah);
          playAyah(item.numberInSurah);
        }}
        onPause={pauseAudio}
        onStop={stopAudio}
        onBookmark={() => toggleBookmark(item.numberInSurah)}
        onNote={() => openNoteModal(item.numberInSurah)}
        styles={styles}
      />
    );
  }, [
    translation, bookmarkKey, surahNumber, bookmarkedAyahs, notes,
    smartMode, ayahWordsMap, splitAyahIntoWords, activeWordAyah,
    currentWordIndex, fontSize, showTranslation, playingAyah,
    selectedAyah, progress, showTajweed, nightMode, repeatMode, t,
    handleWordPress, setSelectedAyah, playAyah, pauseAudio, stopAudio,
    toggleBookmark, openNoteModal, styles,
  ]);

  if (loading) {
    return <BrandedLoading />;
  }

  if (!surah) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{t('common.loadingError')}</Text>
        <AnimatedPressable onPress={loadSurah} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
        </AnimatedPressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, nightMode && styles.containerNight]}>
      <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={GRADIENTS.brand} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={[styles.headerRow, isLandscapeMode && { paddingHorizontal: 20 }]}>
            <AnimatedPressable onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backIcon}>←</Text>
            </AnimatedPressable>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle} numberOfLines={1}>{surah.englishName}</Text>
              <Text style={styles.headerArabic}>{surah.name}</Text>
            </View>
            <AnimatedPressable
              onPress={playFullSurah}
              style={[styles.fullPlayBtn, isPlayingFull && styles.fullPlayBtnActive]}
            >
              <Text style={[styles.fullPlayBtnText, isPlayingFull && { color: COLORS.green }]}>
                {isPlayingFull ? '⏹' : '▶'}
              </Text>
            </AnimatedPressable>
          </View>

          <View style={styles.controlsRow}>
            <AnimatedPressable style={styles.controlChip} onPress={() => setShowReciterPicker(true)}>
              <Text style={styles.controlChipLabel}>{t('quran.reciter')}</Text>
              <Text style={styles.controlChipValue} numberOfLines={1}>{selectedReciterName}</Text>
            </AnimatedPressable>
            <AnimatedPressable style={styles.controlChip} onPress={() => setShowLangPicker(true)}>
              <Text style={styles.controlChipLabel}>{t('quran.translation')}</Text>
              <Text style={styles.controlChipValue} numberOfLines={1}>{selectedLangName}</Text>
            </AnimatedPressable>
          </View>

          <View style={styles.modeRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 6 }}>
              {(['read_listen', 'read', 'listen'] as SmartMode[]).map(mode => (
                <AnimatedPressable
                  key={mode}
                  style={[styles.modeChip, smartMode === mode && styles.modeChipActive]}
                  onPress={() => setSmartMode(mode)}
                >
                  <Text style={[styles.modeChipText, smartMode === mode && { color: COLORS.green }]}>
                    {mode === 'read_listen' ? t('quran.readListen') : mode === 'read' ? t('quran.read') : t('quran.listen')}
                  </Text>
                </AnimatedPressable>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={[styles.toolbar, nightMode && { backgroundColor: '#0A1510', borderBottomColor: '#1A2A20' }]}>
        <View style={styles.toolbarRow}>
          <AnimatedPressable
            style={[styles.toolBtn, showTranslation && { backgroundColor: COLORS.gold }]}
            onPress={() => setShowTranslation(!showTranslation)}
          >
            <Text style={[styles.toolBtnText, showTranslation && { color: COLORS.green }]}>
              {t('quran.translation')}
            </Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={[styles.toolBtn, nightMode && { backgroundColor: COLORS.gold }]}
            onPress={() => setNightMode(!nightMode)}
          >
            <Text style={[styles.toolBtnText, nightMode && { color: COLORS.green }]}>
              {nightMode ? '☀️' : '🌙'}
            </Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={[styles.toolBtn, showTajweed && { backgroundColor: COLORS.gold }]}
            onPress={() => setShowTajweed(!showTajweed)}
          >
            <Text style={[styles.toolBtnText, showTajweed && { color: COLORS.green }]}>
              {t('quran.tajweed')}
            </Text>
          </AnimatedPressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <AnimatedPressable style={styles.fontBtn} onPress={() => setFontSize(f => Math.max(14, f - 2))}>
              <Text style={styles.fontBtnText}>A-</Text>
            </AnimatedPressable>
            <Text style={styles.fontValue}>{fontSize}</Text>
            <AnimatedPressable style={styles.fontBtn} onPress={() => setFontSize(f => Math.min(36, f + 2))}>
              <Text style={styles.fontBtnText}>A+</Text>
            </AnimatedPressable>
          </View>
        </View>

        <View style={styles.toolbarRow}>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <AnimatedPressable
              style={[styles.repeatChip, playbackSpeed !== 1.0 && { backgroundColor: COLORS.gold, borderColor: COLORS.gold }]}
              onPress={() => {
                const SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
                const idx = SPEEDS.indexOf(playbackSpeed);
                setPlaybackSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
              }}
            >
              <Text style={[styles.repeatChipText, playbackSpeed !== 1.0 && { color: COLORS.green }]}>
                {playbackSpeed}x
              </Text>
            </AnimatedPressable>
            {([1, 3, 5, 10] as RepeatOption[]).map(n => (
              <AnimatedPressable
                key={n}
                style={[styles.repeatChip, repeatMode === n && { backgroundColor: COLORS.gold, borderColor: COLORS.gold }]}
                onPress={() => setRepeatMode(n)}
              >
                <Text style={[styles.repeatChipText, repeatMode === n && { color: COLORS.green }]}>
                  {n}x
                </Text>
              </AnimatedPressable>
            ))}
          </View>
          <AnimatedPressable
            style={styles.searchNavBtn}
            onPress={() => navigation.navigate('QuranSearch')}
          >
            <Text style={styles.searchNavText}>{t('common.search')}</Text>
          </AnimatedPressable>
        </View>
      </View>

      <View style={[styles.searchRow, nightMode && { backgroundColor: 'transparent' }]}>
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          style={[styles.searchInput, nightMode && { color: COLORS.textMuted }]}
          placeholder={`${t('common.search')} ${surah.englishName}...`}
          placeholderTextColor={COLORS.textMuted}
        />
        {searchText.length > 0 && (
          <AnimatedPressable onPress={() => setSearchText('')} style={styles.searchClear}>
            <Text style={styles.searchClearText}>✕</Text>
          </AnimatedPressable>
        )}
      </View>

      <FadeIn>
      <FlatList
        ref={flatListRef}
        data={filteredAyahs}
        keyExtractor={(item: Ayah) => item.number.toString()}
        renderItem={renderAyah}
        contentContainerStyle={[styles.listContent, isLandscapeMode && { paddingHorizontal: 40 }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={7}
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
        }}
        ListHeaderComponent={
          surahNumber !== 1 && surahNumber !== 9 ? (
            <View style={styles.bismillahContainer}>
              <Text style={[styles.bismillahText, { fontSize: fontSize + 8 }]}>
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </Text>
              {showTranslation && (
                <Text style={[styles.bismillahTrans, { fontSize: fontSize - 4 }]}>
                  In the name of Allah, the Most Gracious, the Most Merciful
                </Text>
              )}
            </View>
          ) : null
        }
        ListFooterComponent={<View style={{ height: 40 }} />}
      />
      </FadeIn>

      <Modal visible={showReciterPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, nightMode && { backgroundColor: COLORS.cardWarm }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('quran.reciter')}</Text>
            <FlatList
              data={reciters}
              keyExtractor={(item: Reciter) => item.id}
              style={{ maxHeight: Math.floor(screenHeight * 0.4) }}
              renderItem={({ item }: { item: Reciter }) => (
                <AnimatedPressable
                  style={[styles.pickerItem, selectedReciter === item.id && { backgroundColor: `${COLORS.gold}15` }]}
                  onPress={() => {
                    setSelectedReciter(item.id);
                    setShowReciterPicker(false);
                  }}
                >
                  <View>
                    <Text style={styles.pickerItemName}>{item.name}</Text>
                    {item.arabicName && <Text style={styles.pickerItemArabic}>{item.arabicName}</Text>}
                  </View>
                  {selectedReciter === item.id && <Text style={styles.pickerCheck}>✓</Text>}
                </AnimatedPressable>
              )}
            />
            <AnimatedPressable style={styles.modalClose} onPress={() => setShowReciterPicker(false)}>
              <Text style={styles.modalCloseText}>{t('common.close')}</Text>
            </AnimatedPressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showLangPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, nightMode && { backgroundColor: COLORS.cardWarm }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('quran.translation')}</Text>
            <FlatList
              data={TRANSLATIONS}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: Math.floor(screenHeight * 0.4) }}
              renderItem={({ item }) => (
                <AnimatedPressable
                  style={[styles.pickerItem, translationLang === item.id && { backgroundColor: `${COLORS.gold}15` }]}
                  onPress={() => {
                    setTranslationLang(item.id);
                    setShowLangPicker(false);
                  }}
                >
                  <View>
                    <Text style={styles.pickerItemName}>{item.name}</Text>
                    <Text style={styles.pickerItemSub}>{item.language}</Text>
                  </View>
                  {translationLang === item.id && <Text style={styles.pickerCheck}>✓</Text>}
                </AnimatedPressable>
              )}
            />
            <AnimatedPressable style={styles.modalClose} onPress={() => setShowLangPicker(false)}>
              <Text style={styles.modalCloseText}>{t('common.close')}</Text>
            </AnimatedPressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showNoteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, nightMode && { backgroundColor: COLORS.cardWarm }]}>
            <Text style={styles.modalTitle}>{t('quran.addNote')}</Text>
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              style={[styles.noteInput, nightMode && { color: COLORS.textMuted, borderColor: '#1A2A20' }]}
              placeholder={`${t('quran.note')}...`}
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              autoFocus
            />
            <View style={styles.modalActions}>
              <AnimatedPressable
                style={styles.modalActionBtn}
                onPress={() => {
                  setShowNoteModal(false);
                  setCurrentAyahForNote(null);
                  setNoteText('');
                }}
              >
                <Text style={styles.modalActionText}>{t('common.cancel')}</Text>
              </AnimatedPressable>
              <AnimatedPressable style={[styles.modalActionBtn, { backgroundColor: COLORS.gold }]} onPress={saveNote}>
                <Text style={[styles.modalActionText, { color: COLORS.green }]}>{t('common.save')}</Text>
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
