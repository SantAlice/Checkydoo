import { prisma } from '../config/db';
import { CategoryType } from '@prisma/client';

interface TimeDistribution {
  category: string;
  type: CategoryType;
  totalMinutes: number;
  percentage: number;
}

interface OverdueAnalysis {
  totalOverdue: number;
  byCategory: { name: string; count: number }[];
  commonPatterns: string[];
}

interface AnalyticsResult {
  timeDistribution: TimeDistribution[];
  overdueAnalysis: OverdueAnalysis;
  completionRate: number;
  recommendations: string[];
  weeklyTrend: { date: string; completed: number; created: number }[];
}

export async function getUserAnalytics(userId: string, days: number = 30): Promise<AnalyticsResult> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [categories, tasks, timerSessions] = await Promise.all([
    prisma.category.findMany({
      where: { userId },
      include: {
        tasks: {
          where: { createdAt: { gte: since } },
        },
      },
    }),
    prisma.task.findMany({
      where: {
        category: { userId },
        createdAt: { gte: since },
      },
      include: { category: true },
    }),
    prisma.timerSession.findMany({
      where: {
        userId,
        startedAt: { gte: since },
        endedAt: { not: null },
      },
      include: { task: { include: { category: true } } },
    }),
  ]);

  // Распределение времени по категориям
  const timeByCategory = new Map<string, { name: string; type: CategoryType; minutes: number }>();
  for (const session of timerSessions) {
    const catName = session.task?.category?.name ?? 'Без категории';
    const catType = session.task?.category?.type ?? CategoryType.CUSTOM;
    const existing = timeByCategory.get(catName) ?? { name: catName, type: catType, minutes: 0 };
    existing.minutes += (session.duration ?? 0) / 60;
    timeByCategory.set(catName, existing);
  }

  const totalMinutes = Array.from(timeByCategory.values()).reduce((s, v) => s + v.minutes, 0) || 1;
  const timeDistribution: TimeDistribution[] = Array.from(timeByCategory.values()).map(v => ({
    category: v.name,
    type: v.type,
    totalMinutes: Math.round(v.minutes),
    percentage: Math.round((v.minutes / totalMinutes) * 100),
  }));

  // Анализ просроченных задач
  const overdueTasks = tasks.filter(t =>
    t.deadline && t.deadline < new Date() && t.status !== 'COMPLETED'
  );
  const overdueByCategory = new Map<string, number>();
  for (const t of overdueTasks) {
    const name = t.category.name;
    overdueByCategory.set(name, (overdueByCategory.get(name) ?? 0) + 1);
  }

  const overdueAnalysis: OverdueAnalysis = {
    totalOverdue: overdueTasks.length,
    byCategory: Array.from(overdueByCategory.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    commonPatterns: generateOverduePatterns(overdueTasks),
  };

  // Процент выполнения
  const totalTasks = tasks.length || 1;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const completionRate = Math.round((completedTasks / totalTasks) * 100);

  // Тренд по неделям
  const weeklyTrend = generateWeeklyTrend(tasks, days);

  // ИИ-рекомендации
  const recommendations = generateRecommendations(timeDistribution, overdueAnalysis, completionRate);

  return { timeDistribution, overdueAnalysis, completionRate, recommendations, weeklyTrend };
}

function generateOverduePatterns(overdueTasks: any[]): string[] {
  const patterns: string[] = [];

  if (overdueTasks.length === 0) return ['Просроченных задач нет — отличная работа!'];

  // Анализ по дням недели
  const dayCount = new Map<number, number>();
  for (const t of overdueTasks) {
    if (t.deadline) {
      const day = new Date(t.deadline).getDay();
      dayCount.set(day, (dayCount.get(day) ?? 0) + 1);
    }
  }
  const dayNames = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  const worstDay = Array.from(dayCount.entries()).sort((a, b) => b[1] - a[1])[0];
  if (worstDay) {
    patterns.push(`Чаще всего дедлайны срываются в ${dayNames[worstDay[0]]}`);
  }

  // Анализ приоритетов
  const highPriorityOverdue = overdueTasks.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT');
  if (highPriorityOverdue.length > overdueTasks.length * 0.3) {
    patterns.push('Много просроченных задач с высоким приоритетом — возможно, стоит пересмотреть оценку сроков');
  }

  return patterns;
}

function generateWeeklyTrend(tasks: any[], days: number): { date: string; completed: number; created: number }[] {
  const trend: { date: string; completed: number; created: number }[] = [];
  const now = new Date();

  for (let i = Math.min(days, 28); i >= 0; i -= 7) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const created = tasks.filter(t =>
      new Date(t.createdAt) >= weekStart && new Date(t.createdAt) < weekEnd
    ).length;
    const completed = tasks.filter(t =>
      t.completedAt && new Date(t.completedAt) >= weekStart && new Date(t.completedAt) < weekEnd
    ).length;

    trend.push({
      date: weekStart.toISOString().split('T')[0],
      completed,
      created,
    });
  }

  return trend;
}

function generateRecommendations(
  timeDistribution: TimeDistribution[],
  overdueAnalysis: OverdueAnalysis,
  completionRate: number
): string[] {
  const recs: string[] = [];

  // Баланс работа/отдых
  const workTime = timeDistribution
    .filter(t => t.type === 'WORK')
    .reduce((s, t) => s + t.percentage, 0);
  const restTime = timeDistribution
    .filter(t => t.type === 'REST')
    .reduce((s, t) => s + t.percentage, 0);
  const hobbyTime = timeDistribution
    .filter(t => t.type === 'HOBBY')
    .reduce((s, t) => s + t.percentage, 0);

  if (workTime > 70) {
    recs.push('⚠️ Более 70% времени уходит на работу. Рекомендуем выделить время на отдых и хобби для поддержания баланса.');
  }
  if (restTime < 15 && timeDistribution.length > 0) {
    recs.push('💤 Мало времени на отдых. Для долгосрочной продуктивности важен полноценный отдых.');
  }
  if (hobbyTime === 0 && timeDistribution.length > 0) {
    recs.push('🎨 Не забывайте про хобби — творческая активность помогает восстановлению и мотивации.');
  }

  // Процент выполнения
  if (completionRate < 50) {
    recs.push('📋 Выполняется менее половины задач. Попробуйте ставить меньше задач, но выполнять их все.');
  } else if (completionRate > 90) {
    recs.push('🌟 Отличный показатель выполнения! Вы эффективно управляете своими задачами.');
  }

  // Просрочки
  if (overdueAnalysis.totalOverdue > 5) {
    recs.push('⏰ Накопилось много просроченных задач. Рекомендуем пересмотреть приоритеты и перенести дедлайны.');
  }

  if (recs.length === 0) {
    recs.push('✅ Вы отлично справляетесь! Продолжайте в том же духе.');
  }

  return recs;
}
