import { useEffect, useState } from 'react';
import { useStore } from '../hooks/useStore';
import type { Category, Task, Priority } from '../types';

const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  URGENT: 'Срочный',
};

function formatDeadline(deadline?: string): string {
  if (!deadline) return '';
  const d = new Date(deadline);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return `Просрочено на ${Math.abs(days)} дн.`;
  if (days === 0) return 'Сегодня';
  if (days === 1) return 'Завтра';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}ч ${m}м`;
  return `${m}м`;
}

function TaskItem({ task, onToggle, onDelete }: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isCompleted = task.status === 'COMPLETED';
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !isCompleted;

  return (
    <div className="fade-in" style={{
      display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0',
      borderBottom: '1px solid rgba(200, 185, 154, 0.2)',
      opacity: isCompleted ? 0.5 : 1,
    }}>
      <div
        className={`checkbox ${isCompleted ? 'checked' : ''}`}
        onClick={onToggle}
        style={{ marginTop: 2 }}
      >
        {isCompleted && '✓'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15,
          textDecoration: isCompleted ? 'line-through' : 'none',
          color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
          wordBreak: 'break-word',
        }}>
          {task.title}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className={`priority-badge priority-${task.priority}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          {task.deadline && (
            <span style={{
              fontSize: 12,
              color: isOverdue ? 'var(--accent-red)' : 'var(--text-secondary)',
              fontWeight: isOverdue ? 600 : 400,
            }}>
              {formatDeadline(task.deadline)}
            </span>
          )}
          {task.totalTime > 0 && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              ⏱ {formatTime(task.totalTime)}
            </span>
          )}
        </div>
      </div>

      <button className="btn btn-ghost" onClick={onDelete} style={{ fontSize: 16, color: 'var(--text-muted)' }}>
        ×
      </button>
    </div>
  );
}

