import { Router, Request, Response } from 'express';
import azkarData from '../data/azkar.json';

const router = Router();

// GET /api/azkar - Get all azkar categories
router.get('/', (req: Request, res: Response) => {
  const categoriesWithoutAzkar = azkarData.map(({ azkar, ...rest }) => ({
    ...rest,
    azkarCount: azkar.length,
  }));
  res.json({ success: true, data: categoriesWithoutAzkar });
});

// GET /api/azkar/:categoryId - Get specific category with azkar
router.get('/:categoryId', (req: Request, res: Response) => {
  const category = azkarData.find(c => c.id === req.params.categoryId);
  if (!category) {
    return res.status(404).json({ success: false, error: 'Azkar category not found' });
  }
  res.json({ success: true, data: category });
});

// GET /api/azkar/:categoryId/:azkarId - Get specific dhikr
router.get('/:categoryId/:azkarId', (req: Request, res: Response) => {
  const category = azkarData.find(c => c.id === req.params.categoryId);
  if (!category) {
    return res.status(404).json({ success: false, error: 'Category not found' });
  }
  const dhikr = category.azkar.find((a) => a.id === req.params.azkarId);
  if (!dhikr) {
    return res.status(404).json({ success: false, error: 'Dhikr not found' });
  }
  res.json({ success: true, data: dhikr });
});

export default router;
