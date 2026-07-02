import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import Bookmark from '../models/bookmark';

const router = Router();

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { surah, ayah, note } = req.body;
    const bm = new Bookmark({ user: userId, surah, ayah, note });
    await bm.save();
    res.json({ success: true, data: bm });
  } catch (err) {
    console.error('Create bookmark error:', err);
    res.status(500).json({ success: false, error: 'Unable to create bookmark' });
  }
});

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const items = await Bookmark.find({ user: userId }).lean().exec();
    res.json({ success: true, data: items });
  } catch (err) {
    console.error('List bookmarks error:', err);
    res.status(500).json({ success: false, error: 'Unable to list bookmarks' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const id = req.params.id;
    const result = await Bookmark.deleteOne({ _id: id, user: userId }).exec();
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Bookmark not found' });
    }
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error('Delete bookmark error:', err);
    res.status(500).json({ success: false, error: 'Unable to delete bookmark' });
  }
});

export default router;
