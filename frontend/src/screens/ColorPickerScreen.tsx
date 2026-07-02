import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
  StatusBar, PanResponder, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { GRADIENTS, getThemeColors, getContrastTextColor, getLuminance } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { AnimatedPressable } from '../components/AnimatedComponents';
import LogoDecoration from '../components/LogoDecoration';

const COLOR_CATEGORIES = [
  { key: 'gold', label: 'Gold Accent', defaultColor: '#D4A246', group: 'Brand' },
  { key: 'highlight', label: 'Highlight Color', defaultColor: '#D4AF37', group: 'Brand' },

  { key: 'bg', label: 'Main Background', defaultColor: '#FAF7F2', group: 'Background' },
  { key: 'bgSecondary', label: 'Secondary Background', defaultColor: '#F2EDE1', group: 'Background' },
  { key: 'headerBg', label: 'Header Background', defaultColor: '#0E2B22', group: 'Background' },
  { key: 'tabBar', label: 'Tab Bar', defaultColor: '#FFFFFF', group: 'Background' },

  { key: 'card', label: 'Card Background', defaultColor: '#FFFFFF', group: 'Cards' },
  { key: 'cardWarm', label: 'Warm Card', defaultColor: '#F2EDE1', group: 'Cards' },

  { key: 'textPrimary', label: 'Primary Text', defaultColor: '#0E2B22', group: 'Text' },
  { key: 'textSecondary', label: 'Secondary Text', defaultColor: '#496B4A', group: 'Text' },
  { key: 'textMuted', label: 'Muted Text', defaultColor: '#8A9A8A', group: 'Text' },
  { key: 'ayahText', label: 'Ayah Text', defaultColor: '#0E2B22', group: 'Text' },
  { key: 'surahName', label: 'Surah Name', defaultColor: '#D4A246', group: 'Text' },

  { key: 'buttonPrimary', label: 'Button Color', defaultColor: '#D4A246', group: 'UI' },
  { key: 'buttonText', label: 'Button Text', defaultColor: '#0E2B22', group: 'UI' },
  { key: 'inputBg', label: 'Input Background', defaultColor: '#FFFFFF', group: 'UI' },
  { key: 'inputBorder', label: 'Input Border', defaultColor: '#E8E0D0', group: 'UI' },
  { key: 'iconColor', label: 'Icon Color', defaultColor: '#D4A246', group: 'UI' },
  { key: 'badgeBg', label: 'Badge Background', defaultColor: '#D4A246', group: 'UI' },
  { key: 'divider', label: 'Divider', defaultColor: '#E8E0D0', group: 'UI' },
  { key: 'progressBar', label: 'Progress Bar', defaultColor: '#496B4A', group: 'UI' },

  { key: 'success', label: 'Success', defaultColor: '#496B4A', group: 'Status' },
  { key: 'error', label: 'Error', defaultColor: '#C25A4A', group: 'Status' },
  { key: 'warning', label: 'Warning', defaultColor: '#D4A246', group: 'Status' },
  { key: 'info', label: 'Info', defaultColor: '#5B8A8A', group: 'Status' },
];

const GROUP_ICONS: Record<string, string> = {
  Brand: 'star',
  Background: 'layers',
  Cards: 'grid',
  Text: 'text',
  UI: 'options',
  Status: 'alert-circle',
};

const GROUP_LABELS: Record<string, string> = {
  Brand: 'Brand Colors',
  Background: 'Backgrounds',
  Cards: 'Cards',
  Text: 'Text Colors',
  UI: 'UI Elements',
  Status: 'Status Colors',
};

