import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { notificationService } from '../services/notificationService';

const router = Router();

// POST /api/notifications/register - Register device token
router.post('/register', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { token, platform } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token required' });
    }

    notificationService.registerToken(userId, token, platform || 'android');
    res.json({ success: true, message: 'Device token registered' });
  } catch (err) {
    console.error('Register token error:', err);
    res.status(500).json({ success: false, error: 'Failed to register token' });
  }
});

// POST /api/notifications/send-test - Send test notification
router.post('/send-test', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const tokens = notificationService.getTokens(userId);
    
    if (tokens.length === 0) {
      return res.status(400).json({ success: false, error: 'No registered devices' });
    }

    await notificationService.sendNotification(
      tokens,
      '✅ Test Notification',
      'This is a test notification from Aiqan app',
      { type: 'test' }
    );

    res.json({ success: true, message: 'Test notification sent' });
  } catch (err) {
    console.error('Send test notification error:', err);
    res.status(500).json({ success: false, error: 'Failed to send notification' });
  }
});

export default router;
