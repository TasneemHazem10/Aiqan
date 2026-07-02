import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import BackupModel from '../models/backup';
import ProgressModel from '../models/progress';
import FastingModel from '../models/fasting';
import BookmarkModel from '../models/bookmark';
import SettingsModel from '../models/settings';

const router = Router();

// POST /api/backup/create
router.post('/create', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { platform } = req.body;

    const [progressDocs, fastingRecords, bookmarks, settings] = await Promise.all([
      ProgressModel.find({ user: userId }).lean(),
      FastingModel.find({ user: userId }).lean(),
      BookmarkModel.find({ user: userId }).lean(),
      SettingsModel.findOne({ user: userId }).lean(),
    ]);

    const backupData = {
      progress: progressDocs.reduce((acc: any, d: any) => { acc[d.type] = d.data; return acc; }, {}),
      fasting: fastingRecords,
      bookmarks,
      settings,
      exportedAt: new Date().toISOString(),
    };

    const size = Buffer.byteLength(JSON.stringify(backupData), 'utf-8');
    const backup = await BackupModel.create({
      user: userId,
      data: backupData,
      version: '1.0',
      size,
      platform: platform || 'android',
    });

    res.status(201).json({ success: true, data: backup, message: 'Backup created' });
  } catch (err) {
    console.error('Create backup error:', err);
    res.status(500).json({ success: false, error: 'Failed to create backup' });
  }
});

// GET /api/backup/list
router.get('/list', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const backups = await BackupModel.find({ user: userId })
      .select('version size platform createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: backups });
  } catch (err) {
    console.error('List backups error:', err);
    res.status(500).json({ success: false, error: 'Failed to list backups' });
  }
});

// POST /api/backup/restore/:id
router.post('/restore/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const backup = await BackupModel.findOne({ _id: req.params.id, user: userId });
    if (!backup) {
      return res.status(404).json({ success: false, error: 'Backup not found' });
    }

    const { progress, fasting, bookmarks, settings } = backup.data as any;

    if (progress) {
      for (const [type, data] of Object.entries(progress)) {
        await ProgressModel.findOneAndUpdate(
          { user: userId, type },
          { user: userId, type, data },
          { upsert: true }
        );
      }
    }

    if (fasting && Array.isArray(fasting)) {
      for (const record of fasting) {
        await FastingModel.findOneAndUpdate(
          { user: userId, date: record.date },
          { user: userId, date: record.date, type: record.type, status: record.status, notes: record.notes },
          { upsert: true }
        );
      }
    }

    if (bookmarks && Array.isArray(bookmarks)) {
      for (const b of bookmarks) {
        await BookmarkModel.findOneAndUpdate(
          { user: userId, surahNumber: b.surahNumber, ayahNumber: b.ayahNumber },
          { user: userId, ...b },
          { upsert: true }
        );
      }
    }

    if (settings) {
      await SettingsModel.findOneAndUpdate(
        { user: userId },
        { $set: settings },
        { upsert: true }
      );
    }

    res.json({ success: true, message: 'Backup restored successfully' });
  } catch (err) {
    console.error('Restore backup error:', err);
    res.status(500).json({ success: false, error: 'Failed to restore backup' });
  }
});

// DELETE /api/backup/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const backup = await BackupModel.findOneAndDelete({ _id: req.params.id, user: userId });
    if (!backup) {
      return res.status(404).json({ success: false, error: 'Backup not found' });
    }
    res.json({ success: true, message: 'Backup deleted' });
  } catch (err) {
    console.error('Delete backup error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete backup' });
  }
});

export default router;
