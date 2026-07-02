import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import FastingModel from '../models/fasting';
import IslamicEventModel from '../models/islamicEvent';
import events from '../data/islamicEvents.json';

const router = Router();

const ISLAMIC_MONTHS_EN = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
  'Jumada al-Ula', 'Jumada al-Thaniyah', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah',
];

const ISLAMIC_MONTHS_AR = [
  'المحرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
  'جمادى الأولى', 'جمادى الثانية', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة',
];

const GREGORIAN_MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function isIslamicLeapYear(year: number): boolean {
  return ((year * 11) + 14) % 30 < 11;
}

function getIslamicMonthDays(year: number, month: number): number {
  if (month === 12) return isIslamicLeapYear(year) ? 30 : 29;
  return month % 2 === 1 ? 30 : 29;
}

function gregorianToJD(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045.5;
}

function JDToGregorian(jd: number): { year: number; month: number; day: number } {
  const j = Math.floor(jd + 0.5);
  const z = j + 1;
  const e = Math.floor((4 * z + 3) / 146097);
  const f = z - Math.floor((146097 * e) / 4);
  const g = Math.floor((4 * f + 3) / 1461);
  const h = f - Math.floor((1461 * g) / 4);
  const i = Math.floor((5 * h + 2) / 153);
  const day = h - Math.floor((153 * i + 2) / 5) + 1;
  const month = i < 10 ? i + 3 : i - 9;
  const year = month < 3 ? z - 4715 - e : z - 4716 - e;
  return { year, month, day };
}

const REF_JD = 2460503.5;

function JDToIslamic(jd: number): { year: number; month: number; day: number } {
  const diff = Math.round(jd - REF_JD);
  let remaining = diff;
  let year = 1446;

  while (true) {
    const yearDays = isIslamicLeapYear(year) ? 355 : 354;
    if (remaining < yearDays) break;
    remaining -= yearDays;
    year++;
  }

  let month = 1;
  for (let m = 1; m <= 12; m++) {
    const monthDays = getIslamicMonthDays(year, m);
    if (remaining < monthDays) {
      month = m;
      break;
    }
    remaining -= monthDays;
  }

  return { year, month, day: remaining + 1 };
}

function islamicToJD(year: number, month: number, day: number): number {
  let totalDays = 0;
  for (let y = 1446; y < year; y++) {
    totalDays += isIslamicLeapYear(y) ? 355 : 354;
  }
  for (let m = 1; m < month; m++) {
    totalDays += getIslamicMonthDays(year, m);
  }
  totalDays += day - 1;
  return REF_JD + totalDays;
}

function pad(n: number): string {
  return n < 10 ? '0' + n : '' + n;
}

// GET /api/islamic/hijri-calendar/:year/:month
router.get('/hijri-calendar/:year/:month', async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ success: false, error: 'Invalid year or month' });
    }

    const monthDays = getIslamicMonthDays(year, month);
    const jdStart = islamicToJD(year, month, 1);
    const days: Array<{ day: number; gregorianDate: string; monthDay: number; monthName: string }> = [];

    for (let d = 1; d <= monthDays; d++) {
      const jd = jdStart + d - 1;
      const g = JDToGregorian(jd);
      days.push({
        day: d,
        gregorianDate: `${g.year}-${pad(g.month)}-${pad(g.day)}`,
        monthDay: g.day,
        monthName: GREGORIAN_MONTHS_EN[g.month - 1],
      });
    }

    res.json({
      success: true,
      data: {
        year,
        month,
        monthName: ISLAMIC_MONTHS_EN[month - 1],
        monthNameAr: ISLAMIC_MONTHS_AR[month - 1],
        totalDays: monthDays,
        days,
      },
    });
  } catch (err) {
    console.error('Hijri calendar error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate calendar' });
  }
});

// GET /api/islamic/hijri-today
router.get('/hijri-today', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const jd = gregorianToJD(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const islamic = JDToIslamic(jd);
    res.json({
      success: true,
      data: {
        year: islamic.year,
        month: islamic.month,
        day: islamic.day,
        monthName: ISLAMIC_MONTHS_EN[islamic.month - 1],
        monthNameAr: ISLAMIC_MONTHS_AR[islamic.month - 1],
        fullDate: `${islamic.day} ${ISLAMIC_MONTHS_EN[islamic.month - 1]} ${islamic.year}`,
        fullDateAr: `${islamic.day} ${ISLAMIC_MONTHS_AR[islamic.month - 1]} ${islamic.year}`,
      },
    });
  } catch (err) {
    console.error('Hijri today error:', err);
    res.status(500).json({ success: false, error: 'Failed to get Hijri date' });
  }
});

// GET /api/islamic/events
router.get('/events', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const allEvents = events.map((e: any) => ({
      ...e,
      isUpcoming: e.gregorianDate >= todayStr,
      daysUntil: Math.ceil((new Date(e.gregorianDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
    }));

    const upcoming = allEvents.filter((e: any) => e.isUpcoming).sort((a: any, b: any) => a.gregorianDate.localeCompare(b.gregorianDate));

    res.json({ success: true, data: { events: allEvents, upcoming } });
  } catch (err) {
    console.error('Events error:', err);
    res.status(500).json({ success: false, error: 'Failed to get events' });
  }
});

// POST /api/islamic/fasting
router.post('/fasting', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { date, type, status, notes } = req.body;
    if (!date || !type || !status) {
      return res.status(400).json({ success: false, error: 'date, type, and status required' });
    }

    const fasting = await FastingModel.findOneAndUpdate(
      { user: userId, date },
      { user: userId, date, type, status, notes },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: fasting, message: 'Fasting record saved' });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: 'Duplicate fasting record for this date' });
    }
    console.error('Fasting record error:', err);
    res.status(500).json({ success: false, error: 'Failed to save fasting record' });
  }
});

