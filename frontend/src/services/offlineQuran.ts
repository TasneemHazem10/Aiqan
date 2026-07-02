import { QuranPage, SurahWithAyahs, Ayah } from '../types';
import { getSurahMetadata } from '../data/surahs';

interface PageEntry {
  pageNumber: number;
  juzNumber: number;
  surahs: QuranPage['surahs'];
  ayahs: QuranPage['ayahs'];
}

const quranData: { pages: PageEntry[] } = require('../data/quranPages.json');

const SURAH_METADATA = getSurahMetadata();

const PAGE_CACHE: Record<number, QuranPage> = {};

const SURAH_CACHE: Record<number, SurahWithAyahs> = {};

const SURAH_AYAHS_MAP: Record<number, Ayah[]> = {};
const SURAH_FIRST_PAGE: Record<number, number> = {};
for (const page of quranData.pages) {
  for (const pa of page.ayahs) {
    if (!SURAH_AYAHS_MAP[pa.surahNumber]) {
      SURAH_AYAHS_MAP[pa.surahNumber] = [];
      SURAH_FIRST_PAGE[pa.surahNumber] = page.pageNumber;
    }
    SURAH_AYAHS_MAP[pa.surahNumber].push({
      number: pa.number,
      text: pa.text,
      numberInSurah: pa.numberInSurah,
      juz: pa.juz,
      manzil: pa.manzil,
      page: pa.page,
      ruku: pa.ruku,
      hizbQuarter: pa.hizbQuarter,
      sajda: pa.sajda,
      translation: pa.translation ?? undefined,
    });
  }
}

export function getPage(pageNum: number): QuranPage | null {
  if (pageNum < 1 || pageNum > 604) return null;

  if (PAGE_CACHE[pageNum]) return PAGE_CACHE[pageNum];

  const raw = quranData.pages[pageNum - 1];
  if (!raw) return null;

  const page: QuranPage = {
    pageNumber: raw.pageNumber,
    juzNumber: raw.juzNumber,
    surahs: raw.surahs,
    ayahs: raw.ayahs,
  };

  PAGE_CACHE[pageNum] = page;
  return page;
}

export function getOfflineSurah(surahNumber: number): SurahWithAyahs | null {
  if (surahNumber < 1 || surahNumber > 114) return null;

  if (SURAH_CACHE[surahNumber]) return SURAH_CACHE[surahNumber];

  const meta = SURAH_METADATA.find((s) => s.number === surahNumber);
  if (!meta) return null;

  const ayahs = SURAH_AYAHS_MAP[surahNumber] || [];

  const firstPageSurah = quranData.pages
    .flatMap(p => p.surahs)
    .find(s => s.number === surahNumber);

  const surah: SurahWithAyahs = {
    number: meta.number,
    name: firstPageSurah?.name || meta.name,
    englishName: meta.englishName,
    englishNameTranslation: firstPageSurah?.englishNameTranslation || meta.englishNameTranslation,
    numberOfAyahs: meta.numberOfAyahs,
    revelationType: meta.revelationType,
    ayahs,
  };

  SURAH_CACHE[surahNumber] = surah;
  return surah;
}

export function clearCache(): void {
  Object.keys(PAGE_CACHE).forEach(k => delete PAGE_CACHE[Number(k)]);
  Object.keys(SURAH_CACHE).forEach(k => delete SURAH_CACHE[Number(k)]);
}

export function getSurahStartPage(surahNumber: number): number | null {
  return SURAH_FIRST_PAGE[surahNumber] ?? null;
}

export function getTotalPages(): number {
  return quranData.pages.length;
}
