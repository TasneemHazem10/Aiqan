import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { useApp } from '../context/AppContext';
import { ANIMATION, RADIUS, SPACING } from '../constants/theme';
import LogoDecoration from './LogoDecoration';

interface CardSurfaceProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'glass' | 'gold' | 'green' | 'logo';
  padding?: number;
  radius?: number;
  shadow?: 'none' | 'soft' | 'card' | 'elevated' | 'gold';
  index?: number;
  noEntryAnim?: boolean;
}

export default function CardSurface({
  children,
  style,
  variant = 'default',
  padding = SPACING.base,
  radius = RADIUS.xxl,
  shadow = 'card',
  index = 0,
  noEntryAnim = false,
}: CardSurfaceProps) {
  const { activeColors } = useApp();
  const opacity = useSharedValue(noEntryAnim ? 1 : 0);
  const translateY = useSharedValue(noEntryAnim ? 0 : 20);

  useEffect(() => {
    if (noEntryAnim) return;
    opacity.value = withDelay(index * 60, withSpring(1, ANIMATION.springGentle));
    translateY.value = withDelay(index * 60, withSpring(0, ANIMATION.springGentle));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const variantStyle = getVariantStyle(variant, activeColors);
  const shadowStyle = getShadowStyle(shadow, activeColors);

  return (
    <Animated.View
      style={[
        styles.base,
        { padding, borderRadius: radius },
        variantStyle,
        shadowStyle,
        animatedStyle,
        style,
      ]}
    >
      {variant === 'logo' && (
        <LogoDecoration
          size={160}
          opacity={0.04}
          position="center"
          style={styles.logoBg}
        />
      )}
      {children}
    </Animated.View>
  );
}

function getVariantStyle(variant: string, colors: Record<string, string>) {
  switch (variant) {
    case 'glass':
      return {
        backgroundColor: colors.glassDark,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
      };
    case 'green':
      return {
        backgroundColor: colors.glassGreen,
        borderWidth: 1,
        borderColor: `${colors.greenDeep}30`,
      };
    case 'gold':
      return {
        backgroundColor: colors.glassGold,
        borderWidth: 1,
        borderColor: `${colors.gold}30`,
      };
    case 'logo':
      return {
        backgroundColor: colors.cardDark,
        borderWidth: 1,
        borderColor: `${colors.gold}20`,
        overflow: 'hidden' as const,
      };
    default:
      return {
        backgroundColor: colors.cardDark,
        borderWidth: 1,
        borderColor: `${colors.gold}20`,
      };
  }
}

function getShadowStyle(shadow: string, colors: Record<string, string>) {
  switch (shadow) {
    case 'none':
      return {};
    case 'soft':
      return Platform.select({
        ios: {
          shadowColor: colors.shadow || '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        android: { elevation: 2 },
      });
    case 'card':
      return Platform.select({
        ios: {
          shadowColor: colors.shadow || '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        android: { elevation: 3 },
      });
    case 'elevated':
      return Platform.select({
        ios: {
          shadowColor: colors.shadow || '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.10,
          shadowRadius: 24,
        },
        android: { elevation: 6 },
      });
    case 'gold':
      return Platform.select({
        ios: {
          shadowColor: colors.gold,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.20,
          shadowRadius: 12,
        },
        android: { elevation: 4 },
      });
    default:
      return {};
  }
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  logoBg: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
