import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, ScrollView,
  StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { COLORS, GRADIENTS } from '../constants/colors';
import { FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { FadeIn, AnimatedPressable } from '../components/AnimatedComponents';
import LogoDecoration from '../components/LogoDecoration';

interface AdhanVoice {
  id: string;
  nameAr: string;
  nameEn: string;
  origin: string;
  audioUrl: string;
  category: 'reciter' | 'mosque' | 'style' | 'more';
}

const ADHAN_VOICES: AdhanVoice[] = [
  // ═══════════════════════════════════════════════
  //  Famous Reciters
  // ═══════════════════════════════════════════════
  { id: 'mishary_alafasy', nameAr: 'مشاري العفاسي', nameEn: 'Mishary Al-Afasy', origin: 'Kuwait', audioUrl: 'https://www.islamcan.com/audio/adhan/azan8.mp3', category: 'reciter' },
  { id: 'abdul_basit', nameAr: 'عبد الباسط عبد الصمد', nameEn: 'Abdul Basit', origin: 'Egypt', audioUrl: 'https://praytimes.org/audio/sunni/Abdul-Basit.mp3', category: 'reciter' },
  { id: 'minshawi', nameAr: 'محمد صديق المنشاوي', nameEn: 'Minshawi', origin: 'Egypt', audioUrl: 'https://praytimes.org/audio/sunni/Minshawi.mp3', category: 'reciter' },
  { id: 'yusuf_islam', nameAr: 'يوسف إسلام', nameEn: 'Yusuf Islam', origin: 'UK', audioUrl: 'https://www.islamcan.com/audio/adhan/azan6.mp3', category: 'reciter' },
  { id: 'ali_mulla', nameAr: 'علي أحمد ملا', nameEn: 'Ali Ahmad Mulla', origin: 'Makkah, Saudi Arabia', audioUrl: 'https://www.islamcan.com/audio/adhan/azan1.mp3', category: 'reciter' },
  { id: 'abdul_hakam', nameAr: 'عبد الحكم', nameEn: 'Abdul Hakam', origin: 'Saudi Arabia', audioUrl: 'https://praytimes.org/audio/sunni/Abdul-Hakam.mp3', category: 'reciter' },
  { id: 'abdul_ghaffar', nameAr: 'عبد الغفار', nameEn: 'Abdul Ghaffar', origin: 'Saudi Arabia', audioUrl: 'https://praytimes.org/audio/sunni/Abdul-Ghaffar.mp3', category: 'reciter' },
  { id: 'hafez', nameAr: 'حافظ', nameEn: 'Hafez', origin: 'Egypt', audioUrl: 'https://praytimes.org/audio/sunni/Hafez.mp3', category: 'reciter' },
  { id: 'hafiz_murad', nameAr: 'حافظ مراد', nameEn: 'Hafiz Murad', origin: 'Pakistan', audioUrl: 'https://praytimes.org/audio/sunni/Hafiz-Murad.mp3', category: 'reciter' },
  { id: 'saber', nameAr: 'صابر', nameEn: 'Saber', origin: 'Saudi Arabia', audioUrl: 'https://praytimes.org/audio/sunni/Saber.mp3', category: 'reciter' },
  { id: 'sharif_doman', nameAr: 'شريف دومان', nameEn: 'Sharif Doman', origin: 'Jordan', audioUrl: 'https://praytimes.org/audio/sunni/Sharif-Doman.mp3', category: 'reciter' },
  { id: 'al_hussaini', nameAr: 'الحسيني', nameEn: 'Al-Hussaini', origin: 'Egypt', audioUrl: 'https://praytimes.org/audio/sunni/Al-Hussaini.mp3', category: 'reciter' },
  { id: 'naghshbandi', nameAr: 'نقشبندي', nameEn: 'Naghshbandi', origin: 'Turkey', audioUrl: 'https://praytimes.org/audio/sunni/Naghshbandi.mp3', category: 'reciter' },
  { id: 'bakir_bash', nameAr: 'باكير باش', nameEn: 'Bakir Bash', origin: 'Afghanistan', audioUrl: 'https://praytimes.org/audio/sunni/Bakir-Bash.mp3', category: 'reciter' },

  // ═══════════════════════════════════════════════
  //  Famous Mosques
  // ═══════════════════════════════════════════════
  { id: 'makkah', nameAr: 'أذان الحرم المكي', nameEn: 'Masjid Al-Haram (Makkah)', origin: 'Makkah, Saudi Arabia', audioUrl: 'https://praytimes.org/audio/sunni/Adhan-Makkah.mp3', category: 'mosque' },
  { id: 'madinah', nameAr: 'أذان الحرم المدني', nameEn: 'Masjid An-Nabawi (Madinah)', origin: 'Madinah, Saudi Arabia', audioUrl: 'https://praytimes.org/audio/sunni/Adhan-Madinah.mp3', category: 'mosque' },
  { id: 'alaqsa', nameAr: 'أذان المسجد الأقصى', nameEn: 'Al-Aqsa Mosque', origin: 'Jerusalem, Palestine', audioUrl: 'https://praytimes.org/audio/sunni/Adhan-Alaqsa.mp3', category: 'mosque' },

  // ═══════════════════════════════════════════════
  //  Regional Styles
  // ═══════════════════════════════════════════════
  { id: 'egypt', nameAr: 'أذان مصري تقليدي', nameEn: 'Traditional Egyptian', origin: 'Cairo, Egypt', audioUrl: 'https://praytimes.org/audio/sunni/Adhan-Egypt.mp3', category: 'style' },
  { id: 'halab', nameAr: 'أذان حلب', nameEn: 'Aleppo Style', origin: 'Aleppo, Syria', audioUrl: 'https://praytimes.org/audio/sunni/Adhan-Halab.mp3', category: 'style' },

  // ═══════════════════════════════════════════════
  //  Additional (islamcan.com)
  // ═══════════════════════════════════════════════
  { id: 'azan2', nameAr: 'أذان المدينة المنورة', nameEn: 'Madinah Munawwarah', origin: 'Madinah, Saudi Arabia', audioUrl: 'https://www.islamcan.com/audio/adhan/azan2.mp3', category: 'more' },
  { id: 'azan3', nameAr: 'أذان المسجد الأقصى', nameEn: 'Al-Aqsa Call', origin: 'Jerusalem, Palestine', audioUrl: 'https://www.islamcan.com/audio/adhan/azan3.mp3', category: 'more' },
  { id: 'azan4', nameAr: 'أذان مصري', nameEn: 'Egyptian Azan', origin: 'Egypt', audioUrl: 'https://www.islamcan.com/audio/adhan/azan4.mp3', category: 'more' },
  { id: 'azan5', nameAr: 'أذان تركي', nameEn: 'Turkish Azan', origin: 'Turkey', audioUrl: 'https://www.islamcan.com/audio/adhan/azan5.mp3', category: 'more' },
  { id: 'azan9', nameAr: 'أذان متنوع 1', nameEn: 'Beautiful Adhan 1', origin: '', audioUrl: 'https://www.islamcan.com/audio/adhan/azan9.mp3', category: 'more' },
  { id: 'azan10', nameAr: 'أذان متنوع 2', nameEn: 'Beautiful Adhan 2', origin: '', audioUrl: 'https://www.islamcan.com/audio/adhan/azan10.mp3', category: 'more' },
  { id: 'azan11', nameAr: 'أذان متنوع 3', nameEn: 'Beautiful Adhan 3', origin: '', audioUrl: 'https://www.islamcan.com/audio/adhan/azan11.mp3', category: 'more' },
  { id: 'azan12', nameAr: 'أذان متنوع 4', nameEn: 'Beautiful Adhan 4', origin: '', audioUrl: 'https://www.islamcan.com/audio/adhan/azan12.mp3', category: 'more' },
  { id: 'azan13', nameAr: 'أذان متنوع 5', nameEn: 'Beautiful Adhan 5', origin: '', audioUrl: 'https://www.islamcan.com/audio/adhan/azan13.mp3', category: 'more' },
  { id: 'azan14', nameAr: 'أذان متنوع 6', nameEn: 'Beautiful Adhan 6', origin: '', audioUrl: 'https://www.islamcan.com/audio/adhan/azan14.mp3', category: 'more' },
  { id: 'azan15', nameAr: 'أذان متنوع 7', nameEn: 'Beautiful Adhan 7', origin: '', audioUrl: 'https://www.islamcan.com/audio/adhan/azan15.mp3', category: 'more' },
  { id: 'azan16', nameAr: 'أذان متنوع 8', nameEn: 'Beautiful Adhan 8', origin: '', audioUrl: 'https://www.islamcan.com/audio/adhan/azan16.mp3', category: 'more' },
  { id: 'azan17', nameAr: 'أذان متنوع 9', nameEn: 'Beautiful Adhan 9', origin: '', audioUrl: 'https://www.islamcan.com/audio/adhan/azan17.mp3', category: 'more' },
  { id: 'azan18', nameAr: 'أذان متنوع 10', nameEn: 'Beautiful Adhan 10', origin: '', audioUrl: 'https://www.islamcan.com/audio/adhan/azan18.mp3', category: 'more' },
  { id: 'azan19', nameAr: 'أذان متنوع 11', nameEn: 'Beautiful Adhan 11', origin: '', audioUrl: 'https://www.islamcan.com/audio/adhan/azan19.mp3', category: 'more' },
  { id: 'azan20', nameAr: 'أذان متنوع 12', nameEn: 'Beautiful Adhan 12', origin: '', audioUrl: 'https://www.islamcan.com/audio/adhan/azan20.mp3', category: 'more' },
  { id: 'azan21', nameAr: 'أذان متنوع 13', nameEn: 'Beautiful Adhan 13', origin: '', audioUrl: 'https://www.islamcan.com/audio/adhan/azan21.mp3', category: 'more' },

  // ═══════════════════════════════════════════════
  //  Shia Adhan (praytimes.org)
  // ═══════════════════════════════════════════════
  { id: 'aghati', nameAr: 'أغاتي', nameEn: 'Aghati', origin: 'Iran', audioUrl: 'https://praytimes.org/audio/shia/Aghati.mp3', category: 'more' },
  { id: 'ghalwash', nameAr: 'غلوش', nameEn: 'Ghalwash', origin: 'Iran', audioUrl: 'https://praytimes.org/audio/shia/Ghalwash.mp3', category: 'more' },
  { id: 'kazem_zadeh', nameAr: 'كاظم زادة', nameEn: 'Kazem Zadeh', origin: 'Iran', audioUrl: 'https://praytimes.org/audio/shia/Kazem-Zadeh.mp3', category: 'more' },
  { id: 'moazzen_zadeh', nameAr: 'مؤذن زادة', nameEn: 'Moazzen Zadeh', origin: 'Iran', audioUrl: 'https://praytimes.org/audio/shia/Moazzen-Zadeh.mp3', category: 'more' },
  { id: 'mohammad_zadeh', nameAr: 'محمد زادة', nameEn: 'Mohammad Zadeh', origin: 'Iran', audioUrl: 'https://praytimes.org/audio/shia/Mohammad-Zadeh.mp3', category: 'more' },
  { id: 'rezaeian', nameAr: 'رضائيان', nameEn: 'Rezaeian', origin: 'Iran', audioUrl: 'https://praytimes.org/audio/shia/Rezaeian.mp3', category: 'more' },
  { id: 'rowhani_nejad', nameAr: 'روحاني نجاد', nameEn: 'Rowhani Nejad', origin: 'Iran', audioUrl: 'https://praytimes.org/audio/shia/Rowhani-Nejad.mp3', category: 'more' },
  { id: 'salimi', nameAr: 'سليمي', nameEn: 'Salimi', origin: 'Iran', audioUrl: 'https://praytimes.org/audio/shia/Salimi.mp3', category: 'more' },
  { id: 'sharif_shia', nameAr: 'شريف', nameEn: 'Sharif', origin: 'Iran', audioUrl: 'https://praytimes.org/audio/shia/Sharif.mp3', category: 'more' },
  { id: 'sobhdel', nameAr: 'سبح دل', nameEn: 'Sobhdel', origin: 'Iran', audioUrl: 'https://praytimes.org/audio/shia/Sobhdel.mp3', category: 'more' },
  { id: 'tasvieh_chi', nameAr: 'تسويه چي', nameEn: 'Tasvieh Chi', origin: 'Iran', audioUrl: 'https://praytimes.org/audio/shia/Tasvieh-Chi.mp3', category: 'more' },
  { id: 'tookhi', nameAr: 'توخي', nameEn: 'Tookhi', origin: 'Iran', audioUrl: 'https://praytimes.org/audio/shia/Tookhi.mp3', category: 'more' },

  // ── System Default ──
  { id: 'default', nameAr: 'النظام (افتراضي)', nameEn: 'Default (System)', origin: '', audioUrl: '', category: 'reciter' },
];

const CATEGORIES = [
  { key: 'reciter', labelAr: 'قراء مشهورين', labelEn: 'Famous Reciters', icon: 'mic' as const },
  { key: 'mosque', labelAr: 'مساجد', labelEn: 'Famous Mosques', icon: 'home' as const },
  { key: 'style', labelAr: 'أنماط', labelEn: 'Regional Styles', icon: 'musical-notes' as const },
  { key: 'more', labelAr: 'المزيد', labelEn: 'More Voices', icon: 'add-circle' as const },
];

export default function AdhanCustomizationScreen() {
  const navigation = useNavigation<any>();
  const { user, updateSettings, language } = useApp();
  const isRtl = language === 'ar';
  const soundRef = useRef<Audio.Sound | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playPreview = async (voice: AdhanVoice) => {
    if (voice.id === 'default') return;

    if (previewingId === voice.id && soundRef.current) {
      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await soundRef.current.stopAsync();
          setPreviewingId(null);
          return;
        }
      } catch {
        setPreviewingId(null);
      }
      return;
    }

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setPreviewingId(voice.id);

      const { sound } = await Audio.Sound.createAsync(
        { uri: voice.audioUrl },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPreviewingId(null);
            soundRef.current = null;
          }
        }
      );
      soundRef.current = sound;
    } catch {
      setPreviewingId(null);
      Alert.alert(
        isRtl ? 'خطأ' : 'Error',
        isRtl ? 'تعذر تشغيل المعاينة. تحقق من اتصالك بالإنترنت.' : 'Could not play preview. Check your internet connection.'
      );
    }
  };

  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { padding: SPACING.base, paddingBottom: SPACING.md, borderBottomLeftRadius: RADIUS.xxl, borderBottomRightRadius: RADIUS.xxl, overflow: 'hidden' },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: COLORS.glassDark, alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: FONT_SIZES.lg, color: colors.textPrimary, fontFamily: FONTS.bodyBold },
    scroll: { flex: 1 },
    section: { paddingHorizontal: SPACING.base, marginBottom: SPACING.base },
    sectionHeader: {
      flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
      marginBottom: SPACING.sm, marginLeft: SPACING.xs, marginTop: SPACING.sm,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.caption, color: colors.gold,
      fontFamily: FONTS.bodyBold, textTransform: 'uppercase', letterSpacing: 1.2,
    },
    card: {
      backgroundColor: colors.card, borderRadius: RADIUS.xl,
      overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
    },
    voiceRow: {
      flexDirection: 'row', alignItems: 'center',
      borderBottomWidth: 1, borderBottomColor: colors.border,
      paddingRight: SPACING.sm,
    },
    voiceRowLast: { borderBottomWidth: 0 },
    voiceRowSelected: { backgroundColor: COLORS.glassGold },
    voiceInfo: {
      flex: 1, flexDirection: 'row', alignItems: 'center',
      gap: SPACING.md, padding: SPACING.base,
    },
    voiceIconWrap: {
      width: 36, height: 36, borderRadius: RADIUS.sm,
      backgroundColor: COLORS.glassDark, alignItems: 'center', justifyContent: 'center',
    },
    voiceTextBlock: { flex: 1 },
    voiceNameAr: {
      fontSize: FONT_SIZES.body, color: colors.textPrimary, fontFamily: 'serif',
      fontWeight: '600',
    },
    voiceNameSelected: { color: colors.gold },
    voiceNameEn: {
      fontSize: FONT_SIZES.caption, color: colors.textSecondary, fontFamily: FONTS.body,
      marginTop: 1,
    },
    voiceNameEnSelected: { color: colors.textPrimary },
    voiceOrigin: {
      fontSize: FONT_SIZES.micro, color: colors.textMuted, fontFamily: FONTS.body,
      marginTop: 1,
    },
    previewBtn: { padding: SPACING.sm },
    infoText: {
      fontSize: FONT_SIZES.small, color: colors.textSecondary,
      fontFamily: FONTS.body, lineHeight: 20, padding: SPACING.base,
    },
  }));

  const currentVoice = user?.settings?.adhanVoice || 'default';

  const handleSelect = async (voiceId: string) => {
    await updateSettings({ adhanVoice: voiceId });
    Alert.alert(
      isRtl ? 'تم التحديد' : 'Selected',
      isRtl ? `تم اختيار ${ADHAN_VOICES.find(v => v.id === voiceId)?.nameAr}` : `Selected ${ADHAN_VOICES.find(v => v.id === voiceId)?.nameEn}`
    );
  };

  const renderVoiceRow = (voice: AdhanVoice, idx: number, arr: AdhanVoice[]) => {
    const isSelected = currentVoice === voice.id;
    const isLast = idx === arr.length - 1;
    const isPlaying = previewingId === voice.id;
    return (
      <View
        key={voice.id}
        style={[styles.voiceRow, isLast && styles.voiceRowLast, isSelected && styles.voiceRowSelected]}
      >
        <AnimatedPressable
          style={styles.voiceInfo}
          onPress={() => handleSelect(voice.id)}
          activeOpacity={0.7}
        >
          <View style={styles.voiceIconWrap}>
            <Ionicons
              name="volume-high"
              size={18}
              color={isSelected ? COLORS.gold : COLORS.textMuted}
            />
          </View>
          <View style={styles.voiceTextBlock}>
            <Text style={[styles.voiceNameAr, isSelected && styles.voiceNameSelected]}>
              {voice.nameAr}
            </Text>
            <Text style={[styles.voiceNameEn, isSelected && styles.voiceNameEnSelected]}>
              {voice.nameEn}
            </Text>
            {voice.origin && <Text style={styles.voiceOrigin}>{voice.origin}</Text>}
          </View>
          {isSelected && <Ionicons name="checkmark-circle" size={22} color={COLORS.gold} />}
        </AnimatedPressable>
        {voice.id !== 'default' && (
          <AnimatedPressable style={styles.previewBtn} onPress={() => playPreview(voice)}>
            {isPlaying ? (
              <Ionicons name="stop-circle" size={28} color={COLORS.gold} />
            ) : (
              <Ionicons name="play-circle" size={28} color={COLORS.textSecondary} />
            )}
          </AnimatedPressable>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={GRADIENTS.brand} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <AnimatedPressable onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name={isRtl ? 'chevron-forward' : 'chevron-back'} size={22} color={COLORS.gold} />
            </AnimatedPressable>
            <Text style={styles.headerTitle}>{isRtl ? 'صوت الأذان' : 'Adhan Voice'}</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {CATEGORIES.map((cat) => {
          const voices = ADHAN_VOICES.filter(v => v.category === cat.key);
          if (voices.length === 0) return null;
          return (
            <View key={cat.key} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name={cat.icon} size={12} color={COLORS.gold} />
                <Text style={styles.sectionTitle}>
                  {isRtl ? cat.labelAr : cat.labelEn}
                </Text>
              </View>
              <View style={styles.card}>
                {voices.map((voice, idx) => renderVoiceRow(voice, idx, voices))}
              </View>
            </View>
          );
        })}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={12} color={COLORS.gold} />
            <Text style={styles.sectionTitle}>
              {isRtl ? 'معلومات' : 'Info'}
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.infoText}>
              {isRtl
                ? 'سيتم استخدام صوت الأذان المحدد للإشعارات. اضغط على أيقونة التشغيل لمعاينة الصوت، واضغط مرة أخرى للإيقاف.'
                : 'The selected adhan voice will be used for prayer notifications. Tap the play icon to preview, tap again to stop.'}
            </Text>
          </View>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}
