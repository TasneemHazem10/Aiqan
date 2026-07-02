import axios from 'axios';

const QURAN_API = process.env.QURAN_API_BASE || 'https://api.alquran.cloud/v1';
const CACHE_TTL = 60 * 60 * 1000;
const MAX_CACHE_SIZE = 100;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

type QuranCache = Record<string, CacheEntry<unknown>>;

const cache: QuranCache = {};
const cacheKeys: string[] = [];

function getFromCache<T>(key: string): T | null {
  const cached = cache[key] as CacheEntry<T> | undefined;
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  if (cached) delete cache[key];
  return null;
}

function setCache<T>(key: string, data: T): void {
  if (cacheKeys.length >= MAX_CACHE_SIZE) {
    const oldest = cacheKeys.shift();
    if (oldest) delete cache[oldest];
  }
  cache[key] = { data, timestamp: Date.now() };
  if (!cacheKeys.includes(key)) cacheKeys.push(key);
}

export async function getAllSurahs() {
  const cacheKey = 'all_surahs';
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${QURAN_API}/surah`);
  const data = response.data.data;
  setCache(cacheKey, data);
  return data;
}

export async function getSurah(number: number, edition = 'quran-uthmani') {
  const cacheKey = `surah_${number}_${edition}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${QURAN_API}/surah/${number}/${edition}`);
  const data = response.data.data;
  setCache(cacheKey, data);
  return data;
}

export async function getSurahWithTranslation(number: number, language = 'en.sahih') {
  const cacheKey = `surah_trans_${number}_${language}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const [arabicRes, transRes] = await Promise.all([
    axios.get(`${QURAN_API}/surah/${number}/quran-uthmani`),
    axios.get(`${QURAN_API}/surah/${number}/${language}`),
  ]);

  const data = {
    surah: arabicRes.data.data,
    translation: transRes.data.data,
  };
  setCache(cacheKey, data);
  return data;
}

export async function getAyah(reference: string, edition = 'quran-uthmani') {
  const cacheKey = `ayah_${reference}_${edition}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${QURAN_API}/ayah/${reference}/${edition}`);
  const data = response.data.data;
  setCache(cacheKey, data);
  return data;
}

export async function searchQuran(keyword: string, language = 'en') {
  const cacheKey = `search_${keyword}_${language}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(
    `${QURAN_API}/search/${encodeURIComponent(keyword)}/all/${language}`
  );
  const data = response.data.data;
  setCache(cacheKey, data);
  return data;
}

export async function getPage(pageNumber: number, edition = 'quran-uthmani') {
  const cacheKey = `page_${pageNumber}_${edition}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${QURAN_API}/page/${pageNumber}/${edition}`);
  const data = response.data.data;
  setCache(cacheKey, data);
  return data;
}

export async function getJuz(juzNumber: number, edition = 'quran-uthmani') {
  const cacheKey = `juz_${juzNumber}_${edition}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${QURAN_API}/juz/${juzNumber}/${edition}`);
  const data = response.data.data;
  setCache(cacheKey, data);
  return data;
}

export async function getEditions(type?: string, language?: string) {
  let url = `${QURAN_API}/edition`;
  const params: string[] = [];
  if (type) params.push(`type=${type}`);
  if (language) params.push(`language=${language}`);
  if (params.length > 0) url += `?${params.join('&')}`;

  const response = await axios.get(url);
  return response.data.data;
}

export function getAudioUrl(reciterIdentifier: string, surahNumber: number): string {
  const paddedSurah = String(surahNumber).padStart(3, '0');
  return `https://cdn.islamic.network/quran/audio-surah/128/${reciterIdentifier}/${paddedSurah}.mp3`;
}

export function getAyahAudioUrl(
  reciterIdentifier: string,
  ayahGlobalNumber: number
): string {
  return `https://cdn.islamic.network/quran/audio/128/${reciterIdentifier}/${ayahGlobalNumber}.mp3`;
}

export function getAyahAudioUrlBySurah(
  reciterIdentifier: string,
  surahNumber: number,
  ayahNumber: number
): string {
  const surahPadded = String(surahNumber).padStart(3, '0');
  const ayahPadded = String(ayahNumber).padStart(3, '0');
  return `https://cdn.islamic.network/quran/audio-surah/128/${reciterIdentifier}/${surahPadded}_${ayahPadded}.mp3`;
}