const THEME_PRESETS = [
  {
    name: 'Classic Gold',
    icon: '👑',
    colors: {
      gold: '#D4A246',
      highlight: '#D4AF37',
      surahName: '#D4A246',
      buttonPrimary: '#D4A246',
      iconColor: '#D4A246',
      badgeBg: '#D4A246',
      bg: '#FAF7F2',
      bgSecondary: '#F2EDE1',
      card: '#FFFFFF',
      textPrimary: '#0E2B22',
      textSecondary: '#496B4A',
      progressBar: '#496B4A',
    },
  },
  {
    name: 'Emerald Green',
    icon: '💚',
    colors: {
      gold: '#2D6A4F',
      highlight: '#40916C',
      surahName: '#2D6A4F',
      buttonPrimary: '#2D6A4F',
      iconColor: '#2D6A4F',
      badgeBg: '#2D6A4F',
      success: '#1B4332',
      bg: '#F0F7F2',
      bgSecondary: '#E0EDE4',
      card: '#FFFFFF',
      textPrimary: '#0E2B22',
      textSecondary: '#2D6A4F',
      progressBar: '#2D6A4F',
      info: '#40916C',
    },
  },
  {
    name: 'Royal Blue',
    icon: '💙',
    colors: {
      gold: '#1B3A6B',
      highlight: '#2A5A9E',
      surahName: '#1B3A6B',
      buttonPrimary: '#1B3A6B',
      iconColor: '#1B3A6B',
      badgeBg: '#1B3A6B',
      info: '#2A5A9E',
      bg: '#F0F4FA',
      bgSecondary: '#E0E8F4',
      card: '#FFFFFF',
      textPrimary: '#0A1A30',
      textSecondary: '#1B3A6B',
      progressBar: '#1B3A6B',
    },
  },
  {
    name: 'Rose Gold',
    icon: '🌹',
    colors: {
      gold: '#C47A8A',
      highlight: '#D492A0',
      surahName: '#C47A8A',
      buttonPrimary: '#C47A8A',
      iconColor: '#C47A8A',
      badgeBg: '#C47A8A',
      bg: '#FAF2F4',
      bgSecondary: '#F4E4E8',
      card: '#FFF8FA',
      textPrimary: '#3A2A2E',
      textSecondary: '#7A5A62',
      error: '#B25A6A',
      progressBar: '#C47A8A',
    },
  },
];

const PRESET_COLORS = [
  '#C7A951', '#D4A017', '#E8B84B', '#8B6914',
  '#129990', '#0F5132', '#1B6B43', '#2D6A4F',
  '#1B2A4A', '#4A6B8B', '#6B2A3A', '#9F4B6B',
  '#9B2226', '#A8654A', '#D4A574', '#5A2D6B',
];

function hsvToHex(h: number, s: number, v: number): string {
  const f = (n: number, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  const r = Math.round(f(5) * 255);
  const g = Math.round(f(3) * 255);
  const b = Math.round(f(1) * 255);
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

function hexToHsv(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  const s = max === 0 ? 0 : d / max;
  return [h, s, max];
}

const HUE_GRADIENT_COLORS: readonly [string, string, ...string[]] = [
  '#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FF0000',
];

function HueSlider({
  hue, onHueChange, width,
}: {
  hue: number; onHueChange: (h: number) => void; width: number;
}) {
  const sliderRef = useRef<View>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const x = evt.nativeEvent.locationX;
        onHueChange(Math.max(0, Math.min(359, (x / width) * 360)));
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        onHueChange(Math.max(0, Math.min(359, (x / width) * 360)));
      },
    })
  ).current;

  return (
    <View style={{ height: 28, borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
      <LinearGradient
        colors={HUE_GRADIENT_COLORS}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        ref={sliderRef}
        style={{ flex: 1 }}
        {...panResponder.panHandlers}
      />
      <View
        style={{
          position: 'absolute', left: (hue / 360) * (width - 20), top: -2,
          width: 24, height: 32, borderRadius: 6, borderWidth: 2, borderColor: '#fff',
          backgroundColor: hsvToHex(hue, 1, 1),
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.4, shadowRadius: 4, elevation: 6,
        }}
      />
    </View>
  );
}

function SatBrightPicker({
  hue, sat, bright, onSatBrightChange, size,
}: {
  hue: number; sat: number; bright: number;
  onSatBrightChange: (s: number, b: number) => void;
  size: number;
}) {
  const baseColor = hsvToHex(hue, 1, 1);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        onSatBrightChange(
          Math.max(0, Math.min(1, locationX / size)),
          Math.max(0, Math.min(1, 1 - locationY / size)),
        );
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        onSatBrightChange(
          Math.max(0, Math.min(1, locationX / size)),
          Math.max(0, Math.min(1, 1 - locationY / size)),
        );
      },
    })
  ).current;

  return (
    <View
      style={{
        width: size, height: size, borderRadius: 12, overflow: 'hidden',
        backgroundColor: baseColor, position: 'relative',
      }}
      {...panResponder.panHandlers}
    >
      <LinearGradient
        colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 12 }]}
      />
      <View
        style={{
          position: 'absolute',
          left: sat * size - 8,
          top: (1 - bright) * size - 8,
          width: 16, height: 16, borderRadius: 8,
          borderWidth: 2, borderColor: '#fff',
          shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.5, shadowRadius: 3, elevation: 5,
        }}
      />
    </View>
  );
}

