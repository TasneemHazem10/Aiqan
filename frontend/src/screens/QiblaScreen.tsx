import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Animated,
  ActivityIndicator, StatusBar, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { COLORS, GRADIENTS, SHADOWS } from '../constants/colors';
import { FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { FadeIn, AnimatedPressable } from '../components/AnimatedComponents';
import LogoDecoration from '../components/LogoDecoration';

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

function directionName(degrees: number, isRtl: boolean): string {
  const dirs = isRtl
    ? ['شمال', 'شمال شرق', 'شرق', 'جنوب شرق', 'جنوب', 'جنوب غرب', 'غرب', 'شمال غرب']
    : ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return dirs[index];
}

function calculateQiblaAngle(lat: number, lng: number): number {
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (KAABA_LAT * Math.PI) / 180;
  const Δλ = ((KAABA_LNG - lng) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
}

export default function QiblaScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
    loadingText: { color: colors.textSecondary, fontFamily: FONTS.body, fontSize: FONT_SIZES.small },
    errorText:   { color: colors.error, fontSize: FONT_SIZES.base, fontFamily: FONTS.bodyMed, textAlign: 'center' },
    retryBtn: {
      flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
      backgroundColor: colors.gold, borderRadius: RADIUS.lg,
      paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, ...SHADOWS.gold,
    },
    retryBtnText: { color: colors.darkGreen, fontFamily: FONTS.bodyBold, fontSize: FONT_SIZES.base },

    header:    { paddingBottom: SPACING.md, borderBottomLeftRadius: RADIUS.xxl, borderBottomRightRadius: RADIUS.xxl, overflow: 'hidden' },
    headerRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: SPACING.base, paddingTop: SPACING.sm,
    },
    backBtn: {
      width: 38, height: 38, borderRadius: RADIUS.round,
      backgroundColor: colors.glassDark, alignItems: 'center', justifyContent: 'center',
    },
    title: { fontSize: FONT_SIZES.lg, color: colors.textPrimary, fontFamily: FONTS.bodyBold },

    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
    compassContainer: {
      width: Math.min(screenWidth * 0.7, 350), height: Math.min(screenWidth * 0.7, 350), borderRadius: Math.min(screenWidth * 0.7, 350) / 2,
      backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: colors.gold,
      marginBottom: SPACING.xl,
      ...SHADOWS.gold,
    },
    compass: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
    compassFace: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', position: 'relative' },
    compassN: { position: 'absolute', top: 10, fontSize: FONT_SIZES.small, color: colors.error, fontFamily: FONTS.bodyBold },
    compassS: { position: 'absolute', bottom: 10, fontSize: FONT_SIZES.small, color: colors.textMuted, fontFamily: FONTS.bodyBold },
    compassE: { position: 'absolute', right: 10, fontSize: FONT_SIZES.small, color: colors.textMuted, fontFamily: FONTS.bodyBold },
    compassW: { position: 'absolute', left: 10, fontSize: FONT_SIZES.small, color: colors.textMuted, fontFamily: FONTS.bodyBold },
    compassNeedle: {
      width: 4, height: 80, borderRadius: 2, position: 'absolute', top: 30,
      backgroundColor: colors.gold,
    },
    qiblaMarker: { position: 'absolute', width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    qiblaIcon:   { fontSize: 24 },

    statusCard: {
      backgroundColor: colors.card, borderRadius: RADIUS.xl, padding: SPACING.base,
      alignItems: 'center', borderWidth: 1, borderColor: colors.border,
      minWidth: 220, ...SHADOWS.card,
    },
    statusAligned: { borderColor: colors.gold, backgroundColor: colors.glassGold, ...SHADOWS.gold },
    statusText:    { fontSize: FONT_SIZES.md, color: colors.textPrimary, fontFamily: FONTS.bodyBold },
    degreeText:    { fontSize: FONT_SIZES.small, color: colors.textSecondary, fontFamily: FONTS.body, marginTop: SPACING.xs },
    qiblaInfo:     { fontSize: FONT_SIZES.small, color: colors.gold, marginTop: SPACING.base, fontFamily: FONTS.bodyMed },
  }), [screenWidth]);

  const navigation = useNavigation<any>();
  const { t, language } = useApp();
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
  const [heading, setHeading] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isRtl = language === 'ar';

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const continuousHeading = useRef(0);

  useEffect(() => {
    initCompass();
    return () => {
      Magnetometer.removeAllListeners();
    };
  }, []);

  const initCompass = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError(isRtl ? 'تم رفض الإذن' : 'Permission denied');
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const angle = calculateQiblaAngle(loc.coords.latitude, loc.coords.longitude);
      setQiblaAngle(angle);

      Magnetometer.removeAllListeners();
      Magnetometer.setUpdateInterval(100);
      Magnetometer.addListener((data) => {
        const h = Math.atan2(data.y, data.x) * (180 / Math.PI);
        const normalized = (h + 360) % 360;
        setHeading(normalized);

        let target = normalized;
        const diff = target - continuousHeading.current;
        if (diff > 180) target -= 360;
        else if (diff < -180) target += 360;
        continuousHeading.current = target;

        Animated.timing(rotateAnim, {
          toValue: target,
          duration: 100,
          useNativeDriver: true,
        }).start();
      });

      setLoading(false);
    } catch {
      setError(isRtl ? 'فشل تحديد الاتجاه' : 'Failed to determine direction');
      setLoading(false);
    }
  };

  const qiblaHeading = qiblaAngle !== null ? (qiblaAngle - heading + 360) % 360 : 0;
  const isAligned = Math.abs(qiblaHeading) < 10 || Math.abs(qiblaHeading - 360) < 10;

  if (loading) {
    return (
      <LinearGradient colors={GRADIENTS.splashGradient} style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gold} />
        <Text style={styles.loadingText}>{isRtl ? 'جاري المعايرة...' : 'Calibrating...'}</Text>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={GRADIENTS.splashGradient} style={styles.center}>
        <Ionicons name="warning" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
        <AnimatedPressable style={styles.retryBtn} onPress={initCompass}>
          <Ionicons name="refresh" size={16} color={COLORS.darkGreen} />
          <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
        </AnimatedPressable>
      </LinearGradient>
    );
  }

  const rotation = rotateAnim.interpolate({
    inputRange: [-360, 0, 360],
    outputRange: ['-360deg', '0deg', '360deg'],
  });

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
            <Text style={styles.title}>{isRtl ? 'اتجاه القبلة' : 'Qibla Compass'}</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.compassContainer}>
          <Animated.View style={[styles.compass, { transform: [{ rotate: rotation }] }]}>
            <View style={styles.compassFace}>
              <Text style={styles.compassN}>N</Text>
              <Text style={styles.compassS}>S</Text>
              <Text style={styles.compassE}>E</Text>
              <Text style={styles.compassW}>W</Text>
              <View style={styles.compassNeedle} />
              <View style={[styles.qiblaMarker, { transform: [{ rotate: `${qiblaAngle || 0}deg` }] }]}>
                <Text style={styles.qiblaIcon}>🕋</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        <View style={[styles.statusCard, isAligned && styles.statusAligned]}>
          <Text style={styles.statusText}>
            {isAligned
              ? (isRtl ? '✓ متجه نحو القبلة' : '✓ Facing Qibla')
              : (isRtl ? 'ادِر الجهاز نحو القبلة' : 'Turn towards Qibla')}
          </Text>
          <Text style={styles.degreeText}>
            {qiblaAngle !== null ? `${Math.round(qiblaHeading)}° ${isRtl ? 'عن القبلة' : 'from Qibla'}` : ''}
          </Text>
        </View>

        {qiblaAngle !== null && (
          <Text style={styles.qiblaInfo}>
            {isRtl ? 'اتجاه القبلة: ' : 'Qibla: '}{Math.round(qiblaAngle)}° {directionName(qiblaAngle, isRtl)}
          </Text>
        )}
      </View>
    </View>
  );
}
