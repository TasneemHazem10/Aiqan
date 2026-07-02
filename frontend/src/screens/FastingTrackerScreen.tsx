import React, { useState, useEffect, useCallback } from 'react';
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
import { FastingRecord, FastingStats } from '../types';
import api, { get, post } from '../utils/api';
import { ENDPOINTS } from '../constants/api';
import { getData, storeData, KEYS } from '../utils/storage';
import { FadeIn, AnimatedPressable } from '../components/AnimatedComponents';
import LogoDecoration from '../components/LogoDecoration';

const STATUS_COLORS: Record<string, string> = {
  fasted: '#1B6B43',
  missed: '#E53935',
  partial: '#D4A017',
  planned: '#129990',
};

const STATUS_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  fasted: 'checkmark-circle',
  missed: 'close-circle',
  partial: 'time',
  planned: 'alarm',
};

const FASTING_TYPES = ['ramadan', 'sunnah', 'qada', 'nazar'] as const;
const FASTING_STATUSES = ['fasted', 'missed', 'partial', 'planned'] as const;

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function monthDayNames(lang: 'ar' | 'en'): string[] {
  return lang === 'ar'
    ? ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
}

export default function FastingTrackerScreen() {
  const navigation = useNavigation<any>();
  const { t, language, fastingRecords, setFastingRecords } = useApp();
  const isRtl = language === 'ar';
  const { width: screenWidth } = useWindowDimensions();
  const daySize = Math.floor((screenWidth - 48) / 7);

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<FastingStats>({
    totalFasted: 0, ramadanFasted: 0, sunnahFasted: 0, qadaFasted: 0, nazarFasted: 0,
    currentStreak: 0, longestStreak: 0,
  });
  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState('');
  const [modalStatus, setModalStatus] = useState<FastingRecord['status']>('fasted');
  const [modalType, setModalType] = useState<FastingRecord['type']>('sunnah');

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const dateKey = (day: number) =>
    `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const recordForDay = (day: number): FastingRecord | undefined =>
    fastingRecords.find(r => r.date === dateKey(day));

  const fetchData = useCallback(async () => {
    try {
      const cached = await getData<FastingRecord[]>(KEYS.FASTING, []);
      if (cached && cached.length > 0) setFastingRecords(cached);
      const month = currentMonth + 1;
      const year = currentYear;
      const data = await get<FastingRecord[]>(ENDPOINTS.FASTING, { month, year });
      const merged = [...cached.filter(r => !data.find(d => d.date === r.date)), ...data];
      setFastingRecords(merged);
      await storeData(KEYS.FASTING, merged);
    } catch {
      // use cached
    }
  }, [currentMonth, currentYear]);

  const calcStats = useCallback(() => {
    const recs = fastingRecords;
    const totalFasted = recs.filter(r => r.status === 'fasted').length;
    const ramadanFasted = recs.filter(r => r.type === 'ramadan' && r.status === 'fasted').length;
    const sunnahFasted = recs.filter(r => r.type === 'sunnah' && r.status === 'fasted').length;
    const qadaFasted = recs.filter(r => r.type === 'qada' && r.status === 'fasted').length;
    const nazarFasted = recs.filter(r => r.type === 'nazar' && r.status === 'fasted').length;

    const fastedDates = [...new Set(
      recs.filter(r => r.status === 'fasted').map(r => r.date)
    )].sort().reverse();

    let currentStreak = 0;
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (fastedDates.includes(todayStr)) {
      currentStreak = 1;
      for (let i = 1; i < fastedDates.length; i++) {
        const prev = new Date(fastedDates[i - 1]);
        const curr = new Date(fastedDates[i]);
        const diff = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) currentStreak++;
        else break;
      }
    }

    let longestStreak = 0;
    if (fastedDates.length > 0) {
      let temp = 1;
      for (let i = 1; i < fastedDates.length; i++) {
        const prev = new Date(fastedDates[i - 1]);
        const curr = new Date(fastedDates[i]);
        const diff = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) temp++;
        else { longestStreak = Math.max(longestStreak, temp); temp = 1; }
      }
      longestStreak = Math.max(longestStreak, temp);
    }

    setStats({ totalFasted, ramadanFasted, sunnahFasted, qadaFasted, currentStreak, longestStreak, nazarFasted });
  }, [fastingRecords]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, []);

  useEffect(() => { calcStats(); }, [fastingRecords]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  const navigateMonth = (dir: number) => {
    let m = currentMonth + dir;
    let y = currentYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  const openDayModal = (day: number) => {
    const existing = recordForDay(day);
    setModalDate(dateKey(day));
    setModalStatus(existing?.status || 'fasted');
    setModalType(existing?.type || 'sunnah');
    setShowModal(true);
  };

  const saveRecord = async () => {
    try {
      const body = { date: modalDate, type: modalType, status: modalStatus };
      const saved = await post<FastingRecord>(ENDPOINTS.FASTING, body);
      const updated = fastingRecords.filter(r => r.date !== modalDate);
      updated.push(saved);
      setFastingRecords(updated);
      await storeData(KEYS.FASTING, updated);
      setShowModal(false);
    } catch {
      const updated = fastingRecords.filter(r => r.date !== modalDate);
      updated.push({ date: modalDate, type: modalType, status: modalStatus });
      setFastingRecords(updated);
      await storeData(KEYS.FASTING, updated);
      setShowModal(false);
    }
  };

  const deleteRecord = async () => {
    Alert.alert(
      isRtl ? 'حذف التسجيل' : 'Delete Record',
      isRtl ? 'هل أنت متأكد من حذف تسجيل هذا اليوم؟' : 'Are you sure you want to delete this day\'s record?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'), style: 'destructive',
          onPress: async () => {
            const existing = fastingRecords.find(r => r.date === modalDate);
            const updated = fastingRecords.filter(r => r.date !== modalDate);
            setFastingRecords(updated);
            await storeData(KEYS.FASTING, updated);
            setShowModal(false);
            if (existing?._id) {
              try { await api.delete(`/islamic/fasting/${existing._id}`); } catch {}
            }
          },
        },
      ]
    );
  };

  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
    header: { padding: 16, paddingBottom: 12 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 18, color: colors.textPrimary, fontWeight: '700' },
    content: { padding: 16 },
    statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
    statCard: { width: '30%', backgroundColor: colors.card, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border, ...SHADOWS.soft },
    statValue: { fontSize: 20, color: colors.gold, fontWeight: '700' },
    statLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
    monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    navBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.glassGold, alignItems: 'center', justifyContent: 'center' },
    monthTitle: { fontSize: 15, color: colors.textPrimary, fontWeight: '600' },
    calendarCard: { backgroundColor: colors.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 12, ...SHADOWS.soft },
    weekdayRow: { flexDirection: 'row', marginBottom: 6 },
    weekdayCell: { width: daySize, height: 24, alignItems: 'center', justifyContent: 'center' },
    weekdayText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCell: { width: daySize, height: daySize, alignItems: 'center', justifyContent: 'center', padding: 2 },
    dayToday: { borderRadius: 8, backgroundColor: colors.glassGold },
    dayInner: { width: '100%', height: '100%', borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    dayFasted: { borderColor: colors.success },
    dayNum: { fontSize: 13, color: colors.textPrimary, fontWeight: '500' },
    dayNumToday: { color: colors.gold, fontWeight: '700' },
    legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 10, color: colors.textSecondary },
    logBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.glassGold, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.gold + '40' },
    logBtnText: { fontSize: 14, color: colors.gold, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.cardWarm, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalTitle: { fontSize: 18, color: colors.textPrimary, fontWeight: '700', textAlign: 'center' },
    modalDate: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: 20, marginTop: 4 },
    fieldLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 8, marginTop: 12 },
    chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
    chipActive: { borderColor: colors.gold, backgroundColor: colors.glassGold },
    chipText: { fontSize: 13, color: colors.textSecondary },
    chipTextActive: { color: colors.gold, fontWeight: '600' },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
    modalCancel: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
    modalCancelText: { fontSize: 14, color: colors.textSecondary },
    modalSave: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.glassGold, alignItems: 'center' },
    modalSaveText: { fontSize: 14, color: colors.gold, fontWeight: '600' },
  }), [daySize]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  const monthDate = new Date(currentYear, currentMonth);
  const monthName = monthDate.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' });

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
            <Text style={styles.title}>{t('fasting.title')}</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalFasted}</Text>
            <Text style={styles.statLabel}>{t('fasting.totalFasted')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.ramadanFasted}</Text>
            <Text style={styles.statLabel}>{t('fasting.ramadanFasted')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.sunnahFasted}</Text>
            <Text style={styles.statLabel}>{t('fasting.sunnahFasted')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.qadaFasted}</Text>
            <Text style={styles.statLabel}>{t('fasting.qadaFasted')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.nazarFasted}</Text>
            <Text style={styles.statLabel}>{t('fasting.nazar')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.longestStreak}</Text>
            <Text style={styles.statLabel}>{t('fasting.longestStreak')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>{t('fasting.currentStreak')}</Text>
          </View>
        </View>

        <View style={styles.monthNav}>
          <AnimatedPressable onPress={() => navigateMonth(-1)} style={styles.navBtn}>
            <Ionicons name={isRtl ? 'chevron-forward' : 'chevron-back'} size={20} color={COLORS.gold} />
          </AnimatedPressable>
          <Text style={styles.monthTitle}>{monthName}</Text>
          <AnimatedPressable onPress={() => navigateMonth(1)} style={styles.navBtn}>
            <Ionicons name={isRtl ? 'chevron-back' : 'chevron-forward'} size={20} color={COLORS.gold} />
          </AnimatedPressable>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.weekdayRow}>
            {monthDayNames(language).map((d, i) => (
              <View key={i} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{d}</Text>
              </View>
            ))}
          </View>
          <View style={styles.daysGrid}>
            {Array.from({ length: firstDay }).map((_, i) => (
              <View key={`e-${i}`} style={styles.dayCell} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const rec = recordForDay(day);
              const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
              return (
                <AnimatedPressable
                  key={day}
                  style={[styles.dayCell, isToday && styles.dayToday]}
                  onPress={() => openDayModal(day)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.dayInner,
                    rec && { backgroundColor: STATUS_COLORS[rec.status] + '40', borderColor: STATUS_COLORS[rec.status] },
                    rec?.status === 'fasted' && styles.dayFasted,
                  ]}>
                    <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>{day}</Text>
                    {rec && (
                      <Ionicons name={STATUS_ICONS[rec.status]} size={10} color={STATUS_COLORS[rec.status]} />
                    )}
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>
        </View>

        <View style={styles.legendRow}>
          {Object.entries(STATUS_COLORS).map(([key, color]) => (
            <View key={key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendText}>{t(`fasting.${key}`)}</Text>
            </View>
          ))}
        </View>

        <AnimatedPressable style={styles.logBtn} onPress={() => openDayModal(today.getDate())}>
          <Ionicons name="add-circle" size={20} color={COLORS.gold} />
          <Text style={styles.logBtnText}>{t('fasting.logFasting')}</Text>
        </AnimatedPressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('fasting.logFasting')}</Text>
            <Text style={styles.modalDate}>{modalDate}</Text>

            <Text style={styles.fieldLabel}>{t('fasting.selectType')}</Text>
            <View style={styles.chipRow}>
              {FASTING_TYPES.map(type => (
                <AnimatedPressable
                  key={type}
                  style={[styles.chip, modalType === type && styles.chipActive]}
                  onPress={() => setModalType(type)}
                >
                  <Text style={[styles.chipText, modalType === type && styles.chipTextActive]}>
                    {t(`fasting.${type}`)}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>{t('fasting.selectStatus')}</Text>
            <View style={styles.chipRow}>
              {FASTING_STATUSES.map(status => (
                <AnimatedPressable
                  key={status}
                  style={[styles.chip, modalStatus === status && { borderColor: STATUS_COLORS[status], backgroundColor: STATUS_COLORS[status] + '30' }]}
                  onPress={() => setModalStatus(status)}
                >
                  <Ionicons name={STATUS_ICONS[status]} size={14} color={STATUS_COLORS[status]} />
                  <Text style={[styles.chipText, modalStatus === status && { color: STATUS_COLORS[status] }]}>
                    {t(`fasting.${status}`)}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>

            <View style={styles.modalActions}>
              <AnimatedPressable style={styles.modalCancel} onPress={() => setShowModal(false)}>
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </AnimatedPressable>
              {recordForDay(parseInt(modalDate.split('-')[2], 10)) && (
                <AnimatedPressable
                  style={[styles.modalCancel, { backgroundColor: 'rgba(239,68,68,0.2)', borderColor: COLORS.error }]}
                  onPress={deleteRecord}
                >
                  <Ionicons name="trash" size={16} color={COLORS.error} />
                </AnimatedPressable>
              )}
              <AnimatedPressable style={styles.modalSave} onPress={saveRecord}>
                <Text style={styles.modalSaveText}>{t('common.save')}</Text>
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


