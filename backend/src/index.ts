import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { prisma } from './config/db';
import authRouter from './routes/auth';
import categoriesRouter from './routes/categories';
import tasksRouter from './routes/tasks';
import timerRouter from './routes/timer';
import analyticsRouter from './routes/analyticsRoute';
import scheduleRouter from './routes/schedule';

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Rate limiting (1000+ пользователей)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/timer', timerRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/schedule', scheduleRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start
const start = async () => {
  await prisma.$connect();
  console.log('Connected to database');

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

start().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
