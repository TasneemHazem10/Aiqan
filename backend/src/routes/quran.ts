import { Router, Request, Response } from 'express';
import * as quranService from '../services/quranService';

const router = Router();

// GET /api/quran/surahs - Get all surahs
router.get('/surahs', async (req: Request, res: Response) => {
  try {
    const surahs = await quranService.getAllSurahs();
    res.json({ success: true, data: surahs });
  } catch (error) {
    console.error('Error fetching surahs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch surahs' });
  }
});

// GET /api/quran/surah/:number - Get specific surah
router.get('/surah/:number', async (req: Request, res: Response) => {
  try {
    const number = parseInt(req.params.number);
    if (isNaN(number) || number < 1 || number > 114) {
      return res.status(400).json({ success: false, error: 'Invalid surah number (1-114)' });
    }
    const edition = (req.query.edition as string) || 'quran-uthmani';
    const surah = await quranService.getSurah(number, edition);
    res.json({ success: true, data: surah });
  } catch (error) {
    console.error('Error fetching surah:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch surah' });
  }
});

// GET /api/quran/surah/:number/with-translation - Get surah with translation
router.get('/surah/:number/with-translation', async (req: Request, res: Response) => {
  try {
    const number = parseInt(req.params.number);
    if (isNaN(number) || number < 1 || number > 114) {
      return res.status(400).json({ success: false, error: 'Invalid surah number (1-114)' });
    }
    const language = (req.query.lang as string) || 'en.sahih';
    const data = await quranService.getSurahWithTranslation(number, language);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching surah with translation:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch surah with translation' });
  }
});

// GET /api/quran/ayah/:reference - Get specific ayah
router.get('/ayah/:reference', async (req: Request, res: Response) => {
  try {
    const reference = req.params.reference;
    const edition = (req.query.edition as string) || 'quran-uthmani';
    const ayah = await quranService.getAyah(reference, edition);
    res.json({ success: true, data: ayah });
  } catch (error) {
    console.error('Error fetching ayah:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch ayah' });
  }
});

// GET /api/quran/search - Search Quran
router.get('/search', async (req: Request, res: Response) => {
  try {
    const keyword = req.query.q as string;
    if (!keyword) {
      return res.status(400).json({ success: false, error: 'Search keyword required' });
    }
    const language = (req.query.lang as string) || 'en';
    const results = await quranService.searchQuran(keyword, language);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error searching Quran:', error);
    res.status(500).json({ success: false, error: 'Failed to search Quran' });
  }
});

// GET /api/quran/page/:number - Get Quran page
router.get('/page/:number', async (req: Request, res: Response) => {
  try {
    const number = parseInt(req.params.number);
    if (isNaN(number) || number < 1 || number > 604) {
      return res.status(400).json({ success: false, error: 'Invalid page number (1-604)' });
    }
    const edition = (req.query.edition as string) || 'quran-uthmani';
    const page = await quranService.getPage(number, edition);
    res.json({ success: true, data: page });
  } catch (error) {
    console.error('Error fetching page:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch page' });
  }
});

// GET /api/quran/juz/:number - Get Juz
router.get('/juz/:number', async (req: Request, res: Response) => {
  try {
    const number = parseInt(req.params.number);
    if (isNaN(number) || number < 1 || number > 30) {
      return res.status(400).json({ success: false, error: 'Invalid juz number (1-30)' });
    }
    const juz = await quranService.getJuz(number);
    res.json({ success: true, data: juz });
  } catch (error) {
    console.error('Error fetching juz:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch juz' });
  }
});

// GET /api/quran/audio/:reciter/:surah - Get audio URL info
router.get('/audio/:reciter/:surah', (req: Request, res: Response) => {
  try {
    const surahNumber = parseInt(req.params.surah);
    const reciterId = req.params.reciter;
    if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      return res.status(400).json({ success: false, error: 'Invalid surah number' });
    }
    const audioUrl = quranService.getAudioUrl(reciterId, surahNumber);
    res.json({ success: true, data: { url: audioUrl, reciter: reciterId, surah: surahNumber } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get audio URL' });
  }
});

// GET /api/quran/ayah-audio/:reciter/:ayah - Get ayah audio URL
router.get('/ayah-audio/:reciter/:ayah', (req: Request, res: Response) => {
  try {
    const ayahNumber = parseInt(req.params.ayah);
    const reciterId = req.params.reciter;
    const audioUrl = quranService.getAyahAudioUrl(reciterId, ayahNumber);
    res.json({ success: true, data: { url: audioUrl } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get ayah audio URL' });
  }
});

// GET /api/quran/editions - Get available editions/translations
router.get('/editions', async (req: Request, res: Response) => {
  try {
    const type = req.query.type as string;
    const language = req.query.language as string;
    const editions = await quranService.getEditions(type, language);
    res.json({ success: true, data: editions });
  } catch (error) {
    console.error('Error fetching editions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch editions' });
  }
});

export default router;
