const HIJRI_BASE = new Date(2023, 6, 19);
const BASE_HIJRI = { year: 1445, month: 1, day: 1 };
const MONTH_DAYS = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];

function isHijriLeapYear(year: number): boolean {
  return ((year % 30) * 11 + 14) % 30 < 11;
}

export function monthDays(year: number, month: number): number {
  const base = MONTH_DAYS[month - 1];
  if (month === 12 && isHijriLeapYear(year)) return 30;
  return base;
}

function hijriYearDays(year: number): number {
  return monthDays(year, 1) + monthDays(year, 2) + monthDays(year, 3) +
    monthDays(year, 4) + monthDays(year, 5) + monthDays(year, 6) +
    monthDays(year, 7) + monthDays(year, 8) + monthDays(year, 9) +
    monthDays(year, 10) + monthDays(year, 11) + monthDays(year, 12);
}

export function gregorianToHijri(date: Date): { year: number; month: number; day: number } {
  const diff = Math.floor((date.getTime() - HIJRI_BASE.getTime()) / 86400000);
  let hy = BASE_HIJRI.year, hm = BASE_HIJRI.month, hd = BASE_HIJRI.day + diff;
  while (hd > 0) {
    const dim = monthDays(hy, hm);
    if (hd > dim) { hd -= dim; hm++; if (hm > 12) { hm = 1; hy++; } }
    else break;
  }
  if (hd <= 0) { hm--; if (hm < 1) { hm = 12; hy--; } hd += monthDays(hy, hm); }
  return { year: hy, month: hm, day: hd };
}

export function hijriToGregorian(hy: number, hm: number, hd: number): Date {
  let totalDays = 0;
  let y = BASE_HIJRI.year, m = BASE_HIJRI.month;
  while (y < hy || (y === hy && m < hm)) {
    totalDays += monthDays(y, m);
    m++; if (m > 12) { m = 1; y++; }
  }
  while (y > hy || (y === hy && m > hm)) {
    m--; if (m < 1) { m = 12; y--; }
    totalDays -= monthDays(y, m);
  }
  totalDays += hd - BASE_HIJRI.day;
  const g = new Date(HIJRI_BASE);
  g.setDate(g.getDate() + totalDays);
  return g;
}

export function hijriMonthName(month: number, lang: 'ar' | 'en'): string {
  const names: Record<string, string[]> = {
    ar: ['محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الثانية', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'],
    en: ['Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani", 'Jumada al-Ula', 'Jumada al-Thaniyah', 'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah'],
  };
  return names[lang]?.[month - 1] || '';
}

export function formatHijriDate(hy: number, hm: number, hd: number): string {
  return `${hy}-${String(hm).padStart(2, '0')}-${String(hd).padStart(2, '0')}`;
}
