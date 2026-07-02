import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView,
  StatusBar, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { get } from '../utils/api';
import { ENDPOINTS } from '../constants/api';
import { AzkarItem, AzkarCategory } from '../types';
import { COLORS, GRADIENTS, SHADOWS } from '../constants/colors';
import { FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { incrementDhikr } from '../utils/storage';
import { FALLBACK_AZKAR_CATEGORIES } from '../data/azkar';
import LogoDecoration from '../components/LogoDecoration';
import { FadeIn, SlideUp, AnimatedPressable } from '../components/AnimatedComponents';

type Route = RouteProp<{ AzkarDetail: { categoryId: string; title: string } }, 'AzkarDetail'>;

export default function AzkarDetailScreen() {
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.bg },
    center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },

    header:    { paddingBottom: SPACING.md, borderBottomLeftRadius: RADIUS.xxl, borderBottomRightRadius: RADIUS.xxl, overflow: 'hidden' },
    headerRow: {
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.base,
      paddingTop:     SPACING.sm,
      marginBottom:   SPACING.md,
    },
    backBtn: {
      width:          38,
      height:         38,
      borderRadius:   RADIUS.round,
      backgroundColor: colors.glassDark,
      alignItems:     'center',
      justifyContent: 'center',
    },
    headerTitle: { fontSize: FONT_SIZES.lg, color: colors.textPrimary, fontFamily: FONTS.bodyBold },
    resetBtn: {
      width:          38,
      height:         38,
      borderRadius:   RADIUS.round,
      backgroundColor: colors.glassGold,
      alignItems:     'center',
      justifyContent: 'center',
    },

    progressSection:  { paddingHorizontal: SPACING.base, gap: SPACING.sm, marginBottom: SPACING.sm },
    progressHeader:   { flexDirection: 'row', justifyContent: 'space-between' },
    progressText:     { fontSize: FONT_SIZES.caption, color: colors.textSecondary, fontFamily: FONTS.body },
    progressPct:      { fontSize: FONT_SIZES.caption, color: colors.gold, fontFamily: FONTS.bodySemi },
    progressTrack: {
      height:          4,
      backgroundColor: colors.border,
      borderRadius:    2,
      overflow:        'hidden',
    },
    progressFill: {
      height:          '100%',
      backgroundColor: colors.gold,
      borderRadius:    2,
    },

    list: { padding: SPACING.base },

    card: {
      backgroundColor: colors.cardDark,
      borderRadius:    RADIUS.xxl,
      padding:         SPACING.base,
      marginBottom:    SPACING.md,
      borderWidth:     1,
      borderColor:     `${colors.gold}20`,
      gap:             SPACING.sm,
      ...SHADOWS.soft,
    },
    cardDone: {
      borderColor:     `${colors.greenForest}50`,
      backgroundColor: `${colors.greenForest}10`,
    },
    doneOverlay: { position: 'absolute', top: SPACING.md, right: SPACING.md },

    arabicText: {
      fontSize:   FONT_SIZES.arabicLg,
      color:      colors.textPrimary,
      textAlign:  'right',
      lineHeight: FONT_SIZES.arabicLg * 2,
      fontFamily: Platform.OS === 'ios' ? 'Noto Kufi Arabic' : 'serif',
    },
    arabicDone: { opacity: 0.65 },

    transliteration: {
      fontSize:   FONT_SIZES.small,
      color:      colors.textMuted,
      fontFamily: FONTS.body,
      fontStyle:  'italic',
      lineHeight: FONT_SIZES.small * 1.6,
    },
    translation: {
      fontSize:   FONT_SIZES.small,
      color:      colors.textSecondary,
      fontFamily: FONTS.body,
      lineHeight: FONT_SIZES.small * 1.7,
    },
    sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    source:    { fontSize: FONT_SIZES.caption, color: colors.gold, fontFamily: FONTS.bodyMed },

    cardFooter: {
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'space-between',
      gap:            SPACING.sm,
    },
    counterBadge: {
      flexDirection:  'row',
      alignItems:     'center',
      gap:            4,
      backgroundColor: colors.glassGold,
      borderRadius:   RADIUS.round,
      paddingHorizontal: SPACING.md,
      paddingVertical:  4,
    },
    counterBadgeDone: { backgroundColor: `${colors.green}18` },
    counterText: { fontSize: FONT_SIZES.caption, color: colors.gold, fontFamily: FONTS.bodySemi },
    counterTextDone:  { color: colors.green },
    virtue: {
      flex:       1,
      fontSize:   FONT_SIZES.caption,
      color:      colors.textMuted,
      fontFamily: FONTS.body,
      textAlign:  'right',
    },

    progressBar: {
      height:          3,
      backgroundColor: colors.border,
      borderRadius:    2,
      overflow:        'hidden',
    },
    progressBarFill: {
      height:          '100%',
      backgroundColor: colors.gold,
      borderRadius:    2,
    },
    progressBarDone: { backgroundColor: colors.green },

    emptyState: { alignItems: 'center', gap: SPACING.md, paddingTop: SPACING.mega },
    emptyText:  { fontSize: FONT_SIZES.base, color: colors.textMuted, fontFamily: FONTS.body },
  }));

  const navigation        = useNavigation<any>();
  const route             = useRoute<Route>();
  const { categoryId }    = route.params;
  const { t, language, totalDhikr, setTotalDhikr }   = useApp();
  const [azkar, setAzkar] = useState<AzkarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts]   = useState<Record<string, number>>({});
  const isRtl = language === 'ar';

  useEffect(() => {
    get<AzkarCategory>(ENDPOINTS.AZKAR_CATEGORY(categoryId))
      .then(data => setAzkar(data.azkar || []))
      .catch(() => setAzkar(FALLBACK_AZKAR_CATEGORIES[categoryId]?.azkar || []))
      .finally(() => setLoading(false));
  }, [categoryId]);

  const incrementCount = (id: string, max: number) => {
    setCounts(prev => {
      const current = prev[id] || 0;
      if (current >= max) return prev;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const newCount = current + 1;
      if (newCount >= max) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      return { ...prev, [id]: newCount };
    });
    incrementDhikr(1).then(newTotal => setTotalDhikr(newTotal));
  };

  const resetCounts = () => {
    setCounts({});
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const totalDone  = azkar.filter(item => (counts[item.id] || 0) >= item.count).length;
  const totalCount = azkar.length;

  if (loading) {
    return (
      <LinearGradient colors={GRADIENTS.brand} style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <LinearGradient colors={GRADIENTS.brand} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <AnimatedPressable onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name={isRtl ? 'chevron-forward' : 'chevron-back'} size={22} color={COLORS.gold} />
            </AnimatedPressable>
            <Text style={styles.headerTitle}>{isRtl ? 'الأذكار' : 'Azkar'}</Text>
            <AnimatedPressable onPress={resetCounts} style={styles.resetBtn}>
              <Ionicons name="refresh" size={16} color={COLORS.gold} />
            </AnimatedPressable>
          </View>

          {/* Progress bar */}
          {totalCount > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressText}>
                  {totalDone}/{totalCount} {isRtl ? 'مكتمل' : 'completed'}
                </Text>
                <Text style={styles.progressPct}>
                  {Math.round((totalDone / totalCount) * 100)}%
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${(totalDone / totalCount) * 100}%` as any }]} />
              </View>
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>

      <FadeIn><ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {azkar.map((item, index) => {
          const count     = counts[item.id] || 0;
          const remaining = item.count - count;
          const done      = remaining <= 0;
          const progress  = Math.min(count / item.count, 1);

          return (
            <SlideUp key={item.id} delay={index * 60}>
            <AnimatedPressable
              style={[styles.card, done && styles.cardDone]}
              onPress={() => incrementCount(item.id, item.count)}
              activeOpacity={0.85}
            >
              {/* Done overlay indicator */}
              {done && (
                <View style={styles.doneOverlay}>
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.green} />
                </View>
              )}

              {/* Arabic Text */}
              <Text style={[styles.arabicText, done && styles.arabicDone]}>
                {item.arabic}
              </Text>

              {/* Transliteration */}
              {item.transliteration && (
                <Text style={styles.transliteration}>{item.transliteration}</Text>
              )}

              {/* Translation */}
              <Text style={[styles.translation, done && { opacity: 0.6 }]}>
                {item.translation}
              </Text>

              {/* Source */}
              {item.source && (
                <View style={styles.sourceRow}>
                  <Ionicons name="book-outline" size={11} color={COLORS.gold} />
                  <Text style={styles.source}>{item.source}</Text>
                </View>
              )}

              {/* Footer: counter + virtue */}
              <View style={styles.cardFooter}>
                <View style={[styles.counterBadge, done && styles.counterBadgeDone]}>
                  <Ionicons
                    name={done ? 'checkmark' : 'repeat'}
                    size={11}
                    color={done ? COLORS.green : COLORS.gold}
                  />
                  <Text style={[styles.counterText, done && styles.counterTextDone]}>
                    {done
                      ? (isRtl ? 'مكتمل' : 'Done')
                      : `${remaining} ${isRtl ? 'مرة' : 'left'}`}
                  </Text>
                </View>
                {item.virtue && (
                  <Text style={styles.virtue} numberOfLines={2}>
                    {item.virtue}
                  </Text>
                )}
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressBarFill,
                  { width: `${progress * 100}%` as any },
                  done && styles.progressBarDone,
                ]} />
              </View>
            </AnimatedPressable>
            </SlideUp>
          );
        })}

        {azkar.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="sparkles-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>{isRtl ? 'لا توجد أذكار' : 'No azkar found'}</Text>
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView></FadeIn>
    </View>
  );
}
