import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();
router.use(authenticate);

const startSchema = z.object({
  taskId: z.string().uuid().optional(),
});

// Запустить таймер
router.post('/start', validate(startSchema), async (req: AuthRequest, res: Response) => {
  // Проверить, что у пользователя нет активного таймера
  const active = await prisma.timerSession.findFirst({
    where: { userId: req.userId!, endedAt: null },
  });
  if (active) {
    res.status(409).json({ error: 'Уже есть активный таймер', session: active });
    return;
  }

  // Если указана задача, проверить принадлежность
  if (req.body.taskId) {
    const task = await prisma.task.findFirst({
      where: { id: req.body.taskId, category: { userId: req.userId! } },
    });
    if (!task) {
      res.status(404).json({ error: 'Задача не найдена' });
      return;
    }
  }

  const session = await prisma.timerSession.create({
    data: {
      userId: req.userId!,
      taskId: req.body.taskId,
    },
    include: { task: { select: { id: true, title: true } } },
  });
  res.status(201).json(session);
});

// Остановить таймер
router.post('/stop', async (req: AuthRequest, res: Response) => {
  const active = await prisma.timerSession.findFirst({
    where: { userId: req.userId!, endedAt: null },
  });
  if (!active) {
    res.status(404).json({ error: 'Нет активного таймера' });
    return;
  }

  const endedAt = new Date();
  const duration = Math.round((endedAt.getTime() - active.startedAt.getTime()) / 1000);

  const session = await prisma.timerSession.update({
    where: { id: active.id },
    data: { endedAt, duration },
    include: { task: { select: { id: true, title: true } } },
  });
  res.json(session);
});

// Текущий активный таймер
router.get('/active', async (req: AuthRequest, res: Response) => {
  const active = await prisma.timerSession.findFirst({
    where: { userId: req.userId!, endedAt: null },
    include: { task: { select: { id: true, title: true } } },
  });
  res.json(active);
});

// История сессий
router.get('/history', async (req: AuthRequest, res: Response) => {
  const { limit = '20', offset = '0' } = req.query;

  const sessions = await prisma.timerSession.findMany({
    where: { userId: req.userId!, endedAt: { not: null } },
    include: { task: { select: { id: true, title: true, category: { select: { name: true, color: true } } } } },
    orderBy: { startedAt: 'desc' },
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
  });
  res.json(sessions);
});

export default router;
