import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  StatusBar, Alert, Modal, TextInput, ScrollView, Dimensions, useWindowDimensions,
  Platform, PanResponder, PanResponderInstance, Animated, FlatList, Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useApp } from '../context/AppContext';
import { COLORS, GRADIENTS } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useMemorizeMode } from '../hooks/useMemorizeMode';
import api from '../utils/api';
import { TRANSLATIONS } from '../constants/api';
import { getPage as getOfflinePage } from '../services/offlineQuran';
import BrandedLoading from '../components/BrandedLoading';
import {
  storeData, getData, multiRemoveData, KEYS,
  saveBookmark, saveFavoriteAyah, removeFavoriteAyah,
} from '../utils/storage';
import { QuranPage, QuranPageAyah, Reciter } from '../types';
import TajweedHighlightedText from '../components/TajweedHighlightedText';
import LogoDecoration from '../components/LogoDecoration';
import { AnimatedPressable } from '../components/AnimatedComponents';

const SURAH_START_PAGES: Record<number, number> = {
  1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187,
  10: 208, 11: 221, 12: 235, 13: 249, 14: 255, 15: 262, 16: 267, 17: 282,
  18: 293, 19: 305, 20: 312, 21: 322, 22: 332, 23: 342, 24: 350, 25: 359,
  26: 367, 27: 377, 28: 385, 29: 396, 30: 404, 31: 411, 32: 415, 33: 418,
  34: 428, 35: 434, 36: 440, 37: 446, 38: 453, 39: 458, 40: 467, 41: 477,
  42: 483, 43: 489, 44: 496, 45: 499, 46: 502, 47: 507, 48: 511, 49: 515,
  50: 518, 51: 520, 52: 523, 53: 526, 54: 528, 55: 531, 56: 534, 57: 537,
  58: 542, 59: 545, 60: 549, 61: 551, 62: 553, 63: 554, 64: 556, 65: 558,
  66: 560, 67: 562, 68: 564, 69: 566, 70: 568, 71: 570, 72: 572, 73: 574,
  74: 575, 75: 577, 76: 578, 77: 580, 78: 582, 79: 583, 80: 585, 81: 586,
  82: 587, 83: 587, 84: 589, 85: 590, 86: 591, 87: 591, 88: 592, 89: 593,
  90: 594, 91: 595, 92: 595, 93: 596, 94: 596, 95: 597, 96: 597, 97: 598,
  98: 598, 99: 599, 100: 599, 101: 600, 102: 600, 103: 601, 104: 601,
  105: 601, 106: 602, 107: 602, 108: 602, 109: 603, 110: 603, 111: 603,
  112: 604, 113: 604, 114: 604,
};



function NavButton({ iconName, onPress, disabled, navBtnStyle, navBtnDisabledStyle, navBtnIconStyle }: { iconName: 'chevron-back' | 'chevron-forward' | 'chevron-back-circle' | 'chevron-forward-circle'; onPress: () => void; disabled: boolean; navBtnStyle: any; navBtnDisabledStyle: any; navBtnIconStyle: any }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.86, useNativeDriver: true, friction: 8 }).start();
  };
  const pressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <AnimatedPressable
        activeOpacity={0.7}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        style={[navBtnStyle, disabled && navBtnDisabledStyle]}
      >
        <Ionicons name={iconName} size={26} style={[navBtnIconStyle, disabled && { opacity: 0.25 }]} />
      </AnimatedPressable>
    </Animated.View>
  );
}

const JUZ_START_PAGES: Record<number, number> = {
  1: 1, 2: 22, 3: 42, 4: 62, 5: 82, 6: 102, 7: 121, 8: 142, 9: 162, 10: 182,
  11: 201, 12: 222, 13: 242, 14: 262, 15: 282, 16: 302, 17: 322, 18: 342,
  19: 362, 20: 382, 21: 402, 22: 422, 23: 442, 24: 462, 25: 482, 26: 502,
  27: 522, 28: 542, 29: 562, 30: 582,
};

const JUZ_NAMES: Record<number, string> = {
  1: 'الم', 2: 'سَيَقُولُ', 3: 'تِلْكَ الرُّسُلُ', 4: 'لَنْ تَنَالُوا',
  5: 'وَالْمُحْصَنَاتُ', 6: 'لَا يُحِبُّ', 7: 'وَإِذَا سَمِعُوا',
  8: 'وَلَوْ أَنَّنَا', 9: 'قَالَ الْمَلَأُ', 10: 'وَاعْلَمُوا',
  11: 'يَعْتَذِرُونَ', 12: 'وَمَا مِنْ دَابَّةٍ', 13: 'وَمَا أُبَرِّئُ',
  14: 'رُبَمَا', 15: 'سُبْحَانَ', 16: 'قَالَ أَلَمْ', 17: 'اقْتَرَبَ',
  18: 'قَدْ أَفْلَحَ', 19: 'وَقَالَ الَّذِينَ', 20: 'أَمَّنْ خَلَقَ',
  21: 'اتْلُ مَا أُوحِيَ', 22: 'وَمَنْ يَقْنُتْ', 23: 'وَمَا لِيَ',
  24: 'فَمَنْ أَظْلَمُ', 25: 'إِلَيْهِ يُرَدُّ', 26: 'حم',
  27: 'قَالَ فَمَا خَطْبُكُمْ', 28: 'قَدْ سَمِعَ', 29: 'تَبَارَكَ الَّذِي',
  30: 'عَمَّ',
};

type ReaderRoute = RouteProp<
  { QuranPageReader: { initialPage?: number; surahNumber?: number; ayahNumber?: number } },
  'QuranPageReader'
>;

type RepeatOption = 1 | 3 | 5 | 10;

const STORAGE_LAST_PAGE = 'aiqan_last_quran_page';
const STORAGE_READER_SETTINGS = 'aiqan_reader_settings';
const CACHE_VERSION_KEY = 'aiqan_page_cache_ver';
const PAGE_CACHE_VER = 4;

interface ReaderSettings {
  fontSize: number;
  showTranslation: boolean;
  translationLang: string;
  repeatMode: RepeatOption;
  showTajweed: boolean;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 24,
  showTranslation: false,
  translationLang: 'en.sahih',
  repeatMode: 1,
  showTajweed: false,
};

function AyahNumber({ num, style }: { num: number; style: any }) {
  return (
    <Text style={style}>
      {'﴿'}{num}{'﴾'}
    </Text>
  );
}

function BismillahBanner({ fontSize, styles }: { fontSize: number; styles: any }) {
  return (
    <View style={styles.bismillahBanner}>
      <Text style={[styles.bismillahText, { fontSize: fontSize + 2 }]}>
        بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِيمِ
      </Text>
    </View>
  );
}

function SurahHeader({
  name, englishName, number, styles,
}: { name: string; englishName: string; number: number; styles: any }) {
  return (
    <View style={styles.surahHeader}>
      <Text style={styles.surahHeaderNumber}>{number}</Text>
      <View style={styles.surahHeaderCenter}>
        <Text style={styles.surahHeaderArabic}>{name}</Text>
        <Text style={styles.surahHeaderEnglish}>{englishName}</Text>
      </View>
      <Text style={styles.surahHeaderNumber}>{number}</Text>
    </View>
  );
}

