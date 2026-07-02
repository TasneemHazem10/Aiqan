import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useApp } from '../context/AppContext';
import { get } from '../utils/api';
import { ENDPOINTS } from '../constants/api';
import { PrayerTimesResponse } from '../types';
import { COLORS, GRADIENTS, SHADOWS } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';
import BadgeChip from '../components/BadgeChip';
import LogoDecoration from '../components/LogoDecoration';
import CardSurface from '../components/CardSurface';
import { FadeIn, SlideUp } from '../components/AnimatedComponents';
import { adhanService } from '../services/adhanService';

const PRAYER_NAMES = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const PRAYER_META: Record<string, { ar: string; icon: keyof typeof Ionicons.glyphMap }> = {
  Fajr:    { ar: 'الفجر',  icon: 'moon' },
  Sunrise: { ar: 'الشروق', icon: 'sunny-outline' },
  Dhuhr:   { ar: 'الظهر',  icon: 'sunny' },
  Asr:     { ar: 'العصر',  icon: 'partly-sunny' },
  Maghrib: { ar: 'المغرب', icon: 'partly-sunny-outline' },
  Isha:    { ar: 'العشاء', icon: 'moon-outline' },
};

function timeToMinutes(t: string): number {
  const parts = t.split(':').map(Number);
  return parts.length < 2 ? 0 : parts[0] * 60 + parts[1];
}

function getNextPrayerIndex(prayers: Array<{ name: string; time: string }>): number {
  const curMin = new Date().getHours() * 60 + new Date().getMinutes();
  const idx = prayers.findIndex(p => p.name !== 'Sunrise' && timeToMinutes(p.time) > curMin);
  return idx >= 0 ? idx : 0;
}

