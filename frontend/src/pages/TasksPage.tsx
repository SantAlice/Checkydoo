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
      borderBottom: '1px solid var(--glass-border)',
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
          {task.priority && (
            <span className={`priority-badge priority-${task.priority}`}>
              {PRIORITY_LABELS[task.priority]}
            </span>
          )}
          {task.deadline && (
            <span style={{
              fontSize: 12,
              color: isOverdue ? 'var(--scarlet)' : 'var(--text-secondary)',
              fontWeight: isOverdue ? 600 : 400,
            }}>
              {formatDeadline(task.deadline)}
            </span>
          )}
          {task.totalTime > 0 && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {formatTime(task.totalTime)}
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

function CategorySection({ category, tasks, onAddTask, onToggleTask, onDeleteTask, onEditCategory, onDeleteCategory }: {
  category: Category;
  tasks: Task[];
  onAddTask: (categoryId: string) => void;
  onToggleTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;

  return (
    <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, userSelect: 'none' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: category.color, flexShrink: 0 }} />
        <span
          onClick={() => setExpanded(!expanded)}
          style={{ flex: 1, fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
        >
          {category.name}
        </span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {completedCount}/{tasks.length}
        </span>
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost"
            onClick={() => setShowMenu(!showMenu)}
            style={{ fontSize: 16, padding: '4px 8px', color: 'var(--text-muted)' }}
          >
            ...
          </button>
          {showMenu && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', zIndex: 50,
              padding: 4, minWidth: 160, borderRadius: 'var(--radius-md)',
              background: '#1A1A1A', border: '1px solid var(--glass-border)',
            }}>
              <button
                className="btn btn-ghost"
                onClick={() => { setShowMenu(false); onEditCategory(category); }}
                style={{ width: '100%', justifyContent: 'flex-start', fontSize: 14, padding: '8px 12px' }}
              >
                Редактировать
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => { setShowMenu(false); onDeleteCategory(category.id); }}
                style={{ width: '100%', justifyContent: 'flex-start', fontSize: 14, padding: '8px 12px', color: 'var(--scarlet)' }}
              >
                Удалить
              </button>
            </div>
          )}
        </div>
        <span
          onClick={() => setExpanded(!expanded)}
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform var(--transition)', fontSize: 12,
            color: 'var(--text-muted)', cursor: 'pointer',
          }}
        >
          ▼
        </span>
      </div>

      {tasks.length > 0 && (
        <div style={{
          height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2,
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

function AddTaskModal({ categoryId, initialTitle, onClose, onSubmit }: {
  categoryId: string;
  initialTitle?: string;
  onClose: () => void;
  onSubmit: (data: { categoryId: string; title: string; priority?: Priority | null; deadline?: string }) => void;
}) {
  const [title, setTitle] = useState(initialTitle || '');
  const [priority, setPriority] = useState<Priority | null>(null);
  const [deadline, setDeadline] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      categoryId,
      title: title.trim(),
      priority: priority || undefined,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card slide-up" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 16, fontSize: 18 }}>Новая задача</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            className="glass-input"
            placeholder="Название задачи..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setPriority(null)}
              className="priority-badge"
              style={{
                cursor: 'pointer',
                border: priority === null ? '2px solid var(--text-secondary)' : '2px solid transparent',
                padding: '4px 10px', borderRadius: 12,
                background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)',
              }}
            >
              Без приоритета
            </button>
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

function CategoryModal({ category, onClose, onSubmit }: {
  category?: Category;
  onClose: () => void;
  onSubmit: (data: { name: string; color?: string }) => void;
}) {
  const [name, setName] = useState(category?.name || '');
  const [color, setColor] = useState(category?.color || '#AAD7CD');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), color });
  };

  const isEditing = !!category;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card slide-up" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 16, fontSize: 18 }}>
          {isEditing ? 'Редактировать категорию' : 'Новая категория'}
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            className="glass-input"
            placeholder="Название категории..."
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Цвет:</span>
            <input
              className="glass-input"
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              style={{ width: 50, padding: 4, cursor: 'pointer' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              {isEditing ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TasksPage() {
  const {
    categories, loadCategories, addCategory, updateCategory, deleteCategory,
    tasks, loadTasks, addTask, updateTask, deleteTask,
    user, logout,
  } = useStore();

  const [addingTaskFor, setAddingTaskFor] = useState<{ categoryId: string; title?: string } | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [quickTask, setQuickTask] = useState('');

  useEffect(() => {
    loadCategories();
    loadTasks();
  }, [loadCategories, loadTasks]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTask.trim() || categories.length === 0) return;
    setAddingTaskFor({ categoryId: categories[0].id, title: quickTask.trim() });
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

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm('Удалить категорию и все её задачи?')) {
      await deleteCategory(categoryId);
      await loadCategories();
      await loadTasks();
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 16 }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20,
      }}>
        <div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Привет,</span>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ivory)' }}>{user?.displayName}</h2>
        </div>
        <button className="btn btn-ghost" onClick={logout} style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Выйти
        </button>
      </div>

      {/* Quick add */}
      <form onSubmit={handleQuickAdd} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          className="glass-input"
          placeholder="Добавить новую задачу..."
          value={quickTask}
          onChange={e => setQuickTask(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-icon">+</button>
      </form>

      {/* Categories header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12,
      }}>
        <h3 style={{ fontSize: 17, fontWeight: 600 }}>Списки дел</h3>
        <button className="btn btn-ghost" onClick={() => setShowCategoryModal(true)} style={{ fontSize: 14, color: 'var(--mint)' }}>
          + Категория
        </button>
      </div>

      {categories.map(cat => (
        <CategorySection
          key={cat.id}
          category={cat}
          tasks={tasks.filter(t => t.categoryId === cat.id)}
          onAddTask={(categoryId) => setAddingTaskFor({ categoryId })}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onEditCategory={(c) => setEditingCategory(c)}
          onDeleteCategory={handleDeleteCategory}
        />
      ))}

      {categories.length === 0 && (
        <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>Нет категорий</p>
          <button className="btn btn-primary" onClick={() => setShowCategoryModal(true)}>
            Создать первую категорию
          </button>
        </div>
      )}

      {addingTaskFor && (
        <AddTaskModal
          categoryId={addingTaskFor.categoryId}
          initialTitle={addingTaskFor.title}
          onClose={() => setAddingTaskFor(null)}
          onSubmit={handleAddTask}
        />
      )}
      {(showCategoryModal || editingCategory) && (
        <CategoryModal
          category={editingCategory || undefined}
          onClose={() => { setShowCategoryModal(false); setEditingCategory(null); }}
          onSubmit={handleSaveCategory}
        />
      )}
    </div>
  );
}
