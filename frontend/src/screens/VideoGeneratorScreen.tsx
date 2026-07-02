import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  ActivityIndicator, Alert, ScrollView, StatusBar,
  Modal, FlatList, Platform, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { useApp } from '../context/AppContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { COLORS, SHADOWS, GRADIENTS } from '../constants/colors';
import { FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';
import { ENDPOINTS } from '../constants/api';
import { post, get } from '../utils/api';
import { VideoGenerateResponse, VideoJobResponse, Surah } from '../types';
import { addDownload } from '../utils/downloads';
import { FadeIn, AnimatedPressable, StaggeredView, ScaleIn, BounceIn } from '../components/AnimatedComponents';
import LogoDecoration from '../components/LogoDecoration';

const THEMES = [
  { id: 'kaaba', icon: '🕋', label: 'Kaaba', labelAr: 'الكعبة' },
  { id: 'makkah', icon: '🕌', label: 'Makkah', labelAr: 'مكة' },
  { id: 'madinah', icon: '🕍', label: 'Madinah', labelAr: 'المدينة' },
  { id: 'nature', icon: '🌿', label: 'Nature', labelAr: 'الطبيعة' },
  { id: 'rain', icon: '🌧️', label: 'Rain', labelAr: 'المطر' },
  { id: 'clouds', icon: '☁️', label: 'Clouds', labelAr: 'الغيوم' },
  { id: 'mosques', icon: '🕌', label: 'Mosques', labelAr: 'مساجد' },
  { id: 'minimal', icon: '✨', label: 'Minimal', labelAr: 'بسيط' },
  { id: 'black', icon: '⚫', label: 'Black', labelAr: 'أسود' },
];

const STEPS = ['surah', 'ayahs', 'reciter', 'theme'] as const;

export default function VideoGeneratorScreen() {
  const navigation = useNavigation<any>();
  const { allSurahs, reciters, t, language } = useApp();
  const isRtl = language === 'ar';
  const tv = (key: string) => t(`videoGenerator.${key}`);
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const THEME_CARD_SIZE = (screenWidth - 54) / 7;
  const THEME_CARD_RADIUS = THEME_CARD_SIZE / 2;

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [fromAyah, setFromAyah] = useState('');
  const [toAyah, setToAyah] = useState('');
  const [useAllAyahs, setUseAllAyahs] = useState(true);
  const [selectedReciter, setSelectedReciter] = useState('ar.alafasy');
  const [selectedTheme, setSelectedTheme] = useState('kaaba');
  const [surahModal, setSurahModal] = useState(false);
  const [surahSearch, setSurahSearch] = useState('');
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [savingToGallery, setSavingToGallery] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { padding: SPACING.base, paddingBottom: SPACING.md, borderBottomLeftRadius: RADIUS.xxl, borderBottomRightRadius: RADIUS.xxl, overflow: 'hidden' },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 40, height: 40, borderRadius: RADIUS.round, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 18, color: colors.textPrimary, fontWeight: '700', fontFamily: FONTS.bodyBold },
    content: { padding: 12 },
    stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    stepDot: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.08)',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: colors.border,
    },
    stepDotActive: { backgroundColor: colors.gold, borderColor: colors.gold },
    stepDotDone: { backgroundColor: colors.green, borderColor: colors.green },
    stepLine: { width: 28, height: 2, backgroundColor: colors.border, marginHorizontal: 2 },
    stepLineDone: { backgroundColor: colors.green },
    stepLabel: { fontSize: 14, color: colors.textPrimary, fontFamily: FONTS.bodyBold, textAlign: 'center', marginBottom: 10 },
    stepCount: { fontSize: 11, color: colors.textMuted, fontFamily: FONTS.body },
    card: {
      backgroundColor: colors.card, borderRadius: RADIUS.md, padding: 12,
      borderWidth: 1, borderColor: colors.border, ...SHADOWS.soft,
    },
    pickerButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.lg,
      padding: 12, borderWidth: 1, borderColor: colors.border,
    },
    pickerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    pickerPlaceholder: { fontSize: FONT_SIZES.body, color: colors.textMuted, fontFamily: FONTS.body, flex: 1 },
    surahNumber: { fontSize: FONT_SIZES.caption, color: colors.textMuted, fontFamily: FONTS.bodyBold, minWidth: 30 },
    surahNameEn: { fontSize: FONT_SIZES.body, color: colors.textPrimary, fontFamily: FONTS.bodyMed },
    surahNameAr: { fontSize: FONT_SIZES.small, color: colors.textSecondary, fontFamily: FONTS.arabic },
    ayahCount: { fontSize: FONT_SIZES.caption, color: colors.textMuted, fontFamily: FONTS.body },
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    modalContent: {
      backgroundColor: colors.card, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
      maxHeight: '80%', paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    modalTitle: { fontSize: 16, color: colors.textPrimary, fontFamily: FONTS.bodyBold },
    searchRow: { flexDirection: 'row', alignItems: 'center', margin: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.lg, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border },
    searchInput: { flex: 1, paddingVertical: 10, color: colors.textPrimary, fontSize: 14, fontFamily: FONTS.body },
    surahItem: {
      flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
      paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle,
    },
    surahItemActive: { backgroundColor: colors.goldPale },
    surahNumBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.glassGold, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    surahNumText: { fontSize: FONT_SIZES.caption, color: colors.gold, fontFamily: FONTS.bodyBold },
    surahItemEn: { fontSize: FONT_SIZES.body, color: colors.textPrimary, fontFamily: FONTS.bodyMed },
    surahItemAr: { fontSize: FONT_SIZES.small, color: colors.textSecondary, fontFamily: FONTS.arabic },
    surahItemAyahs: { fontSize: FONT_SIZES.caption, color: colors.textMuted, fontFamily: FONTS.body },
    emptyText: { textAlign: 'center', padding: SPACING.xl, color: colors.textMuted, fontFamily: FONTS.body },
    toggleRow: {
      flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
      paddingHorizontal: 12, borderRadius: RADIUS.lg, marginBottom: 6,
      backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: colors.border,
    },
    toggleRowActive: { borderColor: colors.gold, backgroundColor: colors.goldPale },
    toggleLabel: { fontSize: FONT_SIZES.body, color: colors.textMuted, fontFamily: FONTS.bodyMed, marginLeft: 12, flex: 1 },
    ayahRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 8 },
    inputLabel: { fontSize: FONT_SIZES.caption, color: colors.textMuted, fontFamily: FONTS.bodyMed, marginBottom: 4 },
    ayahInput: {
      backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.lg, padding: 10,
      color: colors.textPrimary, fontSize: 16, fontFamily: FONTS.bodyBold,
      borderWidth: 1, borderColor: colors.border, textAlign: 'center',
    },
    ayahDash: { fontSize: FONT_SIZES.xl, color: colors.textMuted, paddingBottom: SPACING.md, marginHorizontal: 4 },
    surahHint: { fontSize: FONT_SIZES.caption, color: colors.textMuted, fontFamily: FONTS.body, textAlign: 'center', marginTop: SPACING.md },
    reciterItem: {
      flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
      paddingHorizontal: 12, borderRadius: RADIUS.lg, marginBottom: 4,
      backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: colors.border,
    },
    reciterItemActive: { borderColor: colors.gold, backgroundColor: colors.goldPale },
    reciterAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.glassGold, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
    reciterName: { fontSize: FONT_SIZES.body, color: colors.textPrimary, fontFamily: FONTS.bodyMed },
    reciterCountry: { fontSize: FONT_SIZES.caption, color: colors.textMuted, fontFamily: FONTS.body },
    themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    themeCard: {
      width: THEME_CARD_SIZE, height: THEME_CARD_SIZE, borderRadius: THEME_CARD_RADIUS,
      backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center', padding: 2,
    },
    themeCardActive: { borderColor: colors.gold, backgroundColor: colors.goldPale },
    themeIcon: { fontSize: 18, marginBottom: 1 },
    themeLabel: { fontSize: 9, color: colors.textPrimary, fontFamily: FONTS.bodyMed, textAlign: 'center' },
    themeLabelActive: { color: colors.gold },
    navRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 8 },
    navBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingVertical: 10, paddingHorizontal: 14,
      borderRadius: RADIUS.lg, backgroundColor: colors.card,
      borderWidth: 1, borderColor: colors.border,
    },
    navBtnPrimary: { backgroundColor: colors.gold, borderColor: colors.gold, flex: 1, justifyContent: 'center', paddingVertical: 10 },
    navBtnText: { fontSize: 13, color: colors.textPrimary, fontFamily: FONTS.bodyMed },
    generateBtn: {
      flex: 1, backgroundColor: colors.gold, borderRadius: RADIUS.lg, paddingVertical: 12,
      alignItems: 'center', justifyContent: 'center', ...SHADOWS.card,
    },
    generateBtnText: { color: colors.green, fontSize: 14, fontFamily: FONTS.bodyBold },
    resultContainer: { marginTop: 12 },
    processingView: { alignItems: 'center', paddingVertical: 32 },
    processingText: { fontSize: FONT_SIZES.lg, color: colors.textPrimary, fontFamily: FONTS.bodyBold, marginTop: SPACING.lg },
    processingSub: { fontSize: FONT_SIZES.body, color: colors.textMuted, fontFamily: FONTS.body, marginTop: SPACING.sm, textAlign: 'center' },
    resultTitle: { fontSize: 14, color: colors.textPrimary, fontFamily: FONTS.bodyBold, marginBottom: SPACING.md },
    videoContainer: { borderRadius: RADIUS.md, overflow: 'hidden', backgroundColor: '#000', aspectRatio: 9 / 16, ...SHADOWS.card },
    video: { flex: 1 },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    actionBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
      paddingVertical: 10, borderRadius: RADIUS.lg,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    },
    actionBtnGold: { backgroundColor: colors.gold, borderColor: colors.gold },
    actionBtnText: { fontSize: 12, color: colors.green, fontFamily: FONTS.bodyBold },
    errorView: { alignItems: 'center', paddingVertical: SPACING.xxl },
    errorTitle: { fontSize: FONT_SIZES.lg, color: colors.error, fontFamily: FONTS.bodyBold, marginTop: SPACING.md },
    errorText: { fontSize: FONT_SIZES.body, color: colors.textMuted, fontFamily: FONTS.body, marginTop: SPACING.sm, textAlign: 'center' },
    resetBtn: {
      paddingVertical: 10, borderRadius: RADIUS.lg,
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      alignItems: 'center', marginTop: SPACING.lg,
    },
    resetBtnText: { fontSize: 13, color: colors.textPrimary, fontFamily: FONTS.bodyMed },
  }), []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const filteredSurahs = allSurahs.filter(s => {
    if (!surahSearch) return true;
    const q = surahSearch.toLowerCase();
    return (
      s.englishName.toLowerCase().includes(q) ||
      s.name.includes(surahSearch) ||
      String(s.number).includes(q)
    );
  });

  const stepLabels = [tv('selectSurah'), tv('ayahRange'), tv('selectReciter'), tv('selectTheme')];
  const stepIcons = ['book', 'list', 'mic', 'color-palette'] as const;

  const handleSelectSurah = (surah: Surah) => {
    setSelectedSurah(surah);
    setFromAyah('');
    setToAyah('');
    setUseAllAyahs(true);
    setSurahModal(false);
    setSurahSearch('');
  };

  const POLL_TIMEOUT = 5 * 60 * 1000;
  const pollStartRef = useRef<number>(0);

  const startPolling = useCallback((id: string) => {
    setJobId(id);
    setJobStatus('pending');
    setOutputUrl(null);
    setError(null);
    pollStartRef.current = Date.now();

    pollRef.current = setInterval(async () => {
      if (Date.now() - pollStartRef.current > POLL_TIMEOUT) {
        if (pollRef.current) clearInterval(pollRef.current);
        setError('Video generation timed out. The server may be busy, please try again later.');
        setJobStatus('failed');
        return;
      }
      try {
        const data = await get<VideoJobResponse>(ENDPOINTS.VIDEO_JOB(id));
        setJobStatus(data.status);
        if (data.status === 'completed') {
          setOutputUrl(data.outputUrl || null);
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data.status === 'failed') {
          setError(data.error || 'Video generation failed');
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        if (pollRef.current) clearInterval(pollRef.current);
        setError('Failed to check job status');
      }
    }, 3000);
  }, []);

  const handleGenerate = async () => {
    if (!selectedSurah) {
      Alert.alert(t('common.error'), tv('errorNoSurah'));
      return;
    }
    if (!useAllAyahs) {
      const f = parseInt(fromAyah);
      const tA = parseInt(toAyah);
      if (isNaN(f) || isNaN(tA) || f < 1 || tA < f || tA > selectedSurah.numberOfAyahs) {
        Alert.alert(t('common.error'), tv('errorNoAyah'));
        return;
      }
    }
    setGenerating(true);
    setError(null);
    try {
      const data = await post<VideoGenerateResponse>(ENDPOINTS.VIDEO_GENERATE, {
        surahNumber: selectedSurah.number,
        fromAyah: useAllAyahs ? 1 : parseInt(fromAyah),
        toAyah: useAllAyahs ? selectedSurah.numberOfAyahs : parseInt(toAyah),
        reciterId: selectedReciter,
        theme: selectedTheme,
      });
      startPolling(data.jobId);
    } catch (err: any) {
      const msg = err?.message || tv('jobFailed');
      setError(msg);
      Alert.alert(t('common.error'), msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!outputUrl) return;
    setDownloading(true);
    try {
      const ext = '.mp4';
      const fileUri = FileSystem.documentDirectory + `aiqan_video_${Date.now()}${ext}`;
      const download = await FileSystem.downloadAsync(outputUrl, fileUri);
      const surahName = selectedSurah ? (language === 'ar' ? selectedSurah.name : selectedSurah.englishName) : 'Video';
      await addDownload({
        id: `video_${Date.now()}`,
        name: `${surahName} - ${selectedSurah ? `(${fromAyah || 1}-${toAyah || selectedSurah.numberOfAyahs})` : ''}`,
        url: outputUrl,
        localUri: download.uri,
        date: new Date().toISOString(),
        size: undefined,
        type: 'video',
      });
      Alert.alert(t('common.success'), tv('download'));
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleSaveToGallery = async () => {
    if (!outputUrl) return;
    setSavingToGallery(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), 'Permission required to save to gallery');
        return;
      }
      const ext = '.mp4';
      const fileUri = FileSystem.cacheDirectory + `aiqan_gallery_${Date.now()}${ext}`;
      const download = await FileSystem.downloadAsync(outputUrl, fileUri);
      await MediaLibrary.createAssetAsync(download.uri);
      Alert.alert(t('common.success'), tv('saveToGallery'));
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.message || 'Failed to save to gallery');
    } finally {
      setSavingToGallery(false);
    }
  };

  const handleShare = async () => {
    if (!outputUrl) return;
    try {
      const ext = outputUrl.endsWith('.mp4') ? '.mp4' : '.mp4';
      const fileUri = FileSystem.cacheDirectory + `aiqan_share_${Date.now()}${ext}`;
      const download = await FileSystem.downloadAsync(outputUrl, fileUri);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(download.uri, {
          mimeType: 'video/mp4',
          dialogTitle: 'Aiqan Video',
        });
      }
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.message || 'Share failed');
    }
  };

  const handleReset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setCurrentStep(0);
    setSelectedSurah(null);
    setFromAyah('');
    setToAyah('');
    setUseAllAyahs(true);
    setSelectedReciter('ar.alafasy');
    setSelectedTheme('kaaba');
    setGenerating(false);
    setJobId(null);
    setJobStatus(null);
    setOutputUrl(null);
    setError(null);
  };

  const renderStepIndicator = () => (
    <View style={styles.stepRow}>
      {STEPS.map((_, idx) => (
        <React.Fragment key={idx}>
          <BounceIn delay={idx * 100}>
            <AnimatedPressable
              style={[
                styles.stepDot,
                idx === currentStep && styles.stepDotActive,
                idx < currentStep && styles.stepDotDone,
              ]}
              onPress={() => idx < currentStep && setCurrentStep(idx)}
            >
              <Ionicons
                name={idx < currentStep ? 'checkmark' : stepIcons[idx]}
                size={16}
                color={idx <= currentStep ? '#fff' : COLORS.textMuted}
              />
            </AnimatedPressable>
          </BounceIn>
          {idx < STEPS.length - 1 && (
            <View style={[styles.stepLine, idx < currentStep && styles.stepLineDone]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderStepLabel = () => (
    <Text style={styles.stepLabel}>
      {stepLabels[currentStep]}
      <Text style={styles.stepCount}> ({currentStep + 1}/{STEPS.length})</Text>
    </Text>
  );

  const renderSurahStep = () => (
    <View>
      <ScaleIn>
      <AnimatedPressable
        style={styles.pickerButton}
        onPress={() => setSurahModal(true)}
      >
        {selectedSurah ? (
          <View style={styles.pickerContent}>
            <Text style={styles.surahNumber}>#{selectedSurah.number}</Text>
            <View>
              <Text style={styles.surahNameEn}>{selectedSurah.englishName}</Text>
              <Text style={styles.surahNameAr}>{selectedSurah.name}</Text>
            </View>
            <Text style={styles.ayahCount}>{selectedSurah.numberOfAyahs} ayahs</Text>
          </View>
        ) : (
          <Text style={styles.pickerPlaceholder}>
            {isRtl ? 'اضغط لاختيار سورة' : 'Tap to select a surah'}
          </Text>
        )}
        <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
      </AnimatedPressable>
      </ScaleIn>

      <Modal visible={surahModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{tv('selectSurah')}</Text>
              <AnimatedPressable onPress={() => { setSurahModal(false); setSurahSearch(''); }}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </AnimatedPressable>
            </View>
            <View style={styles.searchRow}>
              <Ionicons name="search" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                value={surahSearch}
                onChangeText={setSurahSearch}
                placeholder={tv('searchSurah')}
                placeholderTextColor={COLORS.textMuted}
                autoFocus
              />
            </View>
            <FlatList
              data={filteredSurahs}
              keyExtractor={item => String(item.number)}
              renderItem={({ item }) => (
                <AnimatedPressable
                  style={[
                    styles.surahItem,
                    selectedSurah?.number === item.number && styles.surahItemActive,
                  ]}
                  onPress={() => handleSelectSurah(item)}
                >
                  <View style={styles.surahNumBadge}>
                    <Text style={styles.surahNumText}>{item.number}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.surahItemEn}>{item.englishName}</Text>
                    <Text style={styles.surahItemAr}>{item.name}</Text>
                  </View>
                  <Text style={styles.surahItemAyahs}>{item.numberOfAyahs} ayahs</Text>
                  {selectedSurah?.number === item.number && (
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.gold} style={{ marginLeft: 8 }} />
                  )}
                </AnimatedPressable>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>{t('common.noData')}</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderAyahStep = () => {
    const maxAyahs = selectedSurah?.numberOfAyahs || 0;
    return (
      <View>
        <ScaleIn>
        <AnimatedPressable
          style={[styles.toggleRow, useAllAyahs && styles.toggleRowActive]}
          onPress={() => setUseAllAyahs(true)}
        >
          <Ionicons
            name={useAllAyahs ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color={useAllAyahs ? COLORS.gold : COLORS.textMuted}
          />
          <Text style={[styles.toggleLabel, useAllAyahs && { color: COLORS.textPrimary }]}>
            {tv('allAyahs')} ({maxAyahs})
          </Text>
        </AnimatedPressable>
        </ScaleIn>
        <ScaleIn>
        <AnimatedPressable
          style={[styles.toggleRow, !useAllAyahs && styles.toggleRowActive]}
          onPress={() => setUseAllAyahs(false)}
        >
          <Ionicons
            name={!useAllAyahs ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color={!useAllAyahs ? COLORS.gold : COLORS.textMuted}
          />
          <Text style={[styles.toggleLabel, !useAllAyahs && { color: COLORS.textPrimary }]}>
            {tv('ayahRange')}
          </Text>
        </AnimatedPressable>
        </ScaleIn>
        {!useAllAyahs && (
          <View style={styles.ayahRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>{tv('fromAyah')}</Text>
              <TextInput
                style={styles.ayahInput}
                value={fromAyah}
                onChangeText={setFromAyah}
                keyboardType="number-pad"
                placeholder="1"
                placeholderTextColor={COLORS.textMuted}
                maxLength={3}
              />
            </View>
            <Text style={styles.ayahDash}>-</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>{tv('toAyah')}</Text>
              <TextInput
                style={styles.ayahInput}
                value={toAyah}
                onChangeText={setToAyah}
                keyboardType="number-pad"
                placeholder={String(maxAyahs)}
                placeholderTextColor={COLORS.textMuted}
                maxLength={3}
              />
            </View>
          </View>
        )}
        {selectedSurah && (
          <Text style={styles.surahHint}>
            {isRtl
              ? `سورة ${selectedSurah.name} - ${selectedSurah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}`
              : `${selectedSurah.englishName} - ${selectedSurah.revelationType}`}
          </Text>
        )}
      </View>
    );
  };

  const renderReciterStep = () => (
    <ScrollView
      style={{ maxHeight: Math.floor(screenHeight * 0.5) }}
      showsVerticalScrollIndicator={false}
    >
      {reciters.map(reciter => (
        <AnimatedPressable
          key={reciter.id}
          style={[
            styles.reciterItem,
            selectedReciter === reciter.id && styles.reciterItemActive,
          ]}
          onPress={() => setSelectedReciter(reciter.id)}
        >
          <View style={styles.reciterAvatar}>
            <Ionicons name="person" size={20} color={COLORS.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.reciterName}>
              {isRtl ? reciter.arabicName : reciter.name}
            </Text>
            {reciter.country && (
              <Text style={styles.reciterCountry}>{reciter.country}</Text>
            )}
          </View>
          {selectedReciter === reciter.id && (
            <Ionicons name="checkmark-circle" size={22} color={COLORS.gold} />
          )}
        </AnimatedPressable>
      ))}
    </ScrollView>
  );

  const renderThemeStep = () => (
    <StaggeredView style={styles.themeGrid} baseDelay={30} staggerBy={50}>
      {THEMES.map(theme => (
        <AnimatedPressable
          key={theme.id}
          style={[
            styles.themeCard,
            selectedTheme === theme.id && styles.themeCardActive,
          ]}
          onPress={() => setSelectedTheme(theme.id)}
        >
          <Text style={styles.themeIcon}>{theme.icon}</Text>
          <Text style={[
            styles.themeLabel,
            selectedTheme === theme.id && styles.themeLabelActive,
          ]}>
            {isRtl ? theme.labelAr : theme.label}
          </Text>
        </AnimatedPressable>
      ))}
    </StaggeredView>
  );

  const renderResultView = () => (
    <View style={styles.resultContainer}>
      {(jobStatus === 'pending' || jobStatus === 'processing') && (
        <View style={styles.processingView}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={styles.processingText}>
            {jobStatus === 'pending' ? tv('jobPending') : tv('jobProcessing')}
          </Text>
          <Text style={styles.processingSub}>
            {isRtl ? 'قد يستغرق هذا بضع دقائق' : 'This may take a few minutes'}
          </Text>
        </View>
      )}

      {jobStatus === 'completed' && outputUrl && (
        <View>
          <Text style={styles.resultTitle}>{tv('preview')}</Text>
          <View style={styles.videoContainer}>
            <Video
              source={{ uri: outputUrl }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay={false}
            />
          </View>
          <View style={styles.actionRow}>
            <AnimatedPressable
              style={styles.actionBtn}
              onPress={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator size="small" color={COLORS.green} />
              ) : (
                <>
                  <Ionicons name="download" size={20} color={COLORS.green} />
                  <Text style={styles.actionBtnText}>{t('common.download')}</Text>
                </>
              )}
            </AnimatedPressable>
            <AnimatedPressable
              style={styles.actionBtn}
              onPress={handleSaveToGallery}
              disabled={savingToGallery}
            >
              {savingToGallery ? (
                <ActivityIndicator size="small" color={COLORS.green} />
              ) : (
                <>
                  <Ionicons name="images" size={20} color={COLORS.green} />
                  <Text style={styles.actionBtnText}>{tv('saveToGallery')}</Text>
                </>
              )}
            </AnimatedPressable>
            <AnimatedPressable style={[styles.actionBtn, styles.actionBtnGold]} onPress={handleShare}>
              <Ionicons name="share" size={20} color="#fff" />
              <Text style={[styles.actionBtnText, { color: '#fff' }]}>{tv('share')}</Text>
            </AnimatedPressable>
          </View>
        </View>
      )}

      {jobStatus === 'failed' && (
        <View style={styles.errorView}>
          <Ionicons name="close-circle" size={48} color={COLORS.error} />
          <Text style={styles.errorTitle}>{tv('jobFailed')}</Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      )}

      {outputUrl && (
        <AnimatedPressable style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>{tv('generateAnother')}</Text>
        </AnimatedPressable>
      )}

      {(jobStatus === 'failed') && (
        <AnimatedPressable
          style={[styles.resetBtn, { marginTop: 12 }]}
          onPress={handleReset}
        >
          <Text style={styles.resetBtnText}>{tv('retry')}</Text>
        </AnimatedPressable>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={GRADIENTS.brand} style={styles.header}>
        <View style={styles.headerRow}>
          <AnimatedPressable onPress={() => {
            if (jobId) {
              handleReset();
            } else {
              navigation.goBack();
            }
          }} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={18} color={COLORS.gold} />
          </AnimatedPressable>
          <Text style={styles.title}>{tv('title')}</Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FadeIn>
        {!jobId && (
          <>
            {renderStepIndicator()}
            {renderStepLabel()}

            <View style={styles.card}>
              {currentStep === 0 && renderSurahStep()}
              {currentStep === 1 && renderAyahStep()}
              {currentStep === 2 && renderReciterStep()}
              {currentStep === 3 && renderThemeStep()}
            </View>

            <View style={styles.navRow}>
              {currentStep > 0 ? (
                <AnimatedPressable
                  style={styles.navBtn}
                  onPress={() => setCurrentStep(prev => prev - 1)}
                >
                  <Ionicons name="arrow-back" size={16} color={COLORS.textPrimary} />
                  <Text style={styles.navBtnText}>{t('common.back')}</Text>
                </AnimatedPressable>
              ) : <View style={{ flex: 1 }} />}

              {currentStep < STEPS.length - 1 ? (
                <AnimatedPressable
                  style={[styles.navBtn, styles.navBtnPrimary]}
                  onPress={() => setCurrentStep(prev => prev + 1)}
                >
                  <Text style={[styles.navBtnText, { color: '#fff' }]}>{t('common.next')}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </AnimatedPressable>
              ) : (
                <AnimatedPressable
                  style={[styles.generateBtn, generating && { opacity: 0.6 }]}
                  onPress={handleGenerate}
                  disabled={generating}
                >
                  {generating ? (
                    <ActivityIndicator color={COLORS.green} />
                  ) : (
                    <Text style={styles.generateBtnText}>{tv('generate')}</Text>
                  )}
                </AnimatedPressable>
              )}
            </View>
          </>
        )}

        {jobId && renderResultView()}

        <View style={{ height: 40 }} />
        </FadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}


