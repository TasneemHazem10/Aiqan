import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import Settings from '../models/settings';

const router = Router();

// GET /api/settings - get current user settings
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const s = await Settings.findOne({ user: userId }).lean().exec();
    res.json({ success: true, data: s });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ success: false, error: 'Failed to get settings' });
  }
});

// POST /api/settings - update settings
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const payload = req.body;
    const s = await Settings.findOneAndUpdate({ user: userId }, { $set: payload }, { upsert: true, new: true }).exec();
    res.json({ success: true, data: s });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

export default router;