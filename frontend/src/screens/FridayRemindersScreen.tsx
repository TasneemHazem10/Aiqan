import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  StatusBar, ActivityIndicator, Switch, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { COLORS, SHADOWS, GRADIENTS } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { getData, storeData, KEYS } from '../utils/storage';
import { FadeIn, AnimatedPressable } from '../components/AnimatedComponents';
import LogoDecoration from '../components/LogoDecoration';

const TIMES = [
  { label: '06:00', value: '06:00' },
  { label: '07:00', value: '07:00' },
  { label: '08:00', value: '08:00' },
  { label: '09:00', value: '09:00' },
  { label: '10:00', value: '10:00' },
  { label: '11:00', value: '11:00' },
  { label: '12:00', value: '12:00' },
  { label: '13:00', value: '13:00' },
  { label: '14:00', value: '14:00' },
  { label: '15:00', value: '15:00' },
  { label: '16:00', value: '16:00' },
  { label: '17:00', value: '17:00' },
  { label: '18:00', value: '18:00' },
];

const FRIDAY_DUAS = [
  {
    arabic: 'اللَّهُمَّ اغْفِرْ لِي ذَنْبِي وَوَسِّعْ لِي فِي رِزْقِي وَبَارِكْ لِي فِيمَا أَعْطَيْتَنِي',
    english: 'O Allah, forgive my sin, expand my provision, and bless what You have given me',
  },
  {
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    english: 'Our Lord, give us good in this world and good in the Hereafter and protect us from the torment of the Fire',
  },
  {
    arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ',
    english: 'O Allah, You are my Lord, there is no god but You, You created me and I am Your servant',
  },
];

interface FridaySettings {
  enabled: boolean;
  reminderTime: string;
}

