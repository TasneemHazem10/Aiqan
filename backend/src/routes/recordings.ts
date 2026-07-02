import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import Recording from '../models/recording';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const RECORDINGS_DIR = path.join(__dirname, '../../public/recordings');

function ensureDir(dir: string) {
  try { fs.mkdirSync(dir, { recursive: true }); } catch { /* */ }
}

// POST /api/recordings — upload new recording
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { name, surahNumber, surahName, duration, fileData, fileName } = req.body;

    if (!name || !fileData) {
      res.status(400).json({ success: false, error: 'Name and fileData are required' });
      return;
    }

    const id = uuidv4();
    const ext = fileName?.endsWith('.wav') ? 'wav' : 'wav';
    const storedFileName = `${id}.${ext}`;
    const userDir = path.join(RECORDINGS_DIR, userId);
    ensureDir(userDir);
    const filePath = path.join(userDir, storedFileName);

    const buffer = Buffer.from(fileData, 'base64');
    fs.writeFileSync(filePath, buffer);
    const fileSize = buffer.length;

    const uri = `/api/recordings/file/${id}`;

    let recording;
    try {
      recording = await Recording.create({
        userId,
        name,
        surahNumber: surahNumber || 0,
        surahName: surahName || '',
        uri,
        duration: duration || 0,
        fileSize,
      });
    } catch {
      // If MongoDB fails, still return success with file saved locally
      recording = null;
    }

    res.status(201).json({
      success: true,
      data: {
        id,
        _id: recording?._id?.toString(),
        name,
        surahNumber: surahNumber || 0,
        surahName: surahName || '',
        uri,
        duration: duration || 0,
        fileSize,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Recording upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload recording' });
  }
});

// GET /api/recordings — list all recordings for user
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    let recordings: any[] = [];

    try {
      recordings = await Recording.find({ userId }).sort({ createdAt: -1 }).lean();
    } catch {
      // MongoDB not available — list from filesystem
      const userDir = path.join(RECORDINGS_DIR, userId);
      if (fs.existsSync(userDir)) {
        const files = fs.readdirSync(userDir);
        recordings = files.map((f) => {
          const stat = fs.statSync(path.join(userDir, f));
          const id = f.replace(/\.\w+$/, '');
          return {
            id,
            _id: id,
            name: f.replace(/\.\w+$/, ''),
            surahNumber: 0,
            surahName: '',
            uri: `/api/recordings/file/${id}`,
            duration: 0,
            fileSize: stat.size,
            createdAt: stat.birthtime.toISOString(),
          };
        });
      }
    }

    // Also list files in user directory that might not be in DB
    const userDir = path.join(RECORDINGS_DIR, userId);
    if (fs.existsSync(userDir)) {
      const files = fs.readdirSync(userDir);
      const dbIds = new Set(recordings.map((r) => r._id?.toString() || r.id));
      for (const f of files) {
        const id = f.replace(/\.\w+$/, '');
        if (!dbIds.has(id)) {
          const stat = fs.statSync(path.join(userDir, f));
          recordings.push({
            id,
            _id: id,
            name: f,
            surahNumber: 0,
            surahName: '',
            uri: `/api/recordings/file/${id}`,
            duration: 0,
            fileSize: stat.size,
            createdAt: stat.birthtime.toISOString(),
          });
        }
      }
    }

    res.json({ success: true, data: recordings });
  } catch (error) {
    console.error('Recording list error:', error);
    res.status(500).json({ success: false, error: 'Failed to list recordings' });
  }
});

// PATCH /api/recordings/:id — update recording (rename)
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ success: false, error: 'Name is required' });
      return;
    }

    try {
      const recording = await Recording.findOneAndUpdate(
        { _id: id, userId },
        { name, updatedAt: new Date() },
        { new: true }
      );
      if (recording) {
        res.json({ success: true, data: recording });
        return;
      }
    } catch {
      // MongoDB not available, continue with filesystem fallback
    }

    // Filesystem fallback: rename file
    const userDir = path.join(RECORDINGS_DIR, userId);
    const files = fs.readdirSync(userDir);
    const file = files.find((f) => f.startsWith(id));
    if (file) {
      const ext = path.extname(file);
      const newName = `${id}_${name.replace(/[^a-zA-Z0-9_\-\u0600-\u06FF\s]/g, '_')}${ext}`;
      fs.renameSync(path.join(userDir, file), path.join(userDir, newName));
    }

    res.json({ success: true, data: { id, name } });
  } catch (error) {
    console.error('Recording rename error:', error);
    res.status(500).json({ success: false, error: 'Failed to rename recording' });
  }
});

// DELETE /api/recordings/:id — delete recording
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    try {
      await Recording.deleteOne({ _id: id, userId });
    } catch {
      // MongoDB not available
    }

    // Delete file from disk
    const userDir = path.join(RECORDINGS_DIR, userId);
    if (fs.existsSync(userDir)) {
      const files = fs.readdirSync(userDir);
      const file = files.find((f) => f.startsWith(id));
      if (file) {
        fs.unlinkSync(path.join(userDir, file));
      }
    }

    res.json({ success: true, message: 'Recording deleted' });
  } catch (error) {
    console.error('Recording delete error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete recording' });
  }
});

// GET /api/recordings/file/:id — serve the audio file
router.get('/file/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const userDir = path.join(RECORDINGS_DIR, userId);
    if (!fs.existsSync(userDir)) {
      res.status(404).json({ success: false, error: 'File not found' });
      return;
    }

    const files = fs.readdirSync(userDir);
    const file = files.find((f) => f.startsWith(id));
    if (!file) {
      res.status(404).json({ success: false, error: 'File not found' });
      return;
    }

    const filePath = path.join(userDir, file);
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', `inline; filename="${file}"`);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Recording file serve error:', error);
    res.status(500).json({ success: false, error: 'Failed to serve file' });
  }
});

export default router;
