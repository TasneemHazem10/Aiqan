export const BRAND = {
  gold: '#D4A246',
  cream: '#F2EDE1',
  offWhite: '#FAF7F2',
  warmBeige: '#F5F0E8',
  greenDeep: '#0F5132',
  greenForest: '#1B6B43',
  teal: '#129990',
} as const;

export const COLORS = {
  ...BRAND,
  goldLight: '#E0C07A',
  goldDark: '#B8892E',
  goldPale: 'rgba(212, 162, 70, 0.10)',
  goldMedium: 'rgba(212, 162, 70, 0.20)',

  // Light mode defaults
  bg: BRAND.offWhite,
  bgSecondary: BRAND.cream,
  card: '#FFFFFF',
  cardWarm: BRAND.cream,
  border: '#E5DFD3',
  borderSubtle: '#EDE8DF',

  textPrimary: '#1C1C1E',
  textSecondary: '#636366',
  textMuted: '#8E8E93',
  textOnDark: BRAND.offWhite,
  textGold: BRAND.gold,
  textInverse: '#1C1C1E',

  success: '#34A853',
  error: '#EA4335',
  warning: BRAND.gold,
  info: '#5E9CEA',

  greenDeep: BRAND.greenDeep,
  greenForest: BRAND.greenForest,
  teal: BRAND.teal,
  greenPale: 'rgba(15, 81, 50, 0.08)',
  tealPale: 'rgba(18, 153, 144, 0.08)',
  darkGreen: '#1C1C1E',
  green: '#636366',
  glassGreen: 'rgba(15, 81, 50, 0.06)',

  glassWhite: 'rgba(255, 255, 255, 0.70)',
  glassGold: 'rgba(212, 162, 70, 0.08)',
  glassDark: 'rgba(0, 0, 0, 0.04)',

  overlay: 'rgba(0, 0, 0, 0.40)',
  overlayLight: 'rgba(0, 0, 0, 0.06)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Dark palette
  darkBg: '#0C0C0E',
  darkCard: '#1C1C1F',
  darkBorder: '#2C2C30',
  darkTextPrimary: '#F2F2F7',
  darkTextSecondary: '#AEAEB2',
  darkTextMuted: '#636366',
} as const;

const GRADIENT_LIGHT: Record<string, readonly [string, string]> = {
  brand: ['#F8F6F2', '#EFEBE3'],
  gold: ['#D4A246', '#E0C07A'],
  goldSubtle: ['rgba(212, 162, 70, 0.06)', 'rgba(212, 162, 70, 0.02)'],
  green: ['#0F5132', '#1B6B43'],
  greenSubtle: ['rgba(15, 81, 50, 0.06)', 'rgba(27, 107, 67, 0.02)'],
  teal: ['#129990', '#0A7A6E'],
  cream: ['#F2EDE3', '#F8F6F2'],
  card: ['#FFFFFF', '#FAF9F6'],
  cardGold: ['rgba(212, 162, 70, 0.04)', 'rgba(212, 162, 70, 0.01)'],
  cardGreen: ['rgba(15, 81, 50, 0.04)', 'rgba(27, 107, 67, 0.01)'],
  warmGlow: ['#F8F6F2', '#EFEBE3'],
  splashGradient: ['#1A1A1A', '#2D2D2D'],
};

const GRADIENT_DARK: Record<string, readonly [string, string]> = {
  brand: ['#151518', '#0C0C0E'],
  gold: ['#D4A246', '#B8892E'],
  goldSubtle: ['rgba(212, 162, 70, 0.10)', 'rgba(212, 162, 70, 0.04)'],
  green: ['#0A3D25', '#0F5132'],
  greenSubtle: ['rgba(15, 81, 50, 0.12)', 'rgba(27, 107, 67, 0.04)'],
  teal: ['#0A7A6E', '#065F57'],
  cream: ['#1A1A1D', '#111114'],
  card: ['#222226', '#1C1C1F'],
  cardGold: ['rgba(212, 162, 70, 0.08)', 'rgba(212, 162, 70, 0.02)'],
  cardGreen: ['rgba(15, 81, 50, 0.10)', 'rgba(27, 107, 67, 0.03)'],
  warmGlow: ['#1C1C1F', '#151518'],
  splashGradient: ['#1A1A1A', '#2D2D2D'],
};

export function getGradients(theme: 'light' | 'dark' | 'amoled') {
  const isDark = theme === 'dark' || theme === 'amoled';
  return isDark ? GRADIENT_DARK : GRADIENT_LIGHT;
}

export const GRADIENTS: Record<string, readonly [string, string]> = {
  ...GRADIENT_LIGHT,
};

export function applyGradientTheme(theme: 'light' | 'dark' | 'amoled') {
  const isDark = theme === 'dark' || theme === 'amoled';
  const g = isDark ? GRADIENT_DARK : GRADIENT_LIGHT;
  for (const k of Object.keys(g)) {
    (GRADIENTS as any)[k] = (g as any)[k];
  }
}