export default function FridayRemindersScreen() {
  const navigation = useNavigation<any>();
  const { t, language, updateSettings } = useApp();
  const isRtl = language === 'ar';

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<FridaySettings>({
    enabled: false,
    reminderTime: '09:00',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await getData<FridaySettings>(KEYS.FRIDAY_REMINDER, {
        enabled: false,
        reminderTime: '09:00',
      });
      if (saved) setSettings(saved);
    } finally {
      setLoading(false);
    }
  };

  const scheduleFridayNotification = useCallback(async (time: string) => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      const [hour, minute] = time.split(':').map(Number);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: isRtl ? '📖 تذكير الجمعة' : '📖 Friday Reminder',
          body: isRtl
            ? 'اليوم الجمعة! لا تنس قراءة سورة الكهف والإكثار من الصلاة على النبي ﷺ'
            : 'Today is Friday! Read Surah Al-Kahf and send blessings upon the Prophet ﷺ',
          data: { type: 'friday' },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 6,
          hour,
          minute,
        },
      });
    } catch (err) {
      console.error('Failed to schedule Friday notification:', err);
    }
  }, [isRtl]);

  const cancelFridayNotification = useCallback(async () => {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const n of scheduled) {
        if (n.content.data?.type === 'friday') {
          await Notifications.cancelScheduledNotificationAsync(n.identifier);
        }
      }
    } catch (err) {
      console.error('Failed to cancel Friday notification:', err);
    }
  }, []);

  const saveSettings = useCallback(async (updated: FridaySettings) => {
    setSettings(updated);
    await storeData(KEYS.FRIDAY_REMINDER, updated);
    try {
      await updateSettings({ fridayReminderNotifs: updated.enabled });
    } catch {
      // local save is enough
    }
    if (updated.enabled) {
      await scheduleFridayNotification(updated.reminderTime);
    } else {
      await cancelFridayNotification();
    }
  }, [updateSettings, scheduleFridayNotification, cancelFridayNotification]);

  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          isRtl ? 'الإشعارات غير مفعلة' : 'Notifications Disabled',
          isRtl
            ? 'يرجى تفعيل الإشعارات من إعدادات الجهاز للحصول على تذكير الجمعة'
            : 'Please enable notifications in device settings to receive Friday reminders'
        );
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const toggleEnabled = async (val: boolean) => {
    if (val && !(await requestNotificationPermission())) return;
    saveSettings({ ...settings, enabled: val });
  };

  const setReminderTime = (time: string) => {
    saveSettings({ ...settings, reminderTime: time });
  };

  const navigateToKahf = () => {
    (navigation as any).navigate('Quran', {
      screen: 'SurahReader',
      params: { surahNumber: 18, surahName: 'Al-Kahf' },
    });
  };

  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
    header: { padding: 16, paddingBottom: 12 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 18, color: colors.textPrimary, fontWeight: '700' },
    content: { padding: 16 },
    virtueCard: { borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: colors.border, ...SHADOWS.soft },
    virtueText: { fontSize: 14, color: colors.textPrimary, textAlign: 'center', marginTop: 10, lineHeight: 20 },
    virtueArabic: { fontSize: 16, color: colors.gold, textAlign: 'center', marginTop: 8, fontFamily: 'serif' },
    toggleCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    toggleInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    toggleLabel: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
    timeCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
    timeCardTitle: { fontSize: 13, color: colors.gold, fontWeight: '600', marginBottom: 12 },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    timeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardWarm },
    timeChipActive: { borderColor: colors.gold, backgroundColor: colors.glassGold },
    timeChipText: { fontSize: 13, color: colors.textSecondary },
    timeChipTextActive: { color: colors.gold, fontWeight: '600' },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 14, color: colors.textPrimary, fontWeight: '700', marginBottom: 10 },
    actionCard: { borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
    actionGradient: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
    actionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.glassGold, alignItems: 'center', justifyContent: 'center' },
    actionInfo: { flex: 1 },
    actionTitle: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
    actionSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
    sunnahCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border },
    sunnahRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
    sunnahText: { fontSize: 13, color: colors.textPrimary, flex: 1 },
    duaCard: { backgroundColor: colors.card, borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
    duaArabic: { fontSize: 16, color: colors.textPrimary, textAlign: 'center', lineHeight: 28, marginBottom: 8, fontFamily: 'serif' },
    duaTranslation: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic' },
  }), []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={GRADIENTS.brand} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <AnimatedPressable onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name={isRtl ? 'chevron-forward' : 'chevron-back'} size={20} color={COLORS.gold} />
            </AnimatedPressable>
            <Text style={styles.title}>{t('fridayReminders.title')}</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#1B3040', '#0D1A25']} style={styles.virtueCard}>
          <Ionicons name="sunny" size={28} color={COLORS.gold} />
          <Text style={styles.virtueText}>{t('fridayReminders.fridayMessage')}</Text>
          <Text style={styles.virtueArabic}>يوم الجمعة خير يوم طلعت فيه الشمس</Text>
        </LinearGradient>

        <View style={styles.toggleCard}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="notifications" size={20} color={COLORS.gold} />
              <Text style={styles.toggleLabel}>{isRtl ? 'تفعيل تذكير الجمعة' : 'Enable Friday Reminder'}</Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={toggleEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.green }}
              thumbColor={settings.enabled ? COLORS.gold : COLORS.textMuted}
            />
          </View>
        </View>

        {settings.enabled && (
          <View style={styles.timeCard}>
            <Text style={styles.timeCardTitle}>{t('fridayReminders.reminderTime')}</Text>
            <View style={styles.timeGrid}>
              {TIMES.map(time => (
                <AnimatedPressable
                  key={time.value}
                  style={[styles.timeChip, settings.reminderTime === time.value && styles.timeChipActive]}
                  onPress={() => setReminderTime(time.value)}
                >
                  <Text style={[styles.timeChipText, settings.reminderTime === time.value && styles.timeChipTextActive]}>
                    {time.label}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isRtl ? 'سنن الجمعة' : 'Sunnah of Friday'}</Text>

          <AnimatedPressable style={styles.actionCard} onPress={navigateToKahf} activeOpacity={0.7}>
            <LinearGradient colors={GRADIENTS.brand} style={styles.actionGradient}>
              <View style={styles.actionIcon}>
                <Ionicons name="book" size={22} color={COLORS.gold} />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>{t('fridayReminders.surahKahf')}</Text>
                <Text style={styles.actionSub}>
                  {isRtl ? 'سورة الكهف - سورة رقم 18' : "Surah Al-Kahf - Surah 18"}
                </Text>
              </View>
              <Ionicons name={isRtl ? 'chevron-forward' : 'chevron-back'} size={18} color={COLORS.gold} />
            </LinearGradient>
          </AnimatedPressable>

          <View style={styles.sunnahCard}>
            <View style={styles.sunnahRow}>
              <Ionicons name="heart" size={18} color={COLORS.gold} />
              <Text style={styles.sunnahText}>{t('fridayReminders.sendBlessings')}</Text>
            </View>
            <View style={styles.sunnahRow}>
              <Ionicons name="time" size={18} color={COLORS.gold} />
              <Text style={styles.sunnahText}>{isRtl ? 'التبكير إلى صلاة الجمعة' : 'Go early to Friday prayer'}</Text>
            </View>
            <View style={styles.sunnahRow}>
              <Ionicons name="water" size={18} color={COLORS.gold} />
              <Text style={styles.sunnahText}>{isRtl ? 'الاغتسال يوم الجمعة' : 'Take a bath (ghusl) on Friday'}</Text>
            </View>
            <View style={styles.sunnahRow}>
              <Ionicons name="shirt" size={18} color={COLORS.gold} />
              <Text style={styles.sunnahText}>{isRtl ? 'لبس أحسن الثياب' : 'Wear best clothes'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('fridayReminders.fridayDua')}</Text>
          {FRIDAY_DUAS.map((dua, idx) => (
            <View key={idx} style={styles.duaCard}>
              <Text style={styles.duaArabic}>{dua.arabic}</Text>
              <Text style={styles.duaTranslation}>{dua.english}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}


