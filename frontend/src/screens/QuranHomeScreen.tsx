import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { COLORS, GRADIENTS, SHADOWS } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';
import { getData } from '../utils/storage';
import CardSurface from '../components/CardSurface';
import { FadeIn, AnimatedPressable } from '../components/AnimatedComponents';
import LogoDecoration from '../components/LogoDecoration';


const STORAGE_LAST_PAGE = 'aiqan_last_quran_page';

const JUZS = Array.from({ length: 30 }, (_, i) => i + 1);
const JUZ_PAGES: Record<number, number> = {
  1: 1,   2: 22,  3: 42,  4: 62,  5: 82,  6: 102, 7: 121,  8: 142,
  9: 162, 10: 182,11: 201,12: 222,13: 242,14: 262, 15: 282, 16: 302,
  17: 322,18: 342,19: 362,20: 382,21: 402,22: 422, 23: 442, 24: 462,
  25: 482,26: 502,27: 522,28: 542,29: 562,30: 582,
};

type IoniconName = keyof typeof Ionicons.glyphMap;

const ACTION_CARDS: Array<{
  labelAr: string; labelEn: string;
  icon: IoniconName; action: string; subLabel: string;
}> = [
  { labelAr: 'اقرأ القرآن',   labelEn: 'Read Quran',    icon: 'book',        action: 'read',         subLabel: 'From Page 1' },
  { labelAr: 'قائمة السور',   labelEn: 'Surah List',   icon: 'list',        action: 'surahList',    subLabel: '114 Surahs' },
  { labelAr: 'بحث',           labelEn: 'Search',        icon: 'search',      action: 'search',       subLabel: 'Find verses' },
  { labelAr: 'الأجزاء',       labelEn: 'By Juz',        icon: 'grid',        action: 'juz',          subLabel: '30 Juz' },
  { labelAr: 'القراء',        labelEn: 'Reciters',      icon: 'mic',         action: 'reciters',     subLabel: 'Choose reciter' },
  { labelAr: 'حفظ القرآن',    labelEn: 'Memorize',      icon: 'school',       action: 'memorize',     subLabel: 'AI Hifz coach' },
];

