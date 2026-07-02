import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const router = Router();

router.post('/presign', authenticate, async (req: AuthRequest, res) => {
  try {
    const { key, contentType } = req.body;
    if (!key || !contentType) return res.status(400).json({ success: false, error: 'Missing key or contentType' });
    if (!process.env.S3_BUCKET || !process.env.AWS_REGION) return res.status(500).json({ success: false, error: 'S3 not configured' });

    const client = new S3Client({ region: process.env.AWS_REGION });
    const command = new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, ContentType: contentType });
    const url = await getSignedUrl(client, command, { expiresIn: 60 * 5 });
    // Build public URL if S3_BASE_URL provided or infer from bucket/region
    let publicUrl: string | null = null;
    if (process.env.S3_BASE_URL) {
      publicUrl = `${process.env.S3_BASE_URL.replace(/\/+$/, '')}/${key}`;
    } else if (process.env.S3_BUCKET && process.env.AWS_REGION) {
      publicUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }

    res.json({ success: true, data: { url, key, publicUrl } });
  } catch (err:any) {
    console.error('Presign error', err);
    res.status(500).json({ success: false, error: err.message || 'Presign failed' });
  }
});

export default router;
