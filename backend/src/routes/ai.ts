import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as geminiService from '../services/geminiService';
import ProgressModel from '../models/progress';
import HifzPlanModel from '../models/hifzPlan';

const router = Router();

// POST /api/ai/memorize/check
router.post('/memorize/check', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { referenceText, userText } = req.body;
    if (!referenceText || !userText) return res.status(400).json({ success: false, error: 'referenceText and userText required' });

    function normalizeArabic(s: string) {
      if (!s) return '';
      return s.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
              .replace(/[^\u0600-\u06FF0-9a-zA-Z\s]/g, '')
              .replace(/\s+/g, ' ')
              .trim();
    }

    const ref = normalizeArabic(referenceText).split(' ');
    const usr = normalizeArabic(userText).split(' ');

    const maxLen = Math.max(ref.length, usr.length);
    const words: Array<{ word: string; status: 'correct' | 'incorrect' | 'missing' | 'extra' }> = [];
    for (let i = 0; i < maxLen; i++) {
      const r = ref[i];
      const u = usr[i];
      if (r && u) {
        if (r === u) words.push({ word: r, status: 'correct' });
        else {
          const equal = r.replace(/\s+/g,'') === u.replace(/\s+/g,'');
          words.push({ word: r, status: equal ? 'correct' : 'incorrect' });
        }
      } else if (r && !u) {
        words.push({ word: r, status: 'missing' });
      } else if (!r && u) {
        words.push({ word: u, status: 'extra' });
      }
    }

    res.json({ success: true, data: { words } });
  } catch (err) {
    console.error('Memorize check error:', err);
    res.status(500).json({ success: false, error: 'Failed to check memorization' });
  }
});

// POST /api/ai/hifz-plan - generate plan
router.post('/hifz-plan', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { memorizationData, userLevel } = req.body;
    const plan = await geminiService.generateHifzPlan(memorizationData || {}, userLevel || 'beginner');
    res.json({ success: true, data: plan });
  } catch (err) {
    console.error('Hifz plan error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate hifz plan' });
  }
});

