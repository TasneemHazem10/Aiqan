import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import fs from 'fs';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

// Connect to MongoDB (if MONGODB_URI provided)
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || 'aiqan' })
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));
} else {
  console.warn('⚠️ MONGODB_URI not set — running without persistent DB. Set MONGODB_URI in backend/.env to enable persistence.');
}

// Check Gemini API key presence
const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (GEMINI_KEY) {
  console.log('✅ Gemini API key configured — AI features enabled');
} else {
  console.warn('⚠️ GEMINI_API_KEY not set — AI features disabled');
}

// Routes
import quranRoutes from './routes/quran';
import prayerRoutes from './routes/prayer';
import azkarRoutes from './routes/azkar';
import duaRoutes from './routes/dua';
import authRoutes from './routes/auth';
import aiRoutes from './routes/ai';
import progressRoutes from './routes/progress';
import recitersRoutes from './routes/reciters';
import islamicLifestyleRoutes from './routes/islamicLifestyle';
import familyRoutes from './routes/family';
import communityRoutes from './routes/community';
import backupRoutes from './routes/backup';

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet());
const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',');
app.use(cors({
  origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Aiqan API is running 🕌',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/quran', quranRoutes);
import quranDataRoutes from './routes/quranData';
app.use('/api/quran/data', quranDataRoutes);
app.use('/api/prayer', prayerRoutes);
app.use('/api/azkar', azkarRoutes);
app.use('/api/dua', duaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/reciters', recitersRoutes);
app.use('/api/ai', aiRoutes);
import videoRoutes from './routes/video';
import bookmarksRoutes from './routes/bookmarks';
import settingsRoutes from './routes/settings';
import offlineRoutes from './routes/offline';
import notificationsRoutes from './routes/notifications';
app.use('/api/video', videoRoutes);
app.use('/api/bookmarks', bookmarksRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/offline', offlineRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/islamic', islamicLifestyleRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/backup', backupRoutes);
import recordingRoutes from './routes/recordings';
app.use('/api/recordings', recordingRoutes);

// Ensure public directories exist
const videosDir = path.join(__dirname, '../public/videos');
try { fs.mkdirSync(videosDir, { recursive: true }); } catch (e) { /* ignore */ }
const recordingsDir = path.join(__dirname, '../public/recordings');
try { fs.mkdirSync(recordingsDir, { recursive: true }); } catch (e) { /* ignore */ }
app.use('/videos', express.static(videosDir));

// Serve offline files
const offlineDir = path.join(__dirname, '../public/offline');
try { fs.mkdirSync(offlineDir, { recursive: true }); } catch (e) { /* ignore */ }
app.use('/offline', express.static(offlineDir));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global Error Handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║   🕌 Aiqan API Server Running       ║
║   Port: ${PORT}                         ║
║   Mode: ${process.env.NODE_ENV || 'development'}                 ║
╚══════════════════════════════════════╝
  `);
});

export default app;
