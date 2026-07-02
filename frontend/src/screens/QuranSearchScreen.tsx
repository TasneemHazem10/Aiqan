import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { get } from '../utils/api';
import { ENDPOINTS } from '../constants/api';
import { COLORS, GRADIENTS } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { FadeIn, AnimatedPressable } from '../components/AnimatedComponents';
import LogoDecoration from '../components/LogoDecoration';

interface SearchResult {
  surahNumber: number;
  surahName: string;
  surahEnglishName: string;
  ayahNumber: number;
  ayahNumberInSurah: number;
  page: number;
  juz: number;
  text: string;
  translation: string | null;
}

export default function QuranSearchScreen() {
  const navigation = useNavigation<any>();
  const { t, language } = useApp();

  const styles = useThemedStyles((colors) => ({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { padding: 16, paddingBottom: 12 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    backIcon: { fontSize: 18, color: colors.gold },
    title: { fontSize: 18, color: colors.textPrimary, fontWeight: '700' },
    searchRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
    searchInput: {
      flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10,
      paddingHorizontal: 14, paddingVertical: 10, color: colors.textPrimary, fontSize: 13,
    },
    searchBtn: {
      backgroundColor: colors.gold, borderRadius: 10, paddingHorizontal: 16,
      alignItems: 'center', justifyContent: 'center',
    },
    searchBtnText: { color: colors.green, fontWeight: '700', fontSize: 13 },
    typingIndicator: { fontSize: 11, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic' },
    resultCount: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    emptyText: { color: colors.textMuted, textAlign: 'center', fontSize: 15, marginBottom: 8 },
    emptyHint: { color: colors.textMuted, textAlign: 'center', fontSize: 12, opacity: 0.7 },
    list: { padding: 12, flexGrow: 1 },
    resultCard: {
      backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10,
      borderWidth: 1, borderColor: colors.border,
    },
    resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    resultSurahWrap: { flex: 1 },
    resultSurah: { fontSize: 15, color: colors.gold, fontWeight: '700' },
    resultSurahEn: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
    resultMeta: { alignItems: 'flex-end', gap: 2 },
    resultPageBadge: {
      backgroundColor: `${colors.gold}20`, borderRadius: 6,
      paddingHorizontal: 8, paddingVertical: 2,
      fontSize: 11, color: colors.gold, fontWeight: '700',
    },
    resultAyahNum: { fontSize: 11, color: colors.textMuted },
    resultJuz: { fontSize: 10, color: colors.textMuted },
    resultText: {
      fontSize: 18, color: colors.textPrimary, lineHeight: 34,
      textAlign: 'right', writingDirection: 'rtl',
      fontFamily: 'serif', marginBottom: 8,
    },
    resultTranslation: {
      fontSize: 13, color: colors.textSecondary, lineHeight: 20,
      fontStyle: 'italic', marginBottom: 6,
      borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6,
    },
    resultTapHint: { fontSize: 10, color: colors.textMuted, textAlign: 'right' },
  }));

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const isRtl = language === 'ar';
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await get<SearchResult[]>(ENDPOINTS.QURAN_SEARCH, {
        q: searchQuery,
        lang: 'en.sahih',
      });
      setResults(data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeText = (text: string) => {
    setQuery(text);
    setIsTyping(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) { setResults([]); setIsTyping(false); return; }
    debounceRef.current = setTimeout(() => {
      setIsTyping(false);
      doSearch(text);
    }, 400);
  };

  const handleSearch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setIsTyping(false);
    doSearch(query);
  };

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const openPage = (result: SearchResult) => {
    navigation.navigate('QuranPageReader', {
      initialPage: result.page,
      ayahNumber: result.ayahNumber,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LogoDecoration size={450} opacity={0.05} position="background" pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }} />
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={GRADIENTS.brand} style={styles.header}>
        <View style={styles.headerRow}>
          <AnimatedPressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </AnimatedPressable>
          <Text style={styles.title}>{t('common.search')}</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={handleChangeText}
            onSubmitEditing={handleSearch}
            placeholder={isRtl ? 'ابحث في القرآن...' : 'Search the Quran (Arabic or English)...'}
            placeholderTextColor={COLORS.textMuted}
            returnKeyType="search"
          />
          <AnimatedPressable style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>{t('common.search')}</Text>
          </AnimatedPressable>
        </View>
        {isTyping && query.trim() && (
          <Text style={styles.typingIndicator}>{isRtl ? 'جاري البحث...' : 'Searching...'}</Text>
        )}
        {results.length > 0 && !isTyping && (
          <Text style={styles.resultCount}>
            {results.length} {isRtl ? 'نتيجة' : 'results'}
            {results.length === 50 && (isRtl ? ' (الأولى ٥٠)' : ' (first 50)')}
          </Text>
        )}
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item: SearchResult) => item.ayahNumber.toString()}
          renderItem={({ item }: { item: SearchResult }) => (
            <AnimatedPressable
              style={styles.resultCard}
              onPress={() => openPage(item)}
              activeOpacity={0.8}
            >
              <View style={styles.resultHeader}>
                <View style={styles.resultSurahWrap}>
                  <Text style={styles.resultSurah}>
                    {item.surahName}
                  </Text>
                  <Text style={styles.resultSurahEn}>{item.surahEnglishName}</Text>
                </View>
                <View style={styles.resultMeta}>
                  <Text style={styles.resultPageBadge}>p.{item.page}</Text>
                  <Text style={styles.resultAyahNum}>
                    {t('quran.ayah')} {item.ayahNumberInSurah}
                  </Text>
                  <Text style={styles.resultJuz}>
                    {isRtl ? 'ج' : 'J'}{item.juz}
                  </Text>
                </View>
              </View>
              <Text style={styles.resultText}>{item.text}</Text>
              {item.translation && (
                <Text style={styles.resultTranslation}>{item.translation}</Text>
              )}
              <Text style={styles.resultTapHint}>
                {isRtl ? 'اضغط لفتح الصفحة' : 'Tap to open page'}
              </Text>
            </AnimatedPressable>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                {query.trim()
                  ? (isRtl ? 'لا توجد نتائج' : 'No results found')
                  : (isRtl ? 'ابحث في القرآن الكريم' : 'Search the Quran')}
              </Text>
              {!query.trim() && (
                <Text style={styles.emptyHint}>
                  {isRtl
                    ? 'يمكنك البحث بالعربية أو الإنجليزية'
                    : 'Search in Arabic or English'}
                </Text>
              )}
            </View>
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}


