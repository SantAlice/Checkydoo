import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  deadline: z.string().datetime().optional().transform(v => v ? new Date(v) : undefined),
});

const updateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']).optional(),
  deadline: z.string().datetime().optional().nullable().transform(v => v ? new Date(v) : v),
  categoryId: z.string().uuid().optional(),
  sortOrder: z.number().int().optional(),
});

// Получить задачи (опционально фильтр по категории)
router.get('/', async (req: AuthRequest, res: Response) => {
  const { categoryId, status, priority } = req.query;

  const tasks = await prisma.task.findMany({
    where: {
      category: { userId: req.userId! },
      ...(categoryId ? { categoryId: categoryId as string } : {}),
      ...(status ? { status: status as any } : {}),
      ...(priority ? { priority: priority as any } : {}),
    },
    include: {
      category: { select: { id: true, name: true, color: true, icon: true, type: true } },
      timerSessions: {
        where: { endedAt: { not: null } },
        select: { duration: true },
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  // Добавить общее время таймера к каждой задаче
  const tasksWithTime = tasks.map(t => ({
    ...t,
    totalTime: t.timerSessions.reduce((sum, s) => sum + (s.duration ?? 0), 0),
    timerSessions: undefined,
  }));

  res.json(tasksWithTime);
});

router.post('/', validate(createSchema), async (req: AuthRequest, res: Response) => {
  // Проверить, что категория принадлежит пользователю
  const category = await prisma.category.findFirst({
    where: { id: req.body.categoryId, userId: req.userId! },
  });
  if (!category) {
    res.status(404).json({ error: 'Категория не найдена' });
    return;
  }

  const maxOrder = await prisma.task.aggregate({
    where: { categoryId: req.body.categoryId },
    _max: { sortOrder: true },
  });

  const task = await prisma.task.create({
    data: {
      ...req.body,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
    include: {
      category: { select: { id: true, name: true, color: true, icon: true, type: true } },
    },
  });
  res.status(201).json(task);
});

router.put('/:id', validate(updateSchema), async (req: AuthRequest, res: Response) => {
  const task = await prisma.task.findFirst({
    where: { id: req.params.id, category: { userId: req.userId! } },
  });
  if (!task) {
    res.status(404).json({ error: 'Задача не найдена' });
    return;
  }

  const data: any = { ...req.body };
  if (data.status === 'COMPLETED' && task.status !== 'COMPLETED') {
    data.completedAt = new Date();
  } else if (data.status && data.status !== 'COMPLETED') {
    data.completedAt = null;
  }

  const updated = await prisma.task.update({
    where: { id: req.params.id },
    data,
    include: {
      category: { select: { id: true, name: true, color: true, icon: true, type: true } },
    },
  });
  res.json(updated);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const task = await prisma.task.findFirst({
    where: { id: req.params.id, category: { userId: req.userId! } },
  });
  if (!task) {
    res.status(404).json({ error: 'Задача не найдена' });
    return;
  }

  await prisma.task.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