export interface CustomColors {
  gold?: string;
  highlight?: string;
  bg?: string;
  bgSecondary?: string;
  card?: string;
  cardWarm?: string;
  border?: string;
  borderSubtle?: string;
  textPrimary?: string;
  textSecondary?: string;
  textMuted?: string;
  success?: string;
  error?: string;
  warning?: string;
  info?: string;
  tabBar?: string;
  tabBarActive?: string;
  tabBarInactive?: string;
  headerBg?: string;
  buttonPrimary?: string;
  buttonText?: string;
  inputBg?: string;
  inputBorder?: string;
  iconColor?: string;
  badgeBg?: string;
  badgeText?: string;
  divider?: string;
  shadow?: string;
  ayahText?: string;
  ayahNumber?: string;
  surahName?: string;
  progressBar?: string;
  loadingIndicator?: string;
}

export function getThemeColors(
  theme: 'light' | 'dark' | 'amoled',
  customColors: Record<string, string> | null
) {
  const isDark = theme === 'dark' || theme === 'amoled';
  const isAmoled = theme === 'amoled';
  const c: Record<string, string> = {};

  // ── Static colors (same in all themes) ──
  c.gold = '#D4A246';
  c.goldLight = '#E0C07A';
  c.goldDark = '#B8892E';
  c.goldPale = 'rgba(212, 162, 70, 0.10)';
  c.goldMedium = 'rgba(212, 162, 70, 0.20)';
  c.greenDeep = '#0F5132';
  c.greenForest = '#1B6B43';
  c.teal = '#129990';
  c.greenPale = 'rgba(15, 81, 50, 0.08)';
  c.tealPale = 'rgba(18, 153, 144, 0.08)';
  c.white = '#FFFFFF';
  c.black = '#000000';
  c.transparent = 'transparent';
  c.textGold = '#D4A246';
  c.surahName = '#D4A246';
  c.success = '#34A853';
  c.error = '#EA4335';
  c.warning = '#FBBC04';
  c.info = '#5E9CEA';

  // Light mode defaults
  c.cream = '#F2EDE3';
  c.offWhite = '#F8F6F2';

  c.bg = '#F8F6F2';
  c.bgSecondary = '#EFEBE3';
  c.headerBg = '#F8F6F2';
  c.tabBar = '#FFFFFF';
  c.cardDark = '#F7F3E6';

  c.card = '#FFFFFF';
  c.cardWarm = '#FFFFFF';

  c.border = '#E5DFD3';
  c.borderSubtle = '#EDE8DF';
  c.divider = '#E5DFD3';
  c.inputBorder = '#E5DFD3';

  c.textPrimary = '#1C1C1E';
  c.textSecondary = '#636366';
  c.textMuted = '#8E8E93';
  c.darkGreen = '#1C1C1E';
  c.green = '#636366';
  c.textOnDark = '#FAF7F2';
  c.textInverse = '#1C1C1E';
  c.ayahText = '#1C1C1E';
  c.ayahNumber = '#636366';

  c.buttonPrimary = '#D4A246';
  c.buttonText = '#1C1C1E';
  c.inputBg = '#FFFFFF';
  c.iconColor = '#D4A246';
  c.badgeBg = '#D4A246';
  c.badgeText = '#1C1C1E';
  c.progressBar = '#D4A246';
  c.loadingIndicator = '#D4A246';
  c.tabBarActive = '#D4A246';
  c.tabBarInactive = '#8E8E93';
  c.highlight = '#D4AF37';

  c.overlay = 'rgba(0,0,0,0.40)';
  c.overlayLight = 'rgba(0,0,0,0.06)';
  c.glassWhite = 'rgba(255,255,255,0.70)';
  c.glassGold = 'rgba(212,162,70,0.08)';
  c.glassDark = 'rgba(0,0,0,0.04)';
  c.glassGreen = 'rgba(0,0,0,0.04)';
  c.shadow = 'rgba(0,0,0,0.08)';

  // ── Dark mode overrides ──
  if (isDark) {
    c.cream = '#1A1A1D';
    c.offWhite = '#111114';

    c.bg = '#0C0C0E';
    c.bgSecondary = '#151518';
    c.headerBg = '#0C0C0E';
    c.tabBar = '#151518';
    c.cardDark = '#2C2C2E';

    c.card = '#1C1C1F';
    c.cardWarm = '#1C1C1F';

    c.border = '#2C2C30';
    c.borderSubtle = '#252529';
    c.divider = '#2C2C30';
    c.inputBorder = '#2C2C30';

    c.textPrimary = '#F2F2F7';
    c.textSecondary = '#AEAEB2';
    c.textMuted = '#636366';
    c.darkGreen = '#F2F2F7';
    c.green = '#AEAEB2';
    c.ayahText = '#F2F2F7';
    c.ayahNumber = '#AEAEB2';

    c.inputBg = '#1C1C1F';
    c.tabBarInactive = '#636366';

    c.overlay = 'rgba(0,0,0,0.60)';
    c.overlayLight = 'rgba(0,0,0,0.12)';
    c.glassWhite = 'rgba(28,28,31,0.70)';
    c.glassGold = 'rgba(212,162,70,0.12)';
    c.glassDark = 'rgba(255,255,255,0.04)';
    c.glassGreen = 'rgba(15,81,50,0.15)';
    c.shadow = 'rgba(0,0,0,0.35)';
  }

  // ── AMOLED overrides ──
  if (isAmoled) {
    c.bg = '#000000';
    c.bgSecondary = '#0A0A0A';
    c.headerBg = '#000000';
    c.tabBar = '#000000';
    c.card = '#111111';
    c.cardWarm = '#111111';
    c.offWhite = '#0A0A0A';
    c.cream = '#111111';
  }

  // ── Custom colors override ──
  if (customColors) {
    const colorKeys: (keyof CustomColors)[] = [
      'gold', 'highlight',
      'bg', 'bgSecondary', 'headerBg', 'tabBar',
      'card', 'cardWarm',
      'border', 'borderSubtle', 'divider', 'inputBorder',
      'textPrimary', 'textSecondary', 'textMuted',
      'ayahText', 'ayahNumber', 'surahName',
      'buttonPrimary', 'buttonText', 'inputBg',
      'iconColor', 'badgeBg', 'badgeText',
      'progressBar', 'loadingIndicator', 'shadow',
      'tabBarActive', 'tabBarInactive',
      'success', 'error', 'warning', 'info',
    ];
    for (const key of colorKeys) {
      if (customColors[key]) c[key] = customColors[key];
    }
    if (customColors.darkBg && !customColors.bg) c.bg = customColors.darkBg;
    if (customColors.cardDark && !customColors.card) c.card = customColors.cardDark;

    // Auto-contrast: if a background was customized but its paired text wasn't, adjust text color.
    for (const pair of TEXT_PAIRS) {
      const bgKey = pair.bg;
      const fgKey = pair.fg;
      const bgVal = customColors[bgKey];
      const fgVal = customColors[fgKey];
      if (bgVal && !fgVal) {
        c[fgKey] = getContrastTextColor(bgVal, c[fgKey]);
      }
    }

    // also auto-contrast textInverse and textOnDark when gold is customized
    if (customColors.gold) {
      if (!customColors.textInverse) {
        c.textInverse = getContrastTextColor(customColors.gold, '#1C1C1E', '#FFFFFF');
      }
      if (!customColors.textOnDark) {
        c.textOnDark = getContrastTextColor(customColors.gold, '#1C1C1E', '#FFFFFF');
      }
    }
  }

  // Ensure textOnDark/textInverse have sensible defaults relative to brand
  if (!c.textInverse) c.textInverse = getContrastTextColor(c.gold, '#1C1C1E', '#FFFFFF');
  if (!c.textOnDark) c.textOnDark = c.white;

  return c as Record<string, string>;
}

