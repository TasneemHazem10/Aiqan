import React from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, FadeIn } from 'react-native-reanimated';
import { SlideUp } from '../components/AnimatedComponents';
import { useApp } from '../context/AppContext';
import { GRADIENTS } from '../constants/colors';
import { FONTS, FONT_SIZES } from '../constants/theme';
import LogoDecoration from './LogoDecoration';

export default function BrandedLoading() {
  const { activeColors, language } = useApp();
  const opacity = useSharedValue(0.4);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const isRtl = language === 'ar';

  return (
    <LinearGradient colors={GRADIENTS.splashGradient} style={{
      flex: 1, alignItems: 'center', justifyContent: 'center',
    }}>
      <LogoDecoration size={280} opacity={0.06} position="center" />
      <Animated.View entering={FadeIn.duration(800)} style={{ alignItems: 'center', marginBottom: 24 }}>
        <Image
          source={require('../../branding/AiqanLogoNoBg.png')}
          style={{ width: 120, height: 120 }}
          resizeMode="contain"
        />
      </Animated.View>
      <SlideUp delay={300}>
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <Text style={{
            fontSize: FONT_SIZES.mega,
            fontFamily: FONTS.display,
            fontWeight: '700',
            color: activeColors.gold,
            letterSpacing: 1,
          }}>
            {isRtl ? 'أيقان' : 'Aiqan'}
          </Text>
          <Text style={{
            fontSize: FONT_SIZES.small,
            fontFamily: FONTS.body,
            color: activeColors.textMuted,
            marginTop: 4,
            letterSpacing: isRtl ? 0 : 4,
            textTransform: 'uppercase',
          }}>
            {isRtl ? 'القرآن الكريم' : 'Quran'}
          </Text>
        </View>
      </SlideUp>
      <Animated.View style={animatedStyle}>
        <ActivityIndicator size="small" color={activeColors.gold} />
      </Animated.View>
    </LinearGradient>
  );
}
