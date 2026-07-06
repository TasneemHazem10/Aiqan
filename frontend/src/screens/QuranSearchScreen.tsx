import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  StatusBar, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { get } from '../utils/api';
import { ENDPOINTS } from '../constants/api';
import { COLORS, GRADIENTS } from '../constants/colors';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { AnimatedPressable } from '../components/AnimatedComponents';
import LogoDecoration from '../components/LogoDecoration';

// ── Offline data ──────────────────────────────────────────────────────────────
interface RawAyah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
  surahNumber: number;
  surahName: string;
  surahEnglishName: string;
}

const quranData: { pages: { pageNumber: number; juzNumber: number; ayahs: RawAyah[] }[] } =
  require('../data/quranPages.json');

// Build a flat index once at module load
const ALL_AYAHS: RawAyah[] = [];
for (const page of quranData.pages) {
  for (const a of page.ayahs) {
    ALL_AYAHS.push(a);
  }
}

// ── Arabic normalization ───────────────────────────────────────────────────────
function normalizeArabic(text: string): string {
  return text
    // Remove all tashkeel / diacritics (fatha, damma, kasra, tanwin, shadda, sukun, etc.)
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u08D0-\u08FF]/g, '')
    // Superscript alef
    .replace(/\u0670/g, '')
    // Alef variants → ا
    .replace(/[آأإٱ\u0671]/g, 'ا')
    // Teh marbuta → ه
    .replace(/ة/g, 'ه')
    // Alef maksura → ي
    .replace(/ى/g, 'ي')
    // Waw hamza → و
    .replace(/ؤ/g, 'و')
    // Ya hamza → ي
    .replace(/ئ/g, 'ي')
    // Kashida / tatweel
    .replace(/ـ/g, '')
    // Collapse spaces
    .replace(/\s+/g, ' ')
    .trim();
}

// Build normalized text cache
const NORM_CACHE: Record<number, string> = {};
function getNorm(ayah: RawAyah): string {
  if (!NORM_CACHE[ayah.number]) {
    NORM_CACHE[ayah.number] = normalizeArabic(ayah.text);
  }
  return NORM_CACHE[ayah.number];
}

