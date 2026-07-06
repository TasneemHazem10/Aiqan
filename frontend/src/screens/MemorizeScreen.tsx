import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView,
  StatusBar, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { COLORS, SHADOWS, GRADIENTS } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';
import LogoDecoration from '../components/LogoDecoration';
import { FadeIn, SlideUp, AnimatedPressable } from '../components/AnimatedComponents';

export default function MemorizeScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
    header: { padding: 16, paddingBottom: 12 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    backIcon: { fontSize: 18, color: colors.gold },
    title: { fontSize: 18, color: colors.textPrimary, fontWeight: '700' },
    content: { padding: 16 },
    sectionTitle: { fontSize: 16, color: colors.textPrimary, fontWeight: '700', marginBottom: 12, marginTop: 8 },
    modesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    modeCard: {
      width: (screenWidth - 16 * 2 - 10) / 2, backgroundColor: colors.card, borderRadius: 12, padding: 14,
      borderWidth: 1, borderColor: colors.border, alignItems: 'center',
    },
    modeCardActive: { borderColor: colors.gold, backgroundColor: `${colors.gold}10` },
    modeIcon: { fontSize: 24, marginBottom: 6 },
    modeLabel: { fontSize: 12, color: colors.textPrimary, fontWeight: '600' },
    surahGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
    surahChip: {
      backgroundColor: colors.card, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
      borderWidth: 1, borderColor: colors.border,
    },
    surahChipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
    surahChipText: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },
    startBtn: { backgroundColor: colors.gold, borderRadius: 14, paddingVertical: 14, alignItems: 'center', ...SHADOWS.card },
    startBtnText: { color: colors.green, fontSize: 15, fontWeight: '700' },
    footer: {
      padding: 16,
      backgroundColor: colors.bg,
      borderTopWidth: 1,
      borderColor: colors.border,
    },
  }), [screenWidth]);

  const navigation = useNavigation<any>();
  const { allSurahs, t, language } = useApp();
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [selectedMode, setSelectedMode] = useState<string>('reading');
  const [loading, setLoading] = useState(true);
  const isRtl = language === 'ar';

  const MODES = [
    { id: 'reading', labelAr: 'قراءة وتكرار', labelEn: 'Read & Repeat', icon: '👁️' },
    { id: 'hidden_words', labelAr: 'كلمات مخفية', labelEn: 'Hidden Words', icon: '🙈' },
    { id: 'hidden_ayat', labelAr: 'آيات مخفية', labelEn: 'Hidden Ayat', icon: '📝' },
    { id: 'fill_blank', labelAr: 'املأ الفراغ', labelEn: 'Fill in Blank', icon: '✏️' },
  ];

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gold} />
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
            <Text style={styles.title}>{t('memorization.newSession')}</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <FadeIn style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <SlideUp><Text style={styles.sectionTitle}>{t('memorization.chooseMode')}</Text></SlideUp>
            <SlideUp delay={80}><View style={styles.modesGrid}>
              {MODES.map(m => (
                <AnimatedPressable
                  key={m.id}
                  style={[styles.modeCard, selectedMode === m.id && styles.modeCardActive]}
                  onPress={() => setSelectedMode(m.id)}
                >
                  <Text style={styles.modeIcon}>{m.icon}</Text>
                  <Text style={styles.modeLabel}>{isRtl ? m.labelAr : m.labelEn}</Text>
                </AnimatedPressable>
              ))}
            </View></SlideUp>

            <SlideUp delay={160}><Text style={styles.sectionTitle}>{t('memorization.selectSurah')}</Text></SlideUp>
            <SlideUp delay={200}><View style={styles.surahGrid}>
              {allSurahs.map((s: any) => (
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
            </View></SlideUp>
            <View style={{ height: 16 }} />
          </ScrollView>
          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <AnimatedPressable
              style={styles.startBtn}
              onPress={() => {
                const surah = allSurahs.find((s: any) => s.number === selectedSurah);
                navigation.navigate('SurahReader', { surahNumber: selectedSurah, surahName: surah?.englishName || '' });
              }}
            >
              <Text style={styles.startBtnText}>{t('memorization.startSession')}</Text>
            </AnimatedPressable>
          </SafeAreaView>
        </View>
      </FadeIn>
    </View>
  );
}


