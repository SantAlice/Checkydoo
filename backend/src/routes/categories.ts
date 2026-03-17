import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6B9E78'),
  type: z.enum(['WORK', 'PERSONAL', 'HOBBY', 'REST', 'CUSTOM']).default('CUSTOM'),
});

const updateSchema = createSchema.partial();

router.get('/', async (req: AuthRequest, res: Response) => {
  const categories = await prisma.category.findMany({
    where: { userId: req.userId! },
    include: {
      tasks: {
        orderBy: { sortOrder: 'asc' },
      },
      _count: { select: { tasks: true } },
    },
    orderBy: { sortOrder: 'asc' },
  });
  res.json(categories);
});

router.post('/', validate(createSchema), async (req: AuthRequest, res: Response) => {
  const maxOrder = await prisma.category.aggregate({
    where: { userId: req.userId! },
    _max: { sortOrder: true },
  });

  const category = await prisma.category.create({
    data: {
      ...req.body,
      userId: req.userId!,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  res.status(201).json(category);
});

router.put('/:id', validate(updateSchema), async (req: AuthRequest, res: Response) => {
  const category = await prisma.category.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!category) {
    res.status(404).json({ error: 'Категория не найдена' });
    return;
  }

  const updated = await prisma.category.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(updated);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const category = await prisma.category.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!category) {
    res.status(404).json({ error: 'Категория не найдена' });
    return;
  }

  await prisma.category.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