// ── Search logic ───────────────────────────────────────────────────────────────
export interface SearchResult {
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

const MAX_RESULTS = 100;

function searchOffline(query: string): SearchResult[] {
  const q = query.trim();
  if (!q) return [];

  const isArabic = /[\u0600-\u06FF]/.test(q);

  if (isArabic) {
    const normQ = normalizeArabic(q);
    if (!normQ) return [];
    const results: SearchResult[] = [];
    for (const a of ALL_AYAHS) {
      if (getNorm(a).includes(normQ)) {
        results.push({
          surahNumber: a.surahNumber,
          surahName: a.surahName,
          surahEnglishName: a.surahEnglishName,
          ayahNumber: a.number,
          ayahNumberInSurah: a.numberInSurah,
          page: a.page,
          juz: a.juz,
          text: a.text,
          translation: null,
        });
        if (results.length >= MAX_RESULTS) break;
      }
    }
    return results;
  }

  // English: simple case-insensitive substring (translations not in offline bundle,
  // so we return empty and let the backend fill in — handled in the component)
  return [];
}

// ── Highlight helper ───────────────────────────────────────────────────────────
function HighlightedText({
  text,
  query,
  style,
  highlightStyle,
}: {
  text: string;
  query: string;
  style: any;
  highlightStyle: any;
}) {
  const normQ = normalizeArabic(query.trim());
  const normT = normalizeArabic(text);

  if (!normQ || !normT.includes(normQ)) {
    return <Text style={style}>{text}</Text>;
  }

  // Map normalized positions back to original text positions
  // We walk both strings in parallel
  const segments: { text: string; highlight: boolean }[] = [];
  let origIdx = 0;
  let normIdx = 0;

  // Build a map: normIdx -> origIdx (normalized chars map to original chars, skipping diacritics)
  const normToOrig: number[] = [];
  let ni = 0;
  for (let oi = 0; oi < text.length; oi++) {
    const normed = normalizeArabic(text[oi]);
    if (normed.length > 0) {
      normToOrig[ni] = oi;
      ni++;
    }
  }

  const matchStart = normT.indexOf(normQ);
  const matchEnd = matchStart + normQ.length;

  if (matchStart < 0 || matchStart >= normToOrig.length) {
    return <Text style={style}>{text}</Text>;
  }

  const origStart = normToOrig[matchStart] ?? 0;
  const origEnd =
    matchEnd < normToOrig.length
      ? normToOrig[matchEnd] ?? text.length
      : text.length;

  if (origStart > 0) segments.push({ text: text.slice(0, origStart), highlight: false });
  segments.push({ text: text.slice(origStart, origEnd), highlight: true });
  if (origEnd < text.length) segments.push({ text: text.slice(origEnd), highlight: false });

  return (
    <Text style={style}>
      {segments.map((seg, i) =>
        seg.highlight ? (
          <Text key={i} style={highlightStyle}>{seg.text}</Text>
        ) : (
          <Text key={i}>{seg.text}</Text>
        )
      )}
    </Text>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function QuranSearchScreen() {
  const navigation = useNavigation<any>();
  const { t, language } = useApp();
  const isRtl = language === 'ar';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const translationFetchRef = useRef<number>(0);

  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: colors.bg },
      header: { paddingBottom: 12 },
      headerRow: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12,
      },
      backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center', justifyContent: 'center',
      },
      title: { fontSize: 17, color: colors.textPrimary, fontWeight: '700' },
      searchRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 16, marginBottom: 6,
      },
      searchInputWrap: {
        flex: 1,
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.inputBg,
        borderRadius: 12,
        borderWidth: 1, borderColor: colors.border,
        paddingHorizontal: 12,
      },
      searchIcon: { marginRight: 6 },
      searchInput: {
        flex: 1,
        paddingVertical: Platform.OS === 'ios' ? 11 : 8,
        color: colors.textPrimary,
        fontSize: 15,
        textAlign: isRtl ? 'right' : 'left',
      },
      clearBtn: { padding: 4 },
      searchBtn: {
        backgroundColor: colors.gold, borderRadius: 12,
        paddingHorizontal: 16, height: 44,
        alignItems: 'center', justifyContent: 'center',
      },
      searchBtnText: { color: colors.textInverse, fontWeight: '700', fontSize: 14 },
      metaRow: {
        paddingHorizontal: 16, paddingBottom: 6, flexDirection: 'row', justifyContent: 'center',
      },
      metaText: { fontSize: 11, color: colors.textMuted, fontStyle: 'italic' },
      center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
      emptyIcon: { marginBottom: 16, opacity: 0.4 },
      emptyText: { color: colors.textMuted, textAlign: 'center', fontSize: 16, fontWeight: '600', marginBottom: 6 },
      emptyHint: { color: colors.textMuted, textAlign: 'center', fontSize: 13, opacity: 0.7, lineHeight: 20 },
      list: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 24 },
      card: {
        backgroundColor: colors.card,
        borderRadius: 14, padding: 14, marginBottom: 10,
        borderWidth: 1, borderColor: colors.border,
      },
      cardHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 8,
      },
      surahWrap: { flex: 1, marginRight: 8 },
      surahName: { fontSize: 15, color: colors.gold, fontWeight: '700' },
      surahEn: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
      metaBadges: { alignItems: 'flex-end', gap: 3 },
      pageBadge: {
        backgroundColor: `${colors.gold}22`,
        borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
      },
      pageBadgeText: { fontSize: 11, color: colors.gold, fontWeight: '700' },
      ayahNumText: { fontSize: 11, color: colors.textMuted },
      juzText: { fontSize: 10, color: colors.textMuted },
      ayahText: {
        fontSize: 19, lineHeight: 36,
        textAlign: 'right', writingDirection: 'rtl',
        fontFamily: Platform.OS === 'ios' ? 'Scheherazade New' : 'serif',
        color: colors.textPrimary,
        marginBottom: 4,
      },
      ayahHighlight: {
        color: colors.gold,
        backgroundColor: `${colors.gold}22`,
      },
      translationText: {
        fontSize: 13, color: colors.textSecondary, lineHeight: 20,
        fontStyle: 'italic',
        borderTopWidth: 1, borderTopColor: colors.border,
        paddingTop: 6, marginTop: 4, marginBottom: 2,
      },
      tapHint: { fontSize: 10, color: colors.textMuted, textAlign: 'right', marginTop: 4 },
      resultCountText: { fontSize: 12, color: colors.textMuted },
    })
  );

  // ── Core search ─────────────────────────────────────────────────────────────
  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) { setResults([]); setSearched(false); return; }

    setLoading(true);
    setSearched(true);

    const isArabic = /[\u0600-\u06FF]/.test(trimmed);
    let offlineResults = searchOffline(trimmed);

    if (!isArabic) {
      // For English queries: call backend which has translations
      try {
        const data = await get<SearchResult[]>(ENDPOINTS.QURAN_SEARCH, {
          q: trimmed,
          lang: 'en.sahih',
        });
        setResults(data || []);
      } catch {
        setResults([]);
      }
      setLoading(false);
      return;
    }

    // Arabic: show offline results immediately
    setResults(offlineResults);
    setLoading(false);

    // Non-blocking: try to enrich with translations from backend
    if (offlineResults.length > 0) {
      const fetchId = ++translationFetchRef.current;
      try {
        const data = await get<SearchResult[]>(ENDPOINTS.QURAN_SEARCH, {
          q: trimmed,
          lang: 'en.sahih',
        });
        if (fetchId === translationFetchRef.current && data && data.length > 0) {
          // Merge translations into offline results by ayah number
          const transMap = new Map<number, string | null>();
          for (const r of data) transMap.set(r.ayahNumber, r.translation);
          setResults(prev =>
            prev.map(r => ({
              ...r,
              translation: transMap.has(r.ayahNumber)
                ? (transMap.get(r.ayahNumber) ?? null)
                : r.translation,
            }))
          );
        }
      } catch {
        // translations just won't show — results still displayed
      }
    }
  }, []);

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) { setResults([]); setSearched(false); return; }
    debounceRef.current = setTimeout(() => doSearch(text), 450);
  };

  const handleSearch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    doSearch(query);
  };

  const clearQuery = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
  };

  const openPage = (result: SearchResult) => {
    navigation.navigate('QuranPageReader', {
      initialPage: result.page,
      ayahNumber: result.ayahNumber,
    });
  };

  // ── Empty state ─────────────────────────────────────────────────────────────
  const EmptyState = useMemo(() => (
    <View style={styles.center}>
      <Ionicons
        name={searched ? 'search-outline' : 'book-outline'}
        size={56}
        color={COLORS.gold}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyText}>
        {searched
          ? (isRtl ? 'لا توجد نتائج' : 'No results found')
          : (isRtl ? 'ابحث في القرآن الكريم' : 'Search the Quran')}
      </Text>
      <Text style={styles.emptyHint}>
        {searched
          ? (isRtl ? 'جرب كلمات مختلفة أو تأكد من الإملاء' : 'Try different words or check spelling')
          : (isRtl
            ? 'يمكنك البحث بالعربية مع أو بدون تشكيل\nأو بالإنجليزية'
            : 'Search in Arabic (with or without diacritics)\nor in English')}
      </Text>
    </View>
  ), [searched, isRtl, styles]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LogoDecoration
        size={420} opacity={0.04} position="background" pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
      />
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={GRADIENTS.brand as any} style={styles.header}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <AnimatedPressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={COLORS.gold} />
          </AnimatedPressable>
          <Text style={styles.title}>
            {isRtl ? 'البحث في القرآن' : 'Quran Search'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Ionicons
              name="search"
              size={17}
              color={COLORS.textMuted}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={handleChangeText}
              onSubmitEditing={handleSearch}
              placeholder={isRtl ? 'ابحث بالعربية أو الإنجليزية...' : 'Search in Arabic or English...'}
              placeholderTextColor={COLORS.textMuted}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <AnimatedPressable onPress={clearQuery} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </AnimatedPressable>
            )}
          </View>
          <AnimatedPressable style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>{isRtl ? 'بحث' : 'Search'}</Text>
          </AnimatedPressable>
        </View>

        {/* Result count / status */}
        {(results.length > 0 || searched) && !loading && (
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {results.length > 0
                ? `${results.length}${results.length >= MAX_RESULTS ? '+' : ''} ${isRtl ? 'نتيجة' : 'results'}`
                : ''}
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Results */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.ayahNumber.toString()}
          renderItem={({ item }) => (
            <AnimatedPressable style={styles.card} onPress={() => openPage(item)} activeOpacity={0.8}>
              <View style={styles.cardHeader}>
                <View style={styles.surahWrap}>
                  <Text style={styles.surahName}>{item.surahName}</Text>
                  <Text style={styles.surahEn}>{item.surahEnglishName}</Text>
                </View>
                <View style={styles.metaBadges}>
                  <View style={styles.pageBadge}>
                    <Text style={styles.pageBadgeText}>
                      {isRtl ? `ص ${item.page}` : `p.${item.page}`}
                    </Text>
                  </View>
                  <Text style={styles.ayahNumText}>
                    {isRtl ? `آية ${item.ayahNumberInSurah}` : `Ayah ${item.ayahNumberInSurah}`}
                  </Text>
                  <Text style={styles.juzText}>
                    {isRtl ? `جزء ${item.juz}` : `Juz ${item.juz}`}
                  </Text>
                </View>
              </View>

              <HighlightedText
                text={item.text}
                query={query}
                style={styles.ayahText}
                highlightStyle={styles.ayahHighlight}
              />

              {item.translation && (
                <Text style={styles.translationText}>{item.translation}</Text>
              )}
              <Text style={styles.tapHint}>
                {isRtl ? 'اضغط لفتح الصفحة' : 'Tap to open page'}
              </Text>
            </AnimatedPressable>
          )}
          ListEmptyComponent={EmptyState}
          contentContainerStyle={results.length === 0 ? { flex: 1 } : styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}
