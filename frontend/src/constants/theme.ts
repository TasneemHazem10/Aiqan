import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const SCREEN = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: SCREEN_WIDTH < 375,
  isMedium: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
  isLarge: SCREEN_WIDTH >= 414,
} as const;

export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  mega: 64,
} as const;

export const RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  round: 40,
  circle: 9999,
} as const;

export const FONTS = {
  display: 'PlayfairDisplay_700Bold',
  displayIt: 'PlayfairDisplay_700Bold_Italic',
  body: 'Inter_400Regular',
  bodyMed: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  arabic: Platform.OS === 'ios' ? 'Noto Kufi Arabic' : 'serif',
} as const;

export const FONT_SIZES = {
  micro: 10,
  caption: 12,
  small: 13,
  body: 14,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 22,
  display: 24,
  hero: 28,
  mega: 34,
  arabic: 22,
  arabicLg: 26,
  arabicXl: 32,
} as const;

export const LINE_HEIGHTS = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
  arabic: 2.0,
} as const;

export const ANIMATION = {
  fast: 150,
  normal: 250,
  slow: 350,
  verySlow: 500,
  spring: {
    damping: 15,
    stiffness: 180,
    mass: 1,
  },
  springLight: {
    damping: 20,
    stiffness: 300,
    mass: 0.5,
  },
  springSnap: {
    damping: 12,
    stiffness: 250,
    mass: 0.8,
  },
  springGentle: {
    damping: 16,
    stiffness: 120,
    mass: 0.7,
  },
  springBouncy: {
    damping: 10,
    stiffness: 150,
    mass: 0.6,
  },
} as const;

export const TAB_BAR = {
  height: Platform.OS === 'ios' ? 78 : 60,
  paddingBottom: Platform.OS === 'ios' ? 22 : 6,
  paddingTop: 8,
  iconSize: 22,
  labelSize: 10,
} as const;

export const CARD = {
  padding: SPACING.base,
  paddingLg: SPACING.xl,
  radius: RADIUS.xl,
  radiusLg: RADIUS.xxl,
} as const;

export const HEADER = {
  paddingHorizontal: SPACING.base,
  paddingBottom: SPACING.md,
  titleSize: FONT_SIZES.display,
} as const;
