import { create } from 'zustand';
import { api } from '../services/api';
import type { User, Category, Task, TimerSession, Analytics, ScheduleStatus, ScheduleProposal } from '../types';

interface AppStore {
  // Auth
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  initAuth: () => void;

  // Categories
  categories: Category[];
  loadCategories: () => Promise<void>;
  addCategory: (data: { name: string; icon?: string; color?: string; type?: string }) => Promise<void>;
  updateCategory: (id: string, data: any) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Tasks
  tasks: Task[];
  loadTasks: (categoryId?: string) => Promise<void>;
  addTask: (data: { categoryId: string; title: string; priority?: string; deadline?: string }) => Promise<void>;
  updateTask: (id: string, data: any) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Timer
  activeTimer: TimerSession | null;
  timerElapsed: number;
  loadActiveTimer: () => Promise<void>;
  startTimer: (taskId?: string) => Promise<void>;
  stopTimer: () => Promise<void>;
  setTimerElapsed: (seconds: number) => void;

  // Analytics
  analytics: Analytics | null;
  loadAnalytics: (days?: number) => Promise<void>;

  // Schedule optimization
  scheduleStatus: ScheduleStatus | null;
  scheduleProposal: ScheduleProposal | null;
  loadScheduleStatus: () => Promise<void>;
  optimizeSchedule: (preferences?: string) => Promise<void>;
  applyOptimization: () => Promise<void>;
  revertOptimization: () => Promise<void>;
  clearProposal: () => void;

  // UI
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useStore = create<AppStore>((set, get) => ({
  // Auth
  user: null,
  token: null,

  initAuth: () => {
    const token = localStorage.getItem('checkydoo_token');
    const userStr = localStorage.getItem('checkydoo_user');
    if (token && userStr) {
      set({ token, user: JSON.parse(userStr) });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { user, token } = await api.auth.login({ email, password });
      localStorage.setItem('checkydoo_token', token);
      localStorage.setItem('checkydoo_user', JSON.stringify(user));
      set({ user, token, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  register: async (email, password, displayName) => {
    set({ loading: true, error: null });
    try {
      const { user, token } = await api.auth.register({ email, password, displayName });
      localStorage.setItem('checkydoo_token', token);
      localStorage.setItem('checkydoo_user', JSON.stringify(user));
      set({ user, token, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  logout: () => {
    localStorage.removeItem('checkydoo_token');
    localStorage.removeItem('checkydoo_user');
    set({ user: null, token: null, categories: [], tasks: [], analytics: null });
  },

  // Categories
  categories: [],
  loadCategories: async () => {
    try {
      const categories = await api.categories.list();
      set({ categories });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  addCategory: async (data) => {
    const category = await api.categories.create(data);
    set({ categories: [...get().categories, category] });
  },

  updateCategory: async (id, data) => {
    const updated = await api.categories.update(id, data);
    set({ categories: get().categories.map(c => c.id === id ? { ...c, ...updated } : c) });
  },

  deleteCategory: async (id) => {
    await api.categories.delete(id);
    set({ categories: get().categories.filter(c => c.id !== id) });
  },

  // Tasks
  tasks: [],
  loadTasks: async (categoryId) => {
    try {
      const tasks = await api.tasks.list(categoryId ? { categoryId } : undefined);
      set({ tasks });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  addTask: async (data) => {
    const task = await api.tasks.create(data);
    set({ tasks: [...get().tasks, task] });
  },

  updateTask: async (id, data) => {
    const updated = await api.tasks.update(id, data);
    set({ tasks: get().tasks.map(t => t.id === id ? { ...t, ...updated } : t) });
  },

  deleteTask: async (id) => {
    await api.tasks.delete(id);
    set({ tasks: get().tasks.filter(t => t.id !== id) });
  },

  // Timer
  activeTimer: null,
  timerElapsed: 0,

  loadActiveTimer: async () => {
    try {
      const active = await api.timer.active();
      if (active) {
        const elapsed = Math.round((Date.now() - new Date(active.startedAt).getTime()) / 1000);
        set({ activeTimer: active, timerElapsed: elapsed });
      } else {
        set({ activeTimer: null, timerElapsed: 0 });
      }
    } catch { /* ignore */ }
  },

  startTimer: async (taskId) => {
    const session = await api.timer.start(taskId);
    set({ activeTimer: session, timerElapsed: 0 });
  },

  stopTimer: async () => {
    await api.timer.stop();
    set({ activeTimer: null, timerElapsed: 0 });
  },

  setTimerElapsed: (seconds) => set({ timerElapsed: seconds }),

  // Analytics
  analytics: null,
  loadAnalytics: async (days = 30) => {
    try {
      const analytics = await api.analytics.get(days);
      set({ analytics });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  // Schedule optimization
  scheduleStatus: null,
  scheduleProposal: null,

  loadScheduleStatus: async () => {
    try {
      const status = await api.schedule.status();
      set({ scheduleStatus: status });
    } catch { /* ignore */ }
  },

  optimizeSchedule: async (preferences) => {
    set({ loading: true, error: null });
    try {
      const proposal = await api.schedule.optimize(preferences);
      set({ scheduleProposal: proposal, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  applyOptimization: async () => {
    const proposal = get().scheduleProposal;
    if (!proposal) return;
    set({ loading: true, error: null });
    try {
      await api.schedule.apply(
        proposal.changes.map(c => ({
          taskId: c.taskId,
          currentDeadline: c.currentDeadline,
          newDeadline: c.newDeadline,
        })),
      );
      set({ scheduleProposal: null, loading: false });
      // Перезагружаем данные
      await get().loadTasks();
      await get().loadScheduleStatus();
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  revertOptimization: async () => {
    set({ loading: true, error: null });
    try {
      await api.schedule.revert();
      set({ loading: false });
      await get().loadTasks();
      await get().loadScheduleStatus();
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  clearProposal: () => set({ scheduleProposal: null }),

  // UI
  loading: false,
  error: null,
  clearError: () => set({ error: null }),
}));