const MOOD_CONTENT: Record<string, {
  surahs: { number: number; name: string; reason: string }[];
  ayat: { reference: string; text: string; explanation: string }[];
  duas: { title: string; arabic: string; translation: string }[];
}> = {
  anxious: {
    surahs: [
      { number: 94, name: 'Al-Inshirah', reason: 'Brings comfort and relief from distress' },
      { number: 113, name: 'Al-Falaq', reason: 'Protection from anxiety and fear' },
    ],
    ayat: [
      { reference: '13:28', text: 'أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ', explanation: 'Verily, in the remembrance of Allah do hearts find rest' },
      { reference: '94:5-6', text: 'فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا . إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا', explanation: 'For indeed, with hardship comes ease' },
    ],
    duas: [
      { title: 'Dua for anxiety', arabic: 'ٱللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ ٱلْهَمِّ وَٱلْحَزَنِ', translation: 'O Allah, I seek refuge in You from anxiety and grief' },
      { title: 'Hasbunallahu', arabic: 'حَسْبُنَا ٱللَّهُ وَنِعْمَ ٱلْوَكِيلُ', translation: 'Sufficient for us is Allah, and He is the best Disposer of affairs' },
    ],
  },
  sad: {
    surahs: [
      { number: 93, name: 'Ad-Duha', reason: 'Revealed to comfort the Prophet ﷺ during hardship' },
      { number: 94, name: 'Al-Inshirah', reason: 'Relief and expansion of the chest' },
    ],
    ayat: [
      { reference: '94:6', text: 'إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا', explanation: 'Indeed, with hardship comes ease' },
      { reference: '39:53', text: 'لَا تَقْنَطُوا مِن رَّحْمَةِ ٱللَّهِ', explanation: 'Do not despair of the mercy of Allah' },
    ],
    duas: [
      { title: 'Dua for sadness', arabic: 'ٱللَّهُمَّ إِنِّي عَبْدُكَ وَٱبْنُ عَبْدِكَ...', translation: 'O Allah, I am Your servant, son of Your servant...' },
      { title: 'Dua of Yunus', arabic: 'لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ ٱلظَّٰلِمِينَ', translation: 'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers' },
    ],
  },
  angry: {
    surahs: [
      { number: 103, name: 'Al-Asr', reason: 'Reminds of the passing of time and patience' },
      { number: 3, name: "Aal-e-Imran", reason: 'Contains verses about controlling anger and forgiveness' },
    ],
    ayat: [
      { reference: '3:134', text: 'وَٱلْكَٰظِمِينَ ٱلْغَيْظَ وَٱلْعَافِينَ عَنِ ٱلنَّاسِ', explanation: 'Those who repress anger and pardon people' },
      { reference: '42:37', text: 'وَإِذَا مَا غَضِبُوا هُمْ يَغْفِرُونَ', explanation: 'And when they are angry, they forgive' },
    ],
    duas: [
      { title: 'Dua for anger', arabic: 'أَعُوذُ بِٱللَّهِ مِنَ ٱلشَّيْطَٰنِ ٱلرَّجِيمِ', translation: 'I seek refuge in Allah from the accursed Shaytan' },
    ],
  },
  tired: {
    surahs: [
      { number: 94, name: 'Al-Inshirah', reason: 'Renewal of energy and relief' },
      { number: 36, name: 'Ya-Sin', reason: 'Known as the heart of the Quran, brings spiritual energy' },
    ],
    ayat: [
      { reference: '65:2-3', text: 'وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُۥٓ', explanation: 'And whoever relies upon Allah, then He is sufficient for him' },
    ],
    duas: [
      { title: 'Dua for strength', arabic: 'ٱللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا', translation: 'O Allah, there is no ease except what You make easy' },
    ],
  },
  grateful: {
    surahs: [
      { number: 55, name: 'Ar-Rahman', reason: 'Repeatedly asks "Which of the favors of your Lord will you deny?"' },
      { number: 1, name: 'Al-Fatihah', reason: 'Opens with praise and gratitude to Allah' },
    ],
    ayat: [
      { reference: '14:7', text: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ', explanation: 'If you are grateful, I will surely increase you' },
      { reference: '55:13', text: 'فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ', explanation: 'So which of the favors of your Lord would you deny?' },
    ],
    duas: [
      { title: 'Dua of gratitude', arabic: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ', translation: 'All praise is due to Allah, Lord of all the worlds' },
    ],
  },
  guidance: {
    surahs: [
      { number: 18, name: 'Al-Kahf', reason: 'Full of guidance, stories of faith, and protection from trials' },
      { number: 20, name: 'Ta-Ha', reason: 'Story of Musa (AS) seeking guidance and strength from Allah' },
    ],
    ayat: [
      { reference: '2:255', text: 'ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ', explanation: 'Ayat al-Kursi - the greatest verse of guidance and protection' },
      { reference: '1:6', text: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ', explanation: 'Guide us to the straight path' },
    ],
    duas: [
      { title: 'Dua for guidance (Istikhara)', arabic: 'ٱللَّهُمَّ إِنِّىٓ أَسْتَخِيرُكَ بِعِلْمِكَ', translation: 'O Allah, I seek Your guidance through Your knowledge' },
      { title: 'Dua for knowledge', arabic: 'رَّبِّ زِدْنِى عِلْمًا', translation: 'My Lord, increase me in knowledge' },
    ],
  },
};

function buildStructuredResponse(content: typeof MOOD_CONTENT[string], message: string) {
  return {
    message,
    surahs: content.surahs,
    ayat: content.ayat,
    duas: content.duas,
  };
}

// POST /api/ai/assistant
router.post('/assistant', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { messages: conversation, language } = req.body;
    const query = conversation?.[conversation.length - 1]?.content || req.body.query;
    if (!query) {
      return res.status(400).json({ success: false, error: 'query required' });
    }

    const systemPrompt = `You are Aiqan AI, a warm, friendly, and deeply knowledgeable universal assistant. You answer questions about ANY topic without limitation — Islamic knowledge, science, technology, programming, history, philosophy, health, psychology, current events, arts, literature, business, personal advice, relationships, sports, entertainment, or just casual chat.

Guidelines:
- Be conversational, warm, and engaging — like a knowledgeable friend, not a robot.
- Give thorough, accurate, and well-structured answers. Use examples and clear explanations.
- When asked about Islamic topics, draw from Quran and authentic hadith with references where possible.
- For science/tech questions, give clear explanations with practical context.
- For personal advice, be empathetic, practical, and balanced.
- For creative topics, be imaginative and supportive.
- Respond in the SAME LANGUAGE the user writes in (Arabic or English).
- If you don't know something, say so honestly — never make things up.
- Keep responses concise but complete — depth over fluff.`;

    const geminiMessages = conversation && conversation.length > 1
      ? conversation.map((m: { role: string; content: string }) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          content: m.content,
        }))
      : [{ role: 'user' as const, content: query }];

    const reply = await geminiService.chatCompletion(systemPrompt, geminiMessages, 2048);
    res.json({ success: true, data: { message: reply } });
  } catch (err) {
    console.error('AI assistant error:', err);
    res.status(500).json({ success: false, error: 'Failed to get AI response' });
  }
});

