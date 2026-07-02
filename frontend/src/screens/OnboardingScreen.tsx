import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text,
  FlatList, StatusBar, Platform, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, interpolate,
  Extrapolation, useAnimatedScrollHandler, SharedValue,
} from 'react-native-reanimated';
import { useApp } from '../context/AppContext';
import { COLORS } from '../constants/colors';
import { FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';
import GoldButton from '../components/GoldButton';
import { FadeIn, AnimatedPressable } from '../components/AnimatedComponents';
import LogoDecoration from '../components/LogoDecoration';

interface Slide {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const slides: Slide[] = [
  {
    id: '1',
    titleAr: 'القرآن كاملاً بين يديك',
    titleEn: 'The Full Quran, In Your Hands',
    descAr: 'كامل المصحف بالخط العثماني، مع ترجمات دقيقة وتلاوات عذبة لأشهر قراء العالم الإسلامي. اقرأ، استمع، وتدبر أينما كنت.',
    descEn: 'The complete Quran in Uthmani script, with accurate translations and beautiful recitations from the world\'s most renowned reciters. Read, listen, and reflect — anywhere.',
    icon: 'book',
  },
  {
    id: '2',
    titleAr: 'احفظ بذكاء',
    titleEn: 'Memorize Smarter',
    descAr: 'مدّكر حفظ ذكي بالذكاء الاصطناعي يصحح تلاوتك ويخطط لمراجعتك. تقنية التكرار المتباعد تخلي حفظك متين وسهل.',
    descEn: 'An AI-powered memorization coach that corrects your recitation and plans your reviews. Spaced repetition makes your hifdh solid and effortless.',
    icon: 'school',
  },
  {
    id: '3',
    titleAr: 'لا تفوّت صلاة أبداً',
    titleEn: 'Never Miss a Prayer',
    descAr: 'أوقات صلاة دقيقة حسب موقعك، إشعارات أذان روّعة، بوصلة قبلة، وتقويم هجري متكامل. كل اللي تحتاجه لالتزامك اليومي.',
    descEn: 'Accurate prayer times based on your location, beautiful adhan notifications, Qibla compass, and a full Hijri calendar. Everything you need for your daily devotion.',
    icon: 'time',
  },
  {
    id: '4',
    titleAr: 'أنس بالله كل يوم',
    titleEn: 'Find Peace With Allah',
    descAr: 'أذكار الصباح والمساء، أدعية مأثورة، تتبّع الصيام، ورفقة إيمانية ترافقك في رحلتك اليومية. أقرب طريق للقلب المطمئن.',
    descEn: 'Morning & evening azkar, authentic duas, fasting tracker, and a spiritual companion for your daily journey. The shortest path to a peaceful heart.',
    icon: 'sparkles',
  },
];

export default function OnboardingScreen() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { setOnboardingComplete, language } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<any>(null);
  const scrollX = useSharedValue(0);
  const isRtl = language === 'ar';
  const isLast = currentIndex === slides.length - 1;
  const isSmall = screenHeight < 700;
  const iconSize = Math.min(screenWidth * 0.35, 180, screenHeight * 0.22);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      const nextOffset = (currentIndex + 1) * screenWidth;
      flatListRef.current?.scrollToOffset({ offset: nextOffset, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      setOnboardingComplete();
    }
  }, [currentIndex, screenWidth, setOnboardingComplete]);

  const handleSkip = useCallback(() => {
    setOnboardingComplete();
  }, [setOnboardingComplete]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  return (
    <View style={{ flex: 1, backgroundColor: '#0C0C0E' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Background branding watermark */}
      <LogoDecoration
        size={Math.min(screenWidth, screenHeight) * 0.8}
        opacity={0.04}
        position="background"
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Top row: Skip */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          paddingHorizontal: SPACING.base,
          paddingTop: Platform.OS === 'android' ? SPACING.xxl : SPACING.sm,
          zIndex: 10,
        }}>
          {!isLast && (
            <AnimatedPressable
              onPress={handleSkip}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingVertical: SPACING.sm,
                paddingHorizontal: SPACING.md,
                borderRadius: RADIUS.round,
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <Text style={{ fontSize: FONT_SIZES.small, color: 'rgba(255,255,255,0.5)', fontFamily: FONTS.bodyMed }}>
                {isRtl ? 'تخطى' : 'Skip'}
              </Text>
              <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.4)" />
            </AnimatedPressable>
          )}
        </View>

        {/* Slides */}
        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatListRef}
            data={slides}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <SlideItem
                item={item}
                index={index}
                scrollX={scrollX}
                isRtl={isRtl}
                screenWidth={screenWidth}
                iconSize={iconSize}
                isSmall={isSmall}
              />
            )}
          />
        </View>

        {/* Footer */}
        <View style={{
          paddingHorizontal: SPACING.xl,
          paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.lg,
          paddingTop: SPACING.sm,
          gap: SPACING.lg,
          alignItems: 'center',
        }}>
          {/* Dot indicators */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            {slides.map((_, idx) => (
              <AnimatedDot key={idx} index={idx} scrollX={scrollX} screenWidth={screenWidth} />
            ))}
          </View>

          {/* Logo mark */}
          <View style={{ width: 40, height: 52, opacity: 0.5 }}>
            <LogoDecoration size={40} opacity={1} />
          </View>

          {/* CTA Button */}
          <GoldButton
            label={isLast
              ? (isRtl ? 'ابدأ رحلتك' : 'Begin Your Journey')
              : (isRtl ? 'التالي' : 'Next')
            }
            onPress={handleNext}
            fullWidth
            size="lg"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function SlideItem({
  item, index, scrollX, isRtl, screenWidth, iconSize, isSmall,
}: {
  item: Slide;
  index: number;
  scrollX: SharedValue<number>;
  isRtl: boolean;
  screenWidth: number;
  iconSize: number;
  isSmall: boolean;
}) {
  const inputRange = [(index - 1) * screenWidth, index * screenWidth, (index + 1) * screenWidth];

  const iconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, inputRange, [0.2, 1, 0.2], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollX.value, inputRange, [40, 0, -40], Extrapolation.CLAMP) },
      { scale: interpolate(scrollX.value, inputRange, [0.7, 1, 0.7], Extrapolation.CLAMP) },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollX.value, inputRange, [30, 0, 30], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <View style={{
      width: screenWidth,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: SPACING.xxl,
      paddingVertical: isSmall ? SPACING.md : SPACING.xl,
      gap: isSmall ? SPACING.md : SPACING.lg,
    }}>
      {/* Icon */}
      <Animated.View style={[iconStyle, { alignItems: 'center', justifyContent: 'center' }]}>
        <LinearGradient
          colors={['rgba(212,162,70,0.20)', 'rgba(212,162,70,0.04)']}
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius: iconSize * 0.28,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(212,162,70,0.15)',
          }}
        >
          <Ionicons name={item.icon} size={iconSize * 0.5} color={COLORS.gold} />
        </LinearGradient>
      </Animated.View>

      {/* Logo SVG watermark behind icon */}
      <View style={{
        position: 'absolute',
        width: iconSize * 2.2,
        height: iconSize * 2.2,
        opacity: 0.04,
        zIndex: -1,
      }}>
        <LogoDecoration size={iconSize * 2.2} opacity={1} />
      </View>

      {/* Text */}
      <Animated.View style={[textStyle, { alignItems: 'center', gap: isSmall ? SPACING.sm : SPACING.md }]}>
        <Text style={{
          fontSize: isSmall ? FONT_SIZES.hero * 0.85 : FONT_SIZES.hero,
          color: COLORS.textOnDark,
          fontFamily: FONTS.display,
          fontWeight: '700',
          textAlign: 'center',
          lineHeight: (isSmall ? FONT_SIZES.hero * 0.85 : FONT_SIZES.hero) * 1.3,
        }}>
          {isRtl ? item.titleAr : item.titleEn}
        </Text>
        <Text style={{
          fontSize: isSmall ? FONT_SIZES.small : FONT_SIZES.base,
          color: 'rgba(255,255,255,0.6)',
          fontFamily: FONTS.body,
          textAlign: 'center',
          lineHeight: (isSmall ? FONT_SIZES.small : FONT_SIZES.base) * 1.7,
          maxWidth: screenWidth * 0.78,
        }}>
          {isRtl ? item.descAr : item.descEn}
        </Text>
      </Animated.View>
    </View>
  );
}

function AnimatedDot({ index, scrollX, screenWidth }: { index: number; scrollX: SharedValue<number>; screenWidth: number }) {
  const inputRange = [(index - 1) * screenWidth, index * screenWidth, (index + 1) * screenWidth];

  const dotStyle = useAnimatedStyle(() => ({
    width: interpolate(scrollX.value, inputRange, [8, 28, 8], Extrapolation.CLAMP),
    opacity: interpolate(scrollX.value, inputRange, [0.25, 1, 0.25], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View
      style={[{
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.gold,
      }, dotStyle]}
    />
  );
}
