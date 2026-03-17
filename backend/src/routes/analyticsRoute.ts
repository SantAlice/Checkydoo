import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getUserAnalytics } from '../services/analytics';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const analytics = await getUserAnalytics(req.userId!, Math.min(days, 365));
    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Ошибка при получении аналитики' });
  }
});

export default router;
