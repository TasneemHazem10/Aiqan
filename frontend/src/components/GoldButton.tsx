import React, { useRef, useCallback } from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator, View,
  ViewStyle, TextStyle, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import { GRADIENTS } from '../constants/colors';
import { SPACING, FONTS, FONT_SIZES, RADIUS, ANIMATION } from '../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize    = 'sm' | 'md' | 'lg';

interface GoldButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const SIZE_CONFIG = {
  sm: { py: SPACING.sm,   px: SPACING.md,   fontSize: FONT_SIZES.small,  radius: RADIUS.md },
  md: { py: SPACING.md,   px: SPACING.xl,   fontSize: FONT_SIZES.md,     radius: RADIUS.lg },
  lg: { py: SPACING.base, px: SPACING.xxl,  fontSize: FONT_SIZES.lg,     radius: RADIUS.xl },
} as const;

export default function GoldButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}: GoldButtonProps) {
  const { activeColors } = useApp();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const sizeConf = SIZE_CONFIG[size];
  const isDisabled = disabled || loading;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      ...ANIMATION.springLight,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...ANIMATION.springSnap,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const innerStyle: ViewStyle = {
    paddingVertical: sizeConf.py,
    paddingHorizontal: sizeConf.px,
    borderRadius: sizeConf.radius,
    flexDirection: iconPosition === 'right' ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  };

  const textBase: TextStyle = {
    fontSize: sizeConf.fontSize,
    fontFamily: FONTS.bodyBold,
    fontWeight: '700',
    letterSpacing: 0.3,
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? activeColors.darkGreen : variant === 'danger' ? activeColors.error : activeColors.gold}
        />
      );
    }
    return (
      <>
        {icon}
        <Text style={[textBase, getTextColor(variant, activeColors), textStyle]}>{label}</Text>
      </>
    );
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }], opacity: isDisabled ? 0.55 : 1, alignSelf: fullWidth ? 'stretch' : 'auto' }, style]}>
      {variant === 'primary' ? (
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isDisabled}
          activeOpacity={0.9}
          style={{ borderRadius: sizeConf.radius, overflow: 'hidden' }}
        >
          <LinearGradient
            colors={GRADIENTS.gold}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={innerStyle}
          >
            {renderContent()}
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isDisabled}
          activeOpacity={0.85}
          style={[getContainerStyle(variant, sizeConf.radius, activeColors)]}
        >
          <View style={innerStyle}>
            {renderContent()}
          </View>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

function getContainerStyle(variant: string, radius: number, colors: Record<string, string>): ViewStyle {
  switch (variant) {
    case 'secondary':
      return { backgroundColor: colors.buttonPrimary, borderRadius };
    case 'outline':
      return { borderWidth: 1.5, borderColor: colors.buttonPrimary, borderRadius };
    case 'ghost':
      return { backgroundColor: colors.glassDark, borderRadius };
    case 'danger':
      return { backgroundColor: `${colors.error}18`, borderWidth: 1, borderColor: colors.error, borderRadius };
    default:
      return { borderRadius };
  }
}

function getTextColor(variant: string, colors: Record<string, string>): TextStyle {
  switch (variant) {
    case 'primary':
      return { color: colors.darkGreen };
    case 'secondary':
      return { color: colors.buttonText };
    case 'outline':
      return { color: colors.buttonPrimary };
    case 'ghost':
      return { color: colors.textSecondary };
    case 'danger':
      return { color: colors.error };
    default:
      return { color: colors.textPrimary };
  }
}
