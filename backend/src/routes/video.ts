import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import * as videoService from '../services/videoService';
import * as quranService from '../services/quranService';
import presignRouter from './videoPresign';
import { reciterAudioMap, RECITERS } from './reciters';

const router = Router();

router.use('/', presignRouter);

// POST /api/video/generate - resolve data and enqueue job
router.post('/generate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { surahNumber, fromAyah, toAyah, reciterId, theme } = req.body;

    if (!surahNumber || surahNumber < 1 || surahNumber > 114) {
      return res.status(400).json({ success: false, error: 'Invalid surah number (1-114)' });
    }
    if (!reciterId || !reciterAudioMap[reciterId]) {
      return res.status(400).json({ success: false, error: 'Invalid or missing reciterId' });
    }

    const audioId = reciterAudioMap[reciterId];
    const surahData = await quranService.getSurah(surahNumber, 'quran-uthmani');

    if (!surahData || !surahData.ayahs) {
      return res.status(500).json({ success: false, error: 'Failed to fetch surah data' });
    }

    const allAyahs = surahData.ayahs;
    const start = fromAyah || 1;
    const end = toAyah || allAyahs.length;
    const selectedAyahs = allAyahs.slice(start - 1, end);

    if (selectedAyahs.length === 0) {
      return res.status(400).json({ success: false, error: 'No ayahs in the specified range' });
    }

    const ayahAudioUrls = selectedAyahs.map((a: any) =>
      quranService.getAyahAudioUrl(audioId, a.number)
    );

    const text = selectedAyahs.map((a: any) => a.text).join(' ');

    const subtitles = selectedAyahs.map((a: any, idx: number) => ({
      start: idx * 6,
      end: (idx + 1) * 6,
      text: a.text,
      ayahNumber: a.numberInSurah,
    }));

    const input = {
      ayahAudioUrls,
      text,
      subtitles,
      theme: theme || 'black',
      surahNumber,
      surahName: surahData.englishName,
      fromAyah: start,
      toAyah: end,
      reciterId,
      reciterName: RECITERS.find(r => r.id === reciterId)?.name || reciterId,
    };

    const job = await videoService.enqueueVideoJob(userId, { input });

    res.json({
      success: true,
      data: { jobId: job._id, status: job.status, input },
    });
  } catch (err) {
    console.error('Create video job error:', err);
    res.status(500).json({ success: false, error: 'Failed to create video job' });
  }
});

// POST /api/video/create - legacy endpoint (kept for backward compat)
router.post('/create', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const input = req.body;
    const job = await videoService.enqueueVideoJob(userId, input);
    res.json({ success: true, data: { jobId: job._id, status: job.status } });
  } catch (err) {
    console.error('Create video job error:', err);
    res.status(500).json({ success: false, error: 'Failed to create video job' });
  }
});

// GET /api/video/job/:id
router.get('/job/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const job = await videoService.getJob(req.params.id);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });
    res.json({ success: true, data: job });
  } catch (err) {
    console.error('Get video job error:', err);
    res.status(500).json({ success: false, error: 'Failed to get job' });
  }
});

export default router;
