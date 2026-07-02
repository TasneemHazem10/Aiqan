import axios from 'axios';

const PRAYER_API = process.env.PRAYER_API_BASE || 'https://api.aladhan.com/v1';
const CACHE_TTL = 30 * 60 * 1000;
const MAX_CACHE_SIZE = 200;

interface CacheEntry {
  data: unknown;
  timestamp: number;
}
const cache: Record<string, CacheEntry> = {};
const cacheKeys: string[] = [];

function getFromCache<T>(key: string): T | null {
  const cached = cache[key] as CacheEntry | undefined;
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
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

export const PRAYER_METHODS: Record<number, string> = {
  0: 'Shia Ithna-Ansari',
  1: 'University of Islamic Sciences, Karachi',
  2: 'Islamic Society of North America',
  3: 'Muslim World League',
  4: 'Umm Al-Qura University, Makkah',
  5: 'Egyptian General Authority of Survey',
  7: 'Institute of Geophysics, University of Tehran',
  8: 'Gulf Region',
  9: 'Kuwait',
  10: 'Qatar',
  11: 'Majlis Ugama Islam Singapura',
  12: 'Union Organization islamic de France',
  13: 'Diyanet İşleri Başkanlığı',
  14: 'Spiritual Administration of Muslims of Russia',
  15: 'Moonsighting Committee Worldwide (Moonsighting.com)',
  16: 'Dubai (experimental)',
};

export async function getPrayerTimesByCity(
  city: string,
  country: string,
  method = 5,
  date?: string
) {
  const dateStr = date || new Date().toLocaleDateString('en-GB').split('/').join('-');
  const cacheKey = `prayer_city_${city}_${country}_${method}_${dateStr}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${PRAYER_API}/timingsByCity/${dateStr}`, {
    params: { city, country, method },
  });
  const data = response.data.data;
  setCache(cacheKey, data);
  return data;
}

export async function getPrayerTimesByCoords(
  latitude: number,
  longitude: number,
  method = 5,
  date?: string
) {
  const dateStr = date || new Date().toLocaleDateString('en-GB').split('/').join('-');
  const cacheKey = `prayer_coords_${latitude}_${longitude}_${method}_${dateStr}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${PRAYER_API}/timings/${dateStr}`, {
    params: { latitude, longitude, method },
  });
  const data = response.data.data;
  setCache(cacheKey, data);
  return data;
}

export async function getMonthlyPrayerTimes(
  city: string,
  country: string,
  month: number,
  year: number,
  method = 5
) {
  const cacheKey = `monthly_${city}_${country}_${method}_${month}_${year}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${PRAYER_API}/calendarByCity/${year}/${month}`, {
    params: { city, country, method },
  });
  const data = response.data.data;
  setCache(cacheKey, data);
  return data;
}

export async function getHijriDate(date?: string) {
  const dateStr = date || new Date().toLocaleDateString('en-GB').split('/').join('-');
  const cacheKey = `hijri_${dateStr}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${PRAYER_API}/gToH/${dateStr}`);
  const data = response.data.data;
  setCache(cacheKey, data);
  return data;
}

export async function getHijriCalendar(month: number, year: number) {
  const cacheKey = `hijri_cal_${month}_${year}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${PRAYER_API}/hToGCalendar/${month}/${year}`);
  const data = response.data.data;
  setCache(cacheKey, data);
  return data;
}

export async function getIslamicHolidays(year: number) {
  const cacheKey = `holidays_${year}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${PRAYER_API}/specialDays/${year}`);
  const data = response.data.data;
  setCache(cacheKey, data);
  return data;
}

export async function convertHijriToGregorian(
  day: number,
  month: number,
  year: number
) {
  const cacheKey = `h2g_${day}_${month}_${year}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${PRAYER_API}/hToG/${day}/${month}/${year}`);
  const data = response.data.data;
  setCache(cacheKey, data);
  return data;
}

export function calculateQibla(latitude: number, longitude: number): number {
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error(`Invalid coordinates: lat=${latitude}, lng=${longitude}`);
  }

  const KAABA_LAT = 21.4225;
  const KAABA_LNG = 39.8262;

  const lat1 = (latitude * Math.PI) / 180;
  const lat2 = (KAABA_LAT * Math.PI) / 180;
  const dLng = ((KAABA_LNG - longitude) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;
  return Math.round(bearing * 100) / 100;
}
