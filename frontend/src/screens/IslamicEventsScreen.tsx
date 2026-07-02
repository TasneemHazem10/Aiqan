import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  StatusBar, ActivityIndicator, RefreshControl, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { COLORS, SHADOWS, GRADIENTS } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { IslamicEvent } from '../types';
import { get } from '../utils/api';
import { ENDPOINTS } from '../constants/api';
import { getData, storeData, KEYS } from '../utils/storage';
import { gregorianToHijri, hijriToGregorian, formatHijriDate } from '../utils/hijri';
import { FadeIn, AnimatedPressable } from '../components/AnimatedComponents';
import LogoDecoration from '../components/LogoDecoration';


const EVENT_COLORS: Record<string, string> = {
  ramadan: '#1B6B43',
  eid: '#D4A017',
  hajj: '#129990',
  ashura: '#8B4513',
  mawlid: '#4A90D9',
  muharram: '#64706A',
  default: '#64706A',
};

const EVENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  ramadan: 'moon',
  eid: 'star',
  hajj: 'compass',
  ashura: 'heart',
  mawlid: 'leaf',
  muharram: 'calendar',
  default: 'calendar',
};

const MONTH_FILTERS = [
  { value: 0, labelAr: 'الكل', labelEn: 'All' },
  { value: 1, labelAr: 'محرم', labelEn: 'Muharram' },
  { value: 2, labelAr: 'صفر', labelEn: 'Safar' },
  { value: 3, labelAr: 'ربيع الأول', labelEn: "Rabi' al-Awwal" },
  { value: 4, labelAr: 'ربيع الثاني', labelEn: "Rabi' al-Thani" },
  { value: 5, labelAr: 'جمادى الأولى', labelEn: 'Jumada al-Ula' },
  { value: 6, labelAr: 'جمادى الثانية', labelEn: 'Jumada al-Thaniyah' },
  { value: 7, labelAr: 'رجب', labelEn: 'Rajab' },
  { value: 8, labelAr: 'شعبان', labelEn: "Sha'ban" },
  { value: 9, labelAr: 'رمضان', labelEn: 'Ramadan' },
  { value: 10, labelAr: 'شوال', labelEn: 'Shawwal' },
  { value: 11, labelAr: 'ذو القعدة', labelEn: "Dhu al-Qi'dah" },
  { value: 12, labelAr: 'ذو الحجة', labelEn: 'Dhu al-Hijjah' },
];

function getDaysRemaining(eventDate: string): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const parts = eventDate.split('-').map(Number);
  const target = new Date(parts[0], parts[1] - 1, parts[2]);
  const diff = target.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

const STATIC_EVENTS: { eventType: string; hm: number; hd: number; nameEn: string; nameAr: string; descEn: string; descAr: string }[] = [
  { eventType: 'muharram', hm: 1, hd: 1, nameEn: 'Islamic New Year', nameAr: 'رأس السنة الهجرية', descEn: 'Beginning of the Islamic lunar calendar year', descAr: 'بداية السنة الهجرية' },
  { eventType: 'ashura', hm: 1, hd: 10, nameEn: "Day of 'Ashura", nameAr: 'يوم عاشوراء', descEn: 'Day of voluntary fasting, commemorates the victory of truth', descAr: 'يوم صيام تطوعي يذكرنا بانتصار الحق' },
  { eventType: 'mawlid', hm: 3, hd: 12, nameEn: 'Mawlid al-Nabi (PBUH)', nameAr: 'المولد النبوي الشريف', descEn: 'The birth of Prophet Muhammad, peace be upon him', descAr: 'مولد النبي محمد صلى الله عليه وسلم' },
  { eventType: 'ramadan', hm: 9, hd: 1, nameEn: 'First Day of Ramadan', nameAr: 'أول يوم رمضان', descEn: 'The blessed month of fasting begins', descAr: 'يبدأ شهر رمضان المبارك' },
  { eventType: 'eid', hm: 10, hd: 1, nameEn: "Eid al-Fitr", nameAr: 'عيد الفطر المبارك', descEn: 'Celebration marking the end of Ramadan', descAr: 'عيد الفطر المبارك بعد شهر رمضان' },
  { eventType: 'hajj', hm: 12, hd: 8, nameEn: 'Day of Arafah', nameAr: 'يوم عرفة', descEn: 'The most important day of Hajj, standing at Arafah', descAr: 'أهم أيام الحج، الوقوف بعرفة' },
  { eventType: 'eid', hm: 12, hd: 10, nameEn: "Eid al-Adha", nameAr: 'عيد الأضحى المبارك', descEn: 'Festival of Sacrifice', descAr: 'عيد الأضحى المبارك' },
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
      description: { en: ev.descEn, ar: ev.descAr },
    };
  });
}