const PAIRED_TEXT_KEYS: Record<string, string> = {
  bg: 'textPrimary',
  bgSecondary: 'textPrimary',
  card: 'textPrimary',
  cardWarm: 'textPrimary',
  buttonPrimary: 'buttonText',
  badgeBg: 'badgeText',
  tabBar: 'tabBarActive',
  headerBg: 'surahName',
  inputBg: 'textPrimary',
  progressBar: 'badgeText',
};

const GROUP_ORDER = ['Brand', 'Background', 'Cards', 'Text', 'UI', 'Status'];

export default function ColorPickerScreen() {
  const navigation = useNavigation<any>();
  const { customColors, setCustomColors, theme, activeColors } = useApp();

  const [localColors, setLocalColors] = useState<Record<string, string>>({});
  const [showPicker, setShowPicker] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Brand: true, Background: true, Cards: true,
    Text: true, UI: true, Status: true,
  });
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const [hue, setHue] = useState(45);
  const [sat, setSat] = useState(0.8);
  const [bright, setBright] = useState(0.8);

  const { width: screenWidth } = useWindowDimensions();
  const pickerSize = Math.min(screenWidth - 64, 300);

  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { padding: 16, paddingBottom: 12 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, color: colors.textPrimary, fontWeight: '700' },
    body: { flex: 1, padding: 16 },
    sectionTitle: { fontSize: 15, color: colors.textPrimary, fontWeight: '700', marginBottom: 2 },
    sectionSub: { fontSize: 12, color: colors.textMuted, marginBottom: 12 },
    dividerLine: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
    presetsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    presetCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 10,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minWidth: '47%',
      flex: 1,
      position: 'relative',
    },
    presetCardActive: {
      borderColor: '#D4A246',
      backgroundColor: 'rgba(212,162,70,0.06)',
    },
    presetIcon: { fontSize: 16 },
    presetName: { fontSize: 12, color: colors.textPrimary, fontWeight: '600' },
    presetNameActive: { color: '#D4A246' },
    presetCheck: { position: 'absolute', top: 4, right: 4 },
    groupContainer: { marginBottom: 8 },
    groupHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.card, borderRadius: 10, padding: 10,
      marginBottom: 6, borderWidth: 1, borderColor: colors.border,
    },
    groupHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
    groupIcon: { marginRight: 8 },
    groupTitle: { fontSize: 13, color: colors.textPrimary, fontWeight: '700' },
    colorRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.card, borderRadius: 12, padding: 12,
      marginBottom: 6, borderWidth: 1, borderColor: colors.border,
    },
    swatch: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
    colorInfo: { flex: 1, marginLeft: 12 },
    colorLabel: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
    colorHex: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
    swatchRight: { marginLeft: 8 },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 20 },
    saveBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      backgroundColor: colors.gold, borderRadius: 12, paddingVertical: 12,
    },
    saveBtnText: { color: colors.green, fontWeight: '700', fontSize: 14 },
    resetBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      backgroundColor: colors.card, borderRadius: 12, paddingVertical: 12,
      borderWidth: 1, borderColor: colors.border,
    },
    resetBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 13 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    pickerSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, paddingBottom: 40,
    },
    pickerHandle: { width: 40, height: 4, backgroundColor: colors.textMuted, borderRadius: 2, alignSelf: 'center', marginTop: -8, marginBottom: 12 },
    pickerTitle: { fontSize: 17, color: colors.textPrimary, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
    previewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 },
    previewSwatch: { width: 48, height: 48, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
    previewHex: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
    sectionLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
    presetDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
    presetDotActive: { borderWidth: 2, borderColor: colors.textPrimary },
    sbContainer: { alignItems: 'center', marginBottom: 16 },
    pickerActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
    pickerCancel: {
      flex: 1, paddingVertical: 12, borderRadius: 10,
      borderWidth: 1, borderColor: colors.border, alignItems: 'center',
    },
    pickerCancelText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
    pickerApply: {
      flex: 1, paddingVertical: 12, borderRadius: 10,
      backgroundColor: colors.gold, alignItems: 'center',
    },
    pickerApplyText: { color: colors.green, fontSize: 14, fontWeight: '700' },
    previewCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      marginTop: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    previewTitle: { fontSize: 13, color: colors.textMuted, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
    previewBox: { borderRadius: 10, padding: 12, borderWidth: 1, overflow: 'hidden' },
    previewAccent: { borderRadius: 6, padding: 8, marginBottom: 10, alignItems: 'center' },
    previewAccentText: { fontSize: 14, fontWeight: '600' },
    previewAyah: { fontSize: 18, textAlign: 'center', lineHeight: 36, marginBottom: 6 },
    previewTranslation: { fontSize: 11, textAlign: 'center', lineHeight: 16, marginBottom: 8, fontStyle: 'italic' },
    previewDivider: { height: 1, marginVertical: 8 },
    previewBadgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    previewBadge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
    previewBadgeText: { fontSize: 10, fontWeight: '700' },
    previewMeta: { fontSize: 11, fontWeight: '500' },
    colorRowEnd: { alignItems: 'flex-end', gap: 2 },
    contrastBadge: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    contrastGood: { color: '#34A853' },
    contrastPoor: { color: '#EA4335' },
    contrastSwatch: {
      width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
      justifyContent: 'center', alignItems: 'center',
    },
    contrastSwatchText: { fontSize: 10, fontWeight: '800' },
    autoBadge: {
      fontSize: 10, backgroundColor: 'rgba(212,162,70,0.12)', color: '#D4A246',
      borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1, overflow: 'hidden',
      fontWeight: '600', letterSpacing: 0.3,
    },
  }));

  useEffect(() => {
    const initial: Record<string, string> = {};
    COLOR_CATEGORIES.forEach(c => {
      initial[c.key] = customColors?.[c.key] || c.defaultColor;
    });
    setLocalColors(initial);
  }, [customColors]);

  const openPicker = (key: string) => {
    setEditingKey(key);
    const currentColor = localColors[key] || activeColors.gold;
    const [h, s, v] = hexToHsv(currentColor);
    setHue(h);
    setSat(s);
    setBright(v);
    setShowPicker(true);
  };

  const pickerColor = hsvToHex(hue, sat, bright);

  const applyColor = () => {
    if (!editingKey) return;
    setLocalColors(prev => ({ ...prev, [editingKey]: pickerColor }));
    setShowPicker(false);
    setEditingKey(null);
  };

  const saveAll = async () => {
    const diff: Record<string, string> = {};
    COLOR_CATEGORIES.forEach(cat => {
      if (localColors[cat.key] !== cat.defaultColor) {
        diff[cat.key] = localColors[cat.key];
      }
    });
    await setCustomColors(Object.keys(diff).length > 0 ? diff : null);
    navigation.goBack();
  };

  const resetAll = async () => {
    const defaults: Record<string, string> = {};
    COLOR_CATEGORIES.forEach(c => { defaults[c.key] = c.defaultColor; });
    setLocalColors(defaults);
    setSelectedPreset(null);
    await setCustomColors(null);
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const applyPreset = (preset: typeof THEME_PRESETS[0]) => {
    setLocalColors(prev => ({ ...prev, ...preset.colors } as unknown as Record<string, string>));
    setSelectedPreset(preset.name);
  };

  const groupedCategories = GROUP_ORDER.map(group => ({
    group,
    items: COLOR_CATEGORIES.filter(c => c.group === group),
  }));

  const previewCustom = Object.fromEntries(
    Object.entries(localColors).filter(([key, val]) => {
      const cat = COLOR_CATEGORIES.find(c => c.key === key);
      return cat && val !== cat.defaultColor;
    })
  );
  const previewColors = getThemeColors(theme, Object.keys(previewCustom).length > 0 ? previewCustom : null);

  return (
    <SafeAreaView style={styles.container}>
      <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={GRADIENTS.brand} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={activeColors.gold} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Custom Theme</Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Theme Presets */}
        <Text style={styles.sectionTitle}>Theme Presets</Text>
        <Text style={styles.sectionSub}>Apply a complete preset theme</Text>
        <View style={styles.presetsRow}>
          {THEME_PRESETS.map(preset => (
            <TouchableOpacity
              key={preset.name}
              style={[
                styles.presetCard,
                selectedPreset === preset.name && styles.presetCardActive,
              ]}
              onPress={() => applyPreset(preset)}
            >
              <Text style={styles.presetIcon}>{preset.icon}</Text>
              <Text style={[
                styles.presetName,
                selectedPreset === preset.name && styles.presetNameActive,
              ]}>{preset.name}</Text>
              {selectedPreset === preset.name && (
                <Ionicons name="checkmark-circle" size={14} color="#D4A246" style={styles.presetCheck} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dividerLine} />

        {/* Color Categories */}
        <Text style={styles.sectionTitle}>Color Categories</Text>
        <Text style={styles.sectionSub}>Tap a color to customize it</Text>

        {groupedCategories.map(({ group, items }) => (
          <View key={group} style={styles.groupContainer}>
            <TouchableOpacity
              style={styles.groupHeader}
              onPress={() => toggleGroup(group)}
              activeOpacity={0.7}
            >
              <View style={styles.groupHeaderLeft}>
                <Ionicons
                  name={GROUP_ICONS[group] as any}
                  size={14}
                  color={activeColors.gold}
                  style={styles.groupIcon}
                />
                <Text style={styles.groupTitle}>{GROUP_LABELS[group]}</Text>
              </View>
              <Ionicons
                name={expandedGroups[group] ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={activeColors.textMuted}
              />
            </TouchableOpacity>
            {expandedGroups[group] && items.map(cat => {
              const currentColor = localColors[cat.key] || cat.defaultColor;
              const pairedTextKey = PAIRED_TEXT_KEYS[cat.key];
              const pairedTextColor = pairedTextKey ? localColors[pairedTextKey] : null;
              const autoContrastColor = pairedTextKey ? getContrastTextColor(currentColor, '#1C1C1E', '#FFFFFF') : null;
              const luminance = getLuminance(currentColor);
              const hasGoodContrast = pairedTextColor ? Math.abs(getLuminance(pairedTextColor) - luminance) > 0.4 : true;
              return (
                <AnimatedPressable
                  key={cat.key}
                  style={styles.colorRow}
                  onPress={() => openPicker(cat.key)}
                >
                  <View style={[styles.swatch, { backgroundColor: currentColor }]} />
                  <View style={styles.colorInfo}>
                    <Text style={styles.colorLabel}>{cat.label}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={styles.colorHex}>{currentColor.toUpperCase()}</Text>
                      {pairedTextKey && autoContrastColor && (
                        <Text style={styles.autoBadge}>AUTO</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.colorRowEnd}>
                    {pairedTextKey && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View style={[styles.contrastSwatch, { backgroundColor: autoContrastColor || pairedTextColor || '#1C1C1E' }]}>
                          <Text style={[styles.contrastSwatchText, { color: getContrastTextColor(autoContrastColor || pairedTextColor || '#1C1C1E') }]}>T</Text>
                        </View>
                        <Text style={[styles.contrastBadge, hasGoodContrast ? styles.contrastGood : styles.contrastPoor]}>
                          {hasGoodContrast ? 'AA' : '!AA'}
                        </Text>
                      </View>
                    )}
                    <Ionicons name="color-palette" size={14} color={activeColors.gold} />
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>
        ))}

        {/* Live preview card */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Preview</Text>
          <View style={[styles.previewBox, { backgroundColor: previewColors.card, borderColor: previewColors.border }]}>
            <View style={[styles.previewAccent, { backgroundColor: previewColors.gold }]}>
              <Text style={[styles.previewAccentText, { color: previewColors.textInverse }]}>سورة الفاتحة</Text>
            </View>
            <Text style={[styles.previewAyah, { color: previewColors.ayahText || previewColors.textPrimary }]}>
              بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِيمِ
            </Text>
            <Text style={[styles.previewTranslation, { color: previewColors.textMuted }]}>
              In the name of Allah, the Most Gracious, the Most Merciful
            </Text>
            <View style={[styles.previewDivider, { backgroundColor: previewColors.divider || previewColors.border }]} />
            <View style={styles.previewBadgeRow}>
              <View style={[styles.previewBadge, { backgroundColor: previewColors.gold }]}>
                <Text style={[styles.previewBadgeText, { color: previewColors.badgeText }]}>الفاتحة</Text>
              </View>
              <Text style={[styles.previewMeta, { color: previewColors.textSecondary }]}>1:1</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <AnimatedPressable style={styles.saveBtn} onPress={saveAll}>
            <Ionicons name="checkmark-circle" size={18} color={activeColors.green} />
            <Text style={styles.saveBtnText}>Apply Theme</Text>
          </AnimatedPressable>
          <AnimatedPressable style={styles.resetBtn} onPress={resetAll}>
            <Ionicons name="refresh" size={18} color={activeColors.textSecondary} />
            <Text style={styles.resetBtnText}>Reset to Default</Text>
          </AnimatedPressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>Choose Color</Text>

            <View style={styles.previewRow}>
              <View style={[styles.previewSwatch, { backgroundColor: pickerColor }]} />
              <Text style={styles.previewHex}>{pickerColor.toUpperCase()}</Text>
            </View>

            <Text style={styles.sectionLabel}>Presets</Text>
            <View style={styles.presetsRow}>
              {PRESET_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.presetDot,
                    { backgroundColor: color },
                    pickerColor.toUpperCase() === color && styles.presetDotActive,
                  ]}
                  onPress={() => {
                    const [h, s, v] = hexToHsv(color);
                    setHue(h); setSat(s); setBright(v);
                  }}
                />
              ))}
            </View>

            <Text style={styles.sectionLabel}>Hue</Text>
            <HueSlider hue={hue} onHueChange={setHue} width={screenWidth - 64} />

            <Text style={[styles.sectionLabel, { marginTop: 12 }]}>Saturation & Brightness</Text>
            <View style={styles.sbContainer}>
              <SatBrightPicker
                hue={hue}
                sat={sat}
                bright={bright}
                onSatBrightChange={(s, b) => { setSat(s); setBright(b); }}
                size={pickerSize}
              />
            </View>

            <View style={styles.pickerActions}>
              <TouchableOpacity style={styles.pickerCancel} onPress={() => { setShowPicker(false); setEditingKey(null); }}>
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickerApply} onPress={applyColor}>
                <Text style={styles.pickerApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