// GET /api/ai/recs
router.get('/recs', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const docs = await ProgressModel.find({ user: userId }).lean();

    const data: Record<string, any> = {};
    docs.forEach(d => data[d.type] = d.data || {});

    const meta = data.meta || {};
    const quranProgress = data.quran || {};
    const memorization = data.memorization || {};
    const dhikr = data.dhikr || {};

    const streak = meta.dailyStreak || 0;
    const totalDhikr = dhikr.totalDhikrCount || 0;
    const surahsRead = Object.keys(quranProgress).length;
    const memorizedCount = Object.keys(memorization).length;

    const recs: Array<{ type: string; title: string; description: string; priority: string }> = [];

    if (surahsRead === 0) {
      recs.push({ type: 'quran', title: 'Start Reading Quran', description: 'Begin with Surah Al-Fatiha and work your way through Juz 1', priority: 'high' });
    } else if (surahsRead < 10) {
      recs.push({ type: 'quran', title: 'Daily Quran Reading', description: 'You have read ' + surahsRead + ' surahs. Try to read 1 page daily.', priority: 'high' });
    }

    if (streak === 0) {
      recs.push({ type: 'streak', title: 'Start Your Streak', description: 'Open the app daily to build your consistency streak.', priority: 'high' });
    } else if (streak < 7) {
      recs.push({ type: 'streak', title: 'Keep Your Streak Going!', description: 'You have a ' + streak + '-day streak. Reach 7 days for a weekly achievement!', priority: 'medium' });
    } else if (streak >= 30) {
      recs.push({ type: 'streak', title: 'Amazing Streak!', description: 'You have a ' + streak + '-day streak! Consider joining a community challenge.', priority: 'low' });
    }

    if (memorizedCount === 0) {
      recs.push({ type: 'memorization', title: 'Start Memorizing', description: 'Begin with short surahs like Al-Ikhlas, Al-Falaq, and An-Nas.', priority: 'medium' });
    } else {
      recs.push({ type: 'memorization', title: 'Review Memorized Ayahs', description: 'You have memorized ' + memorizedCount + ' ayahs. Daily revision is key to retention.', priority: 'medium' });
    }

    if (totalDhikr < 100) {
      recs.push({ type: 'dhikr', title: 'Increase Your Dhikr', description: 'Try saying SubhanAllah 33x, Alhamdulillah 33x, Allahu Akbar 34x after each prayer.', priority: 'low' });
    }

    recs.push({
      type: 'general',
      title: 'Morning & Evening Adhkar',
      description: 'Don\'t forget the morning and evening adhkar for daily protection and blessings.',
      priority: 'medium',
    });

    recs.push({
      type: 'general',
      title: 'Weekly Goal',
      description: (meta.weeklyGoal || 7) > 0 ? 'Try to complete at least ' + (meta.weeklyGoal || 7) + ' days of worship this week.' : 'Set a weekly goal to stay motivated.',
      priority: 'medium',
    });

    res.json({ success: true, data: { recommendations: recs, userStats: { streak, totalDhikr, surahsRead, memorizedCount } } });
  } catch (err) {
    console.error('Recommendations error:', err);
    res.status(500).json({ success: false, error: 'Failed to get recommendations' });
  }
});

// ─── AI Hifz Coach ────────────────────────────────────────────────

