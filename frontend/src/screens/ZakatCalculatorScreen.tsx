import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, useWindowDimensions,
  StatusBar, TextInput, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { COLORS, SHADOWS, GRADIENTS } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { FONTS, FONT_SIZES, SPACING, RADIUS } from '../constants/theme';
import { post } from '../utils/api';
import { ENDPOINTS } from '../constants/api';
import { ZakatInput, ZakatResult } from '../types';
import { FadeIn, AnimatedPressable } from '../components/AnimatedComponents';
import LogoDecoration from '../components/LogoDecoration';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', nameAr: 'دولار أمريكي' },
  { code: 'EUR', symbol: '€', name: 'Euro', nameAr: 'يورو' },
  { code: 'GBP', symbol: '£', name: 'British Pound', nameAr: 'جنيه إسترليني' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', nameAr: 'ين ياباني' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', nameAr: 'فرنك سويسري' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', nameAr: 'دولار أسترالي' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', nameAr: 'دولار كندي' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', nameAr: 'دولار نيوزيلندي' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', nameAr: 'يوان صيني' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', nameAr: 'دولار هونغ كونغ' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', nameAr: 'دولار سنغافوري' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', nameAr: 'ريال سعودي' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', nameAr: 'درهم إماراتي' },
  { code: 'QAR', symbol: '﷼', name: 'Qatari Riyal', nameAr: 'ريال قطري' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar', nameAr: 'دينار كويتي' },
  { code: 'OMR', symbol: '﷼', name: 'Omani Rial', nameAr: 'ريال عماني' },
  { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar', nameAr: 'دينار بحريني' },
  { code: 'EGP', symbol: 'ج.م', name: 'Egyptian Pound', nameAr: 'جنيه مصري' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', nameAr: 'ليرة تركية' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', nameAr: 'روبية هندية' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', nameAr: 'روبية باكستانية' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', nameAr: 'تاكا بنغلاديشي' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', nameAr: 'رينغيت ماليزي' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', nameAr: 'روبية إندونيسية' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', nameAr: 'بيزو فلبيني' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', nameAr: 'بات تايلاندي' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', nameAr: 'دونغ فيتنامي' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', nameAr: 'وون كوري جنوبي' },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', nameAr: 'دولار تايواني' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', nameAr: 'كرونة نرويجية' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', nameAr: 'كرونة سويدية' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', nameAr: 'كرونة دنماركية' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', nameAr: 'زلوتي بولندي' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', nameAr: 'كرونة تشيكية' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', nameAr: 'فورنت مجري' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu', nameAr: 'ليو روماني' },
  { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev', nameAr: 'ليف بلغاري' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble', nameAr: 'روبل روسي' },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia', nameAr: 'هريفنيا أوكرانية' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso', nameAr: 'بيزو مكسيكي' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', nameAr: 'ريال برازيلي' },
  { code: 'ARS', symbol: 'AR$', name: 'Argentine Peso', nameAr: 'بيزو أرجنتيني' },
  { code: 'CLP', symbol: 'CLP$', name: 'Chilean Peso', nameAr: 'بيزو تشيلي' },
  { code: 'COP', symbol: 'COL$', name: 'Colombian Peso', nameAr: 'بيزو كولومبي' },
  { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', nameAr: 'سول بيروفي' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', nameAr: 'راند جنوب أفريقي' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', nameAr: 'نايرا نيجيري' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', nameAr: 'شيلينغ كيني' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', nameAr: 'سيدي غاني' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', nameAr: 'شيلينغ تنزاني' },
  { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham', nameAr: 'درهم مغربي' },
  { code: 'TND', symbol: 'د.ت', name: 'Tunisian Dinar', nameAr: 'دينار تونسي' },
  { code: 'DZD', symbol: 'د.ج', name: 'Algerian Dinar', nameAr: 'دينار جزائري' },
  { code: 'IQD', symbol: 'د.ع', name: 'Iraqi Dinar', nameAr: 'دينار عراقي' },
  { code: 'JOD', symbol: 'د.ا', name: 'Jordanian Dinar', nameAr: 'دينار أردني' },
  { code: 'LBP', symbol: 'ل.ل', name: 'Lebanese Pound', nameAr: 'ليرة لبنانية' },
  { code: 'YER', symbol: '﷼', name: 'Yemeni Rial', nameAr: 'ريال يمني' },
  { code: 'IRR', symbol: '﷼', name: 'Iranian Rial', nameAr: 'ريال إيراني' },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', nameAr: 'روبية سريلانكية' },
  { code: 'NPR', symbol: 'Rs', name: 'Nepalese Rupee', nameAr: 'روبية نيبالية' },
  { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge', nameAr: 'تينغ كازاخستاني' },
  { code: 'UZS', symbol: 'soʻm', name: 'Uzbekistani Som', nameAr: 'سوم أوزبكستاني' },
  { code: 'AZN', symbol: '₼', name: 'Azerbaijani Manat', nameAr: 'مانات أذربيجاني' },
];

const LOCAL_RATES: Record<string, number> = {
  USD: 1, EUR: 0.93, GBP: 0.79, JPY: 157.6, CHF: 0.89, AUD: 1.52, CAD: 1.37,
  NZD: 1.64, CNY: 7.25, HKD: 7.82, SGD: 1.35, SAR: 3.75, AED: 3.67, QAR: 3.64,
  KWD: 0.31, OMR: 0.38, BHD: 0.38, EGP: 48.5, TRY: 32.8, INR: 83.5, PKR: 278.5,
  BDT: 117.5, MYR: 4.72, IDR: 16250, PHP: 58.5, THB: 36.8, VND: 25450, KRW: 1380,
  TWD: 32.4, NOK: 10.7, SEK: 10.5, DKK: 6.95, PLN: 4.0, CZK: 23.3, HUF: 368,
  RON: 4.62, BGN: 1.82, RUB: 89.5, UAH: 41.2, MXN: 18.5, BRL: 5.45, ARS: 915,
  CLP: 945, COP: 4150, PEN: 3.78, ZAR: 18.9, NGN: 1550, KES: 145, GHS: 15.2,
  TZS: 2680, MAD: 10.05, TND: 3.12, DZD: 134.5, IQD: 1310, JOD: 0.71, LBP: 89500,
  YER: 250, IRR: 42000, LKR: 305, NPR: 133.5, KZT: 465, UZS: 12800, AZN: 1.70,
};

const FIELD_CONFIG: { key: keyof ZakatInput; icon: keyof typeof Ionicons.glyphMap; suffix: string; suffixAr: string }[] = [
  { key: 'cash', icon: 'wallet', suffix: '', suffixAr: '' },
  { key: 'gold', icon: 'diamond', suffix: 'grams', suffixAr: 'جرام' },
  { key: 'silver', icon: 'sparkles', suffix: 'grams', suffixAr: 'جرام' },
  { key: 'investments', icon: 'trending-up', suffix: '', suffixAr: '' },
  { key: 'property', icon: 'home', suffix: '', suffixAr: '' },
];

const INFO_SECTIONS = [
  {
    titleEn: 'What is Zakat?',
    titleAr: 'ما هي الزكاة؟',
    textEn: 'Zakat is an obligatory form of charity in Islam, calculated as 2.5% of eligible wealth held for one lunar year.',
    textAr: 'الزكاة هي فريضة مالية في الإسلام، تُحسب بنسبة 2.5% من المال الذي بلغ النصاب وحال عليه الحول.',
  },
  {
    titleEn: 'Nisab Threshold',
    titleAr: 'حد النصاب',
    textEn: 'Nisab is the minimum amount of wealth before zakat becomes due. It is equivalent to 85g of gold or 595g of silver, whichever is lower.',
    textAr: 'النصاب هو الحد الأدنى من المال قبل وجوب الزكاة. وهو يعادل 85 جرامًا من الذهب أو 595 جرامًا من الفضة، أيهما أقل.',
  },
  {
    titleEn: 'Gold & Silver Prices',
    titleAr: 'أسعار الذهب والفضة',
    textEn: 'Prices are fetched live from global markets and converted to your selected currency.',
    textAr: 'يتم جلب الأسعار مباشرة من الأسواق العالمية وتحويلها إلى العملة المحددة.',
  },
];

export default function ZakatCalculatorScreen() {
  const navigation = useNavigation<any>();
  const { t, language } = useApp();
  const isRtl = language === 'ar';
  const { height: screenHeight } = useWindowDimensions();

  const [inputs, setInputs] = useState<ZakatInput>({
    cash: 0, gold: 0, silver: 0, investments: 0, property: 0,
  });
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
  const [showCurrency, setShowCurrency] = useState(false);
  const [result, setResult] = useState<ZakatResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [pricesLoading, setPricesLoading] = useState(false);

  const updateField = (field: keyof ZakatInput, value: string) => {
    const num = parseFloat(value);
    setInputs(prev => ({ ...prev, [field]: isNaN(num) ? 0 : Math.max(0, num) }));
    setResult(null);
  };

  const calculateZakat = async () => {
    setCalculating(true);
    setPricesLoading(true);
    try {
      const apiResult = await post<ZakatResult>(ENDPOINTS.ZAKAT_CALCULATE, {
        ...inputs,
        currency: selectedCurrency.code,
      });
      setResult(apiResult);
    } catch {
      const rate = LOCAL_RATES[selectedCurrency.code] || 1;
      const goldPerGram = 75 * rate;
      const silverPerGram = 0.85 * rate;
      const goldVal = inputs.gold * goldPerGram;
      const silverVal = inputs.silver * silverPerGram;
      const totalWealth = inputs.cash + goldVal + silverVal + inputs.investments + inputs.property;
      const nisabThreshold = Math.min(85 * goldPerGram, 595 * silverPerGram);
      const isAboveNisab = totalWealth >= nisabThreshold;
      setResult({
        totalWealth,
        nisabThreshold,
        zakatDue: isAboveNisab ? totalWealth * 0.025 : 0,
        isAboveNisab,
        prices: { goldPerGram, silverPerGram, currency: selectedCurrency.code },
        breakdown: [
          { label: 'Cash', amount: inputs.cash },
          { label: 'Gold', amount: goldVal },
          { label: 'Silver', amount: silverVal },
          { label: 'Investments', amount: inputs.investments },
          { label: 'Property', amount: inputs.property },
        ],
      });
    } finally {
      setCalculating(false);
      setPricesLoading(false);
    }
  };

  const clearAll = () => {
    setInputs({ cash: 0, gold: 0, silver: 0, investments: 0, property: 0 });
    setResult(null);
  };

  const currencyLabel = (c: typeof CURRENCIES[0]) =>
    `${c.symbol} ${c.code} - ${isRtl ? c.nameAr : c.name}`;

  const styles = useThemedStyles((colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { padding: SPACING.base, paddingBottom: SPACING.md, borderBottomLeftRadius: RADIUS.xxl, borderBottomRightRadius: RADIUS.xxl, overflow: 'hidden' },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 36, height: 36, borderRadius: RADIUS.round, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: FONT_SIZES.lg, color: colors.textPrimary, fontFamily: FONTS.bodyBold },
    clearBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
    content: { padding: SPACING.base },
    priceBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.sm, marginBottom: SPACING.sm },
    priceBannerText: { fontSize: FONT_SIZES.caption, color: colors.gold, fontFamily: FONTS.bodyMed },
    currencyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', backgroundColor: colors.card, paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.circle, borderWidth: 1, borderColor: colors.border, marginBottom: SPACING.md },
    currencyBtnText: { fontSize: FONT_SIZES.small, color: colors.textPrimary, fontFamily: FONTS.bodyMed },
    inputCard: { backgroundColor: colors.card, borderRadius: RADIUS.md, padding: SPACING.base, marginBottom: SPACING.sm, borderWidth: 1, borderColor: colors.border },
    inputHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.sm },
    inputLabel: { fontSize: FONT_SIZES.small, color: colors.textSecondary, fontFamily: FONTS.bodyMed, flex: 1 },
    inputSuffix: { fontSize: FONT_SIZES.caption, color: colors.textMuted, fontFamily: FONTS.body },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    inputCurrency: { fontSize: FONT_SIZES.lg, color: colors.gold, fontFamily: FONTS.bodyBold },
    input: { flex: 1, fontSize: FONT_SIZES.lg, color: colors.textPrimary, paddingVertical: SPACING.xs, borderBottomWidth: 1, borderBottomColor: colors.border, fontFamily: FONTS.bodyMed },
    calcBtn: { marginTop: SPACING.xs, marginBottom: SPACING.base, borderRadius: RADIUS.md, overflow: 'hidden', ...SHADOWS.gold },
    calcGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: SPACING.base },
    calcBtnText: { fontSize: FONT_SIZES.md, color: colors.darkGreen, fontFamily: FONTS.bodyBold },
    resultCard: { borderRadius: RADIUS.xl, padding: SPACING.lg, alignItems: 'center', marginBottom: SPACING.base, borderWidth: 1, borderColor: colors.goldDark, ...SHADOWS.gold },
    resultTitle: { fontSize: FONT_SIZES.md, color: colors.gold, fontFamily: FONTS.bodyBold, marginTop: SPACING.sm, marginBottom: SPACING.base },
    priceRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: RADIUS.sm, padding: SPACING.md, marginBottom: SPACING.md, width: '100%' },
    priceItem: { flex: 1, alignItems: 'center' },
    priceDivider: { width: 1, height: 30, backgroundColor: colors.border, marginHorizontal: SPACING.sm },
    priceLabel: { fontSize: FONT_SIZES.caption, color: colors.textMuted, fontFamily: FONTS.body },
    priceValue: { fontSize: FONT_SIZES.small, color: colors.textPrimary, fontFamily: FONTS.bodyBold, marginTop: 2 },
    resultRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: SPACING.xs },
    resultLabel: { fontSize: FONT_SIZES.small, color: colors.textSecondary, fontFamily: FONTS.body },
    resultValue: { fontSize: FONT_SIZES.small, color: colors.textPrimary, fontFamily: FONTS.bodyBold },
    resultDivider: { width: '100%', height: 1, backgroundColor: colors.border, marginVertical: SPACING.xs },
    resultDue: { fontSize: FONT_SIZES.lg, color: colors.gold, fontFamily: FONTS.bodyBold },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: SPACING.sm, borderRadius: RADIUS.sm, marginTop: SPACING.md, width: '100%' },
    statusAbove: { backgroundColor: colors.glassGreen },
    statusBelow: { backgroundColor: colors.glassGold },
    statusText: { fontSize: FONT_SIZES.caption, fontFamily: FONTS.bodyMed, flex: 1 },
    breakdownSection: { width: '100%', marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: colors.border },
    breakdownTitle: { fontSize: FONT_SIZES.caption, color: colors.gold, fontFamily: FONTS.bodyBold, marginBottom: SPACING.sm },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.xs },
    breakdownLabel: { fontSize: FONT_SIZES.caption, color: colors.textSecondary, fontFamily: FONTS.body },
    breakdownValue: { fontSize: FONT_SIZES.caption, color: colors.textPrimary, fontFamily: FONTS.bodyMed },
    breakdownEmpty: { fontSize: FONT_SIZES.caption, color: colors.textMuted, fontFamily: FONTS.body, textAlign: 'center', paddingVertical: SPACING.sm },
    infoToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', padding: SPACING.md, marginBottom: SPACING.sm },
    infoToggleText: { fontSize: FONT_SIZES.small, color: colors.info, fontFamily: FONTS.bodyMed },
    infoCard: { backgroundColor: colors.card, borderRadius: RADIUS.md, padding: SPACING.base, marginBottom: SPACING.sm, borderWidth: 1, borderColor: colors.border },
    infoTitle: { fontSize: FONT_SIZES.body, color: colors.info, fontFamily: FONTS.bodyBold, marginBottom: SPACING.xs },
    infoText: { fontSize: FONT_SIZES.caption, color: colors.textSecondary, fontFamily: FONTS.body, lineHeight: 18 },
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.card, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.xl, paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.lg },
    modalTitle: { fontSize: FONT_SIZES.lg, color: colors.textPrimary, fontFamily: FONTS.bodyBold, textAlign: 'center', marginBottom: SPACING.base },
    currencyItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: SPACING.md, borderRadius: RADIUS.sm, marginBottom: SPACING.xs },
    currencyItemActive: { backgroundColor: colors.glassGold },
    currencySymbol: { fontSize: FONT_SIZES.xl, color: colors.gold, fontFamily: FONTS.bodyBold, width: 36, textAlign: 'center' },
    currencyCode: { fontSize: FONT_SIZES.body, color: colors.textPrimary, fontFamily: FONTS.bodyBold },
    currencyName: { fontSize: FONT_SIZES.caption, color: colors.textMuted, fontFamily: FONTS.body },
  }), []);

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
            <Text style={styles.title}>{t('zakat.title')}</Text>
            <AnimatedPressable onPress={clearAll} style={styles.clearBtn}>
              <Ionicons name="refresh" size={18} color={COLORS.textMuted} />
            </AnimatedPressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {pricesLoading && (
            <View style={styles.priceBanner}>
              <Ionicons name="trending-up" size={14} color={COLORS.gold} />
              <Text style={styles.priceBannerText}>
                {isRtl ? 'جاري تحديث الأسعار...' : 'Updating live prices...'}
              </Text>
            </View>
          )}

          <AnimatedPressable style={styles.currencyBtn} onPress={() => setShowCurrency(true)}>
            <Ionicons name="cash" size={16} color={COLORS.gold} />
            <Text style={styles.currencyBtnText}>{currencyLabel(selectedCurrency)}</Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
          </AnimatedPressable>

          {FIELD_CONFIG.map(({ key, icon, suffix, suffixAr }) => (
            <View key={key} style={styles.inputCard}>
              <View style={styles.inputHeader}>
                <Ionicons name={icon} size={18} color={COLORS.gold} />
                <Text style={styles.inputLabel}>{t(`zakat.${key}`)}</Text>
                {(key === 'gold' || key === 'silver') && (
                  <Text style={styles.inputSuffix}>{isRtl ? suffixAr : suffix}</Text>
                )}
              </View>
              <View style={styles.inputRow}>
                <Text style={styles.inputCurrency}>{selectedCurrency.symbol}</Text>
                <TextInput
                  style={styles.input}
                  value={inputs[key] > 0 ? String(inputs[key]) : ''}
                  onChangeText={v => updateField(key, v)}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          ))}

          <AnimatedPressable
            style={styles.calcBtn}
            onPress={calculateZakat}
            disabled={calculating}
            activeOpacity={0.8}
          >
            <LinearGradient colors={[COLORS.goldDark, COLORS.gold, COLORS.goldLight]} style={styles.calcGradient}>
              {calculating ? (
                <Text style={styles.calcBtnText}>{t('common.loading')}</Text>
              ) : (
                <>
                  <Ionicons name="calculator" size={20} color={COLORS.darkGreen} />
                  <Text style={styles.calcBtnText}>{t('zakat.calculate')}</Text>
                </>
              )}
            </LinearGradient>
          </AnimatedPressable>

          {result && (
            <LinearGradient colors={GRADIENTS.cardGold} style={styles.resultCard}>
              <Ionicons name="ribbon" size={28} color={COLORS.gold} />
              <Text style={styles.resultTitle}>{t('zakat.result')}</Text>

              {result.prices && (
                <View style={styles.priceRow}>
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>{t('zakat.goldPrice')}</Text>
                    <Text style={styles.priceValue}>
                      {selectedCurrency.symbol}{result.prices.goldPerGram.toFixed(2)}{t('zakat.perGram')}
                    </Text>
                  </View>
                  <View style={styles.priceDivider} />
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>{t('zakat.silverPrice')}</Text>
                    <Text style={styles.priceValue}>
                      {selectedCurrency.symbol}{result.prices.silverPerGram.toFixed(2)}{t('zakat.perGram')}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t('zakat.totalWealth')}</Text>
                <Text style={styles.resultValue}>
                  {result.totalWealth.toLocaleString(undefined, { maximumFractionDigits: 2 })} {selectedCurrency.symbol}
                </Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t('zakat.nisabThreshold')}</Text>
                <Text style={[styles.resultValue, !result.isAboveNisab && { color: COLORS.error }]}>
                  {result.nisabThreshold.toLocaleString(undefined, { maximumFractionDigits: 2 })} {selectedCurrency.symbol}
                </Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t('zakat.zakatDue')} (2.5%)</Text>
                <Text style={[styles.resultDue, !result.isAboveNisab && { color: COLORS.textMuted }]}>
                  {result.zakatDue.toLocaleString(undefined, { maximumFractionDigits: 2 })} {selectedCurrency.symbol}
                </Text>
              </View>

              <View style={[styles.statusBadge, result.isAboveNisab ? styles.statusAbove : styles.statusBelow]}>
                <Ionicons
                  name={result.isAboveNisab ? 'checkmark-circle' : 'information-circle'}
                  size={16}
                  color={result.isAboveNisab ? COLORS.success : COLORS.warning}
                />
                <Text style={[styles.statusText, { color: result.isAboveNisab ? COLORS.success : COLORS.warning }]}>
                  {result.isAboveNisab
                    ? (isRtl ? `الزكاة مستحقة: ${result.zakatDue.toFixed(2)} ${selectedCurrency.symbol}` : `Zakat due: ${result.zakatDue.toFixed(2)} ${selectedCurrency.symbol}`)
                    : (isRtl ? 'لم تبلغ النصاب - لا زكاة عليك' : 'Below nisab - no zakat due')}
                </Text>
              </View>

              <View style={styles.breakdownSection}>
                <Text style={styles.breakdownTitle}>{t('zakat.breakdown')}</Text>
                {result.breakdown.filter(b => b.amount > 0).map((item, idx) => (
                  <View key={idx} style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{item.label}</Text>
                    <Text style={styles.breakdownValue}>
                      {item.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {selectedCurrency.symbol}
                    </Text>
                  </View>
                ))}
                {result.breakdown.every(b => b.amount === 0) && (
                  <Text style={styles.breakdownEmpty}>
                    {isRtl ? 'جميع القيم صفر' : 'All values are zero'}
                  </Text>
                )}
              </View>
            </LinearGradient>
          )}

          <AnimatedPressable style={styles.infoToggle} onPress={() => setShowInfo(!showInfo)}>
            <Ionicons name="information-circle" size={18} color={COLORS.info} />
            <Text style={styles.infoToggleText}>{isRtl ? 'معلومات عن الزكاة' : 'About Zakat'}</Text>
            <Ionicons name={showInfo ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textSecondary} />
          </AnimatedPressable>

          {showInfo && INFO_SECTIONS.map((section, idx) => (
            <View key={idx} style={styles.infoCard}>
              <Text style={styles.infoTitle}>{isRtl ? section.titleAr : section.titleEn}</Text>
              <Text style={styles.infoText}>{isRtl ? section.textAr : section.textEn}</Text>
            </View>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showCurrency} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('zakat.selectCurrency')}</Text>
            <ScrollView style={{ maxHeight: Math.floor(screenHeight * 0.6) }}>
              {CURRENCIES.map(curr => (
                <AnimatedPressable
                  key={curr.code}
                  style={[styles.currencyItem, selectedCurrency.code === curr.code && styles.currencyItemActive]}
                  onPress={() => { setSelectedCurrency(curr); setShowCurrency(false); }}
                >
                  <Text style={styles.currencySymbol}>{curr.symbol}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.currencyCode}>{curr.code}</Text>
                    <Text style={styles.currencyName}>{isRtl ? curr.nameAr : curr.name}</Text>
                  </View>
                  {selectedCurrency.code === curr.code && (
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.gold} />
                  )}
                </AnimatedPressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}


