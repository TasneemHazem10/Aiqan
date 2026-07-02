import React, { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import {
  View, Text, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { GRADIENTS } from '../constants/colors';
import { SPACING, FONTS, FONT_SIZES, RADIUS } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useApp } from '../context/AppContext';
import LogoDecoration from './LogoDecoration';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  gradient?: boolean;
  paddingBottom?: number;
  children?: React.ReactNode;
  isRtl?: boolean;
  showLogo?: boolean;
}

export default function ScreenHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
  rightElement,
  gradient = true,
  paddingBottom = SPACING.md,
  children,
  isRtl = false,
  showLogo = false,
}: ScreenHeaderProps) {
  const navigation = useNavigation<any>();
  const { activeColors } = useApp();
  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1,
      damping: 18,
      stiffness: 140,
      mass: 0.6,
      useNativeDriver: true,
    }).start();
  }, [headerAnim]);

  const styles = useThemedStyles((colors) => ({
    gradientWrap: {
      borderBottomLeftRadius: RADIUS.xxl,
      borderBottomRightRadius: RADIUS.xxl,
      overflow: 'hidden',
    },
    flatWrap: {
      backgroundColor: colors.bg,
      borderBottomLeftRadius: RADIUS.xxl,
      borderBottomRightRadius: RADIUS.xxl,
      overflow: 'hidden',
    },
    container: {
      paddingHorizontal: SPACING.base,
      paddingTop: SPACING.xs,
    },
    headerLogo: {
      position: 'absolute',
      top: -60,
      right: -60,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 40,
    },
    backBtn: {
      width: 34,
      height: 34,
      borderRadius: RADIUS.round,
      backgroundColor: colors.glassDark,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholder: {
      width: 34,
    },
    titleBlock: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: SPACING.sm,
    },
    title: {
      fontSize: FONT_SIZES.lg,
      color: colors.textPrimary,
      fontFamily: FONTS.bodyBold,
      fontWeight: '700',
      textAlign: 'center',
    },
    subtitle: {
      fontSize: FONT_SIZES.caption,
      color: colors.textSecondary,
      fontFamily: FONTS.body,
      marginTop: 2,
      textAlign: 'center',
    },
    rightSlot: {
      width: 38,
      alignItems: 'flex-end',
    },
  }));

  const handleBack = () => {
    if (onBack) onBack();
    else navigation.goBack();
  };

  const headerOpacity = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const headerTranslateY = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  const content = (
    <Animated.View style={[styles.container, { paddingBottom, opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] }]}>
      {showLogo && (
        <LogoDecoration
          size={180}
          opacity={0.05}
          position="top-right"
          style={styles.headerLogo}
        />
      )}
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isRtl ? 'chevron-forward' : 'chevron-back'}
              size={22}
              color={activeColors.gold}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          ) : null}
        </View>

        {rightElement ? (
          <View style={styles.rightSlot}>{rightElement}</View>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {children}
    </Animated.View>
  );

  if (gradient) {
    return (
      <LinearGradient colors={GRADIENTS.brand} style={styles.gradientWrap}>
        <SafeAreaView edges={['top']}>
          {content}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.flatWrap}>
      {content}
    </SafeAreaView>
  );
}