// POST /api/ai/hifz/weak-ayah - Track a weak ayah
router.post('/hifz/weak-ayah', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { surahNumber, ayahNumber, strength } = req.body;
    if (!surahNumber || !ayahNumber) {
      return res.status(400).json({ success: false, error: 'surahNumber and ayahNumber required' });
    }

    let plan = await HifzPlanModel.findOne({ user: userId });
    if (!plan) {
      plan = new HifzPlanModel({ user: userId, weakAyahs: [], dailyPlans: [], currentLevel: 'beginner', weeklyGoal: 7 });
    }

    const existing = plan.weakAyahs.find(
      w => w.surahNumber === surahNumber && w.ayahNumber === ayahNumber
    );
    if (existing) {
      existing.strength = strength ?? Math.max(0, existing.strength - 10);
      existing.lastReviewed = new Date();
      existing.reviewCount += 1;
    } else {
      plan.weakAyahs.push({
        surahNumber,
        ayahNumber,
        strength: strength ?? 30,
        lastReviewed: new Date(),
        reviewCount: 1,
      });
    }

    await plan.save();
    res.json({ success: true, data: { weakAyahs: plan.weakAyahs } });
  } catch (err) {
    console.error('Weak ayah error:', err);
    res.status(500).json({ success: false, error: 'Failed to track weak ayah' });
  }
});

// GET /api/ai/hifz/weak-ayahs - Get all weak ayahs for user
router.get('/hifz/weak-ayahs', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    let plan = await HifzPlanModel.findOne({ user: userId });
    if (!plan) {
      plan = new HifzPlanModel({ user: userId, weakAyahs: [], dailyPlans: [], currentLevel: 'beginner', weeklyGoal: 7 });
      await plan.save();
    }
    const sorted = [...plan.weakAyahs].sort((a, b) => a.strength - b.strength);
    res.json({ success: true, data: { weakAyahs: sorted } });
  } catch (err) {
    console.error('Weak ayahs error:', err);
    res.status(500).json({ success: false, error: 'Failed to get weak ayahs' });
  }
});

// POST /api/ai/hifz/plan/generate - Generate a revision plan
router.post('/hifz/plan/generate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    let plan = await HifzPlanModel.findOne({ user: userId });
    if (!plan) {
      plan = new HifzPlanModel({ user: userId, weakAyahs: [], dailyPlans: [], currentLevel: 'beginner', weeklyGoal: 7 });
    }

    const weak = [...plan.weakAyahs].sort((a, b) => a.strength - b.strength);
    const dailyPlans: Array<{ date: string; tasks: Array<{ surahNumber: number; ayahRange: string; reps: number; completed: boolean }> }> = [];
    const daysToPlan = 7;

    for (let day = 0; day < daysToPlan; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);
      const dateStr = date.toISOString().split('T')[0];
      const tasks: Array<{ surahNumber: number; ayahRange: string; reps: number; completed: boolean }> = [];

      const dayWeakAyahs = weak.filter((_, i) => i % daysToPlan === day);
      const groupedBySurah = new Map<number, number[]>();
      for (const w of dayWeakAyahs) {
        if (!groupedBySurah.has(w.surahNumber)) groupedBySurah.set(w.surahNumber, []);
        groupedBySurah.get(w.surahNumber)!.push(w.ayahNumber);
      }

      for (const [surahNumber, ayahNumbers] of groupedBySurah) {
        ayahNumbers.sort((a, b) => a - b);
        let rangeStart = ayahNumbers[0];
        let prev = ayahNumbers[0];
        const ranges: string[] = [];

        for (let i = 1; i <= ayahNumbers.length; i++) {
          if (i === ayahNumbers.length || ayahNumbers[i] !== prev + 1) {
            ranges.push(rangeStart === prev ? `${rangeStart}` : `${rangeStart}-${prev}`);
            if (i < ayahNumbers.length) { rangeStart = ayahNumbers[i]; prev = ayahNumbers[i]; }
          } else {
            prev = ayahNumbers[i];
          }
        }

        for (const range of ranges) {
          const weakItem = plan.weakAyahs.find(w => w.surahNumber === surahNumber && w.ayahNumber === parseInt(range.split('-')[0]));
          const reps = weakItem && weakItem.strength < 30 ? 5 : weakItem && weakItem.strength < 60 ? 3 : 1;
          tasks.push({ surahNumber, ayahRange: range, reps, completed: false });
        }
      }

      dailyPlans.push({ date: dateStr, tasks });
    }

    plan.dailyPlans = dailyPlans;
    await plan.save();
    res.json({ success: true, data: { dailyPlans } });
  } catch (err) {
    console.error('Generate plan error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate plan' });
  }
});

