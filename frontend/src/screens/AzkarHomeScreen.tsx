import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, Animated, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { get } from '../utils/api';
import { ENDPOINTS } from '../constants/api';
import { AzkarCategory } from '../types';
import { COLORS, SHADOWS } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';
import { incrementTasbih, getData, KEYS } from '../utils/storage';
import { FALLBACK_AZKAR_CATEGORIES } from '../data/azkar';
import { SlideUp, AnimatedPressable } from '../components/AnimatedComponents';
import LogoDecoration from '../components/LogoDecoration';


type IoniconName = keyof typeof Ionicons.glyphMap;

interface CategoryMeta {
  icon: IoniconName;
  gradient: [string, string];
  iconColor: string;
  accentColor: string;
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  morning:     { icon: 'sunny',      gradient: ['#2C2C2E', '#1C1C1E'], iconColor: COLORS.gold, accentColor: '#F5A623' },
  evening:     { icon: 'moon',       gradient: ['#2C2C2E', '#1C1C1E'], iconColor: COLORS.gold, accentColor: '#7B68EE' },
  after_salah: { icon: 'hand-left',  gradient: ['#2C2C2E', '#1C1C1E'], iconColor: COLORS.gold, accentColor: '#4ECDC4' },
  sleep:       { icon: 'moon',       gradient: ['#2C2C2E', '#1C1C1E'], iconColor: COLORS.gold, accentColor: '#6C63FF' },
  wakeup:      { icon: 'sunny',      gradient: ['#2C2C2E', '#1C1C1E'], iconColor: COLORS.gold, accentColor: '#FF8C42' },
  anxiety:     { icon: 'heart',      gradient: ['#2C2C2E', '#1C1C1E'], iconColor: COLORS.gold, accentColor: '#E84393' },
  protection:  { icon: 'shield',     gradient: ['#2C2C2E', '#1C1C1E'], iconColor: COLORS.gold, accentColor: '#44CC88' },
  food:        { icon: 'restaurant', gradient: ['#2C2C2E', '#1C1C1E'], iconColor: COLORS.gold, accentColor: '#FF6B6B' },
  travel:      { icon: 'airplane',   gradient: ['#2C2C2E', '#1C1C1E'], iconColor: COLORS.gold, accentColor: '#5E9CEA' },
};

