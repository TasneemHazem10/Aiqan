import { Router, Request, Response } from 'express';
import duasData from '../data/duas.json';

const router = Router();

// GET /api/dua - Get all dua categories
router.get('/', (req: Request, res: Response) => {
  const categories = duasData.map(({ duas, ...rest }) => ({
    ...rest,
    duaCount: duas.length,
  }));
  res.json({ success: true, data: categories });
});

// GET /api/dua/search - Search duas
router.get('/search', (req: Request, res: Response) => {
  const query = (req.query.q as string || '').toLowerCase();
  if (!query) {
    return res.status(400).json({ success: false, error: 'Search query required' });
  }
  const results: Array<{ categoryId: string; categoryName: string; dua: unknown }> = [];
  duasData.forEach(category => {
    category.duas.forEach(dua => {
      if (
        dua.title.toLowerCase().includes(query) ||
        dua.translation.toLowerCase().includes(query) ||
        dua.transliteration.toLowerCase().includes(query)
      ) {
        results.push({ categoryId: category.id, categoryName: category.name, dua });
      }
    });
  });
  res.json({ success: true, data: results });
});

// GET /api/dua/:categoryId - Get specific category with duas
router.get('/:categoryId', (req: Request, res: Response) => {
  const category = duasData.find(c => c.id === req.params.categoryId);
  if (!category) {
    return res.status(404).json({ success: false, error: 'Dua category not found' });
  }
  res.json({ success: true, data: category });
});

// GET /api/dua/:categoryId/:duaId - Get specific dua
router.get('/:categoryId/:duaId', (req: Request, res: Response) => {
  const category = duasData.find(c => c.id === req.params.categoryId);
  if (!category) {
    return res.status(404).json({ success: false, error: 'Category not found' });
  }
  const dua = category.duas.find((d) => d.id === req.params.duaId);
  if (!dua) {
    return res.status(404).json({ success: false, error: 'Dua not found' });
  }
  res.json({ success: true, data: dua });
});

export default router;
