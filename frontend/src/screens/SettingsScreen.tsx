import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, StatusBar, Modal, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { GRADIENTS, SHADOWS, getThemeColors } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { AnimatedPressable, SlideUp } from '../components/AnimatedComponents';
import { FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';
import { PRAYER_METHODS } from '../constants/api';
import LogoDecoration from '../components/LogoDecoration';

const ALL_METHODS = Object.entries(PRAYER_METHODS).map(([id, name]) => ({ id: Number(id), name }));
const FONT_SIZES_OPTS = [18, 20, 22, 24, 26, 28, 32];

const THEMES = [
  { id: 'dark',  labelAr: 'داكن',   labelEn: 'Dark',   icon: 'moon' as const,    preview: '#0A1C14' },
  { id: 'light', labelAr: 'فاتح',   labelEn: 'Light',  icon: 'sunny' as const,   preview: '#F7F3E6' },
  { id: 'amoled',labelAr: 'أموليد', labelEn: 'AMOLED', icon: 'contrast' as const, preview: '#000000' },
];

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { user, updateSettings, reciters, selectedReciter, setSelectedReciter, t, language, theme, setTheme, toggleLanguage, customColors, activeColors } = useApp();
  const [showMethodPicker,  setShowMethodPicker]  = useState(false);
  const [showReciterPicker, setShowReciterPicker] = useState(false);
  const isRtl = language === 'ar';

  const styles = useThemedStyles((colors) => ({
    container:  {     flex: 1, backgroundColor: colors.bg },
    center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText:{ color: colors.textSecondary, fontFamily: FONTS.body },

    header:    { padding: SPACING.base, paddingBottom: SPACING.md, borderBottomLeftRadius: RADIUS.xxl, borderBottomRightRadius: RADIUS.xxl, overflow: 'hidden' },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: {
      width:          38,
      height:         38,
      borderRadius:   RADIUS.round,
      backgroundColor: colors.glassDark,
      alignItems:     'center',
      justifyContent: 'center',
    },
    headerTitle: { fontSize: FONT_SIZES.lg, color: colors.textPrimary, fontFamily: FONTS.bodyBold },

    scroll: { flex: 1 },

    section: { paddingHorizontal: SPACING.base, marginBottom: SPACING.base },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.sm, marginLeft: SPACING.xs },
    sectionTitle: { fontSize: FONT_SIZES.caption, color: colors.gold, fontFamily: FONTS.bodyBold, textTransform: 'uppercase', letterSpacing: 1.2 },
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius:    RADIUS.xxl,
      overflow:        'hidden',
      borderWidth:     1,
      borderColor:     colors.border,
    },
    settingRow: {
      flexDirection:  'row',
      alignItems:     'center',
      justifyContent: 'space-between',
      padding:        SPACING.base,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingLeft:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, flex: 1 },
    settingRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
    settingIconWrap: { width: 32, height: 32, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
    settingLabel: { fontSize: FONT_SIZES.small, color: colors.textSecondary, fontFamily: FONTS.bodyMed },
    settingValue: { fontSize: FONT_SIZES.small, color: colors.textPrimary, fontFamily: FONTS.bodySemi, maxWidth: 160 },

    themeRow:    { flexDirection: 'row', gap: SPACING.sm, paddingLeft: 48, marginBottom: SPACING.sm },
    themeOption: { flex: 1, alignItems: 'center', gap: SPACING.xs, padding: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.border },
    themeOptionActive: { borderColor: colors.gold },
    themePreview: { width: 32, height: 32, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    themeLabel:  { fontSize: FONT_SIZES.caption, color: colors.textMuted, fontFamily: FONTS.body },
    themeLabelActive: { color: colors.gold },

    fontRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, paddingLeft: 48 },
    fontOption:  { width: 44, height: 40, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glassDark },
    fontOptionActive: { backgroundColor: colors.gold, borderColor: colors.gold },
    fontOptionText: { fontSize: FONT_SIZES.caption, color: colors.textPrimary, fontFamily: FONTS.bodySemi },
    fontOptionTextActive: { color: colors.darkGreen },

    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalDismiss: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
    sheet: {
      backgroundColor:  colors.card,
      borderTopLeftRadius: RADIUS.xxl,
      borderTopRightRadius: RADIUS.xxl,
      paddingBottom:    SPACING.mega,
      maxHeight:        '75%',
      borderWidth:      1,
      borderColor:      colors.border,
    },
    sheetHandle: { width: 40, height: 4, backgroundColor: colors.textMuted, borderRadius: 2, alignSelf: 'center', marginTop: SPACING.md },
    sheetTitle:  { fontSize: FONT_SIZES.lg, color: colors.textPrimary, fontFamily: FONTS.bodyBold, textAlign: 'center', padding: SPACING.base },
    sheetClose: { position: 'absolute', top: SPACING.md, right: SPACING.base },

    pickerItem: {
      flexDirection:  'row',
      justifyContent: 'space-between',
      alignItems:     'center',
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.xl,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerItemActive: { backgroundColor: colors.glassGold },
    pickerItemText: { fontSize: FONT_SIZES.small, color: colors.textPrimary, fontFamily: FONTS.bodyMed, flex: 1 },
    themePreviewCard: {
      marginLeft: 48, marginTop: 8, borderRadius: RADIUS.md, padding: SPACING.md,
      borderWidth: 1, overflow: 'hidden', ...SHADOWS.soft,
    },
    themePreviewAccent: { borderRadius: 6, padding: 6, marginBottom: 8, alignItems: 'center' },
    themePreviewTitle: { fontSize: 12, fontWeight: '600' },
    themePreviewAyah: { fontSize: 15, textAlign: 'center', lineHeight: 28, marginBottom: 4 },
    themePreviewTrans: { fontSize: 10, textAlign: 'center', fontStyle: 'italic', marginBottom: 6, lineHeight: 14 },
    themePreviewDivider: { height: 1, marginVertical: 6 },
    themePreviewMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    themePreviewBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
    themePreviewBadgeText: { fontSize: 11, fontWeight: '700' },
    themePreviewSecondary: { fontSize: 10, fontWeight: '500' },
  }));

  const settings = user?.settings;

  if (!settings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedReciterName = reciters.find((r: any) => r.id === selectedReciter)?.name || selectedReciter;
  const selectedMethodName  = ALL_METHODS.find(m => m.id === (settings.prayerMethod || 5))?.name || 'Egyptian';

  return (
    <SafeAreaView style={styles.container}>
      <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={GRADIENTS.brand} style={styles.header}>
        <LogoDecoration size={200} opacity={0.04} position="top-right" />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name={isRtl ? 'chevron-forward' : 'chevron-back'} size={22} color={activeColors.gold} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('settings.title')}</Text>
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>

        {/* Appearance */}
        <SlideUp><SettingSection styles={styles} colors={activeColors} title={isRtl ? 'المظهر' : 'Appearance'} icon="color-palette">
          {/* Language */}
          <AnimatedPressable style={styles.settingRow} onPress={toggleLanguage}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: `${activeColors.info}18` }]}>
                <Ionicons name="language" size={16} color={activeColors.info} />
              </View>
              <Text style={styles.settingLabel}>{isRtl ? 'اللغة' : 'Language'}</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>{isRtl ? 'العربية' : 'English'}</Text>
              <Ionicons name={isRtl ? 'chevron-back' : 'chevron-forward'} size={14} color={activeColors.textMuted} />
            </View>
          </AnimatedPressable>

          {/* Theme */}
          <View style={[styles.settingRow, { flexDirection: 'column', alignItems: 'flex-start', gap: SPACING.md }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: `${activeColors.gold}18` }]}>
                <Ionicons name="moon" size={16} color={activeColors.gold} />
              </View>
              <Text style={styles.settingLabel}>{isRtl ? 'السمة' : 'Theme'}</Text>
            </View>
            <View style={styles.themeRow}>
              {THEMES.map(th => (
                <AnimatedPressable
                  key={th.id}
                  style={[styles.themeOption, theme === th.id && styles.themeOptionActive]}
                  onPress={() => setTheme(th.id as any)}
                >
                  <View style={[styles.themePreview, { backgroundColor: th.preview }]}>
                    {theme === th.id && (
                      <Ionicons name="checkmark" size={12} color={activeColors.gold} />
                    )}
                  </View>
                  <Text style={[styles.themeLabel, theme === th.id && styles.themeLabelActive]}>
                    {isRtl ? th.labelAr : th.labelEn}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>
            {/* Live theme preview */}
            {(() => {
              const preview = getThemeColors(theme, customColors);
              return (
                <View style={[styles.themePreviewCard, { backgroundColor: preview.card, borderColor: preview.border }]}>
                  <View style={[styles.themePreviewAccent, { backgroundColor: preview.gold }]}>
                    <Text style={[styles.themePreviewTitle, { color: preview.textInverse }]}>الفاتحة</Text>
                  </View>
                  <Text style={[styles.themePreviewAyah, { color: preview.textPrimary }]}>
                    الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ
                  </Text>
                  <Text style={[styles.themePreviewTrans, { color: preview.textMuted }]}>
                    All praise is due to Allah, Lord of the worlds
                  </Text>
                  <View style={[styles.themePreviewDivider, { backgroundColor: preview.border }]} />
                  <View style={styles.themePreviewMeta}>
                    <View style={[styles.themePreviewBadge, { backgroundColor: preview.gold }]}>
                      <Text style={[styles.themePreviewBadgeText, { color: preview.badgeText }]}>1:2</Text>
                    </View>
                    <Text style={[styles.themePreviewSecondary, { color: preview.textSecondary }]}>Juz 1</Text>
                  </View>
                </View>
              );
            })()}
          </View>

          {/* Custom Colors */}
          <AnimatedPressable
            style={styles.settingRow}
            onPress={() => navigation.navigate('ColorPicker')}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: `${activeColors.gold}18` }]}>
                <Ionicons name="color-palette" size={16} color={activeColors.gold} />
              </View>
              <Text style={styles.settingLabel}>{isRtl ? 'تخصيص الألوان' : 'Customize Colors'}</Text>
            </View>
            <View style={styles.settingRight}>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {customColors ? Object.entries(customColors).slice(0, 4).map(([k, v]) => (
                  <View key={k} style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: v, borderWidth: 1, borderColor: activeColors.border }} />
                )) : (
                  <Text style={[styles.settingValue, { fontSize: 12 }]}>Default</Text>
                )}
              </View>
              <Ionicons name={isRtl ? 'chevron-back' : 'chevron-forward'} size={14} color={activeColors.textMuted} />
            </View>
          </AnimatedPressable>
        </SettingSection></SlideUp>

        {/* Appearance - Animation Speed */}
        <SlideUp delay={80}><SettingSection styles={styles} colors={activeColors} title={isRtl ? 'الحركة' : 'Animation'} icon="flash">
          <View style={[styles.settingRow, { flexDirection: 'column', alignItems: 'flex-start', gap: SPACING.md }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: `${activeColors.info}18` }]}>
                <Ionicons name="speedometer" size={16} color={activeColors.info} />
              </View>
              <Text style={styles.settingLabel}>{isRtl ? 'سرعة الحركة' : 'Animation Speed'}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
              {(['slow', 'normal', 'fast'] as const).map(speed => (
                <TouchableOpacity
                  key={speed}
                  onPress={() => updateSettings({ animationSpeed: speed })}
                  style={{
                    flex: 1, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md,
                    borderRadius: RADIUS.sm, borderWidth: 1,
                    borderColor: (settings.animationSpeed || 'normal') === speed ? activeColors.gold : activeColors.border,
                    backgroundColor: (settings.animationSpeed || 'normal') === speed ? activeColors.glassGold : activeColors.glassDark,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    fontSize: FONT_SIZES.caption, fontWeight: '600',
                    color: (settings.animationSpeed || 'normal') === speed ? activeColors.gold : activeColors.textSecondary,
                    fontFamily: FONTS.bodySemi,
                    textTransform: 'capitalize',
                  }}>
                    {speed === 'slow' ? (isRtl ? 'بطيء' : 'Slow') : speed === 'normal' ? (isRtl ? 'عادي' : 'Normal') : (isRtl ? 'سريع' : 'Fast')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SettingSection></SlideUp>

        {/* Quran */}
        <SlideUp delay={160}><SettingSection styles={styles} colors={activeColors} title={isRtl ? 'القرآن الكريم' : 'Quran'} icon="book">
          <AnimatedPressable style={styles.settingRow} onPress={() => setShowReciterPicker(true)}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: `${activeColors.gold}18` }]}>
                <Ionicons name="mic" size={16} color={activeColors.gold} />
              </View>
              <Text style={styles.settingLabel}>{isRtl ? 'القارئ' : 'Reciter'}</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue} numberOfLines={1}>{selectedReciterName}</Text>
              <Ionicons name={isRtl ? 'chevron-back' : 'chevron-forward'} size={14} color={activeColors.textMuted} />
            </View>
          </AnimatedPressable>

          {/* Font Size */}
          <View style={[styles.settingRow, { flexDirection: 'column', alignItems: 'flex-start', gap: SPACING.md }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: `${activeColors.gold}18` }]}>
                <Ionicons name="text" size={16} color={activeColors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>{isRtl ? 'حجم الخط' : 'Font Size'}</Text>
                <Text style={[styles.settingValue, { fontSize: 12, marginTop: 2 }]}>
                  {settings.fontSize || 22}px
                </Text>
              </View>
            </View>
            <View style={styles.fontRow}>
              {FONT_SIZES_OPTS.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.fontOption, (settings.fontSize || 22) === s && styles.fontOptionActive]}
                  onPress={() => updateSettings({ fontSize: s })}
                >
                  <Text style={[styles.fontOptionText, (settings.fontSize || 22) === s && styles.fontOptionTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.settingValue, { fontSize: 11, marginTop: SPACING.sm }]}>
              {isRtl ? 'معاينة: الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ' : 'Preview: In the name of Allah...'}
            </Text>
          </View>

          {/* Translation Font Size */}
          <View style={[styles.settingRow, { flexDirection: 'column', alignItems: 'flex-start', gap: SPACING.md }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: `${activeColors.info}18` }]}>
                <Ionicons name="document-text" size={16} color={activeColors.info} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>{isRtl ? 'حجم خط الترجمة' : 'Translation Font Size'}</Text>
                <Text style={[styles.settingValue, { fontSize: 12, marginTop: 2 }]}>
                  {settings.fontSizeTranslation || 14}px
                </Text>
              </View>
            </View>
            <View style={styles.fontRow}>
              {[10, 12, 14, 16, 18, 20, 22].map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.fontOption, (settings.fontSizeTranslation || 14) === s && styles.fontOptionActive]}
                  onPress={() => updateSettings({ fontSizeTranslation: s })}
                >
                  <Text style={[styles.fontOptionText, (settings.fontSizeTranslation || 14) === s && styles.fontOptionTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SettingSection></SlideUp>

        {/* Prayer */}
        <SlideUp delay={240}><SettingSection styles={styles} colors={activeColors} title={isRtl ? 'الصلاة' : 'Prayer'} icon="time">
          <TouchableOpacity style={styles.settingRow} onPress={() => setShowMethodPicker(true)} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: `${activeColors.info}18` }]}>
                <Ionicons name="calculator" size={16} color={activeColors.info} />
              </View>
              <Text style={styles.settingLabel}>{isRtl ? 'طريقة الحساب' : 'Calculation Method'}</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue} numberOfLines={1}>{selectedMethodName}</Text>
              <Ionicons name={isRtl ? 'chevron-back' : 'chevron-forward'} size={14} color={activeColors.textMuted} />
            </View>
          </TouchableOpacity>

          <SwitchRow styles={styles} colors={activeColors}
            label={isRtl ? 'إشعارات الصلاة' : 'Prayer Notifications'}
            icon="notifications"
            value={settings.prayerNotifs ?? true}
            onChange={v => updateSettings({ prayerNotifs: v })}
          />
        </SettingSection></SlideUp>

        {/* Travel */}
        <SlideUp delay={320}><SettingSection styles={styles} colors={activeColors} title={isRtl ? 'السفر' : 'Travel'} icon="airplane">
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('TravelSupport')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: `${activeColors.info}18` }]}>
                <Ionicons name="airplane" size={16} color={activeColors.info} />
              </View>
              <Text style={styles.settingLabel}>{isRtl ? 'وضع السفر' : 'Travel Mode'}</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue} numberOfLines={1}>
                {isRtl ? 'تغيير الموقع وأوقات الصلاة' : 'Change location & prayer times'}
              </Text>
              <Ionicons name={isRtl ? 'chevron-back' : 'chevron-forward'} size={14} color={activeColors.textMuted} />
            </View>
          </TouchableOpacity>
        </SettingSection></SlideUp>

        {/* Adhan Voice */}
        <SlideUp delay={400}><SettingSection styles={styles} colors={activeColors} title={isRtl ? 'الأذان' : 'Adhan'} icon="musical-notes">
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('AdhanCustomization')}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: `${activeColors.gold}18` }]}>
                <Ionicons name="musical-notes" size={16} color={activeColors.gold} />
              </View>
              <Text style={styles.settingLabel}>{isRtl ? 'صوت الأذان' : 'Adhan Voice'}</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue} numberOfLines={1}>
                {settings.adhanVoice === 'default'
                  ? (isRtl ? 'النظام' : 'Default')
                  : settings.adhanVoice || (isRtl ? 'النظام' : 'Default')}
              </Text>
              <Ionicons name={isRtl ? 'chevron-back' : 'chevron-forward'} size={14} color={activeColors.textMuted} />
            </View>
          </TouchableOpacity>
        </SettingSection></SlideUp>

        {/* Azkar */}
        <SlideUp delay={480}><SettingSection styles={styles} colors={activeColors} title={isRtl ? 'الأذكار' : 'Azkar'} icon="sparkles">
          <SwitchRow styles={styles} colors={activeColors}
            label={isRtl ? 'أذكار الصباح' : 'Morning Azkar'}
            icon="sunny"
            value={settings.morningAzkarNotifs ?? true}
            onChange={v => updateSettings({ morningAzkarNotifs: v })}
          />
          <SwitchRow styles={styles} colors={activeColors}
            label={isRtl ? 'أذكار المساء' : 'Evening Azkar'}
            icon="moon"
            value={settings.eveningAzkarNotifs ?? true}
            onChange={v => updateSettings({ eveningAzkarNotifs: v })}
          />
          <SwitchRow styles={styles} colors={activeColors}
            label={isRtl ? 'تذكير الجمعة' : 'Friday Reminder'}
            icon="calendar"
            value={settings.fridayReminderNotifs ?? true}
            onChange={v => updateSettings({ fridayReminderNotifs: v })}
          />
        </SettingSection></SlideUp>

        {/* About */}
        <SlideUp delay={560}><SettingSection styles={styles} colors={activeColors} title={isRtl ? 'حول التطبيق' : 'About'} icon="information-circle">
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: `${activeColors.gold}18` }]}>
                <Ionicons name="code-slash" size={16} color={activeColors.gold} />
              </View>
              <Text style={styles.settingLabel}>{isRtl ? 'الإصدار' : 'Version'}</Text>
            </View>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: `${activeColors.gold}18` }]}>
                <Ionicons name="people" size={16} color={activeColors.gold} />
              </View>
              <Text style={styles.settingLabel}>{isRtl ? 'المطورون' : 'Developer'}</Text>
            </View>
            <Text style={styles.settingValue}>Aiqan Team</Text>
          </View>
        </SettingSection></SlideUp>

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* Reciter Picker */}
      <BottomSheet styles={styles} colors={activeColors}
        visible={showReciterPicker}
        title={isRtl ? 'اختر القارئ' : 'Select Reciter'}
        onClose={() => setShowReciterPicker(false)}
      >
        {reciters.map((r: any) => (
          <TouchableOpacity
            key={r.id}
            style={[styles.pickerItem, selectedReciter === r.id && styles.pickerItemActive]}
            onPress={() => { setSelectedReciter(r.id); updateSettings({ defaultReciter: r.id }); setShowReciterPicker(false); }}
          >
            <Text style={styles.pickerItemText}>{r.name}</Text>
            {selectedReciter === r.id && <Ionicons name="checkmark" size={18} color={activeColors.gold} />}
          </TouchableOpacity>
        ))}
      </BottomSheet>

      {/* Method Picker */}
      <BottomSheet styles={styles} colors={activeColors}
        visible={showMethodPicker}
        title={isRtl ? 'طريقة الحساب' : 'Calculation Method'}
        onClose={() => setShowMethodPicker(false)}
      >
        {ALL_METHODS.map(m => (
          <TouchableOpacity
            key={m.id}
            style={[styles.pickerItem, (settings.prayerMethod || 5) === m.id && styles.pickerItemActive]}
            onPress={() => { updateSettings({ prayerMethod: m.id }); setShowMethodPicker(false); }}
          >
            <Text style={styles.pickerItemText}>{m.name}</Text>
            {(settings.prayerMethod || 5) === m.id && <Ionicons name="checkmark" size={18} color={activeColors.gold} />}
          </TouchableOpacity>
        ))}
      </BottomSheet>
    </SafeAreaView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
type IoniconName = keyof typeof Ionicons.glyphMap;

function SettingSection({ title, icon, children, styles, colors }: { title: string; icon: IoniconName; children: React.ReactNode; styles: any; colors: Record<string, string> }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={12} color={colors.gold} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionCard}>
        {children}
      </View>
    </View>
  );
}

function SwitchRow({ label, icon, value, onChange, styles, colors }: { label: string; icon: IoniconName; value: boolean; onChange: (v: boolean) => void; styles: any; colors: Record<string, string> }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <View style={[styles.settingIconWrap, { backgroundColor: `${colors.gold}18` }]}>
          <Ionicons name={icon} size={16} color={colors.gold} />
        </View>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.gold }}
        thumbColor={value ? colors.darkGreen : colors.textMuted}
      />
    </View>
  );
}

function BottomSheet({ visible, title, onClose, children, styles, colors }: { visible: boolean; title: string; onClose: () => void; children: React.ReactNode; styles: any; colors: Record<string, string> }) {
  const { height: screenHeight } = useWindowDimensions();
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalDismiss} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{title}</Text>
          <ScrollView style={{ maxHeight: Math.floor(screenHeight * 0.6) }} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          <TouchableOpacity style={styles.sheetClose} onPress={onClose}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}


