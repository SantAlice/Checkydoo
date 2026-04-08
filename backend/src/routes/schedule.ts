import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();
router.use(authenticate);

const DEFAULT_TASK_MINUTES = 60;
const OVERLOAD_THRESHOLD_MINUTES = 12 * 60;
const TARGET_MINUTES_PER_DAY = 8 * 60;

const PRIORITY_WEIGHT: Record<string, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function estimateTaskMinutes(timerDurations: (number | null)[]): number {
  const tracked = timerDurations.reduce<number>((s, d) => s + (d ?? 0), 0) / 60;
  return Math.max(tracked, DEFAULT_TASK_MINUTES);
}

// GET /api/schedule/status — проверка перегрузки
router.get('/status', async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const todayEnd = endOfDay(now);

  const tasks = await prisma.task.findMany({
    where: {
      category: { userId: req.userId! },
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      deadline: { lte: todayEnd },
    },
    include: {
      timerSessions: {
        where: { endedAt: { not: null } },
        select: { duration: true },
      },
    },
  });

  const totalMinutes = tasks.reduce(
    (sum, t) => sum + estimateTaskMinutes(t.timerSessions.map(s => s.duration)),
    0,
  );

  const snapshot = await prisma.scheduleSnapshot.findUnique({
    where: { userId: req.userId! },
  });

  res.json({
    isOverloaded: totalMinutes > OVERLOAD_THRESHOLD_MINUTES,
    totalMinutesToday: Math.round(totalMinutes),
    taskCount: tasks.length,
    hasSnapshot: !!snapshot,
  });
});

// POST /api/schedule/optimize — генерация предложения
const optimizeSchema = z.object({
  preferences: z.string().max(1000).optional(),
});

router.post('/optimize', validate(optimizeSchema), async (req: AuthRequest, res: Response) => {
  const now = new Date();
  const todayEnd = endOfDay(now);

  const tasks = await prisma.task.findMany({
    where: {
      category: { userId: req.userId! },
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      deadline: { lte: todayEnd },
    },
    include: {
      category: { select: { name: true, type: true } },
      timerSessions: {
        where: { endedAt: { not: null } },
        select: { duration: true },
      },
    },
    orderBy: { deadline: 'asc' },
  });

  // Сортируем по приоритету (высший — первым)
  const sorted = [...tasks].sort((a, b) => {
    const pa = PRIORITY_WEIGHT[a.priority ?? ''] ?? 0;
    const pb = PRIORITY_WEIGHT[b.priority ?? ''] ?? 0;
    return pb - pa;
  });

  // Делим: оставляем на сегодня / переносим
  let todayMinutes = 0;
  const keepToday: typeof sorted = [];
  const toMove: typeof sorted = [];

  for (const task of sorted) {
    const est = estimateTaskMinutes(task.timerSessions.map(s => s.duration));
    if (todayMinutes + est <= TARGET_MINUTES_PER_DAY) {
      todayMinutes += est;
      keepToday.push(task);
    } else {
      toMove.push(task);
    }
  }

  // Загрузка будущих дней (следующие 7 дней)
  const futureDaysLoad = new Map<string, number>();
  for (let i = 1; i <= 7; i++) {
    const dayStart = startOfDay(addDays(now, i));
    const dayEnd = endOfDay(addDays(now, i));
    const count = await prisma.task.count({
      where: {
        category: { userId: req.userId! },
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        deadline: { gte: dayStart, lte: dayEnd },
      },
    });
    futureDaysLoad.set(dayStart.toISOString().slice(0, 10), count * DEFAULT_TASK_MINUTES);
  }

  // Распределяем переносимые задачи по будущим дням
  const changes: {
    taskId: string;
    title: string;
    priority: string | null;
    categoryName: string;
    currentDeadline: string;
    newDeadline: string;
  }[] = [];

  for (const task of toMove) {
    const est = DEFAULT_TASK_MINUTES;
    let placed = false;

    for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
      const dayKey = startOfDay(addDays(now, dayOffset)).toISOString().slice(0, 10);
      const currentLoad = futureDaysLoad.get(dayKey) ?? 0;
      if (currentLoad + est <= TARGET_MINUTES_PER_DAY) {
        const newDeadline = endOfDay(addDays(now, dayOffset));
        changes.push({
          taskId: task.id,
          title: task.title,
          priority: task.priority,
          categoryName: task.category.name,
          currentDeadline: task.deadline!.toISOString(),
          newDeadline: newDeadline.toISOString(),
        });
        futureDaysLoad.set(dayKey, currentLoad + est);
        placed = true;
        break;
      }
    }

    // Если не нашли место за 7 дней — ставим на 7-й день
    if (!placed) {
      const newDeadline = endOfDay(addDays(now, 7));
      changes.push({
        taskId: task.id,
        title: task.title,
        priority: task.priority,
        categoryName: task.category.name,
        currentDeadline: task.deadline!.toISOString(),
        newDeadline: newDeadline.toISOString(),
      });
    }
  }

  res.json({
    totalTasksToday: tasks.length,
    keepTodayCount: keepToday.length,
    movedCount: changes.length,
    changes,
  });
});

// POST /api/schedule/apply — применить оптимизацию
const applySchema = z.object({
  changes: z.array(z.object({
    taskId: z.string().uuid(),
    currentDeadline: z.string(),
    newDeadline: z.string(),
  })),
});

router.post('/apply', validate(applySchema), async (req: AuthRequest, res: Response) => {
  const { changes } = req.body;

  // Сохраняем снимок для отката
  await prisma.scheduleSnapshot.upsert({
    where: { userId: req.userId! },
    create: {
      userId: req.userId!,
      changes: changes.map((c: any) => ({
        taskId: c.taskId,
        oldDeadline: c.currentDeadline,
        newDeadline: c.newDeadline,
      })),
    },
    update: {
      changes: changes.map((c: any) => ({
        taskId: c.taskId,
        oldDeadline: c.currentDeadline,
        newDeadline: c.newDeadline,
      })),
      createdAt: new Date(),
    },
  });

  // Применяем изменения в транзакции
  await prisma.$transaction(
    changes.map((change: any) =>
      prisma.task.update({
        where: { id: change.taskId },
        data: { deadline: new Date(change.newDeadline) },
      }),
    ),
  );

  res.json({ applied: true, movedCount: changes.length });
});

// POST /api/schedule/revert — откатить оптимизацию
router.post('/revert', async (req: AuthRequest, res: Response) => {
  const snapshot = await prisma.scheduleSnapshot.findUnique({
    where: { userId: req.userId! },
  });

  if (!snapshot) {
    res.status(404).json({ error: 'Нет сохранённого снимка расписания' });
    return;
  }

  const changes = snapshot.changes as { taskId: string; oldDeadline: string; newDeadline: string }[];

  // Откатываем в транзакции
  await prisma.$transaction(
    changes.map(change =>
      prisma.task.update({
        where: { id: change.taskId },
        data: { deadline: new Date(change.oldDeadline) },
      }),
    ),
  );

  await prisma.scheduleSnapshot.delete({
    where: { userId: req.userId! },
  });

  res.json({ reverted: true, revertedCount: changes.length });
});

export default router;