const DEFAULT_META: CategoryMeta = {
  icon:        'sparkles',
  gradient:    ['#2C2C2E', '#1C1C1E'],
  iconColor:   COLORS.gold,
  accentColor: COLORS.gold,
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getCardGradient(color: string, isDark: boolean): [string, string] {
  return [
    hexToRgba(color, isDark ? 0.20 : 0.08),
    hexToRgba(color, isDark ? 0.06 : 0.02),
  ];
}



export default function AzkarHomeScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - SPACING.base * 2 - SPACING.md) / 2;
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container:  { flex: 1, overflow: 'hidden', backgroundColor: colors.bg },
    centered:   { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
    safe:       { flex: 1 },
    scroll:     { padding: SPACING.base },

    loadingTitle: {
      fontSize:   FONT_SIZES.display,
      color:      colors.gold,
      fontFamily: FONTS.display,
      fontWeight: '700',
      marginTop:  SPACING.base,
    },

    header: {
      alignItems:   'center',
      marginBottom: SPACING.md,
      marginTop:    SPACING.xs,
      gap:          SPACING.xs,
    },
    headerIconWrap: {
      width:          60,
      height:         60,
      borderRadius:   RADIUS.lg,
      backgroundColor: colors.glassGold,
      borderWidth:    1,
      borderColor:    `${colors.gold}30`,
      alignItems:     'center',
      justifyContent: 'center',
    },
    title: {
      fontSize:   FONT_SIZES.display,
      color:      colors.gold,
      fontFamily: FONTS.display,
      fontWeight: '700',
    },
    subtitle: {
      fontSize:   FONT_SIZES.small,
      color:      colors.textSecondary,
      fontFamily: FONTS.body,
    },

    grid: {
      flexDirection: 'row',
      flexWrap:      'wrap',
      gap:           SPACING.md,
      marginBottom:  SPACING.base,
    },
    card: {
      width:        cardWidth,
      borderRadius: RADIUS.xxxl,
      overflow:     'hidden',
      borderWidth:  1,
      borderColor:  `${colors.gold}12`,
      ...SHADOWS.card,
    },
    cardGrad: {
      padding:        SPACING.base,
      minHeight:      120,
      justifyContent: 'space-between',
      backgroundColor: colors.cardDark,
    },
    cardIconWrap: {
      width:          44,
      height:         44,
      borderRadius:   RADIUS.md,
      alignItems:     'center',
      justifyContent: 'center',
      backgroundColor: colors.glassGold,
    },
    cardName: {
      fontSize:   FONT_SIZES.small,
      color:      colors.textPrimary,
      fontFamily: FONTS.bodyBold,
      marginTop:  SPACING.sm,
    },
    cardArrow: { alignSelf: 'flex-end' },

    duaCard:   {
      borderRadius: RADIUS.xxxl,
      overflow:     'hidden',
      backgroundColor: colors.card,
      borderWidth:    1,
      borderColor:    colors.borderSubtle,
      ...SHADOWS.card,
    },
    duaGrad: {
      flexDirection:  'row',
      alignItems:     'center',
      gap:            SPACING.md,
      padding:        SPACING.base,
    },
    duaIconWrap: {
      width:          52,
      height:         52,
      borderRadius:   RADIUS.md,
      backgroundColor: colors.goldMedium,
      alignItems:     'center',
      justifyContent: 'center',
    },
    duaText:   { flex: 1 },
    duaTitle: {
      fontSize:   FONT_SIZES.md,
      color:      colors.textPrimary,
      fontFamily: FONTS.bodyBold,
    },
    duaSub: {
      fontSize:   FONT_SIZES.caption,
      color:      colors.textSecondary,
      fontFamily: FONTS.body,
      marginTop:  3,
    },

    tasbihCard: {
      borderRadius: RADIUS.xxxl,
      overflow:     'hidden',
      marginBottom: SPACING.base,
      backgroundColor: colors.card,
      borderWidth:    1,
      borderColor:    colors.borderSubtle,
      ...SHADOWS.card,
    },
    tasbihGrad: {
      padding:     SPACING.base,
      alignItems:  'center',
    },
    tasbihHeader: {
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'space-between',
      width:          '100%',
      marginBottom:   SPACING.md,
    },
    tasbihHeaderIcon: {
      width:           36,
      height:          36,
      borderRadius:    RADIUS.md,
      backgroundColor: `${colors.gold}15`,
      alignItems:      'center',
      justifyContent: 'center',
    },
    tasbihTitle: {
      fontSize:   FONT_SIZES.md,
      color:      colors.textPrimary,
      fontFamily: FONTS.bodyBold,
    },
    sessionBadge: {
      paddingHorizontal: SPACING.sm,
      paddingVertical:   4,
      borderRadius:      RADIUS.lg,
      backgroundColor:   `${colors.gold}12`,
    },
    sessionBadgeText: {
      fontSize:   FONT_SIZES.caption,
      color:      colors.gold,
      fontFamily: FONTS.body,
    },
    tasbihCircle: {
      width:           Math.min(screenWidth * 0.4, 160),
      height:          Math.min(screenWidth * 0.4, 160),
      borderRadius:    Math.min(screenWidth * 0.4, 160) / 2,
      backgroundColor: 'rgba(212,162,70,0.08)',
      borderWidth:     2.5,
      borderColor:     colors.gold,
      alignItems:      'center',
      justifyContent:  'center',
      marginVertical:  SPACING.sm,
    },
    tasbihCount: {
      fontSize:   44,
      color:      colors.gold,
      fontFamily: FONTS.display,
      fontWeight: '800',
    },
    tasbihLabel: {
      fontSize:   FONT_SIZES.caption,
      color:      colors.textSecondary,
      fontFamily: FONTS.body,
      marginTop:  2,
    },
    tasbihFooter: {
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'space-between',
      width:          '100%',
      marginTop:      SPACING.sm,
    },
    tasbihTotal: {
      fontSize:   FONT_SIZES.small,
      color:      colors.textMuted,
      fontFamily: FONTS.body,
    },
  }), [screenWidth]);

  const navigation  = useNavigation<any>();
  const { language, theme, activeColors: colors } = useApp();
  const isDark = theme === 'dark' || theme === 'amoled';
  const [categories, setCategories] = useState<AzkarCategory[]>([]);
  const [loading,    setLoading]    = useState(true);
  const isRtl = language === 'ar';

  const [tasbihCount, setTasbihCount] = useState(0);
  const [tasbihSession, setTasbihSession] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getData<number>(KEYS.TASBIH_TOTAL, 0).then(val => {
      if (val) setTasbihCount(val);
    });
  }, []);

  useEffect(() => {
    if (!loading) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, { toValue: 0.88, duration: 1500, useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 1.06, duration: 1500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    Animated.timing(textFade, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
    return () => pulse.stop();
  }, [loading, logoScale, textFade]);

  useEffect(() => {
    get<AzkarCategory[]>(ENDPOINTS.AZKAR_ALL)
      .then(data => setCategories(data || []))
      .catch(() => setCategories(
        Object.keys(CATEGORY_META).map(id => {
          const fb = FALLBACK_AZKAR_CATEGORIES[id];
          return {
            id,
            name: fb?.name || id,
            arabicName: fb?.arabicName || id,
            icon: fb?.icon || CATEGORY_META[id]?.icon || '',
            color: fb?.color || '',
          };
        })
      ))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <Animated.View style={{ transform: [{ scale: logoScale }] }}>
          <LogoDecoration size={110} opacity={0.9} />
        </Animated.View>
        <Animated.Text style={[styles.loadingTitle, { opacity: textFade }]}>
          {isRtl ? 'إيقان' : 'Aiqan'}
        </Animated.Text>
      </View>
    );
  }

  const displayCats = categories.length > 0
    ? categories
    : Object.keys(CATEGORY_META).map(id => ({
        id, name: id, arabicName: id, icon: '', color: '',
      }));

  const handleTasbihPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1.08, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    const newTotal = await incrementTasbih(1);
    setTasbihCount(newTotal);
    setTasbihSession(prev => prev + 1);
  };

  const resetSession = () => {
    setTasbihSession(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={styles.container}>
      <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Header */}
          <LogoDecoration size={200} opacity={0.04} position="top-right" />
          <View style={styles.header}>
            <View style={styles.headerIconWrap}>
              <Ionicons name="sparkles" size={28} color={COLORS.gold} />
            </View>
            <Text style={styles.title}>{isRtl ? 'الأذكار' : 'Azkar'}</Text>
            <Text style={styles.subtitle}>
              {isRtl ? 'أذكار اليوم والليلة' : 'Daily Remembrance'}
            </Text>
          </View>

          {/* Category Grid */}
          <View style={styles.grid}>
            {displayCats.map((cat, index) => {
              const meta = CATEGORY_META[cat.id] || DEFAULT_META;
              const accent = meta.accentColor;
              const gradColors = getCardGradient(accent, isDark);
              return (
                <SlideUp key={cat.id} delay={index * 80}>
                  <AnimatedPressable
                    style={[styles.card, { borderLeftColor: accent, borderLeftWidth: 4 }]}
                    onPress={() => navigation.navigate('AzkarDetail', { categoryId: cat.id, title: cat.name })}
                    activeOpacity={0.8}
                  >
                    <LinearGradient colors={gradColors} style={styles.cardGrad}>
                      <View style={[styles.cardIconWrap, { backgroundColor: hexToRgba(accent, isDark ? 0.25 : 0.12) }]}>
                        <Ionicons name={meta.icon} size={26} color={accent} />
                      </View>
                      <Text style={styles.cardName}>
                        {isRtl ? cat.arabicName || cat.name : cat.name}
                      </Text>
                      <View style={styles.cardArrow}>
                        <Ionicons name="chevron-forward" size={12} color={colors.textMuted} />
                      </View>
                    </LinearGradient>
                  </AnimatedPressable>
                </SlideUp>
              );
            })}
          </View>

          {/* Dua Library Card */}
          <SlideUp delay={displayCats.length * 80 + 80 || 320} style={{ marginBottom: SPACING.xl }}>
            <AnimatedPressable
              style={styles.duaCard}
              onPress={() => navigation.navigate('DuaHome')}
              activeOpacity={0.85}
            >
              <View style={styles.duaGrad}>
                <View style={styles.duaIconWrap}>
                  <Ionicons name="hand-left" size={30} color={COLORS.gold} />
                </View>
                <View style={styles.duaText}>
                  <Text style={styles.duaTitle}>{isRtl ? 'مكتبة الأدعية' : 'Dua Library'}</Text>
                  <Text style={styles.duaSub}>
                    {isRtl ? 'أدعية مأثورة من القرآن والسنة' : 'Authentic duas from Quran & Sunnah'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </View>
            </AnimatedPressable>
          </SlideUp>

          {/* Tasbih Counter Card */}
          <Animated.View style={[styles.tasbihCard, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.tasbihGrad}>
              <View style={styles.tasbihHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <View style={styles.tasbihHeaderIcon}>
                    <Ionicons name="repeat" size={18} color={COLORS.gold} />
                  </View>
                  <Text style={styles.tasbihTitle}>
                    {isRtl ? 'التسبيح' : 'Tasbih'}
                  </Text>
                </View>
                <View style={styles.sessionBadge}>
                  <Text style={styles.sessionBadgeText}>
                    {isRtl ? `الجلسة: ${tasbihSession}` : `Session: ${tasbihSession}`}
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={handleTasbihPress} activeOpacity={0.8}>
                <View style={styles.tasbihCircle}>
                  <Text style={styles.tasbihCount}>{tasbihSession}</Text>
                  <Text style={styles.tasbihLabel}>
                    {isRtl ? 'تسبيحة' : 'Tasbeeh'}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.tasbihFooter}>
                <Text style={styles.tasbihTotal}>
                  {isRtl ? `الإجمالي: ${tasbihCount}` : `Total: ${tasbihCount}`}
                </Text>
                <TouchableOpacity onPress={resetSession} activeOpacity={0.7}>
                  <Ionicons name="refresh" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          <View style={{ height: 48 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}