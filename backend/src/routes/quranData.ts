import { Router } from 'express';
import axios from 'axios';
import { reciterAudioMap } from './reciters';

const router = Router();

// In-memory caches
let uthmaniCache: any = null;          // quran-uthmani edition (Arabic text)
let translationCaches: Record<string, any> = {};  // keyed by edition id

const ALQURAN_BASE = 'https://api.alquran.cloud/v1';
const PAGE_CACHE: Record<string, { data: any; ts: number }> = {};
const PAGE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function getUthmaniQuran() {
  if (!uthmaniCache) {
    const res = await axios.get(`${ALQURAN_BASE}/quran/quran-uthmani`, { timeout: 15000 });
    uthmaniCache = res.data.data;
  }
  return uthmaniCache;
}

async function getTranslationQuran(edition: string) {
  if (!translationCaches[edition]) {
    const res = await axios.get(`${ALQURAN_BASE}/quran/${edition}`, { timeout: 15000 });
    translationCaches[edition] = res.data.data;
  }
  return translationCaches[edition];
}

// Surah start page mapping (Hafs 'An 'Asim, Madinah Mushaf, 15-line)
export const SURAH_START_PAGES: Record<number, number> = {
  1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187,
  10: 208, 11: 221, 12: 235, 13: 249, 14: 255, 15: 262, 16: 267, 17: 282,
  18: 293, 19: 305, 20: 312, 21: 322, 22: 332, 23: 342, 24: 350, 25: 359,
  26: 367, 27: 377, 28: 385, 29: 396, 30: 404, 31: 411, 32: 415, 33: 418,
  34: 428, 35: 434, 36: 440, 37: 446, 38: 453, 39: 458, 40: 467, 41: 477,
  42: 483, 43: 489, 44: 496, 45: 499, 46: 502, 47: 507, 48: 511, 49: 515,
  50: 518, 51: 520, 52: 523, 53: 526, 54: 528, 55: 531, 56: 534, 57: 537,
  58: 542, 59: 545, 60: 549, 61: 551, 62: 553, 63: 554, 64: 556, 65: 558,
  66: 560, 67: 562, 68: 564, 69: 566, 70: 568, 71: 570, 72: 572, 73: 574,
  74: 575, 75: 577, 76: 578, 77: 580, 78: 582, 79: 583, 80: 585, 81: 586,
  82: 587, 83: 587, 84: 589, 85: 590, 86: 591, 87: 591, 88: 592, 89: 593,
  90: 594, 91: 595, 92: 595, 93: 596, 94: 596, 95: 597, 96: 597, 97: 598,
  98: 598, 99: 599, 100: 599, 101: 600, 102: 600, 103: 601, 104: 601,
  105: 601, 106: 602, 107: 602, 108: 602, 109: 603, 110: 603, 111: 603,
  112: 604, 113: 604, 114: 604,
};

// Juz start pages
const JUZ_START_PAGES: Record<number, number> = {
  1: 1, 2: 22, 3: 42, 4: 62, 5: 82, 6: 102, 7: 121, 8: 142, 9: 162, 10: 182,
  11: 201, 12: 222, 13: 242, 14: 262, 15: 282, 16: 302, 17: 322, 18: 342,
  19: 362, 20: 382, 21: 402, 22: 422, 23: 442, 24: 462, 25: 482, 26: 502,
  27: 522, 28: 542, 29: 562, 30: 582,
};

// GET /api/quran/data/surahs
router.get('/surahs', async (req, res) => {
  try {
    const quran = await getUthmaniQuran();
    const result = quran.surahs.map((s: any) => ({
      number: s.number,
      name: s.name,
      englishName: s.englishName,
      englishNameTranslation: s.englishNameTranslation,
      numberOfAyahs: s.numberOfAyahs,
      revelationType: s.revelationType,
      startPage: SURAH_START_PAGES[s.number] || 1,
    }));
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch surahs' });
  }
});

// GET /api/quran/data/surah-pages — mapping of all surah numbers to their start pages
router.get('/surah-pages', async (_req, res) => {
  try {
    res.json({ success: true, data: SURAH_START_PAGES });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed' });
  }
});

// GET /api/quran/data/juz-pages — mapping of juz numbers to start pages
router.get('/juz-pages', async (_req, res) => {
  try {
    res.json({ success: true, data: JUZ_START_PAGES });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed' });
  }
});