/**
 * Returns relative luminance of a hex color (0 = darkest, 1 = brightest).
 */
export function getLuminance(hex: string): number {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const toLin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

/**
 * Returns white (#FFFFFF) for dark backgrounds, dark (#1C1C1E) for light backgrounds.
 * Uses WCAG threshold (0.179).
 */
export function getContrastTextColor(bgHex: string, darkText = '#1C1C1E', lightText = '#FFFFFF'): string {
  try {
    return getLuminance(bgHex) > 0.179 ? darkText : lightText;
  } catch {
    return darkText;
  }
}

const TEXT_PAIRS: Array<{ bg: string; fg: string }> = [
  { bg: 'bg', fg: 'textPrimary' },
  { bg: 'bg', fg: 'textSecondary' },
  { bg: 'bg', fg: 'textMuted' },
  { bg: 'bg', fg: 'textOnDark' },
  { bg: 'card', fg: 'textPrimary' },
  { bg: 'card', fg: 'textSecondary' },
  { bg: 'card', fg: 'textMuted' },
  { bg: 'card', fg: 'ayahText' },
  { bg: 'card', fg: 'ayahNumber' },
  { bg: 'card', fg: 'surahName' },
  { bg: 'buttonPrimary', fg: 'buttonText' },
  { bg: 'badgeBg', fg: 'badgeText' },
  { bg: 'tabBar', fg: 'tabBarActive' },
  { bg: 'tabBar', fg: 'tabBarInactive' },
  { bg: 'headerBg', fg: 'surahName' },
  { bg: 'inputBg', fg: 'textPrimary' },
  { bg: 'inputBg', fg: 'textSecondary' },
  { bg: 'progressBar', fg: 'badgeText' },
  { bg: 'card', fg: 'iconColor' },
  { bg: 'headerBg', fg: 'textPrimary' },
  { bg: 'headerBg', fg: 'textSecondary' },
];

export function applyRuntimeColors(runtime: Record<string, string>) {
  try {
    for (const k of Object.keys(runtime)) {
      (COLORS as any)[k] = (runtime as any)[k];
    }
  } catch {
    // fail silently
  }
}

export const SHADOWS = {
  none: {},
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 6,
  },
  gold: {
    shadowColor: BRAND.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 4,
  },
  goldGlow: {
    shadowColor: BRAND.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.30,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;