export default function IslamicEventsScreen() {
  const navigation = useNavigation<any>();
  const { t, language } = useApp();
  const isRtl = language === 'ar';

  const [events, setEvents] = useState<IslamicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<IslamicEvent | null>(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  const fetchEvents = useCallback(async () => {
    try {
      const cached = await getData<IslamicEvent[]>(KEYS.CACHED_EVENTS, []);
      if (cached && cached.length > 0) setEvents(cached);
      const data = await get<IslamicEvent[]>(ENDPOINTS.ISLAMIC_EVENTS);
      const sorted = data.sort((a, b) => a.hijriDate.localeCompare(b.hijriDate));
      setEvents(sorted);
      await storeData(KEYS.CACHED_EVENTS, sorted);
    } catch {
      if (eventsRef.current.length === 0) {
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

  const filteredEvents = useMemo(() => {
    let result = [...events];
    if (selectedMonth > 0) {
      result = result.filter(e => {
        const parts = e.hijriDate.split(/[-/]/);
        return parts.length >= 2 && parseInt(parts[1], 10) === selectedMonth;
      });
    }
    return result
      .filter(e => getDaysRemaining(e.gregorianDate) >= -1)
      .sort((a, b) => a.hijriDate.localeCompare(b.hijriDate));
  }, [events, selectedMonth]);

  const todayEvents = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return events.filter(e => e.gregorianDate === todayStr);
  }, [events]);

  const thisWeekEvents = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return events.filter(e => {
      const parts = e.gregorianDate.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d >= today && d <= weekEnd;
    });
  }, [events]);

  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
    header: { padding: 16, paddingBottom: 12 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 18, color: colors.textPrimary, fontWeight: '700' },
    content: { padding: 16 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 14, color: colors.gold, fontWeight: '700', marginBottom: 10 },
    eventCard: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...SHADOWS.soft },
    eventColorBar: { width: 4 },
    eventCardLarge: { marginBottom: 10, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, ...SHADOWS.soft },
    eventCardGradient: { flexDirection: 'row' },
    eventColorBarFull: { width: 5 },
    eventCardBody: { flex: 1, padding: 14 },
    eventCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    eventIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.glassGold, alignItems: 'center', justifyContent: 'center' },
    eventInfo: { flex: 1, paddingVertical: 8 },
    eventInfoLarge: { flex: 1 },
    eventName: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
    eventNameLarge: { fontSize: 15, color: colors.textPrimary, fontWeight: '700' },
    eventNameAlt: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    eventDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    eventBadgeToday: { backgroundColor: colors.darkGreen, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'center', marginRight: 8 },
    eventBadgeText: { fontSize: 10, color: colors.textPrimary, fontWeight: '600' },
    daysBadge: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
    daysBadgeNum: { fontSize: 20, color: colors.gold, fontWeight: '700' },
    daysBadgeLabel: { fontSize: 11, color: colors.textMuted },
    daysBadgeLarge: { alignItems: 'center', minWidth: 50 },
    daysBadgeNumLarge: { fontSize: 24, color: colors.gold, fontWeight: '700' },
    daysBadgeLabelLarge: { fontSize: 11, color: colors.textMuted, marginTop: 1, textAlign: 'center' },
    filterRow: { marginBottom: 16 },
    filterScroll: { gap: 8, paddingVertical: 4 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    filterChipActive: { backgroundColor: colors.glassGold, borderColor: colors.gold },
    filterText: { fontSize: 13, color: colors.textSecondary },
    filterTextActive: { color: colors.gold, fontWeight: '600' },
    eventDateRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    dateChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.glassGold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    dateChipText: { fontSize: 11, color: colors.gold, fontWeight: '500' },
    dateChipTextAlt: { fontSize: 11, color: colors.textSecondary },
    emptyCard: { backgroundColor: colors.card, borderRadius: 14, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    emptyText: { fontSize: 13, color: colors.textMuted, marginTop: 8 },
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalContent: { backgroundColor: colors.cardWarm, borderRadius: 20, padding: 0, width: '100%', maxWidth: 340, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
    modalColorBar: { height: 6 },
    modalTitle: { fontSize: 18, color: colors.textPrimary, fontWeight: '700', textAlign: 'center', paddingTop: 16, paddingHorizontal: 20 },
    modalSub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 4, paddingHorizontal: 20 },
    modalDivider: { height: 1, backgroundColor: colors.border, marginVertical: 12, marginHorizontal: 20 },
    modalDateRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20 },
    modalDateItem: { alignItems: 'center' },
    modalDateLabel: { fontSize: 11, color: colors.textMuted },
    modalDateValue: { fontSize: 14, color: colors.textPrimary, fontWeight: '600', marginTop: 4 },
    modalDesc: { fontSize: 13, color: colors.textPrimary, lineHeight: 20, paddingHorizontal: 20, paddingBottom: 12 },
    modalClose: { margin: 20, marginTop: 8, backgroundColor: colors.glassGold, borderRadius: 10, padding: 12, alignItems: 'center' },
    modalCloseText: { fontSize: 14, color: colors.gold, fontWeight: '600' },
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
            <Text style={styles.title}>{t('islamicEvents.title')}</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
        showsVerticalScrollIndicator={false}
      >
        {todayEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="today" size={14} color={COLORS.gold} /> {t('islamicEvents.today')}
            </Text>
            {todayEvents.map((event, idx) => (
              <AnimatedPressable key={idx} style={styles.eventCard} onPress={() => setSelectedEvent(event)} activeOpacity={0.7}>
                <View style={[styles.eventColorBar, { backgroundColor: EVENT_COLORS[event.eventType] || EVENT_COLORS.default }]} />
                <View style={styles.eventIconWrap}>
                  <Ionicons name={EVENT_ICONS[event.eventType] || EVENT_ICONS.default} size={22} color={EVENT_COLORS[event.eventType] || EVENT_COLORS.default} />
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventName}>{language === 'ar' ? event.name.ar : event.name.en}</Text>
                  <Text style={styles.eventDate}>
                    {event.hijriDate} | {event.gregorianDate}
                  </Text>
                </View>
                <View style={styles.eventBadgeToday}>
                  <Text style={styles.eventBadgeText}>{t('islamicEvents.today')}</Text>
                </View>
              </AnimatedPressable>
            ))}
          </View>
        )}

        {thisWeekEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="calendar" size={14} color={COLORS.gold} /> {t('islamicEvents.thisWeek')}
            </Text>
            {thisWeekEvents.map((event, idx) => (
              <AnimatedPressable key={idx} style={styles.eventCard} onPress={() => setSelectedEvent(event)} activeOpacity={0.7}>
                <View style={[styles.eventColorBar, { backgroundColor: EVENT_COLORS[event.eventType] || EVENT_COLORS.default }]} />
                <View style={styles.eventIconWrap}>
                  <Ionicons name={EVENT_ICONS[event.eventType] || EVENT_ICONS.default} size={20} color={EVENT_COLORS[event.eventType] || EVENT_COLORS.default} />
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventName}>{language === 'ar' ? event.name.ar : event.name.en}</Text>
                  <Text style={styles.eventDate}>{event.gregorianDate}</Text>
                </View>
                <View style={styles.daysBadge}>
                  <Text style={styles.daysBadgeNum}>{getDaysRemaining(event.gregorianDate)}</Text>
                  <Text style={styles.daysBadgeLabel}>{isRtl ? 'يوم' : 'd'}</Text>
                </View>
              </AnimatedPressable>
            ))}
          </View>
        )}

        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {MONTH_FILTERS.map(filter => (
              <AnimatedPressable
                key={filter.value}
                style={[styles.filterChip, selectedMonth === filter.value && styles.filterChipActive]}
                onPress={() => setSelectedMonth(filter.value)}
              >
                <Text style={[styles.filterText, selectedMonth === filter.value && styles.filterTextActive]}>
                  {isRtl ? filter.labelAr : filter.labelEn}
                </Text>
              </AnimatedPressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="star" size={14} color={COLORS.gold} /> {t('islamicEvents.upcoming')}
          </Text>

          {filteredEvents.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={36} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>{t('islamicEvents.noUpcoming')}</Text>
            </View>
          ) : (
            filteredEvents.map((event, idx) => {
              const daysLeft = getDaysRemaining(event.gregorianDate);
              return (
                <AnimatedPressable
                  key={idx}
                  style={styles.eventCardLarge}
                  onPress={() => setSelectedEvent(event)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[COLORS.card, COLORS.cardWarm]}
                    style={styles.eventCardGradient}
                  >
                    <View style={[styles.eventColorBarFull, { backgroundColor: EVENT_COLORS[event.eventType] || EVENT_COLORS.default }]} />
                    <View style={styles.eventCardBody}>
                      <View style={styles.eventCardTop}>
                        <View style={styles.eventIconWrap}>
                          <Ionicons name={EVENT_ICONS[event.eventType] || EVENT_ICONS.default} size={22} color={EVENT_COLORS[event.eventType] || EVENT_COLORS.default} />
                        </View>
                        <View style={styles.eventInfoLarge}>
                          <Text style={styles.eventNameLarge}>{language === 'ar' ? event.name.ar : event.name.en}</Text>
                          <Text style={styles.eventNameAlt}>{language === 'ar' ? event.name.en : event.name.ar}</Text>
                        </View>
                        <View style={styles.daysBadgeLarge}>
                          <Text style={styles.daysBadgeNumLarge}>{daysLeft >= 0 ? daysLeft : 0}</Text>
                          <Text style={styles.daysBadgeLabelLarge}>{t('islamicEvents.daysUntil')}</Text>
                        </View>
                      </View>
                      <View style={styles.eventDateRow}>
                        <View style={styles.dateChip}>
                          <Ionicons name="calendar" size={12} color={COLORS.gold} />
                          <Text style={styles.dateChipText}>{event.hijriDate}</Text>
                        </View>
                        <View style={styles.dateChip}>
                          <Ionicons name="calendar-outline" size={12} color={COLORS.textSecondary} />
                          <Text style={styles.dateChipTextAlt}>{event.gregorianDate}</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </AnimatedPressable>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={!!selectedEvent} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedEvent && (
              <>
                <View style={[styles.modalColorBar, { backgroundColor: EVENT_COLORS[selectedEvent.eventType] || EVENT_COLORS.default }]} />
                <Text style={styles.modalTitle}>{language === 'ar' ? selectedEvent.name.ar : selectedEvent.name.en}</Text>
                <Text style={styles.modalSub}>{language === 'ar' ? selectedEvent.name.en : selectedEvent.name.ar}</Text>
                <View style={styles.modalDivider} />
                <View style={styles.modalDateRow}>
                  <View style={styles.modalDateItem}>
                    <Text style={styles.modalDateLabel}>{t('prayer.hijriDate')}</Text>
                    <Text style={styles.modalDateValue}>{selectedEvent.hijriDate}</Text>
                  </View>
                  <View style={styles.modalDateItem}>
                    <Text style={styles.modalDateLabel}>{t('prayer.gregorianDate')}</Text>
                    <Text style={styles.modalDateValue}>{selectedEvent.gregorianDate}</Text>
                  </View>
                </View>
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


