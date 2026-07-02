import request from 'supertest';
import express from 'express';
import azkarRoutes from '../routes/azkar';
import duaRoutes from '../routes/dua';
import recitersRoutes from '../routes/reciters';
function createTestApp() {
  const app = express();
  app.use('/api/azkar', azkarRoutes);
  app.use('/api/dua', duaRoutes);
  app.use('/api/reciters', recitersRoutes);
  return app;
}

const app = createTestApp();

describe('GET /api/azkar', () => {
  it('returns all categories with counts', async () => {
    const res = await request(app).get('/api/azkar');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(5);
    for (const cat of res.body.data) {
      expect(cat.azkarCount).toBeDefined();
      expect(cat.azkar).toBeUndefined();
    }
  });

  it('returns specific category with azkar', async () => {
    const res = await request(app).get('/api/azkar/morning');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.azkar).toBeDefined();
    expect(Array.isArray(res.body.data.azkar)).toBe(true);
  });

  it('returns 404 for unknown category', async () => {
    const res = await request(app).get('/api/azkar/nonexistent');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/dua', () => {
  it('returns all dua categories', async () => {
    const res = await request(app).get('/api/dua');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(8);
  });

  it('search returns results', async () => {
    const res = await request(app).get('/api/dua/search?q=forgiveness');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('search returns 400 without query', async () => {
    const res = await request(app).get('/api/dua/search');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/reciters', () => {
  it('returns all reciters', async () => {
    const res = await request(app).get('/api/reciters');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(20);
  });

  it('returns specific reciter', async () => {
    const res = await request(app).get('/api/reciters/ar.alafasy');
    expect(res.status).toBe(200);
    expect(res.body.data.name).toContain('Alafasy');
  });

  it('returns 404 for unknown reciter', async () => {
    const res = await request(app).get('/api/reciters/unknown');
    expect(res.status).toBe(404);
  });

  it('generates correct audio URL for surah', async () => {
    const res = await request(app).get('/api/reciters/ar.alafasy/audio/1');
    expect(res.status).toBe(200);
    expect(res.body.data.url).toContain('cdn.islamic.network');
    expect(res.body.data.url).toContain('001.mp3');
  });

  it('returns 400 for invalid surah number', async () => {
    const res = await request(app).get('/api/reciters/ar.alafasy/audio/200');
    expect(res.status).toBe(400);
  });
});

