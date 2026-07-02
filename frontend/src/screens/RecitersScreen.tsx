import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, SafeAreaView, StatusBar,
  Alert, Modal, ActivityIndicator, Dimensions, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { Reciter, Surah } from '../types';
import { COLORS, GRADIENTS } from '../constants/colors';
import { getData, storeData, KEYS } from '../utils/storage';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { FadeIn, SlideUp, AnimatedPressable } from '../components/AnimatedComponents';
import LogoDecoration from '../components/LogoDecoration';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RECITER_AUDIO_DOWNLOADS_KEY = 'aiqan_reciter_audio_downloads';

function getGlobalAyahNumber(surahNumber: number, ayahInSurah: number, surahAyahCount: Record<number, number>): number {
  let offset = 0;
  for (let i = 1; i < surahNumber; i++) {
    offset += surahAyahCount[i] || 0;
  }
  return offset + ayahInSurah;
}

export default function RecitersScreen() {
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { padding: 16, paddingBottom: 12 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    backIcon: { fontSize: 18, color: colors.gold },
    title: { fontSize: 18, color: colors.textPrimary, fontWeight: '700' },
    list: { padding: 12 },
    card: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 8,
      borderWidth: 1, borderColor: colors.border,
    },
    cardActive: { borderColor: colors.gold, backgroundColor: `${colors.gold}08` },
    favBtn: { marginRight: 8 },
    favStar: { fontSize: 20, color: colors.textMuted },
    favStarActive: { color: colors.gold },
    cardLeft: { flex: 1 },
    cardName: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
    cardArabic: { fontSize: 12, color: colors.gold, marginTop: 2 },
    cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardStyle: { fontSize: 11, color: colors.textMuted },
    checkMark: { fontSize: 16, color: colors.gold, fontWeight: '700' },
    dlBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: `${colors.gold}20`, alignItems: 'center', justifyContent: 'center' },
    dlBtnDone: { backgroundColor: `${colors.green}30` },
    dlBtnText: { fontSize: 14 },
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center', alignItems: 'center',
    },
    sheet: {
      backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20,
      maxHeight: '80%', paddingBottom: 30, width: '100%',
      position: 'absolute', bottom: 0,
    },
    sheetHandle: { width: 40, height: 4, backgroundColor: colors.textMuted, borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 8 },
    sheetTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 12, paddingHorizontal: 16 },
    sheetClose: { paddingVertical: 14, alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4 },
    sheetCloseText: { color: colors.gold, fontSize: 15, fontWeight: '600' },
    surahItem: {
      flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    surahNum: { width: 32, height: 32, borderRadius: 8, backgroundColor: `${colors.gold}20`, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    surahNumText: { fontSize: 11, color: colors.gold, fontWeight: '700' },
    surahInfo: { flex: 1 },
    surahName: { fontSize: 15, color: colors.textPrimary, fontWeight: '600' },
    surahEnglish: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
    checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
    checkboxActive: { backgroundColor: colors.gold },
    checkIcon: { fontSize: 14, color: colors.green, fontWeight: '700' },
    dlActionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
    dlActionBtn: {
      flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
      backgroundColor: colors.gold,
    },
    dlActionBtnSecondary: { backgroundColor: `${colors.gold}20` },
    dlActionText: { color: colors.green, fontWeight: '700', fontSize: 14 },
    dlActionTextSecondary: { color: colors.gold },
    progressWrap: { alignItems: 'center', padding: 24 },
    progressNum: { fontSize: 42, color: colors.gold, fontWeight: '700' },
    progressLabel: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
    progressBar: { width: '100%', height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginTop: 16, overflow: 'hidden' },
    progressFill: { height: 8, backgroundColor: colors.gold, borderRadius: 4 },
  }));

  const navigation = useNavigation<any>();
  const { reciters, selectedReciter, setSelectedReciter, allSurahs, t, language } = useApp();
  const isRtl = language === 'ar';
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [downloadedSurahs, setDownloadedSurahs] = useState<Record<string, Set<number>>>({});
  const [showSurahPicker, setShowSurahPicker] = useState(false);
  const [pickerReciter, setPickerReciter] = useState<Reciter | null>(null);
  const [selectedSurahs, setSelectedSurahs] = useState<Set<number>>(new Set());
  const [isDownloadingAudio, setIsDownloadingAudio] = useState(false);
  const [downloadAudioProgress, setDownloadAudioProgress] = useState({ current: 0, total: 0 });
  const { height: screenHeight } = useWindowDimensions();

  const surahAyahCount = useMemo(() => {
    const map: Record<number, number> = {};
    allSurahs.forEach((s: Surah) => { map[s.number] = s.numberOfAyahs; });
    return map;
  }, [allSurahs]);

  useEffect(() => {
    loadFavorites();
    loadDownloadedReciters();
  }, []);

  const loadFavorites = async () => {
    const stored = await getData<string[]>(KEYS.FAVORITE_RECITERS, []);
    if (stored) setFavoriteIds(new Set(stored));
  };

  const loadDownloadedReciters = async () => {
    const stored = await getData<Record<string, number[]>>(RECITER_AUDIO_DOWNLOADS_KEY, {});
    if (stored) {
      const mapped: Record<string, Set<number>> = {};
      Object.entries(stored).forEach(([k, v]) => { mapped[k] = new Set(v); });
      setDownloadedSurahs(mapped);
    }
  };

  const toggleFavorite = async (id: string) => {
    const next = new Set(favoriteIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFavoriteIds(next);
    await storeData(KEYS.FAVORITE_RECITERS, Array.from(next));
  };

  const openDownloadPicker = (reciter: Reciter) => {
    setPickerReciter(reciter);
    setSelectedSurahs(new Set());
    setShowSurahPicker(true);
  };

  const toggleSurahSelection = (num: number) => {
    const next = new Set(selectedSurahs);
    if (next.has(num)) next.delete(num);
    else next.add(num);
    setSelectedSurahs(next);
  };

  const downloadReciterSurahs = async () => {
    if (!pickerReciter || selectedSurahs.size === 0) return;
    const audioId = pickerReciter.audioId || pickerReciter.id;
    const totalAyat = Array.from(selectedSurahs).reduce((sum, sn) => sum + (surahAyahCount[sn] || 0), 0);
    setIsDownloadingAudio(true);
    setDownloadAudioProgress({ current: 0, total: totalAyat });

    let count = 0;
    for (const surahNum of Array.from(selectedSurahs).sort((a, b) => a - b)) {
      const ayahCount = surahAyahCount[surahNum] || 0;
      for (let ayahInSurah = 1; ayahInSurah <= ayahCount; ayahInSurah++) {
        const globalNum = getGlobalAyahNumber(surahNum, ayahInSurah, surahAyahCount);
        const localDir = `${FileSystem.documentDirectory}reciter_audio/${audioId}/`;
        const localPath = `${localDir}${globalNum}.mp3`;
        try {
          const existing = await FileSystem.getInfoAsync(localPath);
          if (!existing.exists) {
            await FileSystem.makeDirectoryAsync(localDir, { intermediates: true });
            const url = `https://cdn.islamic.network/quran/audio/128/${audioId}/${globalNum}.mp3`;
            await FileSystem.downloadAsync(url, localPath);
          }
        } catch {}
        count++;
        setDownloadAudioProgress({ current: count, total: totalAyat });
      }
    }

    const stored = await getData<Record<string, number[]>>(RECITER_AUDIO_DOWNLOADS_KEY, {}) || {};
    const existingForReciter = stored[audioId] || [];
    const merged = Array.from(new Set([...existingForReciter, ...Array.from(selectedSurahs)]));
    stored[audioId] = merged;
    await storeData(RECITER_AUDIO_DOWNLOADS_KEY, stored);
    const newMapping = { ...downloadedSurahs };
    newMapping[audioId] = new Set(merged);
    setDownloadedSurahs(newMapping);

    setIsDownloadingAudio(false);
    setShowSurahPicker(false);
  };

  const sortedReciters = useMemo(() => {
    return [...reciters].sort((a, b) => {
      const aFav = favoriteIds.has(a.id) ? 0 : 1;
      const bFav = favoriteIds.has(b.id) ? 0 : 1;
      return aFav - bFav;
    });
  }, [reciters, favoriteIds]);

  const allSurahsList = useMemo(() => {
    return [...allSurahs].sort((a: Surah, b: Surah) => a.number - b.number);
  }, [allSurahs]);

  return (
    <SafeAreaView style={styles.container}>
      <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={GRADIENTS.brand} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('quran.reciter')}</Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <FadeIn>
        <FlatList
          data={sortedReciters}
          keyExtractor={(item: Reciter) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: Reciter }) => {
            const isFav = favoriteIds.has(item.id);
            const audioId = item.audioId || item.id;
            const downloadedSet = downloadedSurahs[audioId];
            const isDownloaded = downloadedSet && downloadedSet.size > 0;
            return (
              <AnimatedPressable
                style={[styles.card, selectedReciter === item.id && styles.cardActive]}
                onPress={() => {
                  setSelectedReciter(item.id);
                  navigation.goBack();
                }}
                activeOpacity={0.7}
              >
              <TouchableOpacity
                style={styles.favBtn}
                onPress={() => toggleFavorite(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.favStar, isFav && styles.favStarActive]}>
                  {isFav ? '★' : '☆'}
                </Text>
              </TouchableOpacity>
              <View style={styles.cardLeft}>
                <Text style={styles.cardName}>{isRtl ? item.arabicName : item.name}</Text>
                {!isRtl && item.arabicName && <Text style={styles.cardArabic}>{item.arabicName}</Text>}
              </View>
              <View style={styles.cardActions}>
                {selectedReciter === item.id && <Text style={styles.checkMark}>✓</Text>}
                <TouchableOpacity
                  style={[styles.dlBtn, isDownloaded && styles.dlBtnDone]}
                  onPress={() => openDownloadPicker(item)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={styles.dlBtnText}>{isDownloaded ? '✓' : '⬇'}</Text>
                </TouchableOpacity>
              </View>
            </AnimatedPressable>
          );
        }}
      />
      </FadeIn>

      <Modal visible={showSurahPicker && !!pickerReciter} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {isRtl ? 'تحميل سور' : 'Download Surahs'} — {pickerReciter?.name}
            </Text>
            <FlatList
              data={allSurahsList}
              keyExtractor={(item: Surah) => item.number.toString()}
              style={{ maxHeight: Math.floor(screenHeight * 0.5) }}
              renderItem={({ item }: { item: Surah }) => {
                const isSelected = selectedSurahs.has(item.number);
                return (
                  <TouchableOpacity style={styles.surahItem} onPress={() => toggleSurahSelection(item.number)}>
                    <View style={styles.surahNum}><Text style={styles.surahNumText}>{item.number}</Text></View>
                    <View style={styles.surahInfo}>
                      <Text style={styles.surahName}>{item.name}</Text>
                      <Text style={styles.surahEnglish}>{item.englishName}</Text>
                    </View>
                    <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                      {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
            {isDownloadingAudio ? (
              <View style={styles.progressWrap}>
                <Text style={styles.progressNum}>{downloadAudioProgress.current}</Text>
                <Text style={styles.progressLabel}>/ {downloadAudioProgress.total} ayahs</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${(downloadAudioProgress.current / Math.max(downloadAudioProgress.total, 1)) * 100}%` }]} />
                </View>
              </View>
            ) : (
              <View style={styles.dlActionRow}>
                <TouchableOpacity style={[styles.dlActionBtn, styles.dlActionBtnSecondary]} onPress={() => setSelectedSurahs(new Set(allSurahsList.map((s: Surah) => s.number)))}>
                  <Text style={[styles.dlActionText, styles.dlActionTextSecondary]}>Select All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dlActionBtn, selectedSurahs.size === 0 && { opacity: 0.4 }]}
                  onPress={downloadReciterSurahs}
                  disabled={selectedSurahs.size === 0}
                >
                  <Text style={styles.dlActionText}>Download ({selectedSurahs.size})</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={styles.sheetClose} onPress={() => { setShowSurahPicker(false); setPickerReciter(null); }}>
              <Text style={styles.sheetCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
