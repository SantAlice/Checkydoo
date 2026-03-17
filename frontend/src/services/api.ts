const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('checkydoo_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Ошибка сервера' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; displayName: string }) =>
      request<{ user: any; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      request<{ user: any; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  },
  categories: {
    list: () => request<any[]>('/categories'),
    create: (data: { name: string; icon?: string; color?: string; type?: string }) =>
      request<any>('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/categories/${id}`, { method: 'DELETE' }),
  },
  tasks: {
    list: (params?: { categoryId?: string; status?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<any[]>(`/tasks${query ? `?${query}` : ''}`);
    },
    create: (data: { categoryId: string; title: string; priority?: string; deadline?: string }) =>
      request<any>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/tasks/${id}`, { method: 'DELETE' }),
  },
  timer: {
    start: (taskId?: string) =>
      request<any>('/timer/start', { method: 'POST', body: JSON.stringify({ taskId }) }),
    stop: () =>
      request<any>('/timer/stop', { method: 'POST' }),
    active: () => request<any | null>('/timer/active'),
    history: (limit = 20) => request<any[]>(`/timer/history?limit=${limit}`),
  },
  analytics: {
    get: (days = 30) => request<any>(`/analytics?days=${days}`),
  },
};
