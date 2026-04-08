export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
export type CategoryType = 'WORK' | 'PERSONAL' | 'HOBBY' | 'REST' | 'CUSTOM';

export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color: string;
  type: CategoryType;
  sortOrder: number;
  tasks: Task[];
  _count?: { tasks: number };
}

export interface Task {
  id: string;
  categoryId: string;
  title: string;
  description?: string;
  priority: Priority | null;
  status: TaskStatus;
  deadline?: string;
  completedAt?: string;
  sortOrder: number;
  totalTime: number;
  category?: {
    id: string;
    name: string;
    color: string;
    icon?: string;
    type: CategoryType;
  };
}

export interface TimerSession {
  id: string;
  taskId?: string;
  startedAt: string;
  endedAt?: string;
  duration?: number;
  task?: { id: string; title: string };
}

export interface ScheduleStatus {
  isOverloaded: boolean;
  totalMinutesToday: number;
  taskCount: number;
  hasSnapshot: boolean;
}

export interface ScheduleChange {
  taskId: string;
  title: string;
  priority: string | null;
  categoryName: string;
  currentDeadline: string;
  newDeadline: string;
}

export interface ScheduleProposal {
  totalTasksToday: number;
  keepTodayCount: number;
  movedCount: number;
  changes: ScheduleChange[];
}

export interface Analytics {
  timeDistribution: {
    category: string;
    type: CategoryType;
    totalMinutes: number;
    percentage: number;
  }[];
  overdueAnalysis: {
    totalOverdue: number;
    byCategory: { name: string; count: number }[];
    commonPatterns: string[];
  };
  completionRate: number;
  recommendations: string[];
  weeklyTrend: { date: string; completed: number; created: number }[];
}