function CategorySection({ category, tasks, onAddTask, onToggleTask, onDeleteTask }: {
  category: Category;
  tasks: Task[];
  onAddTask: (categoryId: string) => void;
  onToggleTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;

  return (
    <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 12 }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 20 }}>{category.icon || '📁'}</span>
        <span style={{ flex: 1, fontWeight: 600, fontSize: 16 }}>{category.name}</span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {completedCount}/{tasks.length}
        </span>
        <span style={{
          transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform var(--transition)', fontSize: 12,
          color: 'var(--text-muted)',
        }}>
          ▼
        </span>
      </div>

      {/* Прогресс-бар */}
      {tasks.length > 0 && (
        <div style={{
          height: 3, background: 'rgba(0,0,0,0.06)', borderRadius: 2,
          marginTop: 10, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${(completedCount / tasks.length) * 100}%`,
            background: category.color, borderRadius: 2,
            transition: 'width 0.3s ease',
          }} />
        </div>
      )}

      {expanded && (
        <div style={{ marginTop: 8 }}>
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={() => onToggleTask(task)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
          <button
            onClick={() => onAddTask(category.id)}
            className="btn btn-ghost"
            style={{
              width: '100%', justifyContent: 'flex-start', marginTop: 4,
              color: 'var(--text-muted)', fontSize: 14, gap: 8,
            }}
          >
            + Добавить задачу
          </button>
        </div>
      )}
    </div>
  );
}

// Модальное окно добавления задачи
function AddTaskModal({ categoryId, onClose, onSubmit }: {
  categoryId: string;
  onClose: () => void;
  onSubmit: (data: { categoryId: string; title: string; priority: Priority; deadline?: string }) => void;
}) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      categoryId,
      title: title.trim(),
      priority,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 100, backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div
        className="glass-card slide-up"
        style={{ width: '100%', maxWidth: 500, padding: 24, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 16, fontSize: 18 }}>Новая задача</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            className="glass-input"
            placeholder="Название задачи..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 8 }}>
            {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as Priority[]).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`priority-badge priority-${p}`}
                style={{
                  cursor: 'pointer', border: priority === p ? '2px solid currentColor' : '2px solid transparent',
                  padding: '4px 10px', borderRadius: 12,
                }}
              >
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
          <input
            className="glass-input"
            type="datetime-local"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
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

// Модалка создания категории
function AddCategoryModal({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (data: { name: string; icon?: string; color?: string; type?: string }) => void;
}) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('#6B9E78');
  const [type, setType] = useState('CUSTOM');

  const types = [
    { value: 'WORK', label: 'Работа' },
    { value: 'PERSONAL', label: 'Личное' },
    { value: 'HOBBY', label: 'Хобби' },
    { value: 'REST', label: 'Отдых' },
    { value: 'CUSTOM', label: 'Другое' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), icon: icon || undefined, color, type });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 100, backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div
        className="glass-card slide-up"
        style={{ width: '100%', maxWidth: 500, padding: 24, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 16, fontSize: 18 }}>Новая категория</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            className="glass-input"
            placeholder="Название категории..."
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="glass-input"
              placeholder="Иконка (эмодзи)"
              value={icon}
              onChange={e => setIcon(e.target.value)}
              style={{ width: 80, textAlign: 'center' }}
              maxLength={4}
            />
            <input
              className="glass-input"
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              style={{ width: 50, padding: 4, cursor: 'pointer' }}
            />
            <select
              className="glass-input"
              value={type}
              onChange={e => setType(e.target.value)}
              style={{ flex: 1 }}
            >
              {types.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TasksPage() {
  const {
    categories, loadCategories, addCategory,
    tasks, loadTasks, addTask, updateTask, deleteTask,
    user, logout,
  } = useStore();

  const [quickTask, setQuickTask] = useState('');
  const [addingTaskFor, setAddingTaskFor] = useState<string | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);

  useEffect(() => {
    loadCategories();
    loadTasks();
  }, [loadCategories, loadTasks]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTask.trim() || categories.length === 0) return;
    await addTask({ categoryId: categories[0].id, title: quickTask.trim() });
    setQuickTask('');
    await loadTasks();
  };

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    await updateTask(task.id, { status: newStatus });
    await loadTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
  };

  const handleAddTask = async (data: any) => {
    await addTask(data);
    setAddingTaskFor(null);
    await loadTasks();
  };

  const handleAddCategory = async (data: any) => {
    await addCategory(data);
    setShowAddCategory(false);
    await loadCategories();
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 16 }}>
      {/* Шапка */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16,
      }}>
        <div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Привет,</span>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>{user?.displayName} 👋</h2>
        </div>
        <button className="btn btn-ghost" onClick={logout} style={{ fontSize: 13 }}>
          Выйти
        </button>
      </div>

      {/* Быстрое добавление */}
      <form onSubmit={handleQuickAdd} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          className="glass-input"
          placeholder="Добавить новую задачу..."
          value={quickTask}
          onChange={e => setQuickTask(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-icon">+</button>
      </form>

      {/* Списки дел */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12,
      }}>
        <h3 style={{ fontSize: 17, fontWeight: 600 }}>Списки дел</h3>
        <button className="btn btn-ghost" onClick={() => setShowAddCategory(true)} style={{ fontSize: 18 }}>
          📁+
        </button>
      </div>

      {categories.map(cat => (
        <CategorySection
          key={cat.id}
          category={cat}
          tasks={tasks.filter(t => t.categoryId === cat.id)}
          onAddTask={setAddingTaskFor}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
        />
      ))}

      {categories.length === 0 && (
        <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>Нет категорий</p>
          <button className="btn btn-primary" onClick={() => setShowAddCategory(true)}>
            Создать первую категорию
          </button>
        </div>
      )}

      {/* Модалки */}
      {addingTaskFor && (
        <AddTaskModal
          categoryId={addingTaskFor}
          onClose={() => setAddingTaskFor(null)}
          onSubmit={handleAddTask}
        />
      )}
      {showAddCategory && (
        <AddCategoryModal
          onClose={() => setShowAddCategory(false)}
          onSubmit={handleAddCategory}
        />
      )}
    </div>
  );
}
