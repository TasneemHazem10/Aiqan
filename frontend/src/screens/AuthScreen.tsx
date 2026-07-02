import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  StatusBar, Image, Animated, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { COLORS, GRADIENTS, SHADOWS } from '../constants/colors';
import { FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';
import CardSurface from '../components/CardSurface';
import GoldButton from '../components/GoldButton';
import { FadeIn, AnimatedPressable } from '../components/AnimatedComponents';
import LogoDecoration from '../components/LogoDecoration';
import { useThemedStyles } from '../hooks/useThemedStyles';

type Mode = 'welcome' | 'login' | 'register';

export default function AuthScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const styles = useThemedStyles((colors) => ({
    container:   { flex: 1, backgroundColor: colors.bg },
    gradient: {
      borderBottomLeftRadius: RADIUS.xxl,
      borderBottomRightRadius: RADIUS.xxl,
      overflow: 'hidden',
      paddingTop: SPACING.xxxl,
      paddingBottom: SPACING.xl,
    },
    safe: { flex: 1 },
    headerContent: {
      alignItems: 'center',
      paddingHorizontal: SPACING.xl,
    },
    headerLogo: {
      width: 56,
      height: 56,
      marginBottom: SPACING.sm,
    },
    appName: {
      fontSize: FONT_SIZES.mega,
      color: colors.gold,
      fontFamily: FONTS.display,
      fontWeight: '700',
      letterSpacing: 1,
    },
    tagline: {
      fontSize: FONT_SIZES.base,
      color: colors.textSecondary,
      fontFamily: FONTS.body,
      textAlign: 'center',
      lineHeight: FONT_SIZES.base * 1.7,
      marginTop: SPACING.sm,
    },
    scroll: {
      flexGrow: 1,
      padding: SPACING.xl,
    },

    welcomeCard: {
      alignItems: 'center',
      padding: SPACING.xxl,
    },
    logoContainer: {
      width:         Math.min(screenWidth * 0.3, 140),
      height:        Math.min(screenWidth * 0.3, 140),
      borderRadius:  RADIUS.xxl,
      backgroundColor: colors.glassDark,
      borderWidth:   1,
      borderColor:   `${colors.gold}30`,
      alignItems:    'center',
      justifyContent:'center',
      marginBottom:  SPACING.lg,
      ...SHADOWS.gold,
    },
    logo: {
      width:  80,
      height: 80,
    },
    appNameEn: {
      fontSize:   FONT_SIZES.lg,
      color:      colors.textMuted,
      fontFamily: FONTS.bodyMed,
      letterSpacing: 4,
      textTransform: 'uppercase',
    },
    taglineDivider: {
      width:           40,
      height:          1,
      backgroundColor: colors.gold,
      opacity:         0.4,
      marginVertical:  SPACING.lg,
    },
    btnStack: {
      width:  '100%',
      gap:    SPACING.md,
      marginBottom: SPACING.md,
    },
    guestLink:   { paddingVertical: SPACING.md },
    guestText: {
      fontSize:   FONT_SIZES.small,
      color:      colors.textMuted,
      fontFamily: FONTS.body,
      textDecorationLine: 'underline',
    },

    formContainer: {
      width: '100%',
    },
    formCard: {
      padding: SPACING.xl,
    },
    formHeader: {
      alignItems:    'center',
      marginBottom:  SPACING.xl,
    },
    formLogo: {
      width:  52,
      height: 52,
      marginBottom: SPACING.md,
      opacity: 0.85,
    },
    formTitle: {
      fontSize:   FONT_SIZES.display,
      color:      colors.textPrimary,
      fontFamily: FONTS.display,
      fontWeight: '700',
    },
    formSubtitle: {
      fontSize:   FONT_SIZES.small,
      color:      colors.textSecondary,
      fontFamily: FONTS.body,
      marginTop:  SPACING.xs,
    },

    errorBanner: {
      flexDirection:  'row',
      alignItems:     'center',
      gap:            SPACING.sm,
      backgroundColor:'rgba(229, 57, 53, 0.10)',
      borderRadius:   RADIUS.md,
      borderWidth:    1,
      borderColor:    `${colors.error}40`,
      padding:        SPACING.md,
      marginBottom:   SPACING.md,
    },
    errorText: {
      flex:       1,
      fontSize:   FONT_SIZES.small,
      color:      colors.error,
      fontFamily: FONTS.body,
    },

    inputWrap: {
      flexDirection:  'row',
      alignItems:     'center',
      backgroundColor: colors.glassDark,
      borderRadius:   RADIUS.lg,
      borderWidth:    1,
      borderColor:    colors.border,
      marginBottom:   SPACING.md,
      paddingHorizontal: SPACING.md,
    },
    inputWrapFocused: {
      borderColor:     colors.gold,
      backgroundColor: colors.glassGold,
    },
    inputIcon: {
      marginRight: SPACING.sm,
    },
    input: {
      flex:       1,
      paddingVertical: SPACING.base,
      fontSize:   FONT_SIZES.base,
      color:      colors.textPrimary,
      fontFamily: FONTS.body,
    },
    inputRightBtn: {
      padding: SPACING.sm,
    },

    submitWrap: {
      marginTop:    SPACING.sm,
      marginBottom: SPACING.lg,
    },
    switchLink:   { alignItems: 'center', paddingVertical: SPACING.sm },
    switchText: {
      fontSize:   FONT_SIZES.small,
      color:      colors.textSecondary,
      fontFamily: FONTS.body,
      textAlign:  'center',
    },
    switchTextBold: {
      color:      colors.gold,
      fontFamily: FONTS.bodySemi,
    },
    backLink: {
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            4,
      paddingVertical: SPACING.md,
      marginTop:      SPACING.xs,
    },
    backText: {
      fontSize:   FONT_SIZES.small,
      color:      colors.textMuted,
      fontFamily: FONTS.body,
    },
  }), [screenWidth]);

  const { login, register, loginAsGuest, language } = useApp();
  const [mode, setMode]                 = useState<Mode>('welcome');
  const [name, setName]                 = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  const isRtl = language === 'ar';

  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const switchMode = (newMode: Mode) => {
    if (newMode === mode) return;
    setErrorMsg('');
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setMode(newMode);
      slideAnim.setValue(newMode === 'login' ? -20 : 20);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    if (mode === 'login') {
      if (!email || !password) {
        setErrorMsg(isRtl ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
        return;
      }
      setLoading(true);
      try { await login(email, password); }
      catch (err: any) { setErrorMsg(err.message || (isRtl ? 'فشل تسجيل الدخول' : 'Login failed')); }
      setLoading(false);
    } else {
      if (!name || !email || !password) {
        setErrorMsg(isRtl ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg(isRtl ? 'كلمة المرور غير متطابقة' : 'Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setErrorMsg(isRtl ? 'كلمة المرور ضعيفة جداً' : 'Password too weak (min 6 chars)');
        return;
      }
      setLoading(true);
      try { await register(name, email, password); }
      catch (err: any) { setErrorMsg(err.message || (isRtl ? 'فشل إنشاء الحساب' : 'Registration failed')); }
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safe}>
        <LinearGradient colors={GRADIENTS.brand} style={styles.gradient}>
          <LogoDecoration size={180} opacity={0.05} position="top-right" />
          <View style={styles.headerContent}>
            <Image
              source={require('../../branding/AiqanLogoNoBg.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>أيقان</Text>
            <Text style={styles.tagline}>
              {isRtl
                ? 'رفيقك في القرآن، الصلاة، والأذكار'
                : 'Quran. Prayer. Remembrance. Your path to peace.'}
            </Text>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── WELCOME MODE ─────────────────────────────────────── */}
          {mode === 'welcome' && (
            <CardSurface variant="logo" style={styles.welcomeCard} key="welcome">
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../branding/AiqanLogoNoBg.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.appNameEn}>Aiqan</Text>
              <View style={styles.taglineDivider} />

              <View style={styles.btnStack}>
                <GoldButton
                  label={isRtl ? 'تسجيل الدخول' : 'Sign In'}
                  onPress={() => switchMode('login')}
                  variant="primary"
                  size="lg"
                  fullWidth
                />
                <GoldButton
                  label={isRtl ? 'إنشاء حساب جديد' : 'Create Account'}
                  onPress={() => switchMode('register')}
                  variant="outline"
                  size="lg"
                  fullWidth
                />
              </View>

              <AnimatedPressable
                style={styles.guestLink}
                onPress={async () => {
                  try { await loginAsGuest(); }
                  catch (err: any) { setErrorMsg(err?.message || ''); }
                }}
              >
                <Text style={styles.guestText}>
                  {isRtl ? 'المتابعة كضيف' : 'Continue as Guest'}
                </Text>
              </AnimatedPressable>
            </CardSurface>
          )}

          {/* ── LOGIN / REGISTER MODE ─────────────────────────────── */}
          {mode !== 'welcome' && (
            <Animated.View
              style={[
                styles.formContainer,
                { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
              ]}
            >
              <CardSurface variant="logo" style={styles.formCard} key={mode}>
                {/* Header */}
                <View style={styles.formHeader}>
                  <Image
                    source={require('../../branding/AiqanLogoNoBg.png')}
                    style={styles.formLogo}
                    resizeMode="contain"
                  />
                  <Text style={styles.formTitle}>
                    {mode === 'login'
                      ? (isRtl ? 'تسجيل الدخول' : 'Welcome Back')
                      : (isRtl ? 'إنشاء حساب' : 'Create Account')}
                  </Text>
                  <Text style={styles.formSubtitle}>
                    {mode === 'login'
                      ? (isRtl ? 'أدخل بيانات حسابك' : 'Sign in to your account')
                      : (isRtl ? 'انضم إلى مجتمع أيقان' : 'Join the Aiqan community')}
                  </Text>
                </View>

                {/* Error Banner */}
                {errorMsg ? (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                ) : null}

                {/* Name Field (Register only) */}
                {mode === 'register' && (
                  <InputField
                    value={name}
                    onChangeText={setName}
                    placeholder={isRtl ? 'الاسم الكامل' : 'Full Name'}
                    icon="person-outline"
                    autoCapitalize="words"
                    styles={styles}
                  />
                )}

                {/* Email */}
                <InputField
                  value={email}
                  onChangeText={setEmail}
                  placeholder={isRtl ? 'البريد الإلكتروني' : 'Email Address'}
                  icon="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  styles={styles}
                />

                {/* Password */}
                <InputField
                  value={password}
                  onChangeText={setPassword}
                  placeholder={isRtl ? 'كلمة المرور' : 'Password'}
                  icon="lock-closed-outline"
                  secureTextEntry={!showPassword}
                  rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  onRightIconPress={() => setShowPassword(v => !v)}
                  styles={styles}
                />

                {/* Confirm Password (Register only) */}
                {mode === 'register' && (
                  <InputField
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder={isRtl ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                    icon="shield-checkmark-outline"
                    secureTextEntry={!showConfirm}
                    rightIcon={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    onRightIconPress={() => setShowConfirm(v => !v)}
                    styles={styles}
                  />
                )}

                {/* Submit */}
                <View style={styles.submitWrap}>
                  <GoldButton
                    label={mode === 'login'
                      ? (isRtl ? 'دخول' : 'Sign In')
                      : (isRtl ? 'إنشاء الحساب' : 'Create Account')}
                    onPress={handleSubmit}
                    loading={loading}
                    fullWidth
                    size="lg"
                  />
                </View>
              </CardSurface>

              {/* Switch Mode */}
              <AnimatedPressable
                onPress={() => switchMode(mode === 'login' ? 'register' : 'login')}
                style={styles.switchLink}
              >
                <Text style={styles.switchText}>
                  {mode === 'login'
                    ? (isRtl ? 'ليس لديك حساب؟ ' : "Don't have an account? ")
                    : (isRtl ? 'لديك حساب؟ ' : 'Already have an account? ')}
                  <Text style={styles.switchTextBold}>
                    {mode === 'login'
                      ? (isRtl ? 'سجل الآن' : 'Sign Up')
                      : (isRtl ? 'سجل دخول' : 'Sign In')}
                  </Text>
                </Text>
              </AnimatedPressable>

              {/* Back to Welcome */}
              <AnimatedPressable
                onPress={() => switchMode('welcome')}
                style={styles.backLink}
              >
                <Ionicons name="chevron-back" size={14} color={COLORS.textMuted} />
                <Text style={styles.backText}>{isRtl ? 'الرجوع' : 'Back'}</Text>
              </AnimatedPressable>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ─── Input Field Component ──────────────────────────────────────────────────
type IoniconName = keyof typeof Ionicons.glyphMap;

interface InputFieldProps {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  icon: IoniconName;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  rightIcon?: IoniconName;
  onRightIconPress?: () => void;
  styles: Record<string, any>;
}

function InputField({
  value, onChangeText, placeholder, icon,
  secureTextEntry, keyboardType, autoCapitalize,
  rightIcon, onRightIconPress, styles,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.inputWrap,
        focused && styles.inputWrapFocused,
      ]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={focused ? COLORS.gold : COLORS.textMuted}
        style={styles.inputIcon}
      />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {rightIcon && onRightIconPress && (
        <AnimatedPressable onPress={onRightIconPress} style={styles.inputRightBtn}>
          <Ionicons name={rightIcon} size={18} color={COLORS.textMuted} />
        </AnimatedPressable>
      )}
    </View>
  );
}
