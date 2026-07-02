import React, { useRef, useEffect, useCallback } from 'react';
import {
  Animated, TouchableOpacity, ViewStyle, StyleProp, View, Dimensions,
} from 'react-native';
import { ANIMATION } from '../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnimatedViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  duration?: number;
  springConfig?: Partial<Animated.SpringAnimationConfig>;
}

export function FadeIn({ children, style, delay = 0 }: AnimatedViewProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(opacity, {
      toValue: 1,
      ...ANIMATION.springGentle,
      delay,
      useNativeDriver: true,
    }).start();
  }, [delay, opacity]);
  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}

export function SlideUp({ children, style, delay = 0 }: AnimatedViewProps) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      ...ANIMATION.springGentle,
      delay,
      useNativeDriver: true,
    }).start();
  }, [delay, anim]);
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.6, 1],
  });
  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

export function ScaleIn({ children, style, delay = 0 }: AnimatedViewProps) {
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        ...ANIMATION.springBouncy,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: ANIMATION.normal,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, scale, opacity]);
  return <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>{children}</Animated.View>;
}

export function SlideDown({ children, style, delay = 0 }: AnimatedViewProps) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      ...ANIMATION.springGentle,
      delay,
      useNativeDriver: true,
    }).start();
  }, [delay, anim]);
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-24, 0],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.6, 1],
  });
  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

export function BounceIn({ children, style, delay = 0 }: AnimatedViewProps) {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      ...ANIMATION.springBouncy,
      delay,
      useNativeDriver: true,
    }).start();
  }, [delay, scale]);
  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}

export function RotateIn({ children, style, delay = 0 }: AnimatedViewProps) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      ...ANIMATION.springGentle,
      delay,
      useNativeDriver: true,
    }).start();
  }, [delay, anim]);
  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '0deg'],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });
  return (
    <Animated.View style={[style, { opacity, transform: [{ rotate }] }]}>
      {children}
    </Animated.View>
  );
}

interface AnimatedPressableProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  activeOpacity?: number;
  scaleTo?: number;
}

export function AnimatedPressable({
  children, onPress, style, disabled, activeOpacity = 0.85, scaleTo = 0.95,
}: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: scaleTo,
      damping: 18,
      stiffness: 350,
      mass: 0.4,
      useNativeDriver: true,
    }).start();
  }, [scale, scaleTo]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      damping: 10,
      stiffness: 200,
      mass: 0.6,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={activeOpacity}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

interface PulseProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  duration?: number;
  minOpacity?: number;
}

export function Pulse({ children, style, duration = 1500, minOpacity = 0.6 }: PulseProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: minOpacity, duration: duration / 2, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: duration / 2, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [duration, minOpacity, opacity]);
  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}

interface ShimmerProps {
  style?: StyleProp<ViewStyle>;
  width?: number;
  height?: number;
  borderRadius?: number;
}

export function Shimmer({ style, width = SCREEN_WIDTH - 48, height = 80, borderRadius = 14 }: ShimmerProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View style={[{ width, height, borderRadius, backgroundColor: '#E0DCD3', opacity }, style]} />
  );
}

export function StaggeredView({
  children, baseDelay = 100, staggerBy = 80, style,
}: {
  children: React.ReactNode[];
  baseDelay?: number;
  staggerBy?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      {React.Children.map(children, (child, index) => (
        <SlideUp key={index} delay={baseDelay + index * staggerBy}>
          {child}
        </SlideUp>
      ))}
    </View>
  );
}
