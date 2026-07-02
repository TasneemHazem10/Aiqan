import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import UserModel from '../models/user';
import SettingsModel from '../models/settings';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const defaultSettings = {
  language: 'en',
  quranFont: 'uthmani',
  translationLanguage: 'en.sahih',
  defaultReciter: 'ar.alafasy',
  notificationsEnabled: true,
  prayerMethod: 5,
  theme: 'dark',
  accentColor: '#C9A84C',
  fontSize: 16,
};

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await UserModel.create({
      email: email.toLowerCase(),
      password: passwordHash,
      name,
    });

    const secret = process.env.JWT_SECRET || 'aiqan_secret';
    const token = jwt.sign({ userId: user._id.toString(), email: user.email }, secret, {
      expiresIn: (process.env.JWT_EXPIRES_IN || '30d') as any,
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          createdAt: user.createdAt.toISOString(),
          settings: defaultSettings,
          progress: {
            dailyStreak: 0, lastActiveDate: '', quranReadingProgress: {},
            memorizedSurahs: [], azkarStreak: 0, totalDhikrCount: 0,
            achievements: [], weeklyGoal: 7, weeklyCompleted: 0,
          },
        },
        token,
      },
      message: 'Account created successfully. Welcome to Aiqan!',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user || !user.password) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const secret = process.env.JWT_SECRET || 'aiqan_secret';
    const token = jwt.sign({ userId: user._id.toString(), email: user.email }, secret, {
      expiresIn: (process.env.JWT_EXPIRES_IN || '30d') as any,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          createdAt: user.createdAt.toISOString(),
          settings: defaultSettings,
          progress: {
            dailyStreak: 0, lastActiveDate: '', quranReadingProgress: {},
            memorizedSurahs: [], azkarStreak: 0, totalDhikrCount: 0,
            achievements: [], weeklyGoal: 7, weeklyCompleted: 0,
          },
        },
        token,
      },
      message: 'Welcome back!',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserModel.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({
      success: true,
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        settings: defaultSettings,
        progress: {
          dailyStreak: 0, lastActiveDate: '', quranReadingProgress: {},
          memorizedSurahs: [], azkarStreak: 0, totalDhikrCount: 0,
          achievements: [], weeklyGoal: 7, weeklyCompleted: 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

// PATCH /api/auth/settings - Update user settings
router.patch('/settings', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    let settings = await SettingsModel.findOne({ user: userId });
    if (!settings) {
      settings = await SettingsModel.create({ ...defaultSettings, ...req.body, user: userId });
    } else {
      await SettingsModel.findByIdAndUpdate(settings._id, { $set: req.body });
    }
    res.json({ success: true, data: { ...defaultSettings, ...req.body }, message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

// PATCH /api/auth/profile - Update profile
router.patch('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserModel.findByIdAndUpdate(
      req.user!.userId,
      { $set: { name: req.body.name } },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({
      success: true,
      data: { id: user._id.toString(), name: user.name, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// POST /api/auth/guest - Guest login
router.post('/guest', (req: Request, res: Response) => {
  const guestId = `guest_${uuidv4()}`;
  const secret = process.env.JWT_SECRET || 'aiqan_secret';
  const token = jwt.sign({ userId: guestId, email: '' }, secret, { expiresIn: '7d' });

  res.json({
    success: true,
    data: {
      user: {
        id: guestId,
        name: 'Guest',
        email: '',
        createdAt: new Date().toISOString(),
        settings: { ...defaultSettings },
        progress: {
          dailyStreak: 0, lastActiveDate: '', quranReadingProgress: {},
          memorizedSurahs: [], azkarStreak: 0, totalDhikrCount: 0,
          achievements: [], weeklyGoal: 7, weeklyCompleted: 0,
        },
      },
      token,
      isGuest: true,
    },
  });
});

export default router;
