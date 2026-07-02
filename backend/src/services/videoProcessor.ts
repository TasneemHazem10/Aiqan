import VideoJob from '../models/videoJob';
import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const ARABIC_FONT_CANDIDATES = [
  '/usr/share/fonts/truetype/noto/NotoNaskhArabic-Regular.ttf',
  '/usr/share/fonts/truetype/noto/NotoNaskhArabic-Bold.ttf',
  '/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf',
  '/usr/share/fonts/opentype/noto/NotoNaskhArabic-Regular.ttf',
  '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
  '/Library/Fonts/Arial.ttf',
  '/System/Library/Fonts/Supplemental/Arial.ttf',
  'C:\\Windows\\Fonts\\arial.ttf',
  'C:\\Windows\\Fonts\\DejaVuSans.ttf',
];

function findFont(): string | null {
  for (const p of ARABIC_FONT_CANDIDATES) {
    try { if (fs.existsSync(p)) return p; } catch (e) { }
  }
  return null;
}

function sanitizePath(p: string): string {
  return p.replace(/['"]/g, '').replace(/[;&|`$()]/g, '');
}

function sanitizeText(t: string): string {
  return t.replace(/['"\\]/g, ' ').replace(/[;&|`$()]/g, '');
}

async function uploadToS3(localPath: string, key: string) {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error('S3_BUCKET not configured');
  const client = new S3Client({ region: process.env.AWS_REGION });
  const body = fs.createReadStream(localPath);
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ACL: 'public-read' } as any));
  const base = process.env.S3_BASE_URL || `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com`;
  return `${base.replace(/\/+$/, '')}/${key}`;
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    proc.stderr?.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
    proc.on('error', (err) => reject(err));
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-500)}`));
    });
  });
}

export async function processJob(jobId: string, inputArg?: Record<string, any>) {
  try {
    await VideoJob.findByIdAndUpdate(jobId, { status: 'processing' }).exec();
    const job = await VideoJob.findById(jobId).exec();
    if (!job) throw new Error('Job not found');

    const rawInput = inputArg || job.input || {};
    const inner = rawInput.input || rawInput;

    const theme = (inner.theme || 'black').toString();
    const safeTheme = sanitizePath(theme);

    const tmpDir = path.join(os.tmpdir(), `videojob-${jobId}-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    let srtPath: string | null = null;
    const ayahUrls: string[] = inner.ayahAudioUrls;
    const subs = inner.subtitles;
    let audioPath: string;

    if (Array.isArray(ayahUrls) && ayahUrls.length > 0) {
      const ayahPaths: string[] = [];
      const ayahDurations: number[] = [];

      const downloads = ayahUrls.map(async (url: string, idx: number) => {
        const p = path.join(tmpDir, `ayah_${idx}.mp3`);
        try {
          const r = await axios.get(url, { responseType: 'stream', timeout: 30000 });
          const w = fs.createWriteStream(p);
          await new Promise<void>((resolve, reject) => {
            r.data.pipe(w);
            w.on('finish', () => resolve());
            w.on('error', reject);
          });
          return { path: p, success: true };
        } catch {
          return { path: p, success: false };
        }
      });

      const results = await Promise.allSettled(downloads);
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.status === 'fulfilled' && r.value.success) {
          ayahPaths.push(r.value.path);
          const textLen = (subs[i]?.text || '').length;
          const dur = Math.max(2, Math.min(20, 2 + textLen * 0.08));
          ayahDurations.push(dur);
        }
      }

      if (ayahPaths.length === 0) {
        throw new Error('Failed to download any ayah audio files');
      }

      const concatList = ayahPaths.map(p => `file '${sanitizePath(p)}'`).join('\n');
      const concatPath = path.join(tmpDir, 'concat.txt');
      fs.writeFileSync(concatPath, concatList, 'utf8');

      audioPath = path.join(tmpDir, 'audio.mp3');
      await runFfmpeg([
        '-y', '-f', 'concat', '-safe', '0', '-i', concatPath,
        '-c', 'copy', audioPath,
      ]);

      if (Array.isArray(subs) && subs.length > 0) {
        srtPath = path.join(tmpDir, 'subs.srt');
        let cumTime = 0;
        const lines: string[] = [];
        let ayahIdx = 0;
        for (let i = 0; i < subs.length; i++) {
          const downloadResult = results[i];
          if (downloadResult.status === 'fulfilled' && downloadResult.value.success) {
            const durS = ayahDurations[ayahIdx];
            const startMs = Math.round(cumTime * 1000);
            const endMs = Math.round((cumTime + durS) * 1000);
            const startSrt = new Date(startMs).toISOString().substr(11, 12).replace('.', ',');
            const endSrt = new Date(endMs).toISOString().substr(11, 12).replace('.', ',');
            lines.push(`${ayahIdx + 1}\n${startSrt} --> ${endSrt}\n${subs[i].text}\n`);
            cumTime += durS;
            ayahIdx++;
          }
        }
        fs.writeFileSync(srtPath, lines.join(''), 'utf8');
      }
    } else {
      const audioUrl = inner.audioUrl || inner.reciterAudioUrl;
      if (!audioUrl) throw new Error('No audio URL provided');

      audioPath = path.join(tmpDir, 'audio.mp3');
      const response = await axios.get(audioUrl, { responseType: 'stream', timeout: 120000 });
      const writer = fs.createWriteStream(audioPath);
      await new Promise<void>((resolve, reject) => {
        response.data.pipe(writer);
        writer.on('finish', () => resolve());
        writer.on('error', err => reject(err));
      });

      if (Array.isArray(subs) && subs.length > 0) {
        srtPath = path.join(tmpDir, 'subs.srt');
        const lines = subs.map((s: any, idx: number) => {
          const startMs = Math.round((s.start || idx * 6) * 1000);
          const endMs = Math.round((s.end || (idx + 1) * 6) * 1000);
          const startSrt = new Date(startMs).toISOString().substr(11, 12).replace('.', ',');
          const endSrt = new Date(endMs).toISOString().substr(11, 12).replace('.', ',');
          return `${idx + 1}\n${startSrt} --> ${endSrt}\n${s.text}\n`;
        }).join('\n');
        fs.writeFileSync(srtPath, lines, 'utf8');
      }
    }

    const publicDir = path.join(__dirname, '../public/videos');
    fs.mkdirSync(publicDir, { recursive: true });
    const outFilename = `video_${jobId}.mp4`;
    const outPath = path.join(publicDir, outFilename);

    const text = sanitizeText(inner.text || inner.reference || 'آية من القرآن الكريم');

    const themeImage = path.join(__dirname, `../public/assets/${safeTheme}.jpg`);
    const hasThemeImage = fs.existsSync(themeImage);

    const fontFile = findFont();
    const fontArg = fontFile ? `:fontfile='${sanitizePath(fontFile)}'` : '';

    const audioSanitized = sanitizePath(audioPath);
    const outSanitized = sanitizePath(outPath);

    if (srtPath) {
      const srtSanitized = sanitizePath(srtPath);
      if (hasThemeImage) {
        const imageSanitized = sanitizePath(themeImage);
        await runFfmpeg([
          '-y', '-loop', '1', '-i', imageSanitized,
          '-i', audioSanitized,
          '-c:v', 'libx264', '-c:a', 'aac', '-pix_fmt', 'yuv420p',
          '-shortest', '-tune', 'stillimage', '-movflags', '+faststart',
          '-vf', `subtitles='${srtSanitized}':original_size=720x1280`,
          outSanitized,
        ]);
      } else {
        await runFfmpeg([
          '-y', '-f', 'lavfi', '-i', 'color=size=720x1280:rate=25:color=black',
          '-i', audioSanitized,
          '-c:v', 'libx264', '-c:a', 'aac', '-pix_fmt', 'yuv420p', '-shortest',
          '-vf', `subtitles='${srtSanitized}':original_size=720x1280`,
          outSanitized,
        ]);
      }
    } else {
      if (hasThemeImage) {
        const imageSanitized = sanitizePath(themeImage);
        await runFfmpeg([
          '-y', '-loop', '1', '-i', imageSanitized,
          '-i', audioSanitized,
          '-c:v', 'libx264', '-c:a', 'aac', '-pix_fmt', 'yuv420p',
          '-shortest', '-tune', 'stillimage', '-movflags', '+faststart',
          '-vf', `drawtext=text='${text}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-200${fontArg}`,
          outSanitized,
        ]);
      } else {
        await runFfmpeg([
          '-y', '-f', 'lavfi', '-i', 'color=size=720x1280:rate=25:color=black',
          '-i', audioSanitized,
          '-c:v', 'libx264', '-c:a', 'aac', '-pix_fmt', 'yuv420p', '-shortest',
          '-vf', `drawtext=text='${text}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2${fontArg}`,
          outSanitized,
        ]);
      }
    }

    let outputUrl = '';
    if (process.env.S3_BUCKET && process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      const key = `videos/${outFilename}`;
      outputUrl = await uploadToS3(outPath, key);
    } else {
      const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
      outputUrl = `${serverUrl.replace(/\/+$/, '')}/videos/${outFilename}`;
    }

    await VideoJob.findByIdAndUpdate(jobId, { status: 'completed', outputUrl }).exec();

    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) { }
  } catch (err: any) {
    console.error('Video job failed:', err);
    await VideoJob.findByIdAndUpdate(jobId, { status: 'failed', error: String(err.message || err) }).exec();
  }
}

export default { processJob };
