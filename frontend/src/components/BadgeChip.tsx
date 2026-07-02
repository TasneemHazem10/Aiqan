import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useApp } from '../context/AppContext';
import { RADIUS, FONTS, FONT_SIZES, SPACING } from '../constants/theme';

interface BadgeChipProps {
  label: string;
  variant?: 'gold' | 'green' | 'info' | 'error' | 'glass';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const SIZE_CONFIG = {
  sm: { px: SPACING.sm, py: 3, radius: RADIUS.sm, fontSize: FONT_SIZES.micro },
  md: { px: SPACING.md, py: SPACING.xs, radius: RADIUS.md, fontSize: FONT_SIZES.caption },
};

export default function BadgeChip({
  label,
  variant = 'gold',
  size = 'sm',
  style,
}: BadgeChipProps) {
  const { activeColors } = useApp();
  const cfg = SIZE_CONFIG[size];

  const bgColor = getBgColor(variant, activeColors);
  const textColor = getTextColor(variant, activeColors);
  const borderColor = getBorderColor(variant, activeColors);

  return (
    <View style={[{
      alignSelf: 'flex-start',
      paddingHorizontal: cfg.px,
      paddingVertical: cfg.py,
      borderRadius: cfg.radius,
      backgroundColor: bgColor,
      borderWidth: variant === 'glass' ? 1 : 0,
      borderColor: borderColor,
    }, style]}>
      <Text style={{
        fontSize: cfg.fontSize,
        fontFamily: FONTS.bodyBold,
        fontWeight: '700',
        letterSpacing: 0.3,
        color: textColor,
      }}>
        {label}
      </Text>
    </View>
  );
}

function getBgColor(variant: string, colors: Record<string, string>): string {
  switch (variant) {
    case 'gold': return colors.gold;
    case 'green': return colors.success;
    case 'info': return colors.info;
    case 'error': return colors.error;
    case 'glass': return colors.glassDark;
    default: return colors.gold;
  }
}

function getTextColor(variant: string, colors: Record<string, string>): string {
  switch (variant) {
    case 'gold':
    case 'green':
    case 'info':
    case 'error':
      return colors.white;
    case 'glass':
      return colors.textSecondary;
    default:
      return colors.white;
  }
}

function getBorderColor(variant: string, colors: Record<string, string>): string {
  return variant === 'glass' ? colors.border : 'transparent';
}