// GET /api/quran/data/surah/:number — returns surah with Uthmani Arabic ayahs
router.get('/surah/:number', async (req, res) => {
  try {
    const number = parseInt(req.params.number, 10);
    if (isNaN(number) || number < 1 || number > 114) {
      return res.status(400).json({ success: false, error: 'Invalid surah number' });
    }
    const quran = await getUthmaniQuran();
    const surah = quran.surahs.find((s: any) => s.number === number);
    if (!surah) return res.status(404).json({ success: false, error: 'Surah not found' });

    const result = {
      number: surah.number,
      name: surah.name,
      englishName: surah.englishName,
      englishNameTranslation: surah.englishNameTranslation,
      numberOfAyahs: surah.numberOfAyahs,
      revelationType: surah.revelationType,
      startPage: SURAH_START_PAGES[surah.number] || 1,
      ayahs: surah.ayahs.map((a: any) => ({
        number: a.number,
        text: a.text,
        numberInSurah: a.numberInSurah,
        juz: a.juz,
        manzil: a.manzil,
        page: a.page,
        ruku: a.ruku,
        hizbQuarter: a.hizbQuarter,
        sajda: a.sajda || false,
      })),
    };
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch surah' });
  }
});

// GET /api/quran/data/ayah/:number
router.get('/ayah/:number', async (req, res) => {
  try {
    const number = parseInt(req.params.number, 10);
    const quran = await getUthmaniQuran();
    let ayah: any = null;
    let surahRef: any = null;
    for (const s of quran.surahs) {
      const found = s.ayahs.find((a: any) => a.number === number);
      if (found) { ayah = found; surahRef = s; break; }
    }
    if (!ayah) return res.status(404).json({ success: false, error: 'Ayah not found' });
    res.json({ success: true, data: { ...ayah, surahName: surahRef?.name, surahNumber: surahRef?.number } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed' });
  }
});

// GET /api/quran/data/page/:number?lang=en.sahih
// Returns all ayahs on a Quran page with optional translation
router.get('/page/:number', async (req, res) => {
  try {
    const pageNum = parseInt(req.params.number, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > 604) {
      return res.status(400).json({ success: false, error: 'Invalid page number (1-604)' });
    }
    const lang = (req.query.lang as string) || '';
    const cacheKey = `${pageNum}:${lang}`;
    const cached = PAGE_CACHE[cacheKey];
    if (cached && Date.now() - cached.ts < PAGE_CACHE_TTL) {
      return res.json({ success: true, data: cached.data });
    }

    // Fetch Arabic + optional translation as separate calls (alquran.cloud doesn't support multi-edition page endpoint)
    const requests: Promise<any>[] = [
      axios.get(`${ALQURAN_BASE}/page/${pageNum}/quran-uthmani`, { timeout: 15000 }),
    ];
    if (lang) requests.push(axios.get(`${ALQURAN_BASE}/page/${pageNum}/${lang}`, { timeout: 15000 }));
    const [arabicRes, translationRes] = await Promise.all(requests);

    const arabicEdition = arabicRes.data.data;
    const translationMap: Record<number, string> = {};
    if (translationRes?.data?.data?.ayahs) {
      for (const a of translationRes.data.data.ayahs) {
        translationMap[a.number] = a.text;
      }
    }

    // Group by surah to detect new surah starts
    const surahsOnPage: Record<number, { number: number; name: string; englishName: string; englishNameTranslation: string }> = {};
    const ayahs = (arabicEdition?.ayahs || arabicEdition || []).map((a: any) => {
      const s = a.surah || {};
      if (!surahsOnPage[s.number]) {
        surahsOnPage[s.number] = {
          number: s.number,
          name: s.name,
          englishName: s.englishName,
          englishNameTranslation: s.englishNameTranslation,
        };
      }
      return {
        number: a.number,
        text: a.text,
        numberInSurah: a.numberInSurah,
        juz: a.juz,
        manzil: a.manzil,
        page: a.page,
        ruku: a.ruku,
        hizbQuarter: a.hizbQuarter,
        sajda: a.sajda || false,
        surahNumber: s.number,
        surahName: s.name,
        surahEnglishName: s.englishName,
        surahEnglishNameTranslation: s.englishNameTranslation,
        isFirstInSurah: a.numberInSurah === 1,
        translation: translationMap[a.number] || null,
      };
    });

    const juzNumber = ayahs[0]?.juz || 1;
    const data = {
      pageNumber: pageNum,
      juzNumber,
      surahs: Object.values(surahsOnPage),
      ayahs,
    };

    PAGE_CACHE[cacheKey] = { data, ts: Date.now() };
    res.json({ success: true, data });
  } catch (err: any) {
    console.error('page error', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch page' });
  }
});

// ─── Arabic text normalization ─────────────────────────────────────────────
function normalizeArabic(text: string): string {
  return text
    // Remove tashkeel (all diacritics including sukun and shadda)
    .replace(/[ًٌٍَُِّْٰٓٔ]/g, '')
    // Remove superscript alef
    .replace(/[\u0670]/g, '')
    // Normalize alef variants → ا
    .replace(/[آأإٱ]/g, 'ا')
    // Normalize teh marbuta → ه
    .replace(/ة/g, 'ه')
    // Normalize alef maksura → ي
    .replace(/ى/g, 'ي')
    // Normalize waw with hamza → و
    .replace(/ؤ/g, 'و')
    // Normalize ya with hamza → ي
    .replace(/ئ/g, 'ي')
    // Remove tatweel/kashida
    .replace(/ـ/g, '')
    // Remove special Quranic markers (small alef, madd, etc.)
    .replace(/[\u06D6-\u06ED\u08D0-\u08E3\u0615\u0616\u0617\u0618\u0619\u061A]/g, '')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

function wordFuzzyScore(queryWord: string, textWord: string): number {
  // Returns a score 0-100: how well queryWord matches textWord
  // 100 = exact match, 50+ = good match, <50 = weak
  if (textWord.includes(queryWord)) return 100;
  if (queryWord.includes(textWord)) return 80;
  // Prefix match (query is prefix of text word, or text word is prefix of query)
  if (textWord.startsWith(queryWord) || queryWord.startsWith(textWord)) return 90;
  // Subsequence check for roots (e.g. "كتب" in "يكتبون")
  let ti = 0;
  let matched = 0;
  for (let qi = 0; qi < queryWord.length && ti < textWord.length; qi++) {
    while (ti < textWord.length && textWord[ti] !== queryWord[qi]) ti++;
    if (ti < textWord.length) { matched++; ti++; }
  }
  return Math.round((matched / queryWord.length) * 70);
}

function isFuzzyMatch(text: string, query: string): boolean {
  const normText = normalizeArabic(text);
  const normQuery = normalizeArabic(query);
  if (normQuery.length === 0) return false;

  // 1. Exact normalized match (highest relevance)
  if (normText.includes(normQuery)) return true;

  const queryWords = normQuery.split(/\s+/).filter(Boolean);
  const textWords = normText.split(/\s+/).filter(Boolean);

  // 2. Multi-word query: each query word must match some text word
  if (queryWords.length > 1) {
    return queryWords.every(qw =>
      textWords.some(tw => wordFuzzyScore(qw, tw) >= 50)
    );
  }

  // 3. Single word: match against each text word
  const qw = queryWords[0];
  for (const tw of textWords) {
    if (wordFuzzyScore(qw, tw) >= 50) return true;
  }

  // 4. Check across word boundaries: the query string might span adjacent words
  // (e.g. "بسم الله" entered as one word "بسمالله")
  const joined = textWords.join('');
  if (joined.includes(qw) || qw.includes(joined)) return true;

  return false;
}

// GET /api/quran/data/search?q=<query>&lang=en.sahih
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString();
    const lang = (req.query.lang as string) || 'en.sahih';
    if (!q.trim()) return res.json({ success: true, data: [] });

    const isArabic = /[؀-ۿ]/.test(q);
    const quran = await getUthmaniQuran();

    let transData: any = null;
    if (!isArabic) {
      try { transData = await getTranslationQuran(lang); } catch { /* skip */ }
    }

    const results: any[] = [];
    const qLower = q.toLowerCase();

    for (const s of quran.surahs) {
      const transSurah = transData?.surahs?.find((ts: any) => ts.number === s.number);
      const transAyahs = transSurah?.ayahs || [];
      for (const a of s.ayahs) {
        let matched = false;
        const transAyah = transAyahs.find((ta: any) => ta.numberInSurah === a.numberInSurah);
        const translation: string | null = transAyah?.text || null;
        if (isArabic) {
          matched = isFuzzyMatch(a.text, q);
        } else {
          matched = !!(translation && translation.toLowerCase().includes(qLower));
        }

        if (matched) {
          results.push({
            surahNumber: s.number,
            surahName: s.name,
            surahEnglishName: s.englishName,
            ayahNumber: a.number,
            ayahNumberInSurah: a.numberInSurah,
            page: a.page,
            juz: a.juz,
            text: a.text,
            translation,
          });
          if (results.length >= 50) break;
        }
      }
      if (results.length >= 50) break;
    }
    res.json({ success: true, data: results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Search failed' });
  }
});

// GET /api/quran/data/reciter-urls/:reciterId
router.get('/reciter-urls/:reciterId', async (req, res) => {
  try {
    const reciterId = req.params.reciterId;
    const editionKey = reciterAudioMap[reciterId] || reciterId;
    const response = await axios.get(`${ALQURAN_BASE}/quran/${editionKey}`, { timeout: 15000 });
    const data = response.data.data;
    const urls = data.surahs.map((s: any) => ({
      surahNumber: s.number,
      audioUrl: s.ayahs[0]?.audio || null,
    }));
    res.json({ success: true, data: urls });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch reciter URLs' });
  }
});

export default router;