// GET /api/ai/hifz/plan - Get current plan
router.get('/hifz/plan', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const plan = await HifzPlanModel.findOne({ user: userId });
    if (!plan) {
      return res.json({ success: true, data: { dailyPlans: [], currentLevel: 'beginner', weeklyGoal: 7 } });
    }
    res.json({ success: true, data: { dailyPlans: plan.dailyPlans, currentLevel: plan.currentLevel, weeklyGoal: plan.weeklyGoal } });
  } catch (err) {
    console.error('Get plan error:', err);
    res.status(500).json({ success: false, error: 'Failed to get plan' });
  }
});

// POST /api/ai/hifz/plan/task/complete - Mark a task as complete
router.post('/hifz/plan/task/complete', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { taskIndex, date } = req.body;
    if (taskIndex === undefined || !date) {
      return res.status(400).json({ success: false, error: 'taskIndex and date required' });
    }

    const plan = await HifzPlanModel.findOne({ user: userId });
    if (!plan) {
      return res.status(404).json({ success: false, error: 'No plan found' });
    }

    const dayPlan = plan.dailyPlans.find(d => d.date === date);
    if (!dayPlan) {
      return res.status(404).json({ success: false, error: 'No plan for that date' });
    }

    if (taskIndex < 0 || taskIndex >= dayPlan.tasks.length) {
      return res.status(400).json({ success: false, error: 'Invalid taskIndex' });
    }

    dayPlan.tasks[taskIndex].completed = true;
    await plan.save();
    res.json({ success: true, data: { dailyPlans: plan.dailyPlans } });
  } catch (err) {
    console.error('Complete task error:', err);
    res.status(500).json({ success: false, error: 'Failed to complete task' });
  }
});

