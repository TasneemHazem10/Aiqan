import React from 'react';
import {
  View, Text, ScrollView, Switch, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { GRADIENTS, COLORS } from '../constants/colors';
import { FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { FadeIn, AnimatedPressable } from '../components/AnimatedComponents';
import LogoDecoration from '../components/LogoDecoration';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface NotifRow {
  icon: IoniconName;
  label: string;
  sub: string;
  key: keyof typeof DEFAULT_NOTIF_KEYS;
}

const DEFAULT_NOTIF_KEYS = {
  notificationsEnabled: true,
  prayerNotifs: true,
  morningAzkarNotifs: true,
  eveningAzkarNotifs: true,
  fridayReminderNotifs: true,
};

const NOTIF_ROWS: NotifRow[] = [
  { icon: 'notifications', label: 'Master Notification', sub: 'Enable all app notifications', key: 'notificationsEnabled' },
  { icon: 'time', label: 'Prayer Times', sub: 'Adhan & prayer time alerts', key: 'prayerNotifs' },
  { icon: 'sunny', label: 'Morning Azkar', sub: 'Daily morning remembrance', key: 'morningAzkarNotifs' },
  { icon: 'moon', label: 'Evening Azkar', sub: 'Daily evening remembrance', key: 'eveningAzkarNotifs' },
  { icon: 'calendar', label: 'Friday Reminders', sub: 'Surah Kahf & Jumuah alerts', key: 'fridayReminderNotifs' },
];

const NOTIF_ROWS_AR: NotifRow[] = [
  { icon: 'notifications', label: 'الإشعارات الرئيسية', sub: 'تفعيل جميع إشعارات التطبيق', key: 'notificationsEnabled' },
  { icon: 'time', label: 'أوقات الصلاة', sub: 'تنبيهات الأذان وأوقات الصلاة', key: 'prayerNotifs' },
  { icon: 'sunny', label: 'أذكار الصباح', sub: 'أذكار الصباح اليومية', key: 'morningAzkarNotifs' },
  { icon: 'moon', label: 'أذكار المساء', sub: 'أذكار المساء اليومية', key: 'eveningAzkarNotifs' },
  { icon: 'calendar', label: 'تذكير الجمعة', sub: 'تنبيهات سورة الكهف وصلاة الجمعة', key: 'fridayReminderNotifs' },
];

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const { user, updateSettings, t, language, activeColors } = useApp();
  const isRtl = language === 'ar';

  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      paddingHorizontal: SPACING.base, paddingVertical: SPACING.md,
      borderBottomLeftRadius: RADIUS.xxl, borderBottomRightRadius: RADIUS.xxl, overflow: 'hidden',
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: COLORS.glassDark, alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
      fontSize: FONT_SIZES.lg, color: colors.textPrimary, fontFamily: FONTS.bodyBold,
    },
    scroll: { flex: 1, paddingHorizontal: SPACING.base, paddingTop: SPACING.base },
    card: {
      backgroundColor: colors.card, borderRadius: RADIUS.xl, overflow: 'hidden',
      borderWidth: 1, borderColor: colors.border, marginBottom: SPACING.base,
    },
    notifRow: {
      flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
      padding: SPACING.base, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    notifRowLast: { borderBottomWidth: 0 },
    iconWrap: {
      width: 36, height: 36, borderRadius: RADIUS.sm,
      alignItems: 'center', justifyContent: 'center',
    },
    textWrap: { flex: 1 },
    label: {
      fontSize: FONT_SIZES.small, color: colors.textPrimary, fontFamily: FONTS.bodyMed,
    },
    sub: {
      fontSize: FONT_SIZES.micro, color: colors.textMuted, fontFamily: FONTS.body,
      marginTop: 2,
    },
    infoCard: {
      backgroundColor: colors.card, borderRadius: RADIUS.xl, padding: SPACING.base,
      borderWidth: 1, borderColor: colors.border,
    },
    infoText: {
      fontSize: FONT_SIZES.caption, color: colors.textSecondary, fontFamily: FONTS.body,
      lineHeight: 20,
    },
  }));

  const settings = user?.settings;
  if (!settings) return null;

  const rows = isRtl ? NOTIF_ROWS_AR : NOTIF_ROWS;

  return (
    <View style={styles.container}>
      <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={GRADIENTS.brand} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <AnimatedPressable onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name={isRtl ? 'chevron-forward' : 'chevron-back'} size={22} color={COLORS.gold} />
            </AnimatedPressable>
            <Text style={styles.headerTitle}>{t('settings.title')}</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.card}>
          {rows.map((row, idx) => {
            const isLast = idx === rows.length - 1;
            const isMaster = row.key === 'notificationsEnabled';
            const actualValue = settings[row.key] ?? DEFAULT_NOTIF_KEYS[row.key];
            const isDisabled = !isMaster && !settings.notificationsEnabled;
            return (
              <View key={row.key} style={[styles.notifRow, isLast && styles.notifRowLast]}>
                <View style={[styles.iconWrap, {
                  backgroundColor: isMaster ? `${activeColors.gold}18` : `${activeColors.info}18`,
                }]}>
                  <Ionicons
                    name={row.icon}
                    size={16}
                    color={isMaster ? activeColors.gold : activeColors.info}
                  />
                </View>
                <View style={styles.textWrap}>
                  <Text style={[styles.label, isDisabled && { opacity: 0.5 }]}>{row.label}</Text>
                  <Text style={[styles.sub, isDisabled && { opacity: 0.4 }]}>{row.sub}</Text>
                </View>
                <Switch
                  value={actualValue && !isDisabled}
                  onValueChange={(v) => updateSettings({ [row.key]: v })}
                  trackColor={{ false: activeColors.border, true: isMaster ? activeColors.gold : activeColors.info }}
                  thumbColor={actualValue ? activeColors.darkGreen : activeColors.textMuted}
                  disabled={isDisabled && !isMaster}
                />
              </View>
            );
          })}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            {isRtl
              ? 'قم بتشغيل أو إيقاف الإشعارات حسب رغبتك. عند تعطيل "الإشعارات الرئيسية"، سيتم تعطيل جميع الإشعارات الأخرى تلقائياً.'
              : 'Toggle notifications on or off as needed. Disabling "Master Notification" will grey out all other notification toggles.'}
          </Text>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}
