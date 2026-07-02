import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import ProgressModel from '../models/progress';
import FastingModel from '../models/fasting';

const router = Router();

function getDateStr(d?: Date): string {
  const date = d || new Date();
  return date.toISOString().split('T')[0];
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((da.getTime() - db.getTime()) / 86400000);
}

// GET /api/progress/stats — Aggregated smart progress with persistent goals
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  try {
    const [docs, fastings] = await Promise.all([
      ProgressModel.find({ user: userId }).lean().exec(),
      FastingModel.find({ user: userId }).lean().exec(),
    ]);

    const progressData: Record<string, any> = {};
    docs.forEach(d => progressData[d.type] = d.data || {});

    // --- Quran ---
    const quranData = progressData.quran || {};
    const surahsRead = Object.keys(quranData).length;
    const totalAyahsRead = Object.values(quranData).reduce((sum: number, s: any) => sum + (s.lastAyah || 0), 0);

    // --- Memorization ---
    const memData = progressData.memorization || {};
    const surahsMemorized = Object.keys(memData).length;
    let totalAyahsMemorized = 0;
    Object.values(memData).forEach((s: any) => {
      if (s.ayahs) totalAyahsMemorized += Object.keys(s.ayahs).length;
    });

    // --- Dhikr ---
    const dhikrData = progressData.dhikr || {};
    const totalDhikrCount = dhikrData.totalDhikrCount || 0;

    // --- Meta / Streak ---
    const metaData = progressData.meta || {};
    const dailyStreak = metaData.dailyStreak || 0;
    const lastActiveDate = metaData.lastActiveDate || null;

    // --- Fasting ---
    const totalFasted = fastings.filter(f => f.status === 'fasted').length;
    const ramadanFasted = fastings.filter(f => f.type === 'ramadan' && f.status === 'fasted').length;
    const sunnahFasted = fastings.filter(f => f.type === 'sunnah' && f.status === 'fasted').length;

    const fastedDates = [...new Set(fastings.filter(f => f.status === 'fasted').map(f => f.date))].sort().reverse();
    let fastingStreak = 0;
    if (fastedDates.length > 0) {
      const todayStr = getDateStr();
      if (fastedDates[0] === todayStr || daysBetween(todayStr, fastedDates[0]) <= 1) {
        fastingStreak = 1;
        for (let i = 1; i < fastedDates.length; i++) {
          if (daysBetween(fastedDates[i - 1], fastedDates[i]) === 1) fastingStreak++;
          else break;
        }
      }
    }

    // --- Week Activity (last 7 real days) ---
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekActivity: { label: string; completed: boolean; date: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getDateStr(d);
      const dayLabel = dayNames[d.getDay()];
      const wasActive = lastActiveDate === dateStr ||
        fastings.some(f => f.date === dateStr) ||
        Object.values(quranData).some((s: any) => {
          const readAt = s.lastReadAt?.split('T')[0];
          return readAt === dateStr;
        });
      weekActivity.push({ label: dayLabel, completed: wasActive, date: dateStr });
    }

    // --- Smart Weekly Goals (persistent, behavior-based) ---
    const storedGoals = metaData.weeklyGoals || {};

    // Quran goal: based on surahs read per week (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = getDateStr(weekAgo);
    const weeklySurahsRead = Object.values(quranData).filter((s: any) => {
      const readAt = s.lastReadAt?.split('T')[0];
      return readAt && readAt >= weekAgoStr;
    }).length;
    const weeklyAyahsRead = Object.values(quranData)
      .filter((s: any) => {
        const readAt = s.lastReadAt?.split('T')[0];
        return readAt && readAt >= weekAgoStr;
      })
      .reduce((sum: number, s: any) => sum + (s.lastAyah || 0), 0);

    // Fasting: days fasted this week
    const weekFasted = fastings.filter(f => {
      return f.status === 'fasted' && f.date >= weekAgoStr;
    }).length;

    // Azkar: total this week (estimate from logs)
    const dhikrLogs = dhikrData.logs || [];
    const weekDhikr = dhikrLogs
      .filter((l: any) => l.timestamp?.split('T')[0] >= weekAgoStr)
      .reduce((sum: number, l: any) => sum + (l.count || 0), 0);

    const weeklyGoals = {
      quran: {
        target: storedGoals.quran?.target || Math.max(5, Math.ceil(weeklyAyahsRead * 1.3) || 10),
        completed: weeklyAyahsRead,
        unit: 'quran.ayahs',
      },
      fasting: {
        target: storedGoals.fasting?.target || Math.max(1, Math.ceil(weekFasted * 1.3) || 3),
        completed: weekFasted,
        unit: 'progress.days',
      },
      azkar: {
        target: storedGoals.azkar?.target || Math.max(50, Math.ceil(weekDhikr * 1.2) || 100),
        completed: weekDhikr || totalDhikrCount,
        unit: 'progress.count',
      },
      prayer: {
        target: storedGoals.prayer?.target || 35,
        completed: storedGoals.prayer?.completed || 0,
        unit: 'progress.prayers',
      },
    };

    // Persist goals so they don't change randomly
    await ProgressModel.findOneAndUpdate(
      { user: userId, type: 'meta' },
      { $set: { 'data.weeklyGoals': weeklyGoals, 'data.lastStatsFetch': new Date().toISOString() } },
      { upsert: true }
    );

    res.json({
      success: true,
      data: {
        dailyStreak,
        totalDhikrCount,
        lastActiveDate,
        quran: { surahsRead, totalAyahsRead },
        memorization: { surahsMemorized, totalAyahsMemorized },
        fasting: { totalFasted, ramadanFasted, sunnahFasted, currentStreak: fastingStreak },
        weeklyGoals,
        weekActivity,
      },
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

export default router;