// GET /api/ai/hifz/stats - Get memorization statistics
router.get('/hifz/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const plan = await HifzPlanModel.findOne({ user: userId });

    let totalAyahs = 0;
    let weakCount = 0;
    let avgStrength = 0;

    if (plan && plan.weakAyahs.length > 0) {
      totalAyahs = plan.weakAyahs.reduce((sum, w) => sum + w.reviewCount, 0);
      weakCount = plan.weakAyahs.filter(w => w.strength < 50).length;
      avgStrength = Math.round(plan.weakAyahs.reduce((sum, w) => sum + w.strength, 0) / plan.weakAyahs.length);
    }

    const today = new Date().toISOString().split('T')[0];
    let streak = 0;
    if (plan && plan.dailyPlans.length > 0) {
      for (let i = plan.dailyPlans.length - 1; i >= 0; i--) {
        const day = plan.dailyPlans[i];
        const completedCount = day.tasks.filter(t => t.completed).length;
        if (completedCount > 0) streak++;
        else if (day.date < today) break;
      }
    }

    res.json({
      success: true,
      data: {
        totalAyahsMemorized: totalAyahs,
        weakAyahsCount: weakCount,
        totalWeakAyahs: plan ? plan.weakAyahs.length : 0,
        averageStrength: avgStrength,
        streak,
        currentLevel: plan?.currentLevel || 'beginner',
        weeklyGoal: plan?.weeklyGoal || 7,
      },
    });
  } catch (err) {
    console.error('Hifz stats error:', err);
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

// ─── Sadaqah Suggestions ──────────────────────────────────────────

const SADAQAH_CATEGORIES: Record<string, Array<{
  category: string;
  title: string;
  description: string;
  reward: string;
  estimatedCost: string;
}>> = {
  foodWater: [
    { category: 'foodWater', title: 'Feed a fasting person', description: 'Provide iftar or suhoor for someone in need', reward: 'Like the reward of the one who fasted', estimatedCost: '10-50 USD' },
    { category: 'foodWater', title: 'Water well', description: 'Contribute to a water well in a water-scarce region', reward: 'Ongoing charity (Sadaqah Jariyah)', estimatedCost: '100-1000 USD' },
    { category: 'foodWater', title: 'Food parcel', description: 'Provide a monthly food parcel for a family', reward: 'Feeds a family for a month', estimatedCost: '30-100 USD' },
  ],
  education: [
    { category: 'education', title: 'Sponsor a student', description: 'Sponsor a child\'s Islamic education', reward: 'Knowledge that continues to benefit', estimatedCost: '20-200 USD/month' },
    { category: 'education', title: 'Quran printing', description: 'Donate towards printing and distributing Qurans', reward: 'Every recitation adds to your deeds', estimatedCost: '5-50 USD per copy' },
    { category: 'education', title: 'Build a school', description: 'Contribute to building an Islamic school', reward: 'Sadaqah Jariyah for generations', estimatedCost: '500-5000 USD' },
  ],
  healthcare: [
    { category: 'healthcare', title: 'Medical fund', description: 'Provide medical treatment for those who cannot afford it', reward: 'Saves lives and brings immense reward', estimatedCost: '50-500 USD' },
    { category: 'healthcare', title: 'Eye surgery', description: 'Sponsor cataract surgery for a blind person', reward: 'Restoring sight is like giving life', estimatedCost: '100-300 USD' },
    { category: 'healthcare', title: 'Maternity care', description: 'Provide safe maternity care for mothers in need', reward: 'Supports new life', estimatedCost: '50-200 USD' },
  ],
  masjid: [
    { category: 'masjid', title: 'Masjid building fund', description: 'Contribute to building or renovating a masjid', reward: 'Every prayer in that masjid adds to your deeds', estimatedCost: '100-10000 USD' },
    { category: 'masjid', title: 'Masjid supplies', description: 'Donate carpets, air conditioning, or Qurans for a masjid', reward: 'Ongoing reward for every person who uses them', estimatedCost: '50-500 USD' },
    { category: 'masjid', title: 'Adhan equipment', description: 'Provide loudspeakers for the adhan', reward: 'Every person who hears the adhan benefits', estimatedCost: '200-1000 USD' },
  ],
  family: [
    { category: 'family', title: 'Orphan sponsorship', description: 'Sponsor an orphan with monthly financial support', reward: 'The Prophet ﷺ said: I and the caretaker of an orphan will be like this in Paradise', estimatedCost: '30-150 USD/month' },
    { category: 'family', title: 'Wedding fund', description: 'Help a couple get married with basic expenses', reward: 'Helps complete half the faith', estimatedCost: '200-1000 USD' },
    { category: 'family', title: 'Debt relief', description: 'Help pay off debts for those in financial hardship', reward: 'Relieves a believer from distress', estimatedCost: '50-500 USD' },
  ],
  environment: [
    { category: 'environment', title: 'Plant a tree', description: 'Plant fruit trees for communities in need', reward: 'Ongoing charity - every bird that eats from it', estimatedCost: '5-20 USD per tree' },
    { category: 'environment', title: 'Clean water project', description: 'Fund a clean water filtration system', reward: 'Sadaqah Jariyah for every drink taken', estimatedCost: '200-2000 USD' },
  ],
  general: [
    { category: 'general', title: 'General charity fund', description: 'Donate to a reputable charity that distributes where needed', reward: 'Helps where help is most needed', estimatedCost: 'Any amount' },
    { category: 'general', title: 'Smile charity', description: 'The Prophet ﷺ said: Your smile for your brother is charity', reward: 'A simple act of kindness counts as sadaqah', estimatedCost: 'Free' },
    { category: 'general', title: 'Remove harm from the path', description: 'Remove obstacles, trash, or anything harmful from the road', reward: 'A branch of faith', estimatedCost: 'Free' },
    { category: 'general', title: 'Volunteer your time', description: 'Volunteer at a local masjid, food bank, or charity organization', reward: 'Every hour is sadaqah', estimatedCost: 'Time' },
  ],
};

// POST /api/ai/sadaqah
router.post('/sadaqah', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { category, language } = req.body;
    const catKey = category || 'general';

    let suggestions = SADAQAH_CATEGORIES[catKey] || SADAQAH_CATEGORIES.general;

    try {
      const prompt = `You are a knowledgeable Islamic advisor. The user wants sadaqah (charity) suggestions in the category: "${catKey}". Suggest 3-5 specific, actionable sadaqah ideas. Return ONLY a JSON array: [{ category: string, title: string, description: string, reward: string, estimatedCost: string }]. Respond in ${language === 'ar' ? 'Arabic' : 'English'}. Keep descriptions concise.`;
      const result = await geminiService.chatCompletion('You are a knowledgeable Islamic advisor. Respond only with valid JSON.', [{ role: 'user', content: prompt }], 600);
      const parsed = JSON.parse(result.replace(/```json|```/g, '').trim());
      if (Array.isArray(parsed) && parsed.length > 0) {
        suggestions = parsed;
      }
    } catch {
      // use local suggestions
    }

    res.json({ success: true, data: { suggestions } });
  } catch (err) {
    console.error('Sadaqah error:', err);
    res.status(500).json({ success: false, error: 'Failed to get sadaqah suggestions' });
  }
});

export default router;
