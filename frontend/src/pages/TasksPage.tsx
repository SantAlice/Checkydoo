import { useEffect, useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import type { Category, Task, Priority, ScheduleChange } from '../types';

const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  URGENT: 'Срочно',
};

function ProgressRing({ percentage, size = 200 }: { percentage: number; size?: number }) {
  const stroke = 8;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (percentage / 100) * circ;

  return (
    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--surface-container-high)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--primary)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      <text x={size / 2} y={size / 2 - 8} textAnchor="middle" fill="var(--primary)"
        fontSize="3rem" fontWeight="800" fontFamily="Manrope">{percentage}%</text>
      <text x={size / 2} y={size / 2 + 22} textAnchor="middle" fill="var(--on-surface-variant)"
        fontSize="0.75rem" fontWeight="700" letterSpacing="2" fontFamily="Manrope">ГОТОВО</text>
    </svg>
  );
}

function TaskItem({ task, onToggle }: {
  task: Task;
  onToggle: () => void;
}) {
  const isCompleted = task.status === 'COMPLETED';

  return (
    <div className="fade-in" style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
      background: 'var(--surface-container)',
      borderRadius: 'var(--radius-full)',
      marginBottom: 10,
      opacity: isCompleted ? 0.5 : 1,
    }}>
      <div className={`checkbox ${isCompleted ? 'checked' : ''}`} onClick={onToggle}>
        {isCompleted && '✓'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15, fontWeight: 500,
          textDecoration: isCompleted ? 'line-through' : 'none',
          color: isCompleted ? 'var(--text-muted)' : 'var(--on-surface)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {task.title}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          {task.priority && (
            <span className={`chip chip-${task.priority.toLowerCase()}`}>
              {PRIORITY_LABELS[task.priority]}
            </span>
          )}
          {task.deadline && (
            <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
              {new Date(task.deadline).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function AddTaskModal({ categoryId, initialTitle, categories, onClose, onSubmit }: {
  categoryId: string;
  initialTitle?: string;
  categories: Category[];
  onClose: () => void;
  onSubmit: (data: { categoryId: string; title: string; priority?: Priority | null; deadline?: string }) => void;
}) {
  const [title, setTitle] = useState(initialTitle || '');
  const [priority, setPriority] = useState<Priority | null>(null);
  const [deadline, setDeadline] = useState('');
  const [catId, setCatId] = useState(categoryId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      categoryId: catId,
      title: title.trim(),
      priority: priority || undefined,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card slide-up" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 20, fontSize: 20, fontWeight: 700 }}>Новая задача</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input className="input" placeholder="Название задачи..." value={title}
            onChange={e => setTitle(e.target.value)} autoFocus />

          <select className="input" value={catId} onChange={e => setCatId(e.target.value)}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[null, 'LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
              <button key={p ?? 'none'} type="button"
                onClick={() => setPriority(p as Priority | null)}
                className="chip"
                style={{
                  cursor: 'pointer', padding: '6px 14px',
                  background: priority === p
                    ? (p ? undefined : 'var(--surface-container-highest)')
                    : 'var(--surface-container-high)',
                  color: priority === p ? (p ? undefined : 'var(--on-surface)') : 'var(--on-surface-variant)',
                  ...(priority === p && p === 'LOW' ? { background: 'rgba(238,245,103,0.12)', color: 'var(--primary)' } : {}),
                  ...(priority === p && p === 'MEDIUM' ? { background: 'rgba(201,190,255,0.15)', color: 'var(--secondary)' } : {}),
                  ...(priority === p && p === 'HIGH' ? { background: 'rgba(232,155,90,0.15)', color: '#E89B5A' } : {}),
                  ...(priority === p && p === 'URGENT' ? { background: 'rgba(255,180,171,0.15)', color: 'var(--error)' } : {}),
                }}
              >
                {p ? PRIORITY_LABELS[p as Priority] : 'Без'}
              </button>
            ))}
          </div>

          <input className="input" type="datetime-local" value={deadline}
            onChange={e => setDeadline(e.target.value)} />

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-surface" onClick={onClose} style={{ flex: 1 }}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Добавить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategoryModal({ category, onClose, onSubmit }: {
  category?: Category;
  onClose: () => void;
  onSubmit: (data: { name: string; color?: string }) => void;
}) {
  const [name, setName] = useState(category?.name || '');
  const [color, setColor] = useState(category?.color || '#c9beff');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), color });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card slide-up" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 20, fontSize: 20, fontWeight: 700 }}>
          {category ? 'Редактировать' : 'Новая категория'}
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input className="input" placeholder="Название категории..."
            value={name} onChange={e => setName(e.target.value)} autoFocus />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>Цвет:</span>
            <input className="input" type="color" value={color}
              onChange={e => setColor(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-surface" onClick={onClose} style={{ flex: 1 }}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              {category ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatRelativeDay(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Сегодня';
  if (diff === 1) return 'Завтра';
  if (diff === 2) return 'Послезавтра';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', weekday: 'short' });
}

function OptimizeModal({
  step, totalMinutes, taskCount, proposal, loading,
  onOptimize, onApply, onClose,
}: {
  step: 'input' | 'proposal';
  totalMinutes: number;
  taskCount: number;
  proposal: { changes: ScheduleChange[]; keepTodayCount: number; movedCount: number } | null;
  loading: boolean;
  onOptimize: (preferences?: string) => void;
  onApply: () => void;
  onClose: () => void;
}) {
  const [preferences, setPreferences] = useState('');
  const hours = Math.round(totalMinutes / 60);

  if (step === 'input') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card slide-up" onClick={e => e.stopPropagation()}
          style={{ maxHeight: '80vh', overflow: 'auto' }}>
          <h3 style={{ marginBottom: 8, fontSize: 20, fontWeight: 700 }}>Оптимизировать расписание</h3>
          <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 20, lineHeight: 1.6 }}>
            У вас <strong style={{ color: 'var(--error)' }}>{taskCount} задач</strong> на сегодня (~{hours}ч).
            Это больше 12 часов — перегрузка. ИИ перенесёт менее приоритетные задачи на свободные слоты ближайших дней.
          </p>
          <textarea className="input-textarea" rows={3}
            placeholder="Ваши пожелания (необязательно)..."
            value={preferences} onChange={e => setPreferences(e.target.value)}
            style={{ marginBottom: 16 }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-surface" onClick={onClose} style={{ flex: 1 }}>Отмена</button>
            <button className="btn btn-primary" onClick={() => onOptimize(preferences || undefined)}
              disabled={loading} style={{ flex: 1 }}>
              {loading ? 'Анализ...' : 'Оптимизировать'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!proposal) return null;

  const byDay = new Map<string, ScheduleChange[]>();
  for (const change of proposal.changes) {
    const dayKey = new Date(change.newDeadline).toISOString().slice(0, 10);
    if (!byDay.has(dayKey)) byDay.set(dayKey, []);
    byDay.get(dayKey)!.push(change);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card slide-up" onClick={e => e.stopPropagation()}
        style={{ maxHeight: '80vh', overflow: 'auto' }}>
        <h3 style={{ marginBottom: 8, fontSize: 20, fontWeight: 700 }}>Предложение</h3>
        <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 20 }}>
          Оставляем: <strong>{proposal.keepTodayCount}</strong>. Переносим:{' '}
          <strong style={{ color: 'var(--primary)' }}>{proposal.movedCount}</strong>.
        </p>
        <div style={{ marginBottom: 20 }}>
          {[...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([dayKey, changes]) => (
            <div key={dayKey} style={{ marginBottom: 16 }}>
              <div className="section-label" style={{ color: 'var(--primary)', marginBottom: 8 }}>
                {formatRelativeDay(dayKey + 'T12:00:00')}
              </div>
              {changes.map(change => (
                <div key={change.taskId} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 0', fontSize: 14,
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                  <span style={{ flex: 1 }}>{change.title}</span>
                  {change.priority && (
                    <span className={`chip chip-${change.priority.toLowerCase()}`} style={{ fontSize: 10 }}>
                      {change.priority}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-surface" onClick={onClose} style={{ flex: 1 }}>Отмена</button>
          <button className="btn btn-primary" onClick={onApply} disabled={loading} style={{ flex: 1 }}>
            {loading ? 'Применяем...' : 'Применить'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TasksPage() {
  const {
    categories, loadCategories, addCategory, updateCategory,
    tasks, loadTasks, addTask, updateTask,
    scheduleStatus, scheduleProposal, loading,
    loadScheduleStatus, optimizeSchedule, applyOptimization, revertOptimization, clearProposal,
  } = useStore();

  const [addingTask, setAddingTask] = useState<{ categoryId: string; title?: string } | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [optimizeStep, setOptimizeStep] = useState<'input' | 'proposal'>('input');
  const [quickTask, setQuickTask] = useState('');

  useEffect(() => {
    loadCategories();
    loadTasks();
    loadScheduleStatus();
  }, [loadCategories, loadTasks, loadScheduleStatus]);

  const incompleteTasks = useMemo(
    () => tasks.filter(t => t.status !== 'COMPLETED'),
    [tasks],
  );

  const todayTasks = useMemo(() => {
    const now = new Date();
    const eod = new Date(now);
    eod.setHours(23, 59, 59, 999);
    return tasks.filter(t =>
      t.status !== 'COMPLETED' && t.deadline && new Date(t.deadline) <= eod
    );
  }, [tasks]);

  const completionRate = useMemo(() => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);

  const remaining = tasks.length - tasks.filter(t => t.status === 'COMPLETED').length;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTask.trim() || categories.length === 0) return;
    setAddingTask({ categoryId: categories[0].id, title: quickTask.trim() });
  };

  const handleToggle = async (task: Task) => {
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    await updateTask(task.id, { status: newStatus });
    await loadTasks();
    await loadScheduleStatus();
  };

  const handleAddTask = async (data: any) => {
    await addTask(data);
    setAddingTask(null);
    setQuickTask('');
    await loadTasks();
  };

  const handleSaveCategory = async (data: { name: string; color?: string }) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, data);
      setEditingCategory(null);
    } else {
      await addCategory(data);
      setShowCategoryModal(false);
    }
    await loadCategories();
  };



  const handleOpenOptimize = () => {
    setOptimizeStep('input');
    clearProposal();
    setShowOptimizeModal(true);
  };

  const handleOptimize = async (preferences?: string) => {
    await optimizeSchedule(preferences);
    setOptimizeStep('proposal');
  };

  const handleApply = async () => {
    await applyOptimization();
    setShowOptimizeModal(false);
    setOptimizeStep('input');
  };

  const handleCloseOptimize = () => {
    setShowOptimizeModal(false);
    setOptimizeStep('input');
    clearProposal();
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', paddingBottom: 16 }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Баланс</h2>
      </div>

      {/* Progress ring */}
      <div className="card" style={{ padding: '32px 24px', marginBottom: 32, textAlign: 'center' }}>
        <ProgressRing percentage={completionRate} />
        <div style={{ marginTop: 16, fontWeight: 700, fontSize: 18 }}>Дневной прогресс</div>
        <div style={{ color: 'var(--on-surface-variant)', fontSize: 14, marginTop: 4 }}>
          {remaining > 0
            ? `Осталось завершить ${remaining} ${remaining === 1 ? 'задачу' : remaining < 5 ? 'задачи' : 'задач'} для достижения цели`
            : 'Все задачи выполнены!'}
        </div>
      </div>

      {/* Revert banner */}
      {scheduleStatus?.hasSnapshot && (
        <div className="fade-in" style={{
          padding: '14px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--surface-container)',
          borderRadius: 'var(--radius-full)',
        }}>
          <span style={{ fontSize: 14, flex: 1, color: 'var(--on-surface-variant)' }}>
            Расписание оптимизировано
          </span>
          <button className="btn btn-secondary" onClick={() => revertOptimization()}
            disabled={loading} style={{ fontSize: 13, padding: '8px 16px' }}>
            {loading ? 'Откат...' : 'Откатить'}
          </button>
        </div>
      )}

      {/* Categories */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 className="section-title">Категории</h3>
        <button className="btn btn-ghost" onClick={() => setShowCategoryModal(true)}
          style={{ color: 'var(--on-surface-variant)', fontSize: 20 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32, overflowX: 'auto', paddingBottom: 4 }}>
        {categories.map(cat => {
          const catTasks = tasks.filter(t => t.categoryId === cat.id);
          const isLavender = cat.color === '#c9beff' || cat.type === 'PERSONAL';
          return (
            <div key={cat.id}
              onClick={() => setEditingCategory(cat)}
              style={{
                minWidth: 150, padding: '20px 18px', cursor: 'pointer',
                background: isLavender ? 'var(--secondary)' : cat.color || 'var(--primary)',
                color: isLavender ? 'var(--on-secondary)' : 'var(--on-primary)',
                borderRadius: 'var(--radius-xl)',
                flexShrink: 0,
              }}>
              <div style={{
                fontSize: 28, fontWeight: 800, marginBottom: 2,
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              }}>
                {cat.icon || (isLavender ? '👤' : '💼')}
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-full)',
                  padding: '2px 10px',
                }}>{catTasks.length}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, marginTop: 12 }}>{cat.name}</div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7, marginTop: 2 }}>
                задач
              </div>
            </div>
          );
        })}
        {categories.length === 0 && (
          <button className="btn btn-primary" onClick={() => setShowCategoryModal(true)}
            style={{ padding: '16px 24px' }}>
            Создать категорию
          </button>
        )}
      </div>

      {/* Today tasks */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 className="section-title">Сегодня</h3>
        <span className="chip" style={{
          background: 'var(--surface-container-high)', color: 'var(--on-surface-variant)',
          padding: '4px 14px', fontSize: 13, fontWeight: 600,
        }}>
          {todayTasks.length} задач
        </span>
      </div>

      {/* Quick add */}
      <form onSubmit={handleQuickAdd} style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input className="input" placeholder="Добавить задачу..." value={quickTask}
          onChange={e => setQuickTask(e.target.value)} style={{ flex: 1 }} />
        <button type="submit" className="btn btn-icon btn-primary" style={{ fontSize: 24 }}>+</button>
      </form>

      {(todayTasks.length > 0 ? todayTasks : incompleteTasks.slice(0, 8)).map(task => (
        <TaskItem key={task.id} task={task} onToggle={() => handleToggle(task)} />
      ))}

      {incompleteTasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
          Нет активных задач
        </div>
      )}

      {/* Overload optimize button */}
      {scheduleStatus?.isOverloaded && !scheduleStatus.hasSnapshot && (
        <button className="optimize-btn fade-in" onClick={handleOpenOptimize} style={{ marginTop: 20 }}>
          ✦ Оптимизировать расписание
        </button>
      )}

      {/* Modals */}
      {addingTask && (
        <AddTaskModal categoryId={addingTask.categoryId} initialTitle={addingTask.title}
          categories={categories} onClose={() => setAddingTask(null)} onSubmit={handleAddTask} />
      )}
      {(showCategoryModal || editingCategory) && (
        <CategoryModal category={editingCategory || undefined}
          onClose={() => { setShowCategoryModal(false); setEditingCategory(null); }}
          onSubmit={handleSaveCategory} />
      )}
      {showOptimizeModal && (
        <OptimizeModal step={optimizeStep}
          totalMinutes={scheduleStatus?.totalMinutesToday ?? 0}
          taskCount={scheduleStatus?.taskCount ?? 0}
          proposal={scheduleProposal} loading={loading}
          onOptimize={handleOptimize} onApply={handleApply} onClose={handleCloseOptimize} />
      )}
    </div>
  );
}