export default function QuranHomeScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },

    header:   { paddingBottom: SPACING.md, borderBottomLeftRadius: RADIUS.xxl, borderBottomRightRadius: RADIUS.xxl, overflow: 'hidden' },
    headerContent: { alignItems: 'center', paddingTop: SPACING.sm, gap: SPACING.xs },
    headerArabic: {
      fontSize:   36,
      color:      colors.gold,
      fontFamily: FONTS.display,
      fontWeight: '700',
    },
    headerTitle: {
      fontSize:   FONT_SIZES.small,
      color:      colors.textSecondary,
      fontFamily: FONTS.bodyMed,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    headerMeta: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap', justifyContent: 'center' },
    metaPill: {
      flexDirection:  'row',
      alignItems:     'center',
      gap:            4,
      backgroundColor: colors.glassDark,
      borderRadius:   RADIUS.round,
      paddingVertical:  4,
      paddingHorizontal: SPACING.sm,
    },
    metaText: { fontSize: FONT_SIZES.caption, color: colors.textSecondary, fontFamily: FONTS.body },

    content:    { paddingHorizontal: SPACING.base },

    continueCard:  { marginTop: SPACING.base, marginBottom: SPACING.md, borderRadius: RADIUS.xxl, overflow: 'hidden', borderWidth: 1, borderColor: `${colors.gold}25`, ...SHADOWS.gold },
    continueGrad:  { flexDirection: 'row', alignItems: 'center', padding: SPACING.base, gap: SPACING.md, borderRadius: RADIUS.xxl },
    continueIconWrap: { width: 52, height: 52, borderRadius: RADIUS.lg, backgroundColor: colors.glassDark, alignItems: 'center', justifyContent: 'center' },
    continueInfo:  { flex: 1 },
    continueLabel: { fontSize: FONT_SIZES.caption, color: colors.textMuted, fontFamily: FONTS.body },
    continuePage:  { fontSize: FONT_SIZES.xl, color: colors.gold, fontFamily: FONTS.bodyBold, fontWeight: '700' },
    continueDate:  { fontSize: FONT_SIZES.caption, color: colors.textMuted, fontFamily: FONTS.body },

    actionGrid: {
      flexDirection: 'row',
      flexWrap:      'wrap',
      gap:           SPACING.md,
      marginBottom:  SPACING.base,
    },
    actionCard: {
      width:          (screenWidth - SPACING.base * 2 - SPACING.md * 2) / 3,
      backgroundColor: colors.card,
      borderRadius:   RADIUS.xl,
      padding:        SPACING.md,
      alignItems:     'center',
      gap:            SPACING.xs,
      borderWidth:    1,
      borderColor:    colors.border,
      ...SHADOWS.soft,
    },
    actionIconWrap: {
      width:          48,
      height:         48,
      borderRadius:   RADIUS.md,
      backgroundColor: colors.glassGold,
      alignItems:     'center',
      justifyContent: 'center',
      marginBottom:   SPACING.xs,
    },
    actionLabel: { fontSize: FONT_SIZES.small, color: colors.textPrimary, fontFamily: FONTS.bodySemi, textAlign: 'center' },
    actionSub:   { fontSize: FONT_SIZES.micro, color: colors.textMuted, fontFamily: FONTS.body, textAlign: 'center' },

    sectionTitle: { fontSize: FONT_SIZES.lg, color: colors.textPrimary, fontFamily: FONTS.display, fontWeight: '700', marginBottom: SPACING.md },

    juzSection:  { marginBottom: SPACING.xl },
    juzGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    juzCard: {
      width:          '18%',
      backgroundColor: colors.card,
      borderRadius:   RADIUS.md,
      padding:        SPACING.sm,
      alignItems:     'center',
      borderWidth:    1,
      borderColor:    colors.border,
    },
    juzNum:  { fontSize: FONT_SIZES.lg, color: colors.gold, fontFamily: FONTS.bodyBold, fontWeight: '700' },
    juzLabel:{ fontSize: FONT_SIZES.micro, color: colors.textMuted, fontFamily: FONTS.body },

  }), [screenWidth]);

  const navigation = useNavigation<any>();
  const { allSurahs, t, language } = useApp();
  const isRtl = language === 'ar';
  const [lastPage, setLastPage] = useState<{ lastPage: number; lastReadAt: string } | null>(null);
  const [showJuz,  setShowJuz]  = useState(false);

  useEffect(() => {
    getData<{ lastPage: number; lastReadAt: string }>(STORAGE_LAST_PAGE).then(d => {
      if (d) setLastPage(d);
    });
  }, []);

  const handleAction = (action: string) => {
    switch (action) {
      case 'read':       navigation.navigate('QuranPageReader', { initialPage: 1 }); break;
      case 'surahList':  navigation.navigate('SurahList'); break;
      case 'search':     navigation.navigate('QuranSearch'); break;
      case 'juz':        setShowJuz(v => !v); break;
      case 'reciters':   navigation.navigate('Reciters'); break;
      case 'memorize':   navigation.navigate('Memorization', {}); break;
    }
  };

  return (
    <View style={styles.container}>
      <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <LinearGradient colors={GRADIENTS.brand} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <LogoDecoration size={220} opacity={0.04} position="top-right" />
          <View style={styles.headerContent}>
            <Text style={styles.headerArabic}>القرآن الكريم</Text>
            <Text style={styles.headerTitle}>{isRtl ? '' : 'The Quran'}</Text>
            <View style={styles.headerMeta}>
              <View style={styles.metaPill}>
                <Ionicons name="book" size={12} color={COLORS.gold} />
                <Text style={styles.metaText}>114 {isRtl ? 'سورة' : 'Surahs'}</Text>
              </View>
              <View style={styles.metaPill}>
                <Ionicons name="document-text" size={12} color={COLORS.gold} />
                <Text style={styles.metaText}>604 {isRtl ? 'صفحة' : 'Pages'}</Text>
              </View>
              <View style={styles.metaPill}>
                <Ionicons name="list" size={12} color={COLORS.gold} />
                <Text style={styles.metaText}>30 {isRtl ? 'جزء' : 'Juz'}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Continue Reading */}
        {lastPage && (
          <AnimatedPressable
            style={styles.continueCard}
            onPress={() => navigation.navigate('QuranPageReader', { initialPage: lastPage.lastPage })}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[`${COLORS.gold}22`, `${COLORS.gold}08`]} style={styles.continueGrad}>
              <View style={styles.continueIconWrap}>
                <Ionicons name="book" size={28} color={COLORS.gold} />
              </View>
              <View style={styles.continueInfo}>
                <Text style={styles.continueLabel}>{isRtl ? 'تابع القراءة' : 'Continue Reading'}</Text>
                <Text style={styles.continuePage}>
                  {isRtl ? 'صفحة' : 'Page'} {lastPage.lastPage}
                </Text>
                <Text style={styles.continueDate}>
                  {new Date(lastPage.lastReadAt).toLocaleDateString()}
                </Text>
              </View>
              <Ionicons name={isRtl ? 'chevron-back' : 'chevron-forward'} size={20} color={`${COLORS.gold}60`} />
            </LinearGradient>
          </AnimatedPressable>
        )}

        {/* Action Grid */}
        <View style={styles.actionGrid}>
          {ACTION_CARDS.map((card) => (
            <AnimatedPressable
              key={card.action}
              style={styles.actionCard}
              onPress={() => handleAction(card.action)}
              activeOpacity={0.75}
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name={card.icon} size={26} color={COLORS.gold} />
              </View>
              <Text style={styles.actionLabel}>{isRtl ? card.labelAr : card.labelEn}</Text>
              <Text style={styles.actionSub}>{card.subLabel}</Text>
            </AnimatedPressable>
          ))}
        </View>

        {/* Juz Grid (collapsible) */}
        {showJuz && (
          <View style={styles.juzSection}>
            <Text style={styles.sectionTitle}>{isRtl ? 'اختر الجزء' : 'Select Juz'}</Text>
            <View style={styles.juzGrid}>
              {JUZS.map(juz => (
                <AnimatedPressable
                  key={juz}
                  style={styles.juzCard}
                  onPress={() => navigation.navigate('QuranPageReader', { initialPage: JUZ_PAGES[juz] || 1 })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.juzNum}>{juz}</Text>
                  <Text style={styles.juzLabel}>{isRtl ? 'جزء' : 'Juz'}</Text>
                </AnimatedPressable>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}