// GET /api/islamic/fasting
router.get('/fasting', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { month, year } = req.query;

    let filter: any = { user: userId };
    if (month && year) {
      const m = parseInt(month as string);
      const y = parseInt(year as string);
      const prefix = `${y}-${pad(m)}`;
      filter.date = { $regex: `^${prefix}` };
    }

    const records = await FastingModel.find(filter).sort({ date: -1 }).lean();
    res.json({ success: true, data: records });
  } catch (err) {
    console.error('Fasting records error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch fasting records' });
  }
});

// GET /api/islamic/fasting/stats
router.get('/fasting/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const totalFasted = await FastingModel.countDocuments({ user: userId, status: 'fasted' });
    const totalMissed = await FastingModel.countDocuments({ user: userId, status: 'missed' });
    const totalPlanned = await FastingModel.countDocuments({ user: userId, status: 'planned' });
    const ramadanFasted = await FastingModel.countDocuments({ user: userId, type: 'ramadan', status: 'fasted' });
    const sunnahFasted = await FastingModel.countDocuments({ user: userId, type: 'sunnah', status: 'fasted' });
    const qadaFasted = await FastingModel.countDocuments({ user: userId, type: 'qada', status: 'fasted' });

    res.json({
      success: true,
      data: {
        totalFasted,
        totalMissed,
        totalPlanned,
        ramadanFasted,
        sunnahFasted,
        qadaFasted,
      },
    });
  } catch (err) {
    console.error('Fasting stats error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch fasting stats' });
  }
});

// DELETE /api/islamic/fasting/:id
router.delete('/fasting/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const record = await FastingModel.findOneAndDelete({ _id: req.params.id, user: userId });
    if (!record) {
      return res.status(404).json({ success: false, error: 'Fasting record not found' });
    }
    res.json({ success: true, message: 'Fasting record deleted' });
  } catch (err) {
    console.error('Delete fasting error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete fasting record' });
  }
});

// POST /api/islamic/zakat/calculate
router.post('/zakat/calculate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      cash = 0, gold = 0, silver = 0, investments = 0, property = 0,
      currency = 'USD',
    } = req.body;

    // Fetch live gold/silver prices (USD per troy ounce)
    let goldPricePerOz = 2350;
    let silverPricePerOz = 28;
    let exchangeRates: Record<string, number> = {
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
    try {
      const [goldRes, silverRes, fxRes] = await Promise.all([
        fetch('https://api.metals.live/v1/spot/gold').then(r => r.json()).catch(() => null),
        fetch('https://api.metals.live/v1/spot/silver').then(r => r.json()).catch(() => null),
        fetch('https://api.exchangerate-api.com/v4/latest/USD').then(r => r.json()).catch(() => null),
      ]);
      const goldData = goldRes as Array<{ price: number }> | null;
      const silverData = silverRes as Array<{ price: number }> | null;
      const fxData = fxRes as { rates?: Record<string, number> } | null;
      if (goldData && goldData.length > 0) goldPricePerOz = goldData[0]?.price || goldPricePerOz;
      if (silverData && silverData.length > 0) silverPricePerOz = silverData[0]?.price || silverPricePerOz;
      if (fxData?.rates) exchangeRates = { ...exchangeRates, ...fxData.rates };
    } catch {
      // fallback to hardcoded defaults
    }

    const TROY_OZ_TO_GRAM = 31.1035;
    const goldPricePerGram = goldPricePerOz / TROY_OZ_TO_GRAM;
    const silverPricePerGram = silverPricePerOz / TROY_OZ_TO_GRAM;

    const rate = exchangeRates[currency] || 1;

    const goldValue = gold * goldPricePerGram * rate;
    const silverValue = silver * silverPricePerGram * rate;
    const totalWealth = cash + goldValue + silverValue + investments + property;

    const nisabGold = 85 * goldPricePerGram * rate;
    const nisabSilver = 595 * silverPricePerGram * rate;
    const nisabThreshold = Math.min(nisabGold, nisabSilver);

    const isAboveNisab = totalWealth >= nisabThreshold;
    const zakatDue = isAboveNisab ? totalWealth * 0.025 : 0;

    res.json({
      success: true,
      data: {
        breakdown: [
          { label: 'Cash', amount: cash },
          { label: 'Gold', amount: goldValue },
          { label: 'Silver', amount: silverValue },
          { label: 'Investments', amount: investments },
          { label: 'Property', amount: property },
        ],
        totalWealth,
        nisabThreshold,
        zakatDue,
        isAboveNisab,
        prices: {
          goldPerGram: goldPricePerGram * rate,
          silverPerGram: silverPricePerGram * rate,
          currency,
        },
      },
    });
  } catch (err) {
    console.error('Zakat calculation error:', err);
    res.status(500).json({ success: false, error: 'Failed to calculate zakat' });
  }
});

export default router;