function formatTimeDisplay(t: string): string {
  if (!t || t === '--:--') return '--:--';
  const [hours, minutes] = t.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

export default function PrayerScreen() {
  const styles = useThemedStyles((colors) => StyleSheet.create({
    container:      { flex: 1, backgroundColor: colors.bg },
    loadingScreen:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
    loadingText:    { color: colors.textSecondary, fontFamily: FONTS.body, fontSize: FONT_SIZES.small },

    header:         { paddingBottom: SPACING.md, borderBottomLeftRadius: RADIUS.xxl, borderBottomRightRadius: RADIUS.xxl, overflow: 'hidden' },
    headerInner:    { alignItems: 'center', paddingTop: SPACING.sm, marginBottom: SPACING.sm },
    headerTitle: {
      fontSize:   FONT_SIZES.display,
      color:      colors.gold,
      fontFamily: FONTS.display,
      fontWeight: '700',
    },
    locationText: { fontSize: FONT_SIZES.caption, color: colors.gold, fontFamily: FONTS.body, marginTop: SPACING.xs },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.sm },
    hijriText: { fontSize: FONT_SIZES.small, color: colors.textPrimary, fontFamily: FONTS.bodyMed },
    gregorianText: { fontSize: FONT_SIZES.caption, color: colors.textSecondary, fontFamily: FONTS.body, marginTop: 2 },

    nextPrayerHero: {
      flexDirection:  'row',
      alignItems:     'center',
      marginHorizontal: SPACING.base,
      borderRadius:   RADIUS.xxl,
      padding:        SPACING.base,
      gap:            SPACING.md,
      ...SHADOWS.gold,
    },
    nextLeft:  { width: 48, height: 48, borderRadius: RADIUS.md, backgroundColor: 'rgba(0,0,0,0.15)', alignItems: 'center', justifyContent: 'center' },
    nextMid:   { flex: 1 },
    nextLabel: { fontSize: FONT_SIZES.caption, color: colors.darkGreen, fontFamily: FONTS.bodyMed, opacity: 0.7 },
    nextName:  { fontSize: FONT_SIZES.xl, color: colors.darkGreen, fontFamily: FONTS.display, fontWeight: '700' },
    nextTime:  { fontSize: FONT_SIZES.xxl, color: colors.darkGreen, fontFamily: FONTS.bodyBold, fontWeight: '700' },

    scroll:         { paddingHorizontal: SPACING.base },
    prayerCard: {
      backgroundColor: colors.card,
      borderRadius:    RADIUS.xxl,
      overflow:        'hidden',
      borderWidth:     1,
      borderColor:     colors.border,
      marginTop:       SPACING.base,
      ...SHADOWS.card,
    },
    prayerRow: {
      flexDirection:  'row',
      alignItems:     'center',
      gap:            SPACING.md,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.base,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      position:       'relative',
    },
    prayerRowActive:  { backgroundColor: `${colors.gold}10` },
    prayerRowSunrise: { opacity: 0.55 },
    prayerRowLast:    { borderBottomWidth: 0 },
    activeLine: {
      position:        'absolute',
      left: 0, top: 0, bottom: 0,
      width:           3,
      backgroundColor: colors.gold,
      borderRadius:    2,
    },
    prayerIconWrap: {
      width:           36,
      height:          36,
      borderRadius:    RADIUS.sm,
      backgroundColor: colors.glassDark,
      alignItems:      'center',
      justifyContent:  'center',
    },
    prayerIconActive: { backgroundColor: colors.glassGold },
    prayerName: {
      flex:       1,
      fontSize:   FONT_SIZES.base,
      color:      colors.textSecondary,
      fontFamily: FONTS.bodyMed,
    },
    prayerNameActive: { color: colors.gold, fontFamily: FONTS.bodyBold },
    prayerNameMuted:  { color: colors.textMuted },
    prayerTime: {
      fontSize:   FONT_SIZES.base,
      color:      colors.textPrimary,
      fontFamily: FONTS.bodySemi,
    },
    prayerTimeActive: { color: colors.gold },

    metaCard: {
      backgroundColor: colors.card,
      borderRadius:    RADIUS.xl,
      padding:         SPACING.base,
      marginTop:       SPACING.base,
      borderWidth:     1,
      borderColor:     colors.border,
    },
    metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md },
    metaInfo: { flex: 1 },
    metaLabel: { fontSize: FONT_SIZES.caption, color: colors.textMuted, fontFamily: FONTS.body },
    metaValue: { fontSize: FONT_SIZES.small, color: colors.textPrimary, fontFamily: FONTS.bodyMed, marginTop: 2 },
  }));

  const { t, language, user } = useApp();
  const [data,       setData]       = useState<PrayerTimesResponse | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nextIdx,    setNextIdx]    = useState(0);
  const [location,   setLocation]   = useState<string>('');
  const isRtl = language === 'ar';

  const fetchPrayers = useCallback(async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      let result: PrayerTimesResponse | null = null;
      
      if (status === 'granted') {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const { latitude, longitude } = loc.coords;
          const addressResult = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (addressResult.length > 0) {
            const addr = addressResult[0];
            setLocation(`${addr.city || addr.region}, ${addr.country}`);
          }
          result = await get<PrayerTimesResponse>(ENDPOINTS.PRAYER_TIMES_COORDS, {
            latitude,
            longitude,
            method: user?.settings?.prayerMethod || 5,
          });
        } catch (err) {
          console.error('Location error:', err);
        }
      }
      
      if (!result) {
        result = await get<PrayerTimesResponse>(ENDPOINTS.PRAYER_TIMES, {
          city: 'Cairo',
          country: 'Egypt',
          method: user?.settings?.prayerMethod || 5,
        });
        setLocation('Cairo, Egypt');
      }
      setData(result);
    } catch (err) {
      console.error('Prayer fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.settings?.prayerMethod]);

  useEffect(() => {
    fetchPrayers();
  }, [fetchPrayers]);

  useEffect(() => {
    if (!data) return;
    const prayers = PRAYER_NAMES.map(n => ({ name: n, time: data.timings[n] || '00:00' }));
    setNextIdx(getNextPrayerIndex(prayers));
    const interval = setInterval(() => setNextIdx(getNextPrayerIndex(prayers)), 30000);
    return () => clearInterval(interval);
  }, [data]);

  // Monitor prayer times and trigger adhan
  useEffect(() => {
    if (!data || !user?.settings?.prayerNotifs) return;
    adhanService.initialize();
    
    const monitorInterval = setInterval(async () => {
      const prayers = PRAYER_NAMES.filter(n => n !== 'Sunrise').map(n => ({
        name: n,
        time: data.timings[n] || '00:00',
      }));
      
      for (const prayer of prayers) {
        if (adhanService.isPrayerTimeNow(prayer.time)) {
          await adhanService.playAdhan(user?.settings?.adhanVoice);
          await adhanService.sendPrayerNotification(prayer.name, language === 'ar');
        }
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(monitorInterval);
  }, [data, user?.settings?.prayerNotifs, user?.settings?.adhanVoice, language]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPrayers();
    setRefreshing(false);
  }, [fetchPrayers]);

  if (loading) {
    return (
      <LinearGradient colors={GRADIENTS.brand} style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.gold} />
        <Text style={styles.loadingText}>{isRtl ? 'جارٍ تحديد الموقع…' : 'Detecting location…'}</Text>
      </LinearGradient>
    );
  }

  const prayers = data
    ? PRAYER_NAMES.map(n => ({ name: n, time: data.timings[n] || '--:--' }))
    : [];

  const nextPrayer = prayers[nextIdx];

  return (
    <View style={styles.container}>
      <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <LinearGradient colors={GRADIENTS.brand} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <LogoDecoration size={220} opacity={0.04} position="top-right" />
          <View style={styles.headerInner}>
            <Text style={styles.headerTitle}>{isRtl ? 'أوقات الصلاة' : 'Prayer Times'}</Text>
            {location && (
              <Text style={styles.locationText}>
                <Ionicons name="location" size={11} color={COLORS.gold} /> {location}
              </Text>
            )}
            {data?.date?.hijri && (
              <View style={styles.dateRow}>
                <Ionicons name="moon" size={12} color={COLORS.gold} />
                <Text style={styles.hijriText}>
                  {data.date.hijri.day} {isRtl ? data.date.hijri.month.ar : data.date.hijri.month.en} {data.date.hijri.year} هـ
                </Text>
              </View>
            )}
            {data?.date?.gregorian && (
              <Text style={styles.gregorianText}>
                {data.date.gregorian.weekday.en}, {data.date.gregorian.month.en} {data.date.gregorian.day}
              </Text>
            )}
          </View>

          {/* Next Prayer Hero */}
          {nextPrayer && nextPrayer.name !== 'Sunrise' && (
            <LinearGradient
              colors={['#A67C00', '#D4A017', '#E8B84B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextPrayerHero}
            >
              <View style={styles.nextLeft}>
                <Ionicons name={PRAYER_META[nextPrayer.name]?.icon || 'time'} size={32} color={COLORS.darkGreen} />
              </View>
              <View style={styles.nextMid}>
                <Text style={styles.nextLabel}>{isRtl ? 'الصلاة القادمة' : 'Next Prayer'}</Text>
                <Text style={styles.nextName}>
                  {isRtl ? PRAYER_META[nextPrayer.name]?.ar : nextPrayer.name}
                </Text>
              </View>
              <Text style={styles.nextTime}>{formatTimeDisplay(nextPrayer.time)}</Text>
            </LinearGradient>
          )}
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Prayer Timeline */}
        <SlideUp><View style={styles.prayerCard}>
          {prayers.map((p, idx) => {
            const isNext    = idx === nextIdx;
            const isSunrise = p.name === 'Sunrise';
            const meta      = PRAYER_META[p.name];
            const isLast    = idx === prayers.length - 1;
            return (
              <View
                key={p.name}
                style={[
                  styles.prayerRow,
                  isNext    && styles.prayerRowActive,
                  isSunrise && styles.prayerRowSunrise,
                  isLast    && styles.prayerRowLast,
                ]}
              >
                {isNext && <View style={styles.activeLine} />}

                {/* Icon */}
                <View style={[styles.prayerIconWrap, isNext && styles.prayerIconActive]}>
                  <Ionicons
                    name={meta?.icon || 'time'}
                    size={18}
                    color={isNext ? COLORS.gold : isSunrise ? COLORS.textMuted : COLORS.textSecondary}
                  />
                </View>

                {/* Name */}
                <Text style={[styles.prayerName, isNext && styles.prayerNameActive, isSunrise && styles.prayerNameMuted]}>
                  {isRtl ? meta?.ar || p.name : p.name}
                </Text>

                {/* Next badge */}
                {isNext && !isSunrise && (
                  <BadgeChip label={isRtl ? 'التالية' : 'Next'} variant="gold" size="sm" />
                )}

                {/* Time */}
                <Text style={[styles.prayerTime, isNext && styles.prayerTimeActive, isSunrise && styles.prayerNameMuted]}>
                  {formatTimeDisplay(p.time)}
                </Text>
              </View>
            );
          })}
        </View></SlideUp>

        {/* Location / Method Info */}
        {data?.meta && (
          <FadeIn delay={150}><View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <Ionicons name="location" size={16} color={COLORS.info} />
              <View style={styles.metaInfo}>
                <Text style={styles.metaLabel}>{isRtl ? 'طريقة الحساب' : 'Calculation Method'}</Text>
                <Text style={styles.metaValue}>{data.meta.method.name}</Text>
              </View>
            </View>
            <View style={[styles.metaRow, { marginTop: SPACING.sm }]}>
              <Ionicons name="time" size={16} color={COLORS.info} />
              <View style={styles.metaInfo}>
                <Text style={styles.metaLabel}>{isRtl ? 'المنطقة الزمنية' : 'Timezone'}</Text>
                <Text style={styles.metaValue}>{data.meta.timezone}</Text>
              </View>
            </View>
          </View></FadeIn>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}
