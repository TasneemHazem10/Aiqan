import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  StatusBar, ActivityIndicator, RefreshControl, Modal, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { COLORS, SHADOWS, GRADIENTS } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { get } from '../utils/api';
import { ENDPOINTS } from '../constants/api';
import { getData, storeData, KEYS } from '../utils/storage';
import { IslamicEvent } from '../types';
import {
  gregorianToHijri, hijriToGregorian, formatHijriDate, hijriMonthName, monthDays,
} from '../utils/hijri';
import LogoDecoration from '../components/LogoDecoration';
import { FadeIn, AnimatedPressable } from '../components/AnimatedComponents';

const EVENT_COLORS: Record<string, string> = {
  ramadan: '#1B6B43',
  hajj: '#D4A017',
  eid: '#129990',
  ashura: '#8B4513',
  default: '#64706A',
};

export default function HijriCalendarScreen() {
  const navigation = useNavigation<any>();
  const { t, language } = useApp();
  const isRtl = language === 'ar';

  const today = useMemo(() => gregorianToHijri(new Date()), []);
  const { width: screenWidth } = useWindowDimensions();
  const daySize = Math.floor((screenWidth - 48) / 7);
  const [currentYear, setCurrentYear] = useState(today.year);
  const [currentMonth, setCurrentMonth] = useState(today.month);
  const [events, setEvents] = useState<IslamicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<IslamicEvent | null>(null);

  const daysInMonth = monthDays(currentYear, currentMonth);
  const monthStart = hijriToGregorian(currentYear, currentMonth, 1);
  const startDay = monthStart.getDay();

  const fetchEvents = useCallback(async () => {
    try {
      const cached = await getData<IslamicEvent[]>(KEYS.CACHED_EVENTS, []);
      if (cached && cached.length > 0) setEvents(cached);
      const data = await get<IslamicEvent[]>(ENDPOINTS.ISLAMIC_EVENTS);
      const sorted = data.sort((a, b) => a.hijriDate.localeCompare(b.hijriDate));
      setEvents(sorted);
      await storeData(KEYS.CACHED_EVENTS, sorted);
    } catch {
      if (events.length === 0) {
        setEvents(getDefaultEvents());
      }
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchEvents().finally(() => setLoading(false));
  }, [fetchEvents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, [fetchEvents]);

  const monthEvents = events.filter(e => {
    const parts = e.hijriDate.split(/[-/]/);
    if (parts.length >= 2) {
      const m = parseInt(parts[1], 10);
      return m === currentMonth;
    }
    return false;
  });

  const navigateMonth = (dir: number) => {
    let m = currentMonth + dir;
    let y = currentYear;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  const isToday = (day: number) => today.year === currentYear && today.month === currentMonth && today.day === day;

  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
    header: { padding: 16, paddingBottom: 12 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 18, color: colors.textPrimary, fontWeight: '700' },
    content: { padding: 16 },
    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.glassGold, alignItems: 'center', justifyContent: 'center' },
    monthTitleWrap: { alignItems: 'center', flex: 1 },
    monthTitleAr: { fontSize: 20, color: colors.gold, fontWeight: '700', marginBottom: 2 },
    monthTitleEn: { fontSize: 12, color: colors.textSecondary },
    calendarCard: { backgroundColor: colors.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 20, ...SHADOWS.soft },
    weekdayRow: { flexDirection: 'row', marginBottom: 8 },
    weekdayCell: { width: daySize, height: 28, alignItems: 'center', justifyContent: 'center' },
    weekdayText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: daySize, height: daySize, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    dayToday: { backgroundColor: colors.glassGold, borderRadius: 8 },
    dayNumber: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
    dayNumberToday: { color: colors.gold, fontWeight: '700' },
    dayGregorian: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
    dayEventDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.gold, position: 'absolute', bottom: 4 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 14, color: colors.gold, fontWeight: '700', marginBottom: 10 },
    eventCard: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...SHADOWS.soft },
    eventColorBar: { width: 4 },
    eventInfo: { flex: 1, padding: 12 },
    eventName: { fontSize: 14, color: colors.textPrimary, fontWeight: '600', marginBottom: 2 },
    eventDate: { fontSize: 11, color: colors.textSecondary },
    eventGregorian: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
    eventDay: { fontSize: 20, color: colors.gold, fontWeight: '700', alignSelf: 'center', paddingRight: 12 },
    emptyCard: { backgroundColor: colors.card, borderRadius: 14, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    emptyText: { fontSize: 13, color: colors.textMuted, marginTop: 8 },
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalContent: { backgroundColor: colors.cardWarm, borderRadius: 20, padding: 24, width: '100%', maxWidth: 340, borderWidth: 1, borderColor: colors.border },
    modalTitle: { fontSize: 18, color: colors.textPrimary, fontWeight: '700', textAlign: 'center' },
    modalSub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
    modalDivider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
    modalLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
    modalValue: { color: colors.textPrimary, fontWeight: '600' },
    modalDesc: { fontSize: 13, color: colors.textPrimary, lineHeight: 20 },
    modalClose: { marginTop: 16, backgroundColor: colors.glassGold, borderRadius: 10, padding: 12, alignItems: 'center' },
    modalCloseText: { fontSize: 14, color: colors.gold, fontWeight: '600' },
  }), [daySize]);

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
            <Text style={styles.title}>{t('hijriCalendar.title')}</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn>
        <View style={styles.monthNav}>
          <AnimatedPressable onPress={() => navigateMonth(-1)} style={styles.navBtn}>
            <Ionicons name={isRtl ? 'chevron-forward' : 'chevron-back'} size={22} color={COLORS.gold} />
          </AnimatedPressable>
          <View style={styles.monthTitleWrap}>
            <Text style={styles.monthTitleAr}>{hijriMonthName(currentMonth, 'ar')}</Text>
            <Text style={styles.monthTitleEn}>{hijriMonthName(currentMonth, language)} {currentYear} {t('hijriCalendar.hijriYear')}</Text>
          </View>
          <AnimatedPressable onPress={() => navigateMonth(1)} style={styles.navBtn}>
            <Ionicons name={isRtl ? 'chevron-back' : 'chevron-forward'} size={22} color={COLORS.gold} />
          </AnimatedPressable>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.weekdayRow}>
            {(isRtl
              ? ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']
              : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            ).map((d, i) => (
              <View key={i} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{d}</Text>
              </View>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {Array.from({ length: startDay }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const todayFlag = isToday(day);
              const gDate = hijriToGregorian(currentYear, currentMonth, day);
              const dayEvents = monthEvents.filter(e => {
                const parts = e.hijriDate.split(/[-/]/);
                return parts.length >= 3 && parseInt(parts[2], 10) === day;
              });
              return (
                <AnimatedPressable
                  key={day}
                  style={[styles.dayCell, todayFlag && styles.dayToday]}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (dayEvents.length > 0) setSelectedEvent(dayEvents[0]);
                  }}
                >
                  <Text style={[styles.dayNumber, todayFlag && styles.dayNumberToday]}>
                    {day}
                  </Text>
                  <Text style={styles.dayGregorian}>
                    {gDate.getDate()}/{gDate.getMonth() + 1}
                  </Text>
                  {dayEvents.length > 0 && <View style={styles.dayEventDot} />}
                </AnimatedPressable>
              );
            })}
          </View>
        </View>

        {monthEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="star" size={14} color={COLORS.gold} /> {t('hijriCalendar.events')}
            </Text>
            {monthEvents.map((event, idx) => {
              const parts = event.hijriDate.split(/[-/]/);
              const evDay = parts.length >= 3 ? parseInt(parts[2], 10) : 0;
              return (
                <AnimatedPressable
                  key={idx}
                  style={styles.eventCard}
                  onPress={() => setSelectedEvent(event)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.eventColorBar, { backgroundColor: EVENT_COLORS[event.eventType] || EVENT_COLORS.default }]} />
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventName}>{language === 'ar' ? event.name.ar : event.name.en}</Text>
                    <Text style={styles.eventDate}>
                      {event.hijriDate}
                    </Text>
                    <Text style={styles.eventGregorian}>{event.gregorianDate}</Text>
                  </View>
                  <Text style={styles.eventDay}>{evDay}</Text>
                </AnimatedPressable>
              );
            })}
          </View>
        )}

        {monthEvents.length === 0 && (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={36} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>{t('hijriCalendar.noEvents')}</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
        </FadeIn>
      </ScrollView>

      <Modal visible={!!selectedEvent} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedEvent && (
              <>
                <Text style={styles.modalTitle}>{language === 'ar' ? selectedEvent.name.ar : selectedEvent.name.en}</Text>
                <Text style={styles.modalSub}>{language === 'ar' ? selectedEvent.name.en : selectedEvent.name.ar}</Text>
                <View style={styles.modalDivider} />
                <Text style={styles.modalLabel}>{t('prayer.hijriDate')}: <Text style={styles.modalValue}>{selectedEvent.hijriDate}</Text></Text>
                <Text style={styles.modalLabel}>{t('prayer.gregorianDate')}: <Text style={styles.modalValue}>{selectedEvent.gregorianDate}</Text></Text>
                {selectedEvent.description && (
                  <>
                    <View style={styles.modalDivider} />
                    <Text style={styles.modalDesc}>
                      {language === 'ar' ? selectedEvent.description.ar : selectedEvent.description.en}
                    </Text>
                  </>
                )}
                <AnimatedPressable style={styles.modalClose} onPress={() => setSelectedEvent(null)}>
                  <Text style={styles.modalCloseText}>{t('common.close')}</Text>
                </AnimatedPressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const STATIC_EVENTS: { eventType: string; hm: number; hd: number; nameEn: string; nameAr: string; descEn?: string; descAr?: string }[] = [
  { eventType: 'muharram', hm: 1, hd: 1, nameEn: 'Islamic New Year', nameAr: 'رأس السنة الهجرية' },
  { eventType: 'ashura', hm: 1, hd: 10, nameEn: "Day of 'Ashura", nameAr: 'يوم عاشوراء' },
  { eventType: 'mawlid', hm: 3, hd: 12, nameEn: "Mawlid al-Nabi (Birth of Prophet)", nameAr: 'المولد النبوي الشريف' },
  { eventType: 'ramadan', hm: 9, hd: 1, nameEn: 'First Day of Ramadan', nameAr: 'أول يوم رمضان', descEn: 'The blessed month of fasting begins', descAr: 'يبدأ شهر رمضان المبارك' },
  { eventType: 'eid', hm: 10, hd: 1, nameEn: "Eid al-Fitr", nameAr: 'عيد الفطر المبارك' },
  { eventType: 'hajj', hm: 12, hd: 8, nameEn: 'First Day of Hajj', nameAr: 'بداية الحج' },
  { eventType: 'eid', hm: 12, hd: 10, nameEn: "Eid al-Adha", nameAr: 'عيد الأضحى المبارك' },
];

function getDefaultEvents(): IslamicEvent[] {
  const today = new Date();
  const hijri = gregorianToHijri(today);
  let eventYear = hijri.year;
  if (hijri.month > 12 || (hijri.month === 12 && hijri.day > 10)) {
    eventYear++;
  }
  return STATIC_EVENTS.map(ev => {
    const gDate = hijriToGregorian(eventYear, ev.hm, ev.hd);
    const gStr = `${gDate.getFullYear()}-${String(gDate.getMonth() + 1).padStart(2, '0')}-${String(gDate.getDate()).padStart(2, '0')}`;
    return {
      eventType: ev.eventType,
      hijriDate: formatHijriDate(eventYear, ev.hm, ev.hd),
      gregorianDate: gStr,
      name: { en: ev.nameEn, ar: ev.nameAr },
      ...(ev.descEn ? { description: { en: ev.descEn, ar: ev.descAr || '' } } : {}),
    };
  });
}


