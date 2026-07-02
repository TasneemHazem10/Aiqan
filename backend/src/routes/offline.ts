import { Router } from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const router = Router();

// POST /api/offline/download
// body: { reciterId, surahNumber, audioUrl }
router.post('/download', async (req, res) => {
  try {
    const { reciterId, surahNumber, audioUrl } = req.body;
    if (!audioUrl || !reciterId || !surahNumber) return res.status(400).json({ success: false, error: 'reciterId, surahNumber and audioUrl required' });

    const publicDir = path.join(__dirname, '../public/offline', reciterId);
    fs.mkdirSync(publicDir, { recursive: true });
    const outPath = path.join(publicDir, `${surahNumber}.mp3`);

    const writer = fs.createWriteStream(outPath);
    const response = await axios.get(audioUrl, { responseType: 'stream', timeout: 120000 });

    await new Promise<void>((resolve, reject) => {
      response.data.pipe(writer);
      writer.on('finish', () => resolve());
      writer.on('error', (err) => reject(err));
    });

    const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
    const fileUrl = `${serverUrl.replace(/\/+$/, '')}/offline/${reciterId}/${surahNumber}.mp3`;

    res.json({ success: true, data: { localPath: outPath, url: fileUrl } });
  } catch (err:any) {
    console.error('offline download failed', err);
    res.status(500).json({ success: false, error: err.message || 'Download failed' });
  }
});

// GET /api/offline/list
router.get('/list', async (req, res) => {
  try {
    const base = path.join(__dirname, '../public/offline');
    const result: any[] = [];
    if (!fs.existsSync(base)) return res.json({ success: true, data: result });
    const reciters = fs.readdirSync(base);
    for (const r of reciters) {
      const reciterDir = path.join(base, r);
      const files = fs.readdirSync(reciterDir).filter(f => f.endsWith('.mp3'));
      for (const f of files) {
        const surah = path.basename(f, '.mp3');
        result.push({ reciterId: r, surahNumber: surah, url: `${req.protocol}://${req.get('host')}/offline/${r}/${f}` });
      }
    }
    res.json({ success: true, data: result });
  } catch (err:any) {
    console.error('offline list failed', err);
    res.status(500).json({ success: false, error: err.message || 'List failed' });
  }
});

// DELETE /api/offline/remove
// body: { reciterId, surahNumber }
router.delete('/remove', async (req, res) => {
  try {
    const { reciterId, surahNumber } = req.body;
    if (!reciterId || !surahNumber) return res.status(400).json({ success: false, error: 'reciterId and surahNumber required' });
    const filePath = path.join(__dirname, '../public/offline', reciterId, `${surahNumber}.mp3`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (err:any) {
    console.error('offline remove failed', err);
    res.status(500).json({ success: false, error: err.message || 'Remove failed' });
  }
});

export default router;