export default function QuranPageReaderScreen() {
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 12, paddingBottom: 6 },
    headerRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', marginTop: 6, marginBottom: 6,
    },
    backBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
    },
    backBtnText: { fontSize: 18, color: colors.gold },
    headerCenter: { flex: 1, alignItems: 'center', marginHorizontal: 8 },
    headerSurahArabic: { fontSize: 16, color: colors.gold, fontWeight: '700' },
    headerSurahEnglish: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
    headerRight: { alignItems: 'flex-end' },
    juzBadge: {
      backgroundColor: 'rgba(201,168,76,0.2)', borderRadius: 8,
      paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: `${colors.gold}40`,
    },
    juzBadgeText: { fontSize: 11, color: colors.gold, fontWeight: '600' },
    toolbarScroll: { maxHeight: 42 },
    toolbarContent: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 4 },
    chip: {
      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    chipActive: { backgroundColor: colors.gold },
    chipContinuous: { borderWidth: 1, borderColor: `${colors.gold}60` },
    chipText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
    chipTextActive: { color: colors.green },
    toolSep: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 2 },
    fontSizeLabel: { fontSize: 12, color: colors.gold, fontWeight: '700', minWidth: 22, textAlign: 'center' },
    pageArea: { flex: 1 },
    pageAreaLandscape: { paddingHorizontal: 40 },
    bookPageWrap: {
      flex: 1,
      marginHorizontal: 4,
      borderRadius: 4,
      overflow: 'hidden',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pageSheet: {
      flex: 1,
      borderRadius: 0,
      overflow: 'hidden',
    },
    arabicFlowText: {
      textAlign: 'right',
      writingDirection: 'rtl',
      fontFamily: Platform.OS === 'ios' ? 'Scheherazade New' : 'serif',
      paddingHorizontal: 14,
      paddingBottom: 20,
      color: colors.textPrimary,
      letterSpacing: 0.2,
    },
    ayahFlowText: {
      color: colors.textPrimary,
      writingDirection: 'rtl',
      fontFamily: Platform.OS === 'ios' ? 'Scheherazade New' : 'serif',
      letterSpacing: 0.2,
    },
    pageScroll: { flex: 1 },
    pageScrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    pageScrollContentLandscape: { paddingHorizontal: 60 },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    loadingText: { marginTop: 12, fontSize: 14 },
    surahHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.goldPale, borderRadius: 14, padding: 14,
      marginVertical: 14, borderWidth: 1, borderColor: `${colors.gold}30`,
    },
    surahHeaderNumber: {
      fontSize: 13, color: colors.gold, fontWeight: '800',
      minWidth: 28, textAlign: 'center',
    },
    surahHeaderCenter: { alignItems: 'center', flex: 1 },
    surahHeaderArabic: { fontSize: 22, color: colors.textPrimary, fontWeight: '700' },
    surahHeaderEnglish: { fontSize: 12, color: colors.textSecondary, marginTop: 3, letterSpacing: 0.3 },
    bismillahBanner: {
      alignItems: 'center', paddingVertical: 14, marginBottom: 10,
      borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.15)',
    },
    bismillahText: {
      color: colors.textPrimary,
      fontFamily: Platform.OS === 'ios' ? 'Amiri' : 'serif',
      fontWeight: '600',
      textAlign: 'center',
      writingDirection: 'rtl',
      fontSize: 20,
      letterSpacing: 0.5,
    },
    ayahWrap: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginVertical: 2,
      borderRadius: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    ayahWrapPlaying: {
      backgroundColor: colors.goldPale,
      borderLeftWidth: 3,
      borderLeftColor: colors.gold,
      borderBottomColor: 'transparent',
      borderRadius: 0,
      borderTopRightRadius: 8,
      borderBottomRightRadius: 8,
    },
    ayahWrapEnd: { borderBottomWidth: 0 },
    sajdaSymbol: { color: colors.gold, fontSize: 14, marginRight: 4 },
    arabicText: {
      textAlign: 'right',
      writingDirection: 'rtl',
      lineHeight: 56,
      color: colors.ayahText,
      fontFamily: Platform.OS === 'ios' ? 'Scheherazade New' : 'serif',
      letterSpacing: 0.3,
    },
    arabicTextPlaying: { color: colors.gold },
    ayahNumberOrnament: {
      color: colors.ayahNumber,
      fontFamily: Platform.OS === 'ios' ? 'Scheherazade New' : 'serif',
      fontSize: 14,
      fontWeight: '600',
    },
    ayahNumberDecor: {
      color: colors.gold,
      fontSize: 12,
      marginHorizontal: 2,
    },
    ayahIndicators: {
      flexDirection: 'row', gap: 4, justifyContent: 'flex-end', marginBottom: 4,
    },
    indicator: { fontSize: 11, opacity: 0.7 },
    translationText: {
      color: colors.textSecondary, fontSize: 13, lineHeight: 22,
      marginTop: 8, marginBottom: 4, fontStyle: 'italic',
      borderTopWidth: 1, borderTopColor: colors.goldPale, paddingTop: 8,
      textAlign: 'left',
    },
    footer: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border,
      paddingHorizontal: 16, paddingVertical: 10,
    },
    navBtn: {
      width: 52, height: 52, borderRadius: 16,
      backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center',
      shadowColor: colors.gold, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
    },
    navBtnDisabled: { opacity: 0.3 },
    navBtnIcon: {
      color: colors.green,
      includeFontPadding: false, textAlign: 'center',
    },
    bookmarkPageBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: `${colors.gold}18`, alignItems: 'center', justifyContent: 'center',
      marginBottom: 4,
    },
    bookmarkPageIcon: { fontSize: 16 },
    footerCenter: { alignItems: 'center' },
    pageNumBtn: { alignItems: 'center' },
    pageNumText: { fontSize: 16, color: colors.textPrimary, fontWeight: '700' },
    pageNumSub: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center', alignItems: 'center',
    },
    jumpCard: {
      backgroundColor: colors.card, borderRadius: 16, padding: 24,
      width: '80%', borderWidth: 1, borderColor: colors.border,
      alignItems: 'center',
    },
    jumpTitle: { fontSize: 18, color: colors.textPrimary, fontWeight: '700', marginBottom: 16 },
    jumpInput: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 10,
      paddingHorizontal: 14, paddingVertical: 10, color: colors.textPrimary,
      fontSize: 20, fontWeight: '700', textAlign: 'center', width: '100%', marginBottom: 12,
      backgroundColor: 'rgba(255,255,255,0.05)',
    },
    jumpBtn: {
      backgroundColor: colors.gold, borderRadius: 10, paddingHorizontal: 32, paddingVertical: 10,
    },
    jumpBtnText: { color: colors.green, fontWeight: '700', fontSize: 15 },
    sheet: {
      backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
      maxHeight: '70%', paddingBottom: 30, width: '100%',
      position: 'absolute', bottom: 0,
    },
    sheetLarge: {
      backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
      maxHeight: '80%', paddingBottom: 30, width: '100%',
      position: 'absolute', bottom: 0,
    },
    sheetHandle: {
      width: 40, height: 4, backgroundColor: colors.textMuted,
      borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 8,
    },
    sheetTitle: {
      fontSize: 17, fontWeight: '700', color: colors.textPrimary,
      textAlign: 'center', marginBottom: 12, paddingHorizontal: 16,
    },
    sheetClose: {
      paddingVertical: 14, alignItems: 'center',
      borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4,
    },
    sheetCloseText: { color: colors.gold, fontSize: 15, fontWeight: '600' },
    surahSearchInput: {
      backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10,
      paddingHorizontal: 14, paddingVertical: 8, color: colors.textPrimary,
      fontSize: 13, marginHorizontal: 16, marginBottom: 8,
    },
    surahPickerItem: {
      flexDirection: 'row', alignItems: 'center',
      paddingVertical: 10, paddingHorizontal: 16,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    surahPickerNum: {
      width: 32, height: 32, borderRadius: 8, backgroundColor: `${colors.gold}20`,
      alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    surahPickerNumText: { fontSize: 11, color: colors.gold, fontWeight: '700' },
    surahPickerInfo: { flex: 1 },
    surahPickerArabic: { fontSize: 15, color: colors.textPrimary, fontWeight: '600' },
    surahPickerEnglish: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
    surahPickerPage: { fontSize: 11, color: colors.textMuted },
    pickerTabRow: {
      flexDirection: 'row', marginHorizontal: 16, marginBottom: 8,
      borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
    },
    pickerTab: {
      flex: 1, paddingVertical: 8, alignItems: 'center',
      backgroundColor: 'transparent',
    },
    pickerTabActive: { backgroundColor: colors.gold },
    pickerTabText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
    pickerTabTextActive: { color: colors.green },
    pickerRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 12, paddingHorizontal: 20,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    pickerRowActive: { backgroundColor: `${colors.gold}12` },
    pickerName: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
    pickerSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    pickerCheck: { fontSize: 18, color: colors.gold, fontWeight: '700' },
    ayahMenuCard: {
      backgroundColor: colors.card, borderRadius: 16, padding: 20,
      width: '88%', borderWidth: 1, borderColor: colors.border,
    },
    ayahMenuTitle: { fontSize: 14, color: colors.gold, fontWeight: '700', marginBottom: 6 },
    ayahMenuArabic: {
      fontSize: 18, color: colors.textPrimary, textAlign: 'right',
      writingDirection: 'rtl', marginBottom: 16,
      fontFamily: Platform.OS === 'ios' ? 'Scheherazade New' : 'serif',
    },
    ayahMenuActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    ayahMenuBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 8,
    },
    ayahMenuBtnIcon: { fontSize: 16 },
    ayahMenuBtnText: { fontSize: 12, color: colors.textPrimary, fontWeight: '500' },
    noteCard: {
      backgroundColor: colors.card, borderRadius: 16, padding: 20,
      width: '90%', borderWidth: 1, borderColor: colors.border,
    },
    noteInput: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 10, color: colors.textPrimary,
      marginVertical: 12, minHeight: 120, fontSize: 14,
    },
    noteActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    noteActionBtn: {
      paddingHorizontal: 18, paddingVertical: 10,
      borderRadius: 8, borderWidth: 1, borderColor: colors.gold,
    },
    noteActionText: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },

    // ── Memorize Mode ──
    memFooter: {
      backgroundColor: '#000', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
      paddingHorizontal: 12, paddingVertical: 8,
    },
    memCheckingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
    memCheckingText: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
    memRecordingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
    memRecordingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
    memRecordingText: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
    memControlsRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 4,
    },
    memSideBtn: {
      width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.06)',
      alignItems: 'center', justifyContent: 'center',
    },
    memSideBtnDisabled: { opacity: 0.4 },
    memMicBtn: {
      width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(212,162,70,0.12)',
      alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.gold,
    },
    memMicBtnActive: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
    memPeekBtn: {
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.06)',
    },
    memPeekBtnText: { fontSize: 12, color: colors.gold, fontWeight: '500' },
    memBottomMeta: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      marginTop: 6,
    },
    memMarkBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
      backgroundColor: 'rgba(255,255,255,0.06)',
    },
    memMarkBtnDone: { backgroundColor: '#1B6B43' },
    memMarkBtnText: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
    memHeaderInfo: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
    memProgressDots: { flexDirection: 'row', gap: 3, maxWidth: 160 },
    memProgDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.12)' },
    memProgDotActive: { backgroundColor: colors.gold, width: 7, height: 7, borderRadius: 4 },
    memProgDotMemorized: { backgroundColor: '#1B6B43' },
    hiddenAyahText: {
      textAlign: 'right', writingDirection: 'rtl', lineHeight: 48,
      fontFamily: Platform.OS === 'ios' ? 'Scheherazade New' : 'serif', color: '#fff',
    },
    wordRevealedText: { color: '#fff' },
    wordIncorrectText: { color: '#EF4444', textDecorationLine: 'underline' },
    wordHiddenText: { color: 'rgba(255,255,255,0.15)' },
    memAyahMarkerText: {
      color: colors.gold, fontSize: 13, marginBottom: 4, textAlign: 'right',
    },
  }));

  const navigation = useNavigation<any>();
  const route = useRoute<ReaderRoute>();
  const { selectedReciter, setSelectedReciter, reciters, user, language, t } = useApp();
  const { height: screenHeight } = useWindowDimensions();
  const params = route.params || {};

  const getInitialPage = () => {
    if (params.initialPage) return Math.max(1, Math.min(604, params.initialPage));
    if (params.surahNumber) return SURAH_START_PAGES[params.surahNumber] || 1;
    return 1;
  };

  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [pageData, setPageData] = useState<QuranPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const targetPage = getInitialPage();
    if (targetPage !== currentPage) {
      if (soundRef.current) {
        soundRef.current.stopAsync().catch(() => {});
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      setPlayingAyah(null);
      playCountRef.current = 0;
      pendingAyahRef.current = null;
      isPlayingSequentialRef.current = false;
      isContinuousPlayRef.current = false;
      autoPlayAfterLoadRef.current = false;
      setIsPlayingSequential(false);
      setIsContinuousPlay(false);
      pageCache.current = {};
      setLoading(true);
      setCurrentPage(targetPage);
    }
  }, [route.params?.initialPage, route.params?.surahNumber]);
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [showPageJump, setShowPageJump] = useState(false);
  const [pageJumpInput, setPageJumpInput] = useState('');
  const [showReciterPicker, setShowReciterPicker] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showSurahPicker, setShowSurahPicker] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showAyahMenu, setShowAyahMenu] = useState(false);
  const [selectedAyah, setSelectedAyah] = useState<QuranPageAyah | null>(null);
  const [noteText, setNoteText] = useState('');
  const [surahSearch, setSurahSearch] = useState('');
  const [pickerTab, setPickerTab] = useState<'surah' | 'juz'>('surah');
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const [isFlipping, setIsFlipping] = useState(false);

  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Set<string>>(new Set());
  const [favoriteAyahs, setFavoriteAyahs] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});

  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [isPlayingSequential, setIsPlayingSequential] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const playCountRef = useRef(0);
  const sequentialIndexRef = useRef(0);
  const isPlayingSequentialRef = useRef(false);
  const pageDataRef = useRef<QuranPage | null>(null);
  const pendingAyahRef = useRef<number | null>(null);
  const [isContinuousPlay, setIsContinuousPlay] = useState(false);
  const isContinuousPlayRef = useRef(false);
  const autoPlayAfterLoadRef = useRef(false);

  const playAyahRef = useRef<((ayah: QuranPageAyah) => Promise<void>) | null>(null);

  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 604 });
  const [isDownloading, setIsDownloading] = useState(false);
  const downloadAbortRef = useRef(false);
  const [isPreparingAudio, setIsPreparingAudio] = useState(false);


  const pageCache = useRef<Record<number, QuranPage>>({});
  const pageScrollRef = useRef<ScrollView>(null);

  const memorize = useMemorizeMode(pageData?.ayahs || []);
  const currentPageRef = useRef(currentPage);
  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

  // ─── Smooth page transition ──────────────────────────────────────────────
  const transitionAnim = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false);
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const flipDirectionRef = useRef<'next' | 'prev'>('next');
  const destPageRef = useRef(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const directionSign = useRef(new Animated.Value(1)).current;
  const baseOldTranslateX = useMemo(() => transitionAnim.interpolate({
    inputRange: [0, 1], outputRange: [0, -60],
  }), [transitionAnim]);
  const baseNewTranslateX = useMemo(() => transitionAnim.interpolate({
    inputRange: [0, 1], outputRange: [60, 0],
  }), [transitionAnim]);
  const { oldOpacity, oldScale, newOpacity, newScale } = useMemo(() => ({
    oldOpacity: transitionAnim.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [1, 0.7, 0],
    }),
    oldScale: transitionAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.88],
    }),
    newOpacity: transitionAnim.interpolate({
      inputRange: [0, 0.3, 0.5, 1],
      outputRange: [0, 0, 0.4, 1],
    }),
    newScale: transitionAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.9, 1],
    }),
  }), [transitionAnim]);

  const animateToPageRef = useRef<((direction: 'next' | 'prev') => void) | null>(null);
  const panResponderRef = useRef<PanResponderInstance | null>(null);
  if (!panResponderRef.current) {
    panResponderRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        !isAnimatingRef.current && !memorize.memorizeMode && Math.abs(g.dx) > 10 && Math.abs(g.dy) < 60,
      onPanResponderMove: (_, g) => {
        slideAnim.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
        if (g.dx < -50) {
          animateToPageRef.current?.('next');
        } else if (g.dx > 50) {
          animateToPageRef.current?.('prev');
        }
      },
    });
  }
  const panResponder = panResponderRef.current!;

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDimensions(window));
    return () => sub?.remove();
  }, []);

  const isLandscape = dimensions.width > dimensions.height;

  useEffect(() => {
    (async () => {
      try {
        const savedVer = await getData<number>(CACHE_VERSION_KEY, 0);
        if (savedVer !== PAGE_CACHE_VER) {
          const keys = Array.from({ length: 604 }, (_, i) => cachePageKey(i + 1));
          await multiRemoveData(keys);
          await storeData(CACHE_VERSION_KEY, PAGE_CACHE_VER);
        }
        const saved = await getData<ReaderSettings>(STORAGE_READER_SETTINGS);
        if (saved) setSettings({ ...DEFAULT_SETTINGS, ...saved });
        const bk = await getData<Array<{ surah: number; ayah: number }>>(KEYS.BOOKMARKS, []);
        const fv = await getData<Array<{ surah: number; ayah: number }>>(KEYS.FAVORITES, []);
        const nt = await getData<Record<string, string>>(KEYS.NOTES, {});
        if (bk) setBookmarkedAyahs(new Set(bk.map(b => `${b.surah}:${b.ayah}`)));
        if (fv) setFavoriteAyahs(new Set(fv.map(f => `${f.surah}:${f.ayah}`)));
        if (nt) setNotes(nt);
      } catch {}
      setSettingsLoaded(true);
    })();
    return () => { cleanupAudio(); };
  }, []);

  useEffect(() => {
    if (settingsLoaded) storeData(STORAGE_READER_SETTINGS, settings);
  }, [settings, settingsLoaded]);

  useEffect(() => {
    if (settingsLoaded) loadPage(currentPage);
  }, [currentPage, settings.translationLang, settingsLoaded]);

  useEffect(() => {
    if (!loading) {
      storeData(STORAGE_LAST_PAGE, { lastPage: currentPage, lastReadAt: new Date().toISOString() });
    }
  }, [currentPage, loading]);



  useEffect(() => {
    if (autoPlayAfterLoadRef.current && isContinuousPlayRef.current && pageData?.ayahs.length) {
      autoPlayAfterLoadRef.current = false;
      playAyahRef.current?.(pageData.ayahs[0]);
    }
  }, [pageData]);

  useEffect(() => {
    if (memorize.memorizeMode) {
      memorize.setFocusedAyah(0);
    }
  }, [currentPage]);

  const cachePageKey = (n: number) => `aiqan_quran_page_${n}`;

  const isValidPageData = (data: any): data is QuranPage =>
    data && Array.isArray(data.ayahs) && data.ayahs.length > 0 &&
    data.ayahs.every((a: any) => a.text && a.text.length > 0);

  const loadPage = async (pageNum: number) => {
    if (pageCache.current[pageNum] && isValidPageData(pageCache.current[pageNum])) {
      setPageData(pageCache.current[pageNum]);
      pageDataRef.current = pageCache.current[pageNum];
      setLoading(false);
      return;
    }

    const offline = getOfflinePage(pageNum);
    if (offline) {
      pageCache.current[pageNum] = offline;
      setPageData(offline);
      pageDataRef.current = offline;
      setLoading(false);

      (async () => {
        try {
          const lang = settings.translationLang;
          const res = await api.get<any>(`/quran/data/page/${pageNum}?lang=${lang}`);
          const apiData: QuranPage = res.data?.data || res.data;
          if (apiData && Array.isArray(apiData.ayahs) && apiData.ayahs.length > 0) {
            const apiMap = new Map(apiData.ayahs.map((aa: any) => [aa.number, aa]));
            const merged = { ...offline, ayahs: offline.ayahs.map(a => {
              const match = apiMap.get(a.number);
              return match?.translation ? { ...a, translation: match.translation } : a;
            })};
            if (merged.ayahs.some(a => a.translation)) {
              pageCache.current[pageNum] = merged;
              setPageData(merged);
              pageDataRef.current = merged;
              await storeData(cachePageKey(pageNum), merged);
            }
          }
        } catch {}
      })();

      if (pageNum < 604) prefetchPage(pageNum + 1);
      if (pageNum > 1) prefetchPage(pageNum - 1);
      return;
    }

    setLoading(true);
    try {
      const lang = settings.translationLang;
      const res = await api.get<any>(`/quran/data/page/${pageNum}?lang=${lang}`);
      const data: QuranPage = res.data?.data || res.data;
      if (isValidPageData(data)) {
        pageCache.current[pageNum] = data;
        setPageData(data);
        pageDataRef.current = data;
        await storeData(cachePageKey(pageNum), data);
      }
    } catch {}
    setLoading(false);
  };

  const prefetchPage = async (pageNum: number) => {
    if (pageCache.current[pageNum]) return;
    const offline = getOfflinePage(pageNum);
    if (offline) { pageCache.current[pageNum] = offline; }
  };

  const goToPage = useCallback((updater: number | ((p: number) => number)) => {
    pendingAyahRef.current = null;
    isPlayingSequentialRef.current = false;
    isContinuousPlayRef.current = false;
    autoPlayAfterLoadRef.current = false;
    setIsPlayingSequential(false);
    setIsContinuousPlay(false);
    setCurrentPage(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return Math.max(1, Math.min(604, next));
    });
    cleanupAudio();
  }, []);

  const cleanupAudio = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch { }
      soundRef.current = null;
    }
    setPlayingAyah(null);
    playCountRef.current = 0;
  };

  // ─── Smooth Page Transition ─────────────────────────────────────────────
  const animateToPage = useCallback((direction: 'next' | 'prev') => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    pendingAyahRef.current = null;
    isPlayingSequentialRef.current = false;
    isContinuousPlayRef.current = false;
    autoPlayAfterLoadRef.current = false;
    setIsPlayingSequential(false);
    setIsContinuousPlay(false);
    cleanupAudio();

    const cp = currentPageRef.current;
    const dest = direction === 'next' ? Math.min(604, cp + 1) : Math.max(1, cp - 1);
    if (dest === cp) { isAnimatingRef.current = false; return; }

    if (!pageCache.current[dest]) {
      const offline = getOfflinePage(dest);
      if (offline) {
        pageCache.current[dest] = offline;
        if (dest < 604) prefetchPage(dest + 1);
        if (dest > 1) prefetchPage(dest - 1);
      } else {
        prefetchPage(dest);
      }
    }

    destPageRef.current = dest;
    flipDirectionRef.current = direction;
    directionSign.setValue(direction === 'next' ? 1 : -1);
    setIsFlipping(true);
    transitionAnim.setValue(0);
    Animated.spring(transitionAnim, {
      toValue: 1,
      friction: 9,
      tension: 65,
      useNativeDriver: true,
    }).start(() => {
      setCurrentPage(dest);
      transitionAnim.setValue(0);
      setIsFlipping(false);
      isAnimatingRef.current = false;
    });
  }, []);
  animateToPageRef.current = animateToPage;

  const getAudioId = () => {
    const reciter = reciters.find((r: Reciter) => r.id === selectedReciter);
    return reciter?.audioId || selectedReciter || 'ar.alafasy';
  };

  const getAyahAudioUris = async (ayah: QuranPageAyah): Promise<string[]> => {
    const audioId = getAudioId();
    const uris: string[] = [];
    const localPath = `${FileSystem.documentDirectory}reciter_audio/${audioId}/${ayah.number}.mp3`;
    try {
      const info = await FileSystem.getInfoAsync(localPath);
      if (info.exists) uris.push(localPath);
    } catch {}
    const reciter = reciters.find((r: Reciter) => r.id === selectedReciter);
    if (reciter?.customAudioUrlTemplate) {
      uris.push(reciter.customAudioUrlTemplate.replace('{ayahNumber}', String(ayah.number)));
    } else {
      uris.push(
        `https://cdn.islamic.app/quran/audio/${audioId}/${ayah.number}.mp3`,
        `https://cdn.alquran.cloud/media/audio/ayah/${audioId}/${ayah.number}`,
        `https://cdn.islamic.network/quran/audio/128/${audioId}/${ayah.number}.mp3`,
      );
    }
    return uris;
  };



  const downloadAllPages = async () => {
    setIsDownloading(true);
    setShowDownloadModal(true);
    setDownloadProgress({ current: 0, total: 604 });
    downloadAbortRef.current = false;
    for (let i = 1; i <= 604; i++) {
      if (downloadAbortRef.current) break;
      if (pageCache.current[i]) { setDownloadProgress({ current: i, total: 604 }); continue; }
      const cached = await getData<QuranPage>(cachePageKey(i));
      if (cached) { pageCache.current[i] = cached; setDownloadProgress({ current: i, total: 604 }); continue; }
      try {
        const lang = settings.translationLang;
        const res = await api.get<any>(`/quran/data/page/${i}?lang=${lang}`);
        const data: QuranPage = res.data?.data || res.data;
        pageCache.current[i] = data;
        await storeData(cachePageKey(i), data);
      } catch {}
      setDownloadProgress({ current: i, total: 604 });
    }
    setIsDownloading(false);
  };

  const playAyah = async (ayah: QuranPageAyah) => {
    if (soundRef.current && pendingAyahRef.current === ayah.number) { await stopAudio(); return; }
    pendingAyahRef.current = ayah.number;
    await cleanupAudio();
    if (pendingAyahRef.current !== ayah.number) return;
    setIsPreparingAudio(true);
    const uris = await getAyahAudioUris(ayah);
    await Audio.setAudioModeAsync({ staysActiveInBackground: true, playsInSilentModeIOS: true });
    let sound: Audio.Sound | null = null;
    for (const uri of uris) {
      if (pendingAyahRef.current !== ayah.number) { setIsPreparingAudio(false); return; }
      try {
        const result = await Audio.Sound.createAsync(
          { uri }, { shouldPlay: false, rate: 1.0 }
        );
        sound = result.sound;
        break;
      } catch {}
    }
    if (!sound) {
      setPlayingAyah(null);
      setIsPreparingAudio(false);
      Alert.alert('Audio Error', 'Could not play audio.');
      return;
    }
    if (pendingAyahRef.current !== ayah.number) { sound.unloadAsync().catch(() => { }); setIsPreparingAudio(false); return; }
    const getAdvanceNextAyah = () => {
      if (!pageDataRef.current) return null;
      const idx = pageDataRef.current.ayahs.findIndex(a => a.number === ayah.number);
      return pageDataRef.current.ayahs[idx + 1] || null;
    };
    await sound.playAsync();
    if (pendingAyahRef.current !== ayah.number) { sound.stopAsync().catch(() => { }); sound.unloadAsync().catch(() => { }); setIsPreparingAudio(false); return; }
    soundRef.current = sound;
    setPlayingAyah(ayah.number);
    setIsPreparingAudio(false);
    playCountRef.current = 0;
    const handleAyahEnd = () => {
      setPlayingAyah(null);
      const seq = isPlayingSequentialRef.current;
      const cont = isContinuousPlayRef.current;
      if (seq || cont) {
        const next = getAdvanceNextAyah();
        if (next) { playAyah(next); }
        else if (cont && pageDataRef.current) {
          const np = (pageDataRef.current.pageNumber || 1) + 1;
          if (np <= 604) { autoPlayAfterLoadRef.current = true; setCurrentPage(np); }
          else { setIsContinuousPlay(false); isContinuousPlayRef.current = false; }
        } else { setIsPlayingSequential(false); isPlayingSequentialRef.current = false; }
      }
    };
    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (status.didJustFinish) {
        playCountRef.current += 1;
        if (playCountRef.current < settings.repeatMode) {
          sound.replayAsync().catch(() => { });
        } else {
          handleAyahEnd();
        }
      }
    });
  };
  playAyahRef.current = playAyah;

  const playSequentialFromStart = async () => {
    if (!pageDataRef.current?.ayahs.length) return;
    isContinuousPlayRef.current = false;
    setIsContinuousPlay(false);
    setIsPlayingSequential(true);
    isPlayingSequentialRef.current = true;
    await playAyah(pageDataRef.current.ayahs[0]);
  };

  const stopAudio = async () => {
    pendingAyahRef.current = null;
    setIsPlayingSequential(false);
    isPlayingSequentialRef.current = false;
    setIsContinuousPlay(false);
    isContinuousPlayRef.current = false;
    autoPlayAfterLoadRef.current = false;
    await cleanupAudio();
  };

  const toggleContinuousPlay = async () => {
    if (isContinuousPlayRef.current) { await stopAudio(); return; }
    isPlayingSequentialRef.current = false;
    setIsPlayingSequential(false);
    setIsContinuousPlay(true);
    isContinuousPlayRef.current = true;
    if (pageDataRef.current?.ayahs.length) await playAyah(pageDataRef.current.ayahs[0]);
  };

  const toggleBookmark = async (ayah: QuranPageAyah) => {
    const result = await saveBookmark(ayah.surahNumber, ayah.numberInSurah);
    setBookmarkedAyahs(new Set(result.bookmarks.map((b: any) => `${b.surah}:${b.ayah}`)));
  };

  const toggleFavorite = async (ayah: QuranPageAyah) => {
    const key = `${ayah.surahNumber}:${ayah.numberInSurah}`;
    if (favoriteAyahs.has(key)) {
      const r = await removeFavoriteAyah(ayah.surahNumber, ayah.numberInSurah);
      setFavoriteAyahs(new Set(r.map((f: any) => `${f.surah}:${f.ayah}`)));
    } else {
      const r = await saveFavoriteAyah(ayah.surahNumber, ayah.numberInSurah);
      setFavoriteAyahs(new Set(r.map((f: any) => `${f.surah}:${f.ayah}`)));
    }
  };

  const openNoteForAyah = (ayah: QuranPageAyah) => {
    setNoteText(notes[`${ayah.surahNumber}:${ayah.numberInSurah}`] || '');
    setSelectedAyah(ayah);
    setShowNoteModal(true);
  };

  const saveNote = async () => {
    if (!selectedAyah) return;
    const key = `${selectedAyah.surahNumber}:${selectedAyah.numberInSurah}`;
    const newNotes = { ...notes };
    if (noteText.trim()) newNotes[key] = noteText.trim();
    else delete newNotes[key];
    setNotes(newNotes);
    await storeData(KEYS.NOTES, newNotes);
    setShowNoteModal(false);
    setSelectedAyah(null);
    setNoteText('');
  };

  const handleAyahLongPress = (ayah: QuranPageAyah) => {
    setSelectedAyah(ayah);
    setShowAyahMenu(true);
  };

  const updateSetting = <K extends keyof ReaderSettings>(key: K, val: ReaderSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const jumpToPage = () => {
    const p = parseInt(pageJumpInput, 10);
    if (!isNaN(p) && p >= 1 && p <= 604) {
      goToPage(p);
      setShowPageJump(false);
      setPageJumpInput('');
    } else Alert.alert('', 'Enter a page number between 1 and 604');
  };

  const renderPageContent = useCallback((data?: QuranPage) => {
    const page = data || pageData;
    if (!page) return null;
    const { fontSize, showTranslation, showTajweed } = settings;
    const isMem = memorize.memorizeMode && memorize.versesHidden;
    const useFlow = !showTajweed && !isMem;
    const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ';
    const ayahText = (a: typeof page.ayahs[0]) =>
      a.surahNumber !== 1 && a.surahNumber !== 9 && a.isFirstInSurah && a.text.startsWith(BISMILLAH)
        ? a.text.slice(BISMILLAH.length) : a.text;
    const elements: React.ReactNode[] = [];
    let lastSurahNumber = -1;
    for (let i = 0; i < page.ayahs.length; i++) {
      const ayah = page.ayahs[i];
      const key = `${ayah.surahNumber}:${ayah.numberInSurah}`;
      const isBookmarked = bookmarkedAyahs.has(key);
      const isFavorite = favoriteAyahs.has(key);
      const hasNote = !!notes[key];
      const isPlaying = playingAyah === ayah.number;
      const isFocused = isMem && i === memorize.focusedAyahIndex;
      if (ayah.surahNumber !== lastSurahNumber && ayah.isFirstInSurah) {
        elements.push(
          <SurahHeader key={`surah-header-${ayah.surahNumber}`} name={ayah.surahName} englishName={ayah.surahEnglishName} number={ayah.surahNumber} styles={styles} />
        );
        if (ayah.surahNumber !== 1 && ayah.surahNumber !== 9) {
          elements.push(
            <BismillahBanner key={`bismillah-${ayah.surahNumber}`} fontSize={fontSize} styles={styles} />
          );
        }
        lastSurahNumber = ayah.surahNumber;
      }
      if (isMem) {
        const words = memorize.getWords(ayah.text);
        const ayahRevealed = memorize.revealedWords[ayah.number] || new Set<number>();
        const ayahIncorrect = memorize.incorrectWords[ayah.number] || new Set<number>();
        elements.push(
          <AnimatedPressable key={`ayah-${ayah.number}`} activeOpacity={0.8} onPress={() => memorize.setFocusedAyah(i)} style={[styles.ayahWrap, isFocused && styles.ayahWrapPlaying]}>
            <Text style={styles.memAyahMarkerText}>{String.fromCharCode(0xFD3F)}{ayah.numberInSurah}{String.fromCharCode(0xFD3E)}</Text>
            <Text style={[styles.hiddenAyahText, { fontSize }]}>
              {words.map((w, wi) => (
                <Text key={wi} style={ayahRevealed.has(wi) ? (ayahIncorrect.has(wi) ? styles.wordIncorrectText : styles.wordRevealedText) : styles.wordHiddenText}>{ayahRevealed.has(wi) ? w : '━━━ '} </Text>
              ))}
            </Text>
            {showTranslation && ayah.translation && !memorize.isRecording && <Text style={styles.translationText}>{ayah.translation}</Text>}
          </AnimatedPressable>
        );
      } else {
        const displayText = ayahText(ayah);
        const sajdaEl = ayah.sajda ? <Text style={styles.sajdaSymbol}>۩ </Text> : null;
        if (useFlow) {
          elements.push(
            <Text key={`f-${ayah.number}`} onPress={() => playAyah(ayah)} onLongPress={() => handleAyahLongPress(ayah)} style={[styles.ayahFlowText, { fontSize, lineHeight: fontSize * 2.2, paddingBottom: 8, color: isPlaying ? COLORS.gold : undefined }]}>
              {sajdaEl}{displayText}
              <Text style={[styles.ayahNumberOrnament, { fontSize: fontSize * 0.65 }]}> ﴿{ayah.numberInSurah}﴾ </Text>
            </Text>
          );
        } else {
          elements.push(
            <AnimatedPressable key={`ayah-${ayah.number}`} activeOpacity={0.75} onPress={() => playAyah(ayah)} onLongPress={() => handleAyahLongPress(ayah)} style={[styles.ayahWrap, isPlaying && styles.ayahWrapPlaying]}>
              {showTajweed ? (
                <TajweedHighlightedText text={displayText} fontSize={fontSize} defaultColor={COLORS.textPrimary} showLabels={false} />
              ) : (
                <Text style={[styles.arabicText, { fontSize }, isPlaying && styles.arabicTextPlaying]} textBreakStrategy="highQuality">{displayText}</Text>
              )}
              <Text style={[styles.ayahNumberOrnament, { fontSize: fontSize * 0.7 }]}><Text style={styles.ayahNumberDecor}>﴿</Text>{ayah.numberInSurah}<Text style={styles.ayahNumberDecor}>﴾</Text></Text>
              {showTranslation && ayah.translation && <Text style={styles.translationText}>{ayah.translation}</Text>}
            </AnimatedPressable>
          );
        }
      }
    }
    return (
      <View style={styles.arabicFlowText}>
        {elements}
      </View>
    );
  }, [pageData, settings, memorize, bookmarkedAyahs, favoriteAyahs, notes, playingAyah, playAyah, handleAyahLongPress, styles, t]);

  const renderPageSheet = useCallback((contentData?: QuranPage) => (
    <View style={styles.bookPageWrap}>
      <ScrollView
        ref={pageScrollRef}
        style={[styles.pageSheet, { backgroundColor: memorize.memorizeMode ? '#000' : COLORS.card }]}
        contentContainerStyle={[styles.pageScrollContent, isLandscape && styles.pageScrollContentLandscape]}
        showsVerticalScrollIndicator={false} scrollEventThrottle={16}
      >
        {loading && !contentData ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={COLORS.gold} />
            <Text style={[styles.loadingText, { color: COLORS.textPrimary }]}>Loading page {currentPage}...</Text>
          </View>
        ) : renderPageContent(contentData)}
      </ScrollView>
    </View>
  ), [memorize.memorizeMode, isLandscape, loading, currentPage, renderPageContent, styles]);

  const currentSurahName = pageData?.surahs?.[0]?.name || '';
  const currentSurahEnglish = pageData?.surahs?.[0]?.englishName || '';
  const juzNumber = pageData?.juzNumber || 1;
  const ayahs = pageData?.ayahs || [];

  if (!settingsLoaded) {
    return <BrandedLoading />;
  }

  return (
    <View style={[styles.container, { backgroundColor: memorize.memorizeMode ? '#000' : COLORS.bg }]}>
      {!memorize.memorizeMode && <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />}
      <StatusBar barStyle={memorize.memorizeMode ? 'light-content' : 'dark-content'} backgroundColor={memorize.memorizeMode ? '#000' : '#1B4332'} />

      <LinearGradient colors={GRADIENTS.brand} style={styles.header}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <AnimatedPressable onPress={() => navigation.goBack()} style={styles.backBtn}><Text style={styles.backBtnText}>←</Text></AnimatedPressable>
              <AnimatedPressable style={styles.headerCenter} onPress={() => setShowSurahPicker(true)}>
                <Text style={styles.headerSurahArabic}>{currentSurahName}</Text>
                <Text style={styles.headerSurahEnglish}>{currentSurahEnglish}</Text>
              </AnimatedPressable>
              <View style={styles.headerRight}><View style={styles.juzBadge}><Text style={styles.juzBadgeText}>جزء {juzNumber}</Text></View></View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toolbarScroll} contentContainerStyle={styles.toolbarContent}>
              <AnimatedPressable style={styles.chip} onPress={() => updateSetting('fontSize', Math.max(18, settings.fontSize - 2))}><Text style={styles.chipText}>A−</Text></AnimatedPressable>
              <Text style={styles.fontSizeLabel}>{settings.fontSize}</Text>
              <AnimatedPressable style={styles.chip} onPress={() => updateSetting('fontSize', Math.min(36, settings.fontSize + 2))}><Text style={styles.chipText}>A+</Text></AnimatedPressable>
              <View style={styles.toolSep} />
              <AnimatedPressable style={[styles.chip, settings.showTranslation && styles.chipActive]} onPress={() => updateSetting('showTranslation', !settings.showTranslation)}>
                <Text style={[styles.chipText, settings.showTranslation && styles.chipTextActive]}>{t('quran.translation')}</Text>
              </AnimatedPressable>
              {settings.showTranslation && (
                <AnimatedPressable style={styles.chip} onPress={() => setShowLangPicker(true)}>
                  <Text style={styles.chipText} numberOfLines={1}>{TRANSLATIONS.find(x => x.id === settings.translationLang)?.name || settings.translationLang}</Text>
                </AnimatedPressable>
              )}
              <View style={styles.toolSep} />
              <AnimatedPressable style={[styles.chip, settings.showTajweed && styles.chipActive]} onPress={() => updateSetting('showTajweed', !settings.showTajweed)}>
                <Text style={[styles.chipText, settings.showTajweed && styles.chipTextActive]}>تجويد</Text>
              </AnimatedPressable>
              <View style={styles.toolSep} />
              {isPreparingAudio && <Text style={{ color: COLORS.gold, fontSize: 10, fontWeight: '600', paddingHorizontal: 6 }}>⏳</Text>}
              <AnimatedPressable style={styles.chip} onPress={() => setShowReciterPicker(true)}><Text style={styles.chipText}>🎙</Text></AnimatedPressable>
              {isPlayingSequential ? (
                <AnimatedPressable style={[styles.chip, styles.chipActive]} onPress={stopAudio}><Text style={[styles.chipText, styles.chipTextActive]}>⏹</Text></AnimatedPressable>
              ) : (
                <AnimatedPressable style={styles.chip} onPress={playSequentialFromStart}><Text style={styles.chipText}>▶</Text></AnimatedPressable>
              )}
              {isContinuousPlay ? (
                <AnimatedPressable style={[styles.chip, styles.chipActive, styles.chipContinuous]} onPress={stopAudio}><Text style={[styles.chipText, styles.chipTextActive]}>⏹ All</Text></AnimatedPressable>
              ) : (
                <AnimatedPressable style={[styles.chip, styles.chipContinuous]} onPress={toggleContinuousPlay}><Text style={styles.chipText}>▶ All</Text></AnimatedPressable>
              )}
              {([1, 3, 5, 10] as RepeatOption[]).map(n => (
                <AnimatedPressable key={n} style={[styles.chip, settings.repeatMode === n && styles.chipActive]} onPress={() => updateSetting('repeatMode', n)}>
                  <Text style={[styles.chipText, settings.repeatMode === n && styles.chipTextActive]}>{n}×</Text>
                </AnimatedPressable>
              ))}
              <View style={styles.toolSep} />
              <AnimatedPressable style={[styles.chip, memorize.memorizeMode && styles.chipActive]} onPress={memorize.toggleMemorizeMode}>
                <Text style={[styles.chipText, memorize.memorizeMode && styles.chipTextActive]}>
                  {memorize.memorizeMode ? '✕ Memorize' : '🎯 Memorize'}
                </Text>
              </AnimatedPressable>
              <AnimatedPressable style={styles.chip} onPress={() => setShowDownloadModal(true)}>
                <Text style={styles.chipText}>⬇ Pages</Text>
              </AnimatedPressable>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>

      {/* ── Page area ── */}
      <View style={[styles.pageArea, isLandscape && styles.pageAreaLandscape]} {...panResponder.panHandlers}>
        {isFlipping && pageCache.current[destPageRef.current] ? (
          <View style={{ flex: 1 }}>
            <Animated.View style={[StyleSheet.absoluteFill, {
              opacity: oldOpacity,
              transform: [{ scale: oldScale }, { translateX: Animated.multiply(baseOldTranslateX, directionSign) }],
            }]}>
              {renderPageSheet(pageData || undefined)}
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, {
              opacity: newOpacity,
              transform: [{ scale: newScale }, { translateX: Animated.multiply(baseNewTranslateX, directionSign) }],
            }]}>
              {renderPageSheet(pageCache.current[destPageRef.current])}
            </Animated.View>
          </View>
        ) : (
          <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
            {renderPageSheet(pageData || undefined)}
          </Animated.View>
        )}
      </View>

      {memorize.memorizeMode ? (
        <View style={styles.memFooter}>
          {memorize.isChecking ? (
            <View style={styles.memCheckingRow}>
              <ActivityIndicator size="small" color={COLORS.gold} />
              <Text style={styles.memCheckingText}>
                {language === 'ar' ? 'جاري التحقق...' : 'Checking...'}
              </Text>
            </View>
          ) : memorize.isRecording ? (
            <View style={styles.memRecordingRow}>
              <View style={styles.memRecordingDot} />
              <Text style={styles.memRecordingText}>
                {language === 'ar' ? 'جاري الاستماع...' : 'Listening...'}
              </Text>
            </View>
          ) : null}

          <View style={styles.memControlsRow}>
            <AnimatedPressable
              style={[styles.memSideBtn, memorize.isFirstAyah && styles.memSideBtnDisabled]}
              onPress={memorize.prevAyah}
              disabled={memorize.isFirstAyah}
            >
              <Ionicons
                name={language === 'ar' ? 'chevron-forward' : 'chevron-back'}
                size={20}
                color={memorize.isFirstAyah ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)'}
              />
            </AnimatedPressable>

            <AnimatedPressable
              style={[styles.memMicBtn, memorize.isRecording && styles.memMicBtnActive]}
              onPress={memorize.isRecording ? memorize.stopRecording : memorize.startRecording}
              disabled={memorize.isChecking}
            >
              <Ionicons
                name={memorize.isRecording ? 'stop' : 'mic'}
                size={24}
                color={memorize.isRecording ? '#000' : COLORS.gold}
              />
            </AnimatedPressable>

            <AnimatedPressable style={styles.memPeekBtn} onPress={memorize.revealWord}>
              <Text style={styles.memPeekBtnText}>
                {language === 'ar' ? '👁 كشف' : '👁 Peek'}
              </Text>
            </AnimatedPressable>

            <AnimatedPressable style={styles.memSideBtn} onPress={memorize.revealAyah}>
              <Ionicons name="eye" size={18} color="rgba(255,255,255,0.6)" />
            </AnimatedPressable>

            <AnimatedPressable
              style={[styles.memSideBtn, memorize.isLastAyah && styles.memSideBtnDisabled]}
              onPress={memorize.nextAyah}
              disabled={memorize.isLastAyah}
            >
              <Ionicons
                name={language === 'ar' ? 'chevron-back' : 'chevron-forward'}
                size={20}
                color={memorize.isLastAyah ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)'}
              />
            </AnimatedPressable>
          </View>

          <View style={styles.memBottomMeta}>
            <AnimatedPressable
              style={[styles.memMarkBtn, memorize.memorizedAyahs.has(`${pageData?.ayahs[memorize.focusedAyahIndex]?.number}`) && styles.memMarkBtnDone]}
              onPress={memorize.markMemorized}
            >
              <Ionicons
                name={memorize.memorizedAyahs.has(`${pageData?.ayahs[memorize.focusedAyahIndex]?.number}`) ? 'checkmark-circle' : 'bookmark-outline'}
                size={13}
                color={memorize.memorizedAyahs.has(`${pageData?.ayahs[memorize.focusedAyahIndex]?.number}`) ? '#fff' : 'rgba(255,255,255,0.5)'}
              />
              <Text style={[styles.memMarkBtnText, memorize.memorizedAyahs.has(`${pageData?.ayahs[memorize.focusedAyahIndex]?.number}`) && { color: '#fff' }]}>
                {memorize.memorizedAyahs.has(`${pageData?.ayahs[memorize.focusedAyahIndex]?.number}`)
                  ? (language === 'ar' ? 'محفوظ' : 'Memorized')
                  : (language === 'ar' ? 'تسجيل' : 'Mark')}
              </Text>
            </AnimatedPressable>

            <Text style={styles.memHeaderInfo}>
              {memorize.focusedAyahIndex + 1} / {ayahs.length}
            </Text>

            <View style={styles.memProgressDots}>
              {ayahs.slice(0, Math.min(ayahs.length, 40)).map((_, di) => {
                const dotNumber = ayahs[di]?.number;
                const isDotMemorized = dotNumber ? memorize.memorizedAyahs.has(`${dotNumber}`) : false;
                return (
                  <AnimatedPressable
                    key={di}
                    style={[
                      styles.memProgDot,
                      di === memorize.focusedAyahIndex && styles.memProgDotActive,
                      isDotMemorized && styles.memProgDotMemorized,
                    ]}
                    onPress={() => memorize.setFocusedAyah(di)}
                  />
                );
              })}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.footer}>
          <NavButton iconName="chevron-back" onPress={() => animateToPage('next')} disabled={currentPage === 604} navBtnStyle={styles.navBtn} navBtnDisabledStyle={styles.navBtnDisabled} navBtnIconStyle={styles.navBtnIcon} />
          <View style={styles.footerCenter}>
            <AnimatedPressable style={styles.bookmarkPageBtn} onPress={() => { if (pageData?.ayahs[0]) toggleBookmark(pageData.ayahs[0]); }}>
              <Text style={styles.bookmarkPageIcon}>{pageData?.ayahs[0] && bookmarkedAyahs.has(`${pageData.ayahs[0].surahNumber}:${pageData.ayahs[0].numberInSurah}`) ? '🔖' : '🏷️'}</Text>
            </AnimatedPressable>
            <AnimatedPressable style={styles.pageNumBtn} onPress={() => setShowPageJump(true)}>
              <Text style={styles.pageNumText}>{currentPage} / 604</Text>
              <Text style={styles.pageNumSub}>{t('quran.juz')} {juzNumber} · {JUZ_NAMES[juzNumber] || ''}</Text>
            </AnimatedPressable>
          </View>
          <NavButton iconName="chevron-forward" onPress={() => animateToPage('prev')} disabled={currentPage === 1} navBtnStyle={styles.navBtn} navBtnDisabledStyle={styles.navBtnDisabled} navBtnIconStyle={styles.navBtnIcon} />
        </View>
      )}

      <Modal visible={showPageJump} transparent animationType="fade">
        <AnimatedPressable style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPageJump(false)}>
          <View style={[styles.jumpCard, { backgroundColor: COLORS.card }]}>
            <Text style={styles.jumpTitle}>Go to Page</Text>
            <TextInput value={pageJumpInput} onChangeText={setPageJumpInput} style={styles.jumpInput} placeholder="1 – 604" placeholderTextColor={COLORS.textMuted} keyboardType="numeric" autoFocus onSubmitEditing={jumpToPage} returnKeyType="go" />
            <AnimatedPressable style={styles.jumpBtn} onPress={jumpToPage}><Text style={styles.jumpBtnText}>Go</Text></AnimatedPressable>
          </View>
        </AnimatedPressable>
      </Modal>

      <Modal visible={showSurahPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.sheetLarge}>
            <View style={styles.sheetHandle} /><Text style={styles.sheetTitle}>Go to Surah / Juz</Text>
            <View style={styles.pickerTabRow}>
              <AnimatedPressable style={[styles.pickerTab, pickerTab === 'surah' && styles.pickerTabActive]} onPress={() => setPickerTab('surah')}>
                <Text style={[styles.pickerTabText, pickerTab === 'surah' && styles.pickerTabTextActive]}>Surahs</Text>
              </AnimatedPressable>
              <AnimatedPressable style={[styles.pickerTab, pickerTab === 'juz' && styles.pickerTabActive]} onPress={() => setPickerTab('juz')}>
                <Text style={[styles.pickerTabText, pickerTab === 'juz' && styles.pickerTabTextActive]}>Juz</Text>
              </AnimatedPressable>
            </View>
            {pickerTab === 'surah' ? (
              <>
                <TextInput value={surahSearch} onChangeText={setSurahSearch} style={styles.surahSearchInput} placeholder="Search surah..." placeholderTextColor={COLORS.textMuted} autoFocus />
                <FlatList
                  data={SURAH_LIST.filter(s => !surahSearch || s.name.includes(surahSearch) || s.english.toLowerCase().includes(surahSearch.toLowerCase()))}
                  keyExtractor={item => item.number.toString()} style={{ maxHeight: Math.floor(screenHeight * 0.5) }}
                  renderItem={({ item }) => (
                    <AnimatedPressable style={styles.surahPickerItem} onPress={() => { goToPage(SURAH_START_PAGES[item.number] || 1); setShowSurahPicker(false); setSurahSearch(''); }}>
                      <View style={styles.surahPickerNum}><Text style={styles.surahPickerNumText}>{item.number}</Text></View>
                      <View style={styles.surahPickerInfo}><Text style={styles.surahPickerArabic}>{item.name}</Text><Text style={styles.surahPickerEnglish}>{item.english}</Text></View>
                      <Text style={styles.surahPickerPage}>p.{SURAH_START_PAGES[item.number]}</Text>
                    </AnimatedPressable>
                  )}
                />
              </>
            ) : (
              <FlatList
                data={Array.from({ length: 30 }, (_, i) => i + 1)}
                keyExtractor={item => item.toString()} style={{ maxHeight: Math.floor(screenHeight * 0.5) }}
                renderItem={({ item }) => (
                  <AnimatedPressable style={styles.surahPickerItem} onPress={() => { goToPage(JUZ_START_PAGES[item] || 1); setShowSurahPicker(false); setSurahSearch(''); }}>
                    <View style={styles.surahPickerNum}><Text style={styles.surahPickerNumText}>{item}</Text></View>
                    <View style={styles.surahPickerInfo}><Text style={styles.surahPickerArabic}>{JUZ_NAMES[item]}</Text><Text style={styles.surahPickerEnglish}>Juz {item}</Text></View>
                    <Text style={styles.surahPickerPage}>p.{JUZ_START_PAGES[item]}</Text>
                  </AnimatedPressable>
                )}
              />
            )}
            <AnimatedPressable style={styles.sheetClose} onPress={() => { setShowSurahPicker(false); setSurahSearch(''); }}><Text style={styles.sheetCloseText}>Close</Text></AnimatedPressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showReciterPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} /><Text style={styles.sheetTitle}>{t('quran.reciter')}</Text>
            <FlatList data={reciters} keyExtractor={(item: Reciter) => item.id} style={{ maxHeight: Math.floor(screenHeight * 0.4) }}
              renderItem={({ item }: { item: Reciter }) => (
                <AnimatedPressable style={[styles.pickerRow, selectedReciter === item.id && styles.pickerRowActive]} onPress={() => { setSelectedReciter(item.id); setShowReciterPicker(false); }}>
                  <View style={{ flex: 1 }}><Text style={styles.pickerName}>{item.name}</Text>{item.arabicName && <Text style={styles.pickerSub}>{item.arabicName}</Text>}</View>
                  {selectedReciter === item.id && <Text style={styles.pickerCheck}>✓</Text>}
                </AnimatedPressable>
              )}
            />
            <AnimatedPressable style={styles.sheetClose} onPress={() => setShowReciterPicker(false)}><Text style={styles.sheetCloseText}>Close</Text></AnimatedPressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showLangPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} /><Text style={styles.sheetTitle}>{t('quran.translation')}</Text>
            <FlatList data={TRANSLATIONS} keyExtractor={item => item.id} style={{ maxHeight: Math.floor(screenHeight * 0.4) }}
              renderItem={({ item }) => (
                <AnimatedPressable style={[styles.pickerRow, settings.translationLang === item.id && styles.pickerRowActive]} onPress={() => { updateSetting('translationLang', item.id); setShowLangPicker(false); }}>
                  <View style={{ flex: 1 }}><Text style={styles.pickerName}>{item.name}</Text><Text style={styles.pickerSub}>{item.language}</Text></View>
                  {settings.translationLang === item.id && <Text style={styles.pickerCheck}>✓</Text>}
                </AnimatedPressable>
              )}
            />
            <AnimatedPressable style={styles.sheetClose} onPress={() => setShowLangPicker(false)}><Text style={styles.sheetCloseText}>Close</Text></AnimatedPressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showAyahMenu && !!selectedAyah} transparent animationType="fade">
        <AnimatedPressable style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAyahMenu(false)}>
          <View style={styles.ayahMenuCard}>
            {selectedAyah && (
              <>
                <Text style={styles.ayahMenuTitle}>{selectedAyah.surahEnglishName} {selectedAyah.numberInSurah}</Text>
                <Text style={styles.ayahMenuArabic} numberOfLines={2}>{selectedAyah.text}</Text>
                <View style={styles.ayahMenuActions}>
                  <AnimatedPressable style={styles.ayahMenuBtn} onPress={() => { toggleBookmark(selectedAyah); setShowAyahMenu(false); }}>
                    <Text style={styles.ayahMenuBtnIcon}>🔖</Text>
                    <Text style={styles.ayahMenuBtnText}>{bookmarkedAyahs.has(`${selectedAyah.surahNumber}:${selectedAyah.numberInSurah}`) ? 'Remove Bookmark' : 'Bookmark'}</Text>
                  </AnimatedPressable>
                  <AnimatedPressable style={styles.ayahMenuBtn} onPress={() => { toggleFavorite(selectedAyah); setShowAyahMenu(false); }}>
                    <Text style={styles.ayahMenuBtnIcon}>⭐</Text>
                    <Text style={styles.ayahMenuBtnText}>{favoriteAyahs.has(`${selectedAyah.surahNumber}:${selectedAyah.numberInSurah}`) ? 'Remove Favorite' : 'Favorite'}</Text>
                  </AnimatedPressable>
                  <AnimatedPressable style={styles.ayahMenuBtn} onPress={() => { setShowAyahMenu(false); openNoteForAyah(selectedAyah); }}>
                    <Text style={styles.ayahMenuBtnIcon}>📝</Text>
                    <Text style={styles.ayahMenuBtnText}>{notes[`${selectedAyah.surahNumber}:${selectedAyah.numberInSurah}`] ? 'Edit Note' : 'Add Note'}</Text>
                  </AnimatedPressable>
                  <AnimatedPressable style={styles.ayahMenuBtn} onPress={() => { setShowAyahMenu(false); playAyah(selectedAyah); }}>
                    <Text style={styles.ayahMenuBtnIcon}>▶</Text><Text style={styles.ayahMenuBtnText}>Play Ayah</Text>
                  </AnimatedPressable>
                </View>
              </>
            )}
          </View>
        </AnimatedPressable>
      </Modal>

      <Modal visible={showNoteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.noteCard}>
            <Text style={styles.sheetTitle}>{selectedAyah ? `Note · ${selectedAyah.surahEnglishName} ${selectedAyah.numberInSurah}` : 'Note'}</Text>
            <TextInput value={noteText} onChangeText={setNoteText} style={styles.noteInput} placeholder="Write your note here..." placeholderTextColor={COLORS.textMuted} multiline numberOfLines={5} autoFocus textAlignVertical="top" />
            <View style={styles.noteActions}>
              <AnimatedPressable style={styles.noteActionBtn} onPress={() => { setShowNoteModal(false); setNoteText(''); setSelectedAyah(null); }}><Text style={styles.noteActionText}>Cancel</Text></AnimatedPressable>
              <AnimatedPressable style={[styles.noteActionBtn, { backgroundColor: COLORS.gold }]} onPress={saveNote}><Text style={[styles.noteActionText, { color: COLORS.green }]}>Save</Text></AnimatedPressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showDownloadModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.jumpCard, { backgroundColor: COLORS.card }]}>
            <Text style={styles.jumpTitle}>Quran Pages</Text>
            {isDownloading ? (
              <>
                <Text style={{ color: COLORS.textPrimary, fontSize: 48, fontWeight: '700' }}>
                  {downloadProgress.current}
                </Text>
                <Text style={{ color: COLORS.textMuted, fontSize: 14, marginBottom: 12 }}>
                  / {downloadProgress.total}
                </Text>
                <View style={{ width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%`, height: 8, backgroundColor: COLORS.gold, borderRadius: 4 }} />
                </View>
                <AnimatedPressable style={{ marginTop: 16 }} onPress={() => { downloadAbortRef.current = true; }}>
                  <Text style={{ color: COLORS.error, fontSize: 14, fontWeight: '600' }}>Cancel</Text>
                </AnimatedPressable>
              </>
            ) : (
              <>
                <Text style={{ color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 8 }}>
                  {downloadProgress.current} / {downloadProgress.total} pages cached
                </Text>
                <AnimatedPressable style={styles.jumpBtn} onPress={downloadAllPages}>
                  <Text style={styles.jumpBtnText}>Download All</Text>
                </AnimatedPressable>
              </>
            )}
            {!isDownloading && (
              <AnimatedPressable style={{ marginTop: 16 }} onPress={() => { setShowDownloadModal(false); setDownloadProgress({ current: 0, total: 604 }); }}>
                <Text style={{ color: COLORS.gold, fontSize: 14, fontWeight: '600' }}>Close</Text>
              </AnimatedPressable>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const SURAH_LIST = [
  { number: 1, name: 'الفاتحة', english: 'Al-Fatihah' },
  { number: 2, name: 'البقرة', english: 'Al-Baqarah' },
  { number: 3, name: 'آل عمران', english: "Al-'Imran" },
  { number: 4, name: 'النساء', english: "An-Nisa'" },
  { number: 5, name: 'المائدة', english: "Al-Ma'idah" },
  { number: 6, name: 'الأنعام', english: "Al-An'am" },
  { number: 7, name: 'الأعراف', english: "Al-A'raf" },
  { number: 8, name: 'الأنفال', english: 'Al-Anfal' },
  { number: 9, name: 'التوبة', english: 'At-Tawbah' },
  { number: 10, name: 'يونس', english: 'Yunus' },
  { number: 11, name: 'هود', english: 'Hud' },
  { number: 12, name: 'يوسف', english: 'Yusuf' },
  { number: 13, name: 'الرعد', english: "Ar-Ra'd" },
  { number: 14, name: 'إبراهيم', english: 'Ibrahim' },
  { number: 15, name: 'الحجر', english: 'Al-Hijr' },
  { number: 16, name: 'النحل', english: 'An-Nahl' },
  { number: 17, name: 'الإسراء', english: "Al-Isra'" },
  { number: 18, name: 'الكهف', english: 'Al-Kahf' },
  { number: 19, name: 'مريم', english: 'Maryam' },
  { number: 20, name: 'طه', english: 'Ta-Ha' },
  { number: 21, name: 'الأنبياء', english: "Al-Anbiya'" },
  { number: 22, name: 'الحج', english: 'Al-Hajj' },
  { number: 23, name: 'المؤمنون', english: "Al-Mu'minun" },
  { number: 24, name: 'النور', english: 'An-Nur' },
  { number: 25, name: 'الفرقان', english: 'Al-Furqan' },
  { number: 26, name: 'الشعراء', english: "Ash-Shu'ara'" },
  { number: 27, name: 'النمل', english: 'An-Naml' },
  { number: 28, name: 'القصص', english: 'Al-Qasas' },
  { number: 29, name: 'العنكبوت', english: 'Al-Ankabut' },
  { number: 30, name: 'الروم', english: 'Ar-Rum' },
  { number: 31, name: 'لقمان', english: 'Luqman' },
  { number: 32, name: 'السجدة', english: 'As-Sajdah' },
  { number: 33, name: 'الأحزاب', english: 'Al-Ahzab' },
  { number: 34, name: 'سبأ', english: "Saba'" },
  { number: 35, name: 'فاطر', english: 'Fatir' },
  { number: 36, name: 'يس', english: 'Ya-Sin' },
  { number: 37, name: 'الصافات', english: 'As-Saffat' },
  { number: 38, name: 'ص', english: 'Sad' },
  { number: 39, name: 'الزمر', english: 'Az-Zumar' },
  { number: 40, name: 'غافر', english: 'Ghafir' },
  { number: 41, name: 'فصلت', english: 'Fussilat' },
  { number: 42, name: 'الشورى', english: 'Ash-Shura' },
  { number: 43, name: 'الزخرف', english: 'Az-Zukhruf' },
  { number: 44, name: 'الدخان', english: 'Ad-Dukhan' },
  { number: 45, name: 'الجاثية', english: 'Al-Jathiyah' },
  { number: 46, name: 'الأحقاف', english: 'Al-Ahqaf' },
  { number: 47, name: 'محمد', english: 'Muhammad' },
  { number: 48, name: 'الفتح', english: 'Al-Fath' },
  { number: 49, name: 'الحجرات', english: 'Al-Hujurat' },
  { number: 50, name: 'ق', english: 'Qaf' },
  { number: 51, name: 'الذاريات', english: 'Adh-Dhariyat' },
  { number: 52, name: 'الطور', english: 'At-Tur' },
  { number: 53, name: 'النجم', english: 'An-Najm' },
  { number: 54, name: 'القمر', english: 'Al-Qamar' },
  { number: 55, name: 'الرحمن', english: 'Ar-Rahman' },
  { number: 56, name: 'الواقعة', english: "Al-Waqi'ah" },
  { number: 57, name: 'الحديد', english: 'Al-Hadid' },
  { number: 58, name: 'المجادلة', english: 'Al-Mujadilah' },
  { number: 59, name: 'الحشر', english: 'Al-Hashr' },
  { number: 60, name: 'الممتحنة', english: 'Al-Mumtahanah' },
  { number: 61, name: 'الصف', english: 'As-Saff' },
  { number: 62, name: 'الجمعة', english: "Al-Jumu'ah" },
  { number: 63, name: 'المنافقون', english: 'Al-Munafiqun' },
  { number: 64, name: 'التغابن', english: 'At-Taghabun' },
  { number: 65, name: 'الطلاق', english: 'At-Talaq' },
  { number: 66, name: 'التحريم', english: 'At-Tahrim' },
  { number: 67, name: 'الملك', english: 'Al-Mulk' },
  { number: 68, name: 'القلم', english: 'Al-Qalam' },
  { number: 69, name: 'الحاقة', english: "Al-Haqqah" },
  { number: 70, name: 'المعارج', english: "Al-Ma'arij" },
  { number: 71, name: 'نوح', english: 'Nuh' },
  { number: 72, name: 'الجن', english: 'Al-Jinn' },
  { number: 73, name: 'المزمل', english: 'Al-Muzzammil' },
  { number: 74, name: 'المدثر', english: 'Al-Muddaththir' },
  { number: 75, name: 'القيامة', english: 'Al-Qiyamah' },
  { number: 76, name: 'الإنسان', english: 'Al-Insan' },
  { number: 77, name: 'المرسلات', english: 'Al-Mursalat' },
  { number: 78, name: 'النبأ', english: "An-Naba'" },
  { number: 79, name: 'النازعات', english: "An-Nazi'at" },
  { number: 80, name: 'عبس', english: "'Abasa" },
  { number: 81, name: 'التكوير', english: 'At-Takwir' },
  { number: 82, name: 'الانفطار', english: 'Al-Infitar' },
  { number: 83, name: 'المطففين', english: 'Al-Mutaffifin' },
  { number: 84, name: 'الانشقاق', english: 'Al-Inshiqaq' },
  { number: 85, name: 'البروج', english: 'Al-Buruj' },
  { number: 86, name: 'الطارق', english: 'At-Tariq' },
  { number: 87, name: 'الأعلى', english: "Al-A'la" },
  { number: 88, name: 'الغاشية', english: 'Al-Ghashiyah' },
  { number: 89, name: 'الفجر', english: 'Al-Fajr' },
  { number: 90, name: 'البلد', english: 'Al-Balad' },
  { number: 91, name: 'الشمس', english: 'Ash-Shams' },
  { number: 92, name: 'الليل', english: 'Al-Layl' },
  { number: 93, name: 'الضحى', english: 'Ad-Duha' },
  { number: 94, name: 'الشرح', english: 'Ash-Sharh' },
  { number: 95, name: 'التين', english: 'At-Tin' },
  { number: 96, name: 'العلق', english: "Al-'Alaq" },
  { number: 97, name: 'القدر', english: 'Al-Qadr' },
  { number: 98, name: 'البينة', english: 'Al-Bayyinah' },
  { number: 99, name: 'الزلزلة', english: 'Az-Zalzalah' },
  { number: 100, name: 'العاديات', english: "Al-'Adiyat" },
  { number: 101, name: 'القارعة', english: "Al-Qari'ah" },
  { number: 102, name: 'التكاثر', english: 'At-Takathur' },
  { number: 103, name: 'العصر', english: "Al-'Asr" },
  { number: 104, name: 'الهمزة', english: 'Al-Humazah' },
  { number: 105, name: 'الفيل', english: 'Al-Fil' },
  { number: 106, name: 'قريش', english: 'Quraysh' },
  { number: 107, name: 'الماعون', english: "Al-Ma'un" },
  { number: 108, name: 'الكوثر', english: 'Al-Kawthar' },
  { number: 109, name: 'الكافرون', english: 'Al-Kafirun' },
  { number: 110, name: 'النصر', english: 'An-Nasr' },
  { number: 111, name: 'المسد', english: 'Al-Masad' },
  { number: 112, name: 'الإخلاص', english: 'Al-Ikhlas' },
  { number: 113, name: 'الفلق', english: 'Al-Falaq' },
  { number: 114, name: 'الناس', english: 'An-Nas' },
];
