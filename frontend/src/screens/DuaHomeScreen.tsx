import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { DuaCategory } from '../types';
import { getOfflineDuaCategories } from '../services/offlineDuas';
import { COLORS, GRADIENTS, SHADOWS } from '../constants/colors';
import { FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import LogoDecoration from '../components/LogoDecoration';
import { FadeIn, SlideUp, AnimatedPressable } from '../components/AnimatedComponents';

type IoniconName = keyof typeof Ionicons.glyphMap;

const DUA_ICON_MAP: Record<string, IoniconName> = {
  'heart-broken': 'heart-dislike-outline',
  'heart-pulse':  'heart',
  'wave':         'water',
  'coins':        'cash',
  'book':         'book',
  'home':         'home',
  'refresh':      'refresh',
  'shield':       'shield',
  'star':         'star',
  'users':        'people',
  'moon':         'moon',
  'airplane':     'airplane',
  'restaurant':   'restaurant',
  'rainy':        'rainy',
  'compass':      'compass',
  'heart':        'heart',
  'people':       'people',
  'shirt':        'shirt',
  'medkit':       'medkit',
};

function resolveIcon(icon: string | undefined): IoniconName {
  if (!icon) return 'hand-left';
  return DUA_ICON_MAP[icon] || 'hand-left';
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getCardGradient(color: string, isDark: boolean): [string, string] {
  return [
    hexToRgba(color, isDark ? 0.2 : 0.08),
    hexToRgba(color, isDark ? 0.06 : 0.02),
  ];
}

export default function DuaHomeScreen() {
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.bg },
    center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },

    header:    { paddingBottom: SPACING.md, borderBottomLeftRadius: RADIUS.xxl, borderBottomRightRadius: RADIUS.xxl, overflow: 'hidden' },
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.base, paddingTop: SPACING.sm },
    backBtn: {
      width:          38,
      height:         38,
      borderRadius:   RADIUS.round,
      backgroundColor: colors.glassDark,
      alignItems:     'center',
      justifyContent: 'center',
    },
    titleBlock: { flex: 1, alignItems: 'center' },
    title:    { fontSize: FONT_SIZES.lg, color: colors.textPrimary, fontFamily: FONTS.bodyBold },
    subtitle: { fontSize: FONT_SIZES.caption, color: colors.textMuted, fontFamily: FONTS.body, marginTop: 2 },

    list: { padding: SPACING.base },

    card: {
      borderRadius: RADIUS.xl,
      overflow:     'hidden',
      marginBottom: SPACING.md,
      borderWidth:  1,
      borderColor:  `${colors.gold}12`,
      ...SHADOWS.card,
    },
    cardGrad: {
      flexDirection:  'row',
      alignItems:     'center',
      padding:        SPACING.base,
      gap:            SPACING.md,
      backgroundColor: colors.cardDark,
    },
    cardIconWrap: {
      width:          44,
      height:         44,
      borderRadius:   RADIUS.md,
      backgroundColor: colors.glassGold,
      alignItems:     'center',
      justifyContent: 'center',
    },
    cardInfo:  { flex: 1 },
    cardName: {
      fontSize:   FONT_SIZES.base,
      color:      colors.textPrimary,
      fontFamily: FONTS.bodyBold,
    },
    cardCount: {
      fontSize:   FONT_SIZES.caption,
      color:      colors.textMuted,
      fontFamily: FONTS.body,
      marginTop:  2,
    },

    empty:     { alignItems: 'center', gap: SPACING.md, paddingTop: SPACING.mega },
    emptyText: { fontSize: FONT_SIZES.base, color: colors.textMuted, fontFamily: FONTS.body },
  }));

  const navigation  = useNavigation<any>();
  const { t, language, theme } = useApp();
  const isDark = theme === 'dark' || theme === 'amoled';
  const [categories, setCategories] = useState<DuaCategory[]>([]);
  const [loading,    setLoading]    = useState(true);
  const isRtl = language === 'ar';

  useEffect(() => {
    const offline = getOfflineDuaCategories();
    setCategories(offline);
    setLoading(false);
  }, []);

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
      <LinearGradient colors={GRADIENTS.brand} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <AnimatedPressable onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name={isRtl ? 'chevron-forward' : 'chevron-back'} size={22} color={COLORS.gold} />
            </AnimatedPressable>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{isRtl ? 'مكتبة الأدعية' : 'Dua Library'}</Text>
              <Text style={styles.subtitle}>{isRtl ? 'أدعية مأثورة' : 'Authentic Duas'}</Text>
            </View>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <FadeIn><ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {categories.map((cat, index) => {
          const gradColors = getCardGradient(cat.color, isDark);
          return (
            <SlideUp key={cat.id} delay={index * 80}>
            <AnimatedPressable
              style={[styles.card, { borderLeftColor: cat.color, borderLeftWidth: 4 }]}
              onPress={() => navigation.navigate('DuaDetail', { categoryId: cat.id, title: cat.name })}
              activeOpacity={0.8}
            >
              <LinearGradient colors={gradColors} style={styles.cardGrad}>
                <View style={styles.cardIconWrap}>
                  <Ionicons name={resolveIcon(cat.icon)} size={22} color={COLORS.gold} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>
                    {isRtl ? cat.arabicName || cat.name : cat.name}
                  </Text>
                  {cat.duaCount !== undefined && (
                    <Text style={styles.cardCount}>
                      {cat.duaCount} {isRtl ? 'دعاء' : 'duas'}
                    </Text>
                  )}
                </View>
                <Ionicons
                  name={isRtl ? 'chevron-back' : 'chevron-forward'}
                  size={16}
                  color={`${COLORS.textSecondary}60`}
                />
              </LinearGradient>
            </AnimatedPressable>
            </SlideUp>
          );
        })}
        {categories.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="hand-left-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>{t('common.noData')}</Text>
          </View>
        )}
        <View style={{ height: 48 }} />
      </ScrollView></FadeIn>
    </View>
  );
}
