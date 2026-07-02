import React from 'react';
import { View, Text, Image, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SHADOWS } from '../constants/colors';
import { RADIUS, FONTS, FONT_SIZES } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';

interface AvatarCircleProps {
  name: string;
  size?: number;
  imageUri?: string | null;
  variant?: 'gold' | 'gradient' | 'ring';
  style?: ViewStyle;
}

export default function AvatarCircle({
  name,
  size = 56,
  imageUri,
  variant = 'gradient',
  style,
}: AvatarCircleProps) {
  const styles = useThemedStyles((colors) => ({
    ringWrap: {},
    initial: {
      fontFamily: FONTS.bodyBold,
      fontWeight: '700',
      color: colors.gold,
      includeFontPadding: false,
    },
  }));
  const initial = (name || '?')[0].toUpperCase();
  const fontSize = Math.round(size * 0.42);
  const borderRadius = size / 2;

  if (imageUri) {
    return (
      <View style={[{ width: size + 4, height: size + 4, borderRadius: (size + 4) / 2, padding: 2 }, style]}>
        <LinearGradient
          colors={GRADIENTS.gold}
          style={{ width: size, height: size, borderRadius, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Image
            source={{ uri: imageUri }}
            style={{ width: size - 2, height: size - 2, borderRadius: (size - 2) / 2 }}
            resizeMode="cover"
          />
        </LinearGradient>
      </View>
    );
  }

  if (variant === 'gradient') {
    return (
      <View
        style={[
          { width: size + 4, height: size + 4, borderRadius: (size + 4) / 2, padding: 2 },
          styles.ringWrap,
          style,
        ]}
      >
        <LinearGradient
          colors={GRADIENTS.gold}
          style={{ width: size, height: size, borderRadius, alignItems: 'center', justifyContent: 'center' }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View
            style={{
              width: size - 4, height: size - 4, borderRadius: (size - 4) / 2,
              backgroundColor: COLORS.darkGreen, alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (variant === 'ring') {
    return (
      <View
        style={[
          {
            width: size, height: size, borderRadius,
            backgroundColor: COLORS.card, borderWidth: 2, borderColor: COLORS.gold,
            alignItems: 'center', justifyContent: 'center',
          },
          SHADOWS.gold,
          style,
        ]}
      >
        <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        {
          width: size, height: size, borderRadius,
          backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center',
        },
        SHADOWS.gold,
        style,
      ]}
    >
      <Text style={[styles.initial, { fontSize, color: COLORS.darkGreen }]}>{initial}</Text>
    </View>
  );
}
