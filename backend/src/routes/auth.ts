import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { validate } from '../middleware/validate';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Пароль должен содержать минимум 8 символов'),
  displayName: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function generateToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '30d' });
}

router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Пользователь с таким email уже существует' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        categories: {
          create: [
            { name: 'Работа', type: 'WORK', color: '#4A90D9', icon: '💼', sortOrder: 0 },
            { name: 'Личное', type: 'PERSONAL', color: '#6B9E78', icon: '🏠', sortOrder: 1 },
            { name: 'Хобби', type: 'HOBBY', color: '#D4A574', icon: '🎨', sortOrder: 2 },
            { name: 'Отдых', type: 'REST', color: '#9B8EC4', icon: '☕', sortOrder: 3 },
          ],
        },
      },
      select: { id: true, email: true, displayName: true },
    });

    const token = generateToken(user.id);
    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Неверный email или пароль' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Неверный email или пароль' });
      return;
    }

    const token = generateToken(user.id);
    res.json({
      user: { id: user.id, email: user.email, displayName: user.displayName },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
