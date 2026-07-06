import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StatusBar, Alert, Modal, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { GRADIENTS, SHADOWS } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';
import { FadeIn, SlideUp, AnimatedPressable } from '../components/AnimatedComponents';
import CardSurface from '../components/CardSurface';
import AvatarCircle from '../components/AvatarCircle';
import LogoDecoration from '../components/LogoDecoration';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface MenuItem {
  icon: IoniconName;
  label: string;
  sub?: string;
  onPress: () => void;
  badge?: string;
  danger?: boolean;
}

export default function MoreScreen() {
  const navigation = useNavigation<any>();
  const { user, logout, t, language, theme, activeColors } = useApp();
  const isRtl = language === 'ar';
  const [showAbout, setShowAbout] = useState(false);
  const { height: screenHeight } = useWindowDimensions();

  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.offWhite },

    header: {
      paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm,
    },
    headerTitle: {
      fontSize: FONT_SIZES.hero, color: colors.darkGreen, fontFamily: FONTS.display,
      fontWeight: '700',
    },

    profileCard: {
      flexDirection: 'row', alignItems: 'center', gap: SPACING.base,
      marginHorizontal: SPACING.lg, padding: SPACING.base,
      borderRadius: RADIUS.xxl, ...SHADOWS.card,
    },
    profileInfo: { flex: 1, gap: 2 },
    profileName: {
      fontSize: FONT_SIZES.lg, color: colors.textPrimary, fontFamily: FONTS.display,
      fontWeight: '700',
    },
    profileEmail: {
      fontSize: FONT_SIZES.small, color: colors.textMuted, fontFamily: FONTS.body,
    },
    guestBadge: {
      backgroundColor: 'rgba(212,162,70,0.20)', borderRadius: RADIUS.round,
      paddingHorizontal: SPACING.sm, paddingVertical: 2, alignSelf: 'flex-start',
    },
    guestBadgeText: {
      fontSize: FONT_SIZES.micro, color: colors.gold, fontFamily: FONTS.bodyBold,
    },

    sections: { paddingHorizontal: SPACING.lg, marginTop: SPACING.xl },
    sectionGroup: { marginBottom: SPACING.xxl },
    sectionHeaderRow: {
      flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
      marginBottom: SPACING.md, paddingLeft: SPACING.xs,
    },
    sectionTitleDot: {
      width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.small, color: colors.gold, fontFamily: FONTS.bodyBold,
      letterSpacing: 1.2, textTransform: 'uppercase',
    },
    sectionCard: {
      backgroundColor: colors.card, borderRadius: RADIUS.xxl, overflow: 'hidden',
      ...SHADOWS.soft,
    },
    menuRow: {
      flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
      paddingVertical: 14, paddingHorizontal: 12, marginBottom: 6,
    },
    menuRowDanger: { backgroundColor: 'rgba(194,90,74,0.04)', borderRadius: RADIUS.md },
    menuRowLast: { marginBottom: 0 },
    menuIconWrap: {
      width: 44, height: 44, borderRadius: RADIUS.md,
      backgroundColor: colors.goldPale,
      alignItems: 'center', justifyContent: 'center',
    },
    menuIconDanger: { backgroundColor: 'rgba(194,90,74,0.12)' },
    menuInfo: { flex: 1 },
    menuLabel: {
      fontSize: FONT_SIZES.body, color: colors.textPrimary, fontFamily: FONTS.bodyMed,
    },
    menuLabelDanger: { color: colors.error },
    menuSub: {
      fontSize: FONT_SIZES.caption, color: colors.textMuted, fontFamily: FONTS.body,
      marginTop: 4,
    },
  }));

  const handleLogout = () => {
    Alert.alert(
      t('more.signOut'),
      isRtl ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to sign out?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('more.signOut'), style: 'destructive', onPress: logout },
      ]
    );
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: isRtl ? 'الأدوات الإسلامية' : 'Islamic Tools',
      items: [
        { icon: 'compass', label: isRtl ? 'بوصلة القبلة' : 'Qibla Compass', sub: isRtl ? 'اتجاه مكة المكرمة' : 'Direction to Makkah', onPress: () => navigation.navigate('More', { screen: 'Qibla' }) },
        { icon: 'calendar', label: isRtl ? 'التقويم الهجري' : 'Islamic Calendar', sub: isRtl ? 'التقويم الهجري والأحداث' : 'Hijri dates & events', onPress: () => navigation.navigate('More', { screen: 'HijriCalendar' }) },
        { icon: 'moon', label: isRtl ? 'وضع رمضان' : 'Ramadan Mode', sub: isRtl ? 'السحور والإفطار والمزيد' : 'Suhoor, iftar & more', onPress: () => navigation.navigate('More', { screen: 'RamadanMode' }) },
        { icon: 'hourglass', label: isRtl ? 'متابعة الصيام' : 'Fasting Tracker', sub: isRtl ? 'سجل صيامك' : 'Track your fasts', onPress: () => navigation.navigate('More', { screen: 'FastingTracker' }) },
        { icon: 'cash', label: isRtl ? 'حاسبة الزكاة' : 'Zakat Calculator', sub: isRtl ? 'احسب زكاة مالك' : 'Calculate your zakat', onPress: () => navigation.navigate('More', { screen: 'ZakatCalculator' }) },
        { icon: 'sunny', label: isRtl ? 'تذكير الجمعة' : 'Friday Reminders', sub: isRtl ? 'سورة الكهف وصلاة الجمعة' : 'Surah Kahf & Jumuah', onPress: () => navigation.navigate('More', { screen: 'FridayReminders' }) },
        { icon: 'flag', label: isRtl ? 'المناسبات الإسلامية' : 'Islamic Events', sub: isRtl ? 'الأعياد والمناسبات' : 'Eid & special occasions', onPress: () => navigation.navigate('More', { screen: 'IslamicEvents' }) },
        { icon: 'videocam', label: t('more.videoGenerator'), sub: isRtl ? 'إنشاء مقاطع قرآنية' : 'Create Quran video clips', onPress: () => navigation.navigate('More', { screen: 'VideoGenerator' }) },
        { icon: 'download', label: t('more.downloads'), sub: isRtl ? 'إدارة الصوتيات المحملة' : 'Manage offline audio', onPress: () => navigation.navigate('More', { screen: 'Downloads' }) },
        { icon: 'recording', label: isRtl ? 'تسجيل صوتي' : 'Voice Recording', sub: isRtl ? 'سجل تلاوتك للقرآن' : 'Record your Quran recitation', onPress: () => navigation.navigate('More', { screen: 'VoiceRecorder' }) },
        { icon: 'airplane', label: isRtl ? 'دعم السفر' : 'Travel Support', sub: isRtl ? 'أوقات الصلاة والقبلة للسفر' : 'Prayer times & qibla for travel', onPress: () => navigation.navigate('More', { screen: 'TravelSupport' }) },
      ],
    },
    {
      title: isRtl ? 'الميزات الذكية' : 'AI Features',
      items: [
        { icon: 'chatbubble-ellipses', label: isRtl ? 'إيقان AI' : 'Aiqan AI', sub: isRtl ? 'اسأل عن أي شيء' : 'Ask me anything', onPress: () => navigation.navigate('More', { screen: 'AiAssistant' }) },
      ],
    },
    {
      title: isRtl ? 'رحلتي' : 'My Journey',
      items: [
        { icon: 'bar-chart', label: t('more.myProgress'), sub: isRtl ? 'الإنجازات والإحصائيات' : 'Streaks, stats & achievements', onPress: () => navigation.navigate('More', { screen: 'Progress' }) },
        { icon: 'stats-chart', label: isRtl ? 'تحليلات الأداء' : 'Performance Analytics', sub: isRtl ? 'تحليلات الحفظ والتقدم' : 'Deep memorization analytics', onPress: () => navigation.navigate('More', { screen: 'PerformanceAnalytics' }) },
        { icon: 'person-circle', label: t('more.myProfile'), sub: isRtl ? 'ملفي الشخصي' : 'View your spiritual journey', onPress: () => navigation.navigate('More', { screen: 'Profile' }) },
        { icon: 'timer', label: isRtl ? 'الحفظ الموقوت' : 'Timed Memorization', sub: isRtl ? 'جلسات حفظ بمؤقت' : 'Timed memorization sessions', onPress: () => navigation.navigate('More', { screen: 'TimedMemorization' }) },
      ],
    },
    {
      title: isRtl ? 'الإعدادات' : 'Settings',
      items: [
        { icon: 'cloud-upload', label: isRtl ? 'النسخ الاحتياطي' : 'Cloud Backup', sub: isRtl ? 'مزامنة واستعادة البيانات' : 'Sync & restore data', onPress: () => navigation.navigate('More', { screen: 'CloudBackup' }) },
        { icon: 'settings', label: t('more.settings'), sub: isRtl ? 'السمة والإشعارات والقارئ' : 'Theme, notifications, reciter', onPress: () => navigation.navigate('More', { screen: 'Settings' }) },
        { icon: 'notifications', label: t('more.notifications'), sub: isRtl ? 'تنبيهات الصلاة والأذكار' : 'Prayer & reminder alerts', onPress: () => navigation.navigate('More', { screen: 'Notifications' }) },
        { icon: 'musical-notes', label: isRtl ? 'صوت الأذان' : 'Adhan Voice', sub: isRtl ? 'تخصيص صوت الأذان' : 'Customize adhan sound', onPress: () => navigation.navigate('More', { screen: 'AdhanCustomization' }) },
      ],
    },
    {
      title: isRtl ? 'حول التطبيق' : 'About',
      items: [
        { icon: 'information-circle', label: isRtl ? 'حول إيقان' : 'About Aiqan', sub: `${t('common.version')} 1.0.0`, onPress: () => setShowAbout(true) },
        { icon: 'log-out', label: t('more.signOut'), onPress: handleLogout, danger: true },
      ],
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: activeColors.offWhite }}>
      <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} backgroundColor={activeColors.offWhite} />
        <SafeAreaView edges={['top']}>
          <LogoDecoration size={250} opacity={0.02} position="top-right" />
          <FadeIn>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{isRtl ? 'أكثر' : 'More'}</Text>
            </View>
          </FadeIn>

          <SlideUp delay={100}>
            <TouchableOpacity onPress={() => navigation.navigate('More', { screen: 'Profile' })} activeOpacity={0.8}>
              <LinearGradient colors={GRADIENTS.brand} style={styles.profileCard}>
                <AvatarCircle name={user?.name || 'أ'} size={56} imageUri={user?.avatar} variant="gradient" />
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{user?.name || (isRtl ? 'ضيف' : 'Guest')}</Text>
                  {user?.email ? <Text style={styles.profileEmail}>{user.email}</Text> : null}
                  {user?.isGuest && (
                    <View style={styles.guestBadge}>
                      <Text style={styles.guestBadgeText}>{isRtl ? 'ضيف' : 'Guest'}</Text>
                    </View>
                  )}
                </View>
                <Ionicons name={isRtl ? 'chevron-back' : 'chevron-forward'} size={18} color={activeColors.gold} />
              </LinearGradient>
            </TouchableOpacity>
          </SlideUp>

          <View style={styles.sections}>
            {menuSections.map((section, sIdx) => (
              <SlideUp key={sIdx} delay={200 + sIdx * 60}>
                <View style={styles.sectionGroup}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionTitleDot} />
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                  </View>
                  <CardSurface variant="default" radius={RADIUS.xxl} padding={6} shadow="soft">
                    {section.items.map((item, iIdx) => (
                      <AnimatedPressable key={iIdx} onPress={item.onPress} scaleTo={0.98}>
                        <View style={[
                          styles.menuRow,
                          item.danger && styles.menuRowDanger,
                          iIdx === section.items.length - 1 && styles.menuRowLast,
                        ]}>
                          <View style={[styles.menuIconWrap, item.danger && styles.menuIconDanger]}>
                            <Ionicons
                              name={item.icon}
                              size={18}
                              color={item.danger ? activeColors.error : activeColors.gold}
                            />
                          </View>
                          <View style={styles.menuInfo}>
                            <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>
                              {item.label}
                            </Text>
                            {item.sub && <Text style={styles.menuSub}>{item.sub}</Text>}
                          </View>
                          <Ionicons
                            name={isRtl ? 'chevron-back' : 'chevron-forward'}
                            size={16}
                            color={item.danger ? activeColors.error : activeColors.textMuted}
                          />
                        </View>
                      </AnimatedPressable>
                    ))}
                  </CardSurface>
                </View>
              </SlideUp>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </SafeAreaView>
        <LogoDecoration size={200} opacity={0.02} position="bottom-left" />
      </ScrollView>

      <Modal visible={showAbout} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}
            activeOpacity={1} onPress={() => setShowAbout(false)}
          />
          <View style={{
            backgroundColor: activeColors.card,
            borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl,
            maxHeight: Math.floor(screenHeight * 0.75),
            paddingBottom: SPACING.mega,
            borderWidth: 1, borderColor: activeColors.border,
          }}>
            <View style={{ width: 40, height: 4, backgroundColor: activeColors.textMuted, borderRadius: 2, alignSelf: 'center', marginTop: SPACING.md }} />
            <TouchableOpacity
              onPress={() => setShowAbout(false)}
              style={{ position: 'absolute', top: SPACING.md, right: SPACING.base, zIndex: 1 }}
            >
              <Ionicons name="close" size={22} color={activeColors.textSecondary} />
            </TouchableOpacity>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ alignItems: 'center', paddingVertical: SPACING.xl }}>
                <LogoDecoration size={80} opacity={0.8} position="center" />
                <Text style={{
                  fontSize: FONT_SIZES.xxl, color: activeColors.gold, fontFamily: FONTS.display,
                  fontWeight: '700', marginTop: SPACING.sm,
                }}>إيقان</Text>
                <Text style={{
                  fontSize: FONT_SIZES.body, color: activeColors.textMuted, fontFamily: FONTS.body,
                  marginTop: 4,
                }}>Aiqan</Text>
                <Text style={{
                  fontSize: FONT_SIZES.caption, color: activeColors.textSecondary, fontFamily: FONTS.body,
                  marginTop: SPACING.sm, backgroundColor: activeColors.glassGold,
                  paddingHorizontal: SPACING.md, paddingVertical: 4, borderRadius: RADIUS.round,
                }}>
                  {t('common.version')} 1.0.0
                </Text>
              </View>

              <View style={{ paddingHorizontal: SPACING.lg }}>
                <Text style={{
                  fontSize: FONT_SIZES.small, color: activeColors.textPrimary, fontFamily: FONTS.body,
                  lineHeight: 22, textAlign: 'center', marginBottom: SPACING.lg,
                }}>
                  {isRtl
                    ? 'إيقان هو تطبيق إسلامي شامل يهدف إلى مساعدة المسلمين في رحلتهم الإيمانية اليومية. جمعنا لك القرآن الكريم، الأذكار، أوقات الصلاة، والأدعية في تطبيق واحد سهل الاستخدام.'
                    : 'Aiqan is a comprehensive Islamic app designed to support Muslims in their daily spiritual journey. We bring together the Holy Quran, Azkar, prayer times, and duas in one easy-to-use application.'}
                </Text>
              </View>

              <View style={{ paddingHorizontal: SPACING.lg }}>
                <Text style={{
                  fontSize: FONT_SIZES.body, color: activeColors.gold, fontFamily: FONTS.bodyBold,
                  marginBottom: SPACING.md, textAlign: isRtl ? 'right' : 'left',
                }}>
                  {isRtl ? 'الميزات الرئيسية' : 'Key Features'}
                </Text>
              </View>

              {[
                { icon: 'book', title: isRtl ? 'القرآن الكريم' : 'Holy Quran', desc: isRtl ? 'قراءة القرآن مع التفسير والتجويد وأصوات 21 قارئاً' : 'Read Quran with translation, tajweed & 21 reciters' },
                { icon: 'time', title: isRtl ? 'أوقات الصلاة' : 'Prayer Times', desc: isRtl ? 'مواقيت الصلاة الدقيقة مع طرق حساب متعددة' : 'Accurate prayer times with multiple calculation methods' },
                { icon: 'star', title: isRtl ? 'الأذكار والأدعية' : 'Azkar & Dua', desc: isRtl ? 'أذكار الصباح والمساء والأدعية اليومية' : 'Morning/evening azkar & daily supplications' },
                { icon: 'compass', title: isRtl ? 'القبلة والتقويم' : 'Qibla & Calendar', desc: isRtl ? 'اتجاه القبلة والتقويم الهجري والمناسبات' : 'Qibla direction, Hijri calendar & events' },
                { icon: 'chatbubble-ellipses', title: isRtl ? 'إيقان AI' : 'Aiqan AI', desc: isRtl ? 'مساعد ذكي يجيب عن أسئلتك الإسلامية' : 'Smart assistant for your Islamic questions' },
                { icon: 'moon', title: isRtl ? 'رمضان والصيام' : 'Ramadan & Fasting', desc: isRtl ? 'إمساكية رمضان، متابعة الصيام، وحساب الزكاة' : 'Ramadan schedule, fasting tracker & zakat calculator' },
                { icon: 'cloud-upload', title: isRtl ? 'النسخ الاحتياطي' : 'Cloud Backup', desc: isRtl ? 'مزامنة بياناتك عبر الأجهزة بأمان' : 'Sync your data securely across devices' },
                { icon: 'color-palette', title: isRtl ? 'الثيمات والتخصيص' : 'Themes & Customization', desc: isRtl ? 'ثيمات متعددة وألوان قابلة للتخصيص' : 'Multiple themes & fully customizable colors' },
              ].map((feat, idx) => (
                <View key={idx} style={{
                  flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
                  paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
                }}>
                  <View style={{
                    width: 36, height: 36, borderRadius: RADIUS.sm,
                    backgroundColor: activeColors.glassGold,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name={feat.icon as any} size={16} color={activeColors.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: FONT_SIZES.small, color: activeColors.textPrimary, fontFamily: FONTS.bodyMed,
                    }}>{feat.title}</Text>
                    <Text style={{
                      fontSize: FONT_SIZES.micro, color: activeColors.textMuted, fontFamily: FONTS.body,
                      marginTop: 2,
                    }}>{feat.desc}</Text>
                  </View>
                </View>
              ))}

              <View style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.lg }}>
                <Text style={{
                  fontSize: FONT_SIZES.micro, color: activeColors.textMuted, fontFamily: FONTS.body,
                  textAlign: 'center', lineHeight: 18,
                }}>
                  {isRtl
                    ? '© 2024 إيقان. جميع الحقوق محفوظة. صنع بحب للمسلمين في كل مكان.'
                    : '© 2024 Aiqan. All rights reserved. Made with love for Muslims everywhere.'}
                </Text>
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}


