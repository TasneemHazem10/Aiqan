import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import ChallengeModel from '../models/challenge';
import ProgressModel from '../models/progress';

const router = Router();

// POST /api/community/challenge/create
router.post('/challenge/create', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { type, goal, startDate, endDate } = req.body;
    if (!type || !goal || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'type, goal, startDate, and endDate required' });
    }

    const challenge = await ChallengeModel.create({
      creator: userId,
      participants: [{ user: userId, joinedAt: new Date(), score: 0, completed: false }],
      type,
      goal,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'active',
    });

    res.status(201).json({ success: true, data: challenge, message: 'Challenge created' });
  } catch (err) {
    console.error('Create challenge error:', err);
    res.status(500).json({ success: false, error: 'Failed to create challenge' });
  }
});

// POST /api/community/challenge/join/:id
router.post('/challenge/join/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const challenge = await ChallengeModel.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    if (challenge.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Challenge is not active' });
    }

    const alreadyJoined = challenge.participants.some(p => p.user.toString() === userId);
    if (alreadyJoined) {
      return res.status(400).json({ success: false, error: 'Already joined this challenge' });
    }

    challenge.participants.push({ user: userId as any, joinedAt: new Date(), score: 0, completed: false });
    await challenge.save();

    res.json({ success: true, data: challenge, message: 'Joined challenge' });
  } catch (err) {
    console.error('Join challenge error:', err);
    res.status(500).json({ success: false, error: 'Failed to join challenge' });
  }
});

// GET /api/community/challenges
router.get('/challenges', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status) filter.status = status;

    const challenges = await ChallengeModel.find(filter)
      .populate('creator', 'name email')
      .populate('participants.user', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: challenges });
  } catch (err) {
    console.error('List challenges error:', err);
    res.status(500).json({ success: false, error: 'Failed to list challenges' });
  }
});

// GET /api/community/challenge/:id
router.get('/challenge/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const challenge = await ChallengeModel.findById(req.params.id)
      .populate('creator', 'name email')
      .populate('participants.user', 'name email')
      .lean();

    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    res.json({ success: true, data: challenge });
  } catch (err) {
    console.error('Get challenge error:', err);
    res.status(500).json({ success: false, error: 'Failed to get challenge' });
  }
});

// POST /api/community/challenge/:id/progress
router.post('/challenge/:id/progress', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { score } = req.body;
    if (typeof score !== 'number') {
      return res.status(400).json({ success: false, error: 'score required' });
    }

    const challenge = await ChallengeModel.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    const participant = challenge.participants.find(p => p.user.toString() === userId);
    if (!participant) {
      return res.status(400).json({ success: false, error: 'You have not joined this challenge' });
    }

    participant.score += score;
    if (participant.score >= challenge.goal) {
      participant.completed = true;
    }
    await challenge.save();

    res.json({ success: true, data: challenge, message: 'Progress updated' });
  } catch (err) {
    console.error('Challenge progress error:', err);
    res.status(500).json({ success: false, error: 'Failed to update progress' });
  }
});

// GET /api/community/leaderboard
router.get('/leaderboard', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const docs = await ProgressModel.find({ type: 'dhikr' }).populate('user', 'name email').sort({ 'data.totalDhikrCount': -1 }).limit(50).lean();
    const quranDocs = await ProgressModel.find({ type: 'quran' }).populate('user', 'name email').lean();

    const leaderboard = docs.map((d: any, i: number) => ({
      rank: i + 1,
      userId: (d as any).user?._id?.toString() || 'unknown',
      name: (d as any).user?.name || 'User',
      totalDhikrCount: d.data?.totalDhikrCount || 0,
      surahsRead: Object.keys((quranDocs.find((q: any) => q.user?.toString() === (d as any).user?._id?.toString()) as any)?.data || {}).length,
    }));

    res.json({ success: true, data: leaderboard });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
  }
});

// GET /api/community/leaderboard/:challengeId
router.get('/leaderboard/:challengeId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const challenge = await ChallengeModel.findById(req.params.challengeId)
      .populate('participants.user', 'name email')
      .lean();

    if (!challenge) {
      return res.status(404).json({ success: false, error: 'Challenge not found' });
    }

    const sorted = challenge.participants
      .sort((a: any, b: any) => b.score - a.score)
      .map((p: any, i: number) => ({
        rank: i + 1,
        userId: p.user?._id?.toString() || 'unknown',
        name: p.user?.name || 'User',
        score: p.score,
        completed: p.completed,
      }));

    res.json({ success: true, data: sorted });
  } catch (err) {
    console.error('Challenge leaderboard error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch challenge leaderboard' });
  }
});

export default router;
