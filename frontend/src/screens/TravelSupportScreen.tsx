import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, StatusBar, Alert, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useApp } from '../context/AppContext';
import { get } from '../utils/api';
import { ENDPOINTS } from '../constants/api';
import { storeData, getData, KEYS } from '../utils/storage';
import { PrayerTimesResponse, NextPrayer } from '../types';
import { COLORS, SHADOWS, GRADIENTS } from '../constants/colors';
import { FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { FadeIn, AnimatedPressable } from '../components/AnimatedComponents';
import LogoDecoration from '../components/LogoDecoration';

interface SavedLocation {
  id: string;
  city: string;
  country: string;
  label?: string;
}

const COUNTRY_LIST = [
  'Saudi Arabia', 'Egypt', 'UAE', 'Kuwait', 'Qatar', 'Oman', 'Bahrain',
  'Jordan', 'Lebanon', 'Syria', 'Iraq', 'Yemen', 'Palestine',
  'Turkey', 'Iran', 'Pakistan', 'India', 'Bangladesh', 'Indonesia',
  'Malaysia', 'Morocco', 'Algeria', 'Tunisia', 'Libya', 'Sudan',
  'Mauritania', 'Somalia', 'Djibouti', 'Comoros',
  'USA', 'UK', 'Canada', 'Australia', 'Germany', 'France',
  'Italy', 'Spain', 'Netherlands', 'Sweden', 'Norway',
];

const CITY_MAP: Record<string, string[]> = {
  'Saudi Arabia': ['Makkah', 'Madinah', 'Riyadh', 'Jeddah', 'Dammam'],
  Egypt: ['Cairo', 'Alexandria', 'Giza', 'Luxor', 'Aswan'],
  UAE: ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman'],
  Kuwait: ['Kuwait City'],
  Qatar: ['Doha'],
  Oman: ['Muscat', 'Salalah'],
  Jordan: ['Amman', 'Zarqa'],
  Turkey: ['Istanbul', 'Ankara', 'Izmir'],
  Morocco: ['Casablanca', 'Rabat', 'Marrakech'],
  Algeria: ['Algiers', 'Oran'],
  Tunisia: ['Tunis', 'Sfax'],
  Indonesia: ['Jakarta', 'Bandung', 'Surabaya'],
  Pakistan: ['Karachi', 'Lahore', 'Islamabad'],
  India: ['Mumbai', 'Delhi', 'Hyderabad'],
  USA: ['New York', 'Chicago', 'Los Angeles', 'Houston', 'Detroit'],
  UK: ['London', 'Birmingham', 'Manchester'],
  Canada: ['Toronto', 'Montreal', 'Vancouver'],
  Australia: ['Sydney', 'Melbourne', 'Perth'],
};

const PRAYERS_DISPLAY = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const PRAYER_AR: Record<string, string> = {
  Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء',
};

function formatTime(timeStr: string): string {
  if (!timeStr) return '--:--';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

function getNextPrayer(timings: Record<string, string>): NextPrayer {
  const prayerKeys = [
    { key: 'Fajr', arabic: 'الفجر' },
    { key: 'Dhuhr', arabic: 'الظهر' },
    { key: 'Asr', arabic: 'العصر' },
    { key: 'Maghrib', arabic: 'المغرب' },
    { key: 'Isha', arabic: 'العشاء' },
  ];
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  for (const p of prayerKeys) {
    const timeStr = timings[p.key];
    if (!timeStr) continue;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const prayerTime = new Date(`${todayStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
    if (prayerTime > now) {
      const diffMs = prayerTime.getTime() - now.getTime();
      const diffH = Math.floor(diffMs / 3600000);
      const diffM = Math.floor((diffMs % 3600000) / 60000);
      return {
        name: p.key, arabicName: p.arabic, time: formatTime(timeStr),
        countdown: diffH > 0 ? `${diffH}h ${diffM}m` : `${diffM}m`,
        countdownSeconds: Math.floor(diffMs / 1000),
      };
    }
  }
  return {
    name: 'Fajr', arabicName: 'الفجر', time: formatTime(timings['Fajr'] || ''),
    countdown: 'Tomorrow', countdownSeconds: 0,
  };
}

export default function TravelSupportScreen() {
  const navigation = useNavigation<any>();
  const { t, language } = useApp();
  const isRtl = language === 'ar';

  const { height: screenHeight } = useWindowDimensions();

  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { padding: SPACING.base, paddingBottom: SPACING.md, borderBottomLeftRadius: RADIUS.xxl, borderBottomRightRadius: RADIUS.xxl, overflow: 'hidden' },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: {
      width: 38, height: 38, borderRadius: RADIUS.round,
      backgroundColor: COLORS.glassDark, alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: FONT_SIZES.lg, color: colors.textPrimary, fontFamily: FONTS.bodyBold },
    scroll: { flex: 1 },
    section: { paddingHorizontal: SPACING.base, marginBottom: SPACING.base },
    sectionHeader: {
      flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
      marginBottom: SPACING.sm, marginLeft: SPACING.xs,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.caption, color: colors.gold,
      fontFamily: FONTS.bodyBold, textTransform: 'uppercase', letterSpacing: 1.2,
    },
    card: {
      backgroundColor: colors.card, borderRadius: RADIUS.xl,
      overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
      padding: SPACING.base,
    },
    locationDisplay: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    locationCity: {
      fontSize: FONT_SIZES.md, color: colors.textPrimary, fontFamily: FONTS.bodyBold,
    },
    locationCountry: {
      fontSize: FONT_SIZES.small, color: colors.textSecondary, fontFamily: FONTS.body,
    },
    emptyText: { fontSize: FONT_SIZES.small, color: colors.textMuted, textAlign: 'center' },

    pickerBtn: {
      flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
      backgroundColor: COLORS.glassDark, borderRadius: RADIUS.md,
      padding: SPACING.md, marginBottom: SPACING.sm,
    },
    pickerBtnText: {
      flex: 1, fontSize: FONT_SIZES.small, color: colors.textPrimary, fontFamily: FONTS.bodyMed,
    },
    cityRow: { marginBottom: SPACING.sm },
    cityChip: {
      backgroundColor: COLORS.glassDark, borderRadius: RADIUS.round,
      paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginRight: SPACING.sm,
    },
    cityChipActive: { backgroundColor: colors.gold },
    cityChipText: { fontSize: FONT_SIZES.small, color: colors.textSecondary },
    cityChipTextActive: { color: colors.green, fontFamily: FONTS.bodyBold },
    input: {
      backgroundColor: COLORS.glassDark, borderRadius: RADIUS.md,
      padding: SPACING.md, color: colors.textPrimary, fontSize: FONT_SIZES.small,
      fontFamily: FONTS.body, marginBottom: SPACING.sm,
    },
    locationActions: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
    detectBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs,
      backgroundColor: COLORS.glassDark, borderRadius: RADIUS.md,
      paddingVertical: SPACING.md, borderWidth: 1, borderColor: colors.gold,
    },
    detectBtnText: { fontSize: FONT_SIZES.small, color: colors.gold, fontFamily: FONTS.bodyMed },
    fetchBtn: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.gold, borderRadius: RADIUS.md, paddingVertical: SPACING.md,
    },
    fetchBtnText: {
      fontSize: FONT_SIZES.small, color: colors.green, fontFamily: FONTS.bodyBold,
    },
    saveLocationBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs,
      paddingVertical: SPACING.sm, borderRadius: RADIUS.md,
      borderWidth: 1, borderColor: colors.info, borderStyle: 'dashed',
    },
    saveLocationBtnText: {
      fontSize: FONT_SIZES.small, color: colors.info, fontFamily: FONTS.bodyMed,
    },

    nextPrayerBanner: {
      backgroundColor: COLORS.glassGold, borderRadius: RADIUS.md,
      padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.md,
    },
    nextPrayerLabel: {
      fontSize: FONT_SIZES.caption, color: colors.textMuted, fontFamily: FONTS.bodyMed,
      textTransform: 'uppercase',
    },
    nextPrayerName: {
      fontSize: FONT_SIZES.xl, color: colors.gold, fontFamily: FONTS.display,
      fontWeight: '700', marginVertical: 4,
    },
    nextPrayerCountdown: {
      fontSize: FONT_SIZES.small, color: colors.textSecondary, fontFamily: FONTS.bodyMed,
    },
    prayerRow: {
      flexDirection: 'row', justifyContent: 'space-between',
      paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    prayerRowLast: { borderBottomWidth: 0 },
    prayerName: { fontSize: FONT_SIZES.base, color: colors.textSecondary, fontFamily: FONTS.bodyMed },
    prayerTime: { fontSize: FONT_SIZES.base, color: colors.textPrimary, fontFamily: FONTS.bodySemi },

    qiblaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    qiblaDegrees: {
      fontSize: FONT_SIZES.display, color: colors.gold, fontFamily: FONTS.display,
      fontWeight: '700',
    },
    qiblaLabel: { fontSize: FONT_SIZES.small, color: colors.textSecondary, fontFamily: FONTS.body },

    savedLocationRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    savedLocationInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
    savedLocationText: {
      fontSize: FONT_SIZES.small, color: colors.textPrimary, fontFamily: FONTS.bodyMed,
    },

    modalOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    countrySheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl,
      paddingBottom: SPACING.mega, maxHeight: '75%',
      borderWidth: 1, borderColor: colors.border,
    },
    sheetTitle: {
      fontSize: FONT_SIZES.lg, color: colors.textPrimary,
      fontFamily: FONTS.bodyBold, textAlign: 'center', padding: SPACING.base,
    },
    countryItem: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    countryItemActive: { backgroundColor: COLORS.glassGold },
    countryItemText: {
      fontSize: FONT_SIZES.small, color: colors.textPrimary, fontFamily: FONTS.bodyMed,
    },
    countryItemTextActive: { color: colors.gold, fontFamily: FONTS.bodyBold },
  }));

  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [prayerData, setPrayerData] = useState<PrayerTimesResponse | null>(null);
  const [nextPrayer, setNextPrayer] = useState<NextPrayer | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [qibla, setQibla] = useState<number | null>(null);
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    loadSavedLocations();
    loadDefaultLocation();
  }, []);

  const loadSavedLocations = async () => {
    const locs = await getData<SavedLocation[]>(KEYS.TRAVEL_LOCATIONS, []) || [];
    setSavedLocations(locs);
  };

  const loadDefaultLocation = async () => {
    const loc = await getData<{ city: string; country: string }>(KEYS.PRAYER_LOCATION);
    if (loc) {
      setCity(loc.city);
      setCountry(loc.country);
      fetchPrayerTimes(loc.city, loc.country);
    }
  };

  const fetchPrayerTimes = useCallback(async (c: string, co: string) => {
    if (!c || !co) return;
    setLoading(true);
    try {
      const data = await get<PrayerTimesResponse>(ENDPOINTS.PRAYER_TIMES, { city: c, country: co });
      setPrayerData(data);
      setNextPrayer(getNextPrayer(data.timings));
      setCity(c);
      setCountry(co);
    } catch {
      Alert.alert(isRtl ? 'خطأ' : 'Error', isRtl ? 'فشل في تحميل أوقات الصلاة' : 'Failed to load prayer times');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!prayerData) return;
    const interval = setInterval(() => setNextPrayer(getNextPrayer(prayerData.timings)), 1000);
    return () => clearInterval(interval);
  }, [prayerData]);

  useEffect(() => {
    const lat = prayerData?.meta?.latitude || lastCoords?.lat;
    const lng = prayerData?.meta?.longitude || lastCoords?.lng;
    if (!lat || !lng) return;
    const fetchQibla = async () => {
      try {
        const data = await get<{ direction: number }>(ENDPOINTS.PRAYER_QIBLA, { lat, lng });
        setQibla(data.direction);
      } catch {}
    };
    fetchQibla();
  }, [prayerData?.meta?.latitude, prayerData?.meta?.longitude, lastCoords?.lat, lastCoords?.lng]);

  const detectLocation = async () => {
    setDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          isRtl ? 'الإذن مطلوب' : 'Permission Required',
          isRtl ? 'يجب منح صلاحية الوصول للموقع لتحديد موقعك تلقائياً' : 'Location permission is needed to auto-detect your location'
        );
        setDetecting(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      setLastCoords({ lat: latitude, lng: longitude });
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode.length > 0) {
        const addr = geocode[0];
        const detectedCity = addr.city || addr.subregion || addr.region || '';
        const detectedCountry = addr.country || '';
        if (detectedCity && detectedCountry) {
          setCity(detectedCity);
          setCountry(detectedCountry);
          fetchPrayerTimes(detectedCity, detectedCountry);
        } else {
          fetchByCoords(latitude, longitude);
        }
      } else {
        fetchByCoords(latitude, longitude);
      }
    } catch {
      Alert.alert(
        isRtl ? 'خطأ' : 'Error',
        isRtl ? 'فشل تحديد الموقع. الرجاء المحاولة مرة أخرى أو إدخال الموقع يدوياً' : 'Failed to detect location. Please try again or enter manually.'
      );
    } finally {
      setDetecting(false);
    }
  };

  const fetchByCoords = async (lat: number, lng: number) => {
    setLastCoords({ lat, lng });
    setLoading(true);
    try {
      const data = await get<PrayerTimesResponse>(ENDPOINTS.PRAYER_TIMES_COORDS, { lat, lng });
      setPrayerData(data);
      setNextPrayer(getNextPrayer(data.timings));
      setCity(`${lat.toFixed(2)}, ${lng.toFixed(2)}`);
      setCountry('');
    } catch {
      Alert.alert(isRtl ? 'خطأ' : 'Error', isRtl ? 'فشل في تحميل أوقات الصلاة' : 'Failed to load prayer times');
    } finally {
      setLoading(false);
    }
  };

  const saveAsTravelLocation = async () => {
    if (!city || !country) {
      Alert.alert(isRtl ? 'خطأ' : 'Error', isRtl ? 'الرجاء إدخال المدينة والدولة' : 'Please enter city and country');
      return;
    }
    const newLoc: SavedLocation = {
      id: `${city}_${country}_${Date.now()}`,
      city,
      country,
      label: `${city}, ${country}`,
    };
    const updated = [...savedLocations, newLoc];
    setSavedLocations(updated);
    await storeData(KEYS.TRAVEL_LOCATIONS, updated);
    Alert.alert(isRtl ? 'تم الحفظ' : 'Saved', isRtl ? 'تم حفظ الموقع للسفر' : 'Travel location saved');
  };

  const switchToLocation = (loc: SavedLocation) => {
    setCity(loc.city);
    setCountry(loc.country);
    fetchPrayerTimes(loc.city, loc.country);
  };

  const removeLocation = async (id: string) => {
    const updated = savedLocations.filter(l => l.id !== id);
    setSavedLocations(updated);
    await storeData(KEYS.TRAVEL_LOCATIONS, updated);
  };

  const citiesForCountry = CITY_MAP[country] || [];

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
            <Text style={styles.headerTitle}>{isRtl ? 'دعم السفر' : 'Travel Support'}</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* Current Location Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={12} color={COLORS.gold} />
            <Text style={styles.sectionTitle}>
              {isRtl ? 'الموقع الحالي' : 'Current Location'}
            </Text>
          </View>
          <View style={styles.card}>
            {city && country ? (
              <View style={styles.locationDisplay}>
                <Ionicons name="navigate" size={20} color={COLORS.gold} />
                <View>
                  <Text style={styles.locationCity}>{city}</Text>
                  <Text style={styles.locationCountry}>{country}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.emptyText}>
                {isRtl ? 'لم يتم تحديد موقع' : 'No location set'}
              </Text>
            )}
          </View>
        </View>

        {/* Manual Location Input */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="create" size={12} color={COLORS.gold} />
            <Text style={styles.sectionTitle}>
              {isRtl ? 'تغيير الموقع' : 'Change Location'}
            </Text>
          </View>
          <View style={styles.card}>
            {/* Country Picker */}
            <AnimatedPressable
              style={styles.pickerBtn}
              onPress={() => setShowCountryPicker(true)}
            >
              <Ionicons name="flag" size={16} color={COLORS.gold} />
              <Text style={styles.pickerBtnText}>
                {country || (isRtl ? 'اختر الدولة' : 'Select Country')}
              </Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} />
            </AnimatedPressable>

            {/* City Input */}
            {citiesForCountry.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cityRow}>
                {citiesForCountry.map(c => (
                  <AnimatedPressable
                    key={c}
                    style={[styles.cityChip, city === c && styles.cityChipActive]}
                    onPress={() => setCity(c)}
                  >
                    <Text style={[styles.cityChipText, city === c && styles.cityChipTextActive]}>
                      {c}
                    </Text>
                  </AnimatedPressable>
                ))}
              </ScrollView>
            ) : (
              <TextInput
                style={styles.input}
                placeholder={isRtl ? 'اسم المدينة' : 'City name'}
                placeholderTextColor={COLORS.textMuted}
                value={city}
                onChangeText={setCity}
              />
            )}

            <View style={styles.locationActions}>
              <AnimatedPressable
                style={styles.detectBtn}
                onPress={detectLocation}
                disabled={detecting}
              >
                {detecting ? (
                  <ActivityIndicator size="small" color={COLORS.gold} />
                ) : (
                  <Ionicons name="locate" size={16} color={COLORS.gold} />
                )}
                <Text style={styles.detectBtnText}>
                  {isRtl ? 'كشف موقعي' : 'Detect My Location'}
                </Text>
              </AnimatedPressable>

              <AnimatedPressable
                style={styles.fetchBtn}
                onPress={() => fetchPrayerTimes(city, country)}
                disabled={loading || !city || !country}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.green} />
                ) : (
                  <Text style={styles.fetchBtnText}>
                    {isRtl ? 'عرض الأوقات' : 'Show Times'}
                  </Text>
                )}
              </AnimatedPressable>
            </View>

            <AnimatedPressable style={styles.saveLocationBtn} onPress={saveAsTravelLocation}>
              <Ionicons name="bookmark" size={16} color={COLORS.info} />
              <Text style={styles.saveLocationBtnText}>
                {isRtl ? 'حفظ كموقع سفر' : 'Save as Travel Location'}
              </Text>
            </AnimatedPressable>
          </View>
        </View>

        {/* Prayer Times */}
        {prayerData && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={12} color={COLORS.gold} />
              <Text style={styles.sectionTitle}>
                {isRtl ? 'أوقات الصلاة' : 'Prayer Times'} — {city}
              </Text>
            </View>
            <View style={styles.card}>
              {nextPrayer && (
                <View style={styles.nextPrayerBanner}>
                  <Text style={styles.nextPrayerLabel}>
                    {isRtl ? 'الصلاة القادمة' : 'Next Prayer'}
                  </Text>
                  <Text style={styles.nextPrayerName}>
                    {isRtl ? nextPrayer.arabicName : nextPrayer.name}
                  </Text>
                  <Text style={styles.nextPrayerCountdown}>{nextPrayer.countdown}</Text>
                </View>
              )}
              {PRAYERS_DISPLAY.map((name, idx) => (
                <View
                  key={name}
                  style={[styles.prayerRow, idx === PRAYERS_DISPLAY.length - 1 && styles.prayerRowLast]}
                >
                  <Text style={styles.prayerName}>
                    {isRtl ? PRAYER_AR[name] : name}
                  </Text>
                  <Text style={styles.prayerTime}>
                    {formatTime(prayerData.timings[name])}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Qibla Direction */}
        {qibla !== null && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="compass" size={12} color={COLORS.gold} />
              <Text style={styles.sectionTitle}>
                {isRtl ? 'اتجاه القبلة' : 'Qibla Direction'}
              </Text>
            </View>
            <View style={styles.card}>
              <View style={styles.qiblaRow}>
                <Ionicons name="compass" size={32} color={COLORS.gold} />
                <View>
                  <Text style={styles.qiblaDegrees}>{qibla}°</Text>
                  <Text style={styles.qiblaLabel}>
                    {isRtl ? 'من الشمال الحقيقي' : 'From True North'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Saved Locations */}
        {savedLocations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bookmarks" size={12} color={COLORS.gold} />
              <Text style={styles.sectionTitle}>
                {isRtl ? 'مواقع السفر المحفوظة' : 'Saved Travel Locations'}
              </Text>
            </View>
            <View style={styles.card}>
              {savedLocations.map((loc) => (
                <View key={loc.id} style={styles.savedLocationRow}>
                  <AnimatedPressable
                    style={styles.savedLocationInfo}
                    onPress={() => switchToLocation(loc)}
                  >
                    <Ionicons name="location" size={16} color={COLORS.info} />
                    <Text style={styles.savedLocationText}>
                      {loc.city}, {loc.country}
                    </Text>
                  </AnimatedPressable>
                  <AnimatedPressable onPress={() => removeLocation(loc.id)}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                  </AnimatedPressable>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* Country Picker Modal */}
      {showCountryPicker && (
        <AnimatedPressable
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCountryPicker(false)}
        >
          <View style={styles.countrySheet}>
            <Text style={styles.sheetTitle}>
              {isRtl ? 'اختر الدولة' : 'Select Country'}
            </Text>
            <ScrollView style={{ maxHeight: Math.floor(screenHeight * 0.6) }}>
              {COUNTRY_LIST.map(c => (
                <AnimatedPressable
                  key={c}
                  style={[styles.countryItem, country === c && styles.countryItemActive]}
                  onPress={() => {
                    setCountry(c);
                    setCity('');
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={[styles.countryItemText, country === c && styles.countryItemTextActive]}>
                    {c}
                  </Text>
                  {country === c && <Ionicons name="checkmark" size={18} color={COLORS.gold} />}
                </AnimatedPressable>
              ))}
            </ScrollView>
          </View>
        </AnimatedPressable>
      )}
    </View>
  );
}


