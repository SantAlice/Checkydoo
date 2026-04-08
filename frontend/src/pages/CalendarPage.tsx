import { useEffect, useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import type { Task, Category, Priority } from '../types';

const WEEKDAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  URGENT: 'Срочно',
};

const TIPS = [
  'Разбивайте крупные задачи на мелкие шаги для продуктивности.',
  'Начинайте день с самой сложной задачи, пока энергия на максимуме.',
  'Используйте таймер для фокусировки — 25 минут работы, 5 минут отдыха.',
  'Планируйте не более 3-5 важных задач на день.',
  'Регулярные перерывы повышают общую продуктивность.',
];

function getWeekDays(date: Date): Date[] {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  const days: Date[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function AddTaskModal({ categories, onClose, onSubmit }: {
  categories: Category[];
  onClose: () => void;
  onSubmit: (data: { categoryId: string; title: string; priority?: Priority | null; deadline?: string }) => void;
}) {
  const [title, setTitle] = useState('');
  const [catId, setCatId] = useState(categories[0]?.id || '');
  const [priority, setPriority] = useState<Priority | null>(null);
  const [deadline, setDeadline] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !catId) return;
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
            {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as Priority[]).map(p => (
              <button key={p} type="button" onClick={() => setPriority(priority === p ? null : p)}
                className={`chip chip-${p.toLowerCase()}`}
                style={{
                  cursor: 'pointer', padding: '6px 14px',
                  opacity: priority === p ? 1 : 0.5,
                }}>
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
          <input className="input" type="datetime-local" value={deadline}
            onChange={e => setDeadline(e.target.value)} />
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-surface" onClick={onClose} style={{ flex: 1 }}>Отмена</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Добавить</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CalendarPage() {
  const { tasks, loadTasks, categories, loadCategories, addTask, updateTask } = useStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    loadTasks();
    loadCategories();
  }, [loadTasks, loadCategories]);

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const today = new Date();

  const dayTasks = useMemo(() => {
    return tasks
      .filter(t => t.deadline && isSameDay(new Date(t.deadline), selectedDate) && t.status !== 'COMPLETED')
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
  }, [tasks, selectedDate]);

  const tip = useMemo(() => TIPS[Math.floor(Math.random() * TIPS.length)], []);

  const handleToggle = async (task: Task) => {
    await updateTask(task.id, { status: task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' });
    await loadTasks();
  };

  const handleAdd = async (data: any) => {
    await addTask(data);
    setShowAdd(false);
    await loadTasks();
  };

  const prevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    setSelectedDate(d);
  };

  const nextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    setSelectedDate(d);
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', paddingBottom: 16 }}>
      <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Календарь</h2>

      {/* Calendar card */}
      <div className="card" style={{ padding: '20px 16px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 20, fontWeight: 700 }}>
            {MONTH_NAMES[selectedDate.getMonth()]}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={prevWeek} style={{ fontSize: 18 }}>‹</button>
            <button className="btn btn-ghost" onClick={nextWeek} style={{ fontSize: 18 }}>›</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
          {WEEKDAYS.map(d => (
            <div key={d} style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-variant)', padding: '4px 0' }}>
              {d}
            </div>
          ))}
          {weekDays.slice(0, 7).map((d, i) => {
            const isSelected = isSameDay(d, selectedDate);
            const isToday = isSameDay(d, today);
            const hasTasks = tasks.some(t => t.deadline && isSameDay(new Date(t.deadline), d));
            return (
              <button key={i} onClick={() => setSelectedDate(d)} style={{
                padding: '8px 0', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 15, fontWeight: isSelected || isToday ? 700 : 400,
                background: isSelected ? 'var(--primary)' : 'transparent',
                color: isSelected ? 'var(--on-primary)' : isToday ? 'var(--primary)' : 'var(--on-surface)',
                borderRadius: 'var(--radius-full)',
                position: 'relative',
              }}>
                {d.getDate()}
                {hasTasks && !isSelected && (
                  <span style={{
                    position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
                    width: 4, height: 4, borderRadius: '50%', background: 'var(--primary)',
                  }} />
                )}
              </button>
            );
          })}
          {weekDays.slice(7, 14).map((d, i) => {
            const isSelected = isSameDay(d, selectedDate);
            const isToday = isSameDay(d, today);
            const hasTasks = tasks.some(t => t.deadline && isSameDay(new Date(t.deadline), d));
            return (
              <button key={i + 7} onClick={() => setSelectedDate(d)} style={{
                padding: '8px 0', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 15, fontWeight: isSelected || isToday ? 700 : 400,
                background: isSelected ? 'var(--primary)' : 'transparent',
                color: isSelected ? 'var(--on-primary)' : isToday ? 'var(--primary)' : 'var(--on-surface)',
                borderRadius: 'var(--radius-full)',
                position: 'relative',
              }}>
                {d.getDate()}
                {hasTasks && !isSelected && (
                  <span style={{
                    position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
                    width: 4, height: 4, borderRadius: '50%', background: 'var(--primary)',
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tip card */}
      <div className="card-lavender" style={{ padding: '20px 24px', marginBottom: 32 }}>
        <div className="section-label" style={{ color: 'var(--on-secondary)', opacity: 0.6, marginBottom: 8 }}>
          Совет дня
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.6, fontWeight: 500 }}>{tip}</div>
      </div>

      {/* Day header */}
      <div className="section-label" style={{ marginBottom: 16 }}>
        {isSameDay(selectedDate, today)
          ? `Сегодня, ${selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`
          : selectedDate.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>

      {/* Timeline */}
      {dayTasks.length > 0 ? (
        <div style={{ position: 'relative', paddingLeft: 32 }}>
          {/* Timeline line */}
          <div style={{
            position: 'absolute', left: 11, top: 12, bottom: 12, width: 2,
            background: 'var(--surface-container-high)',
          }} />
          {dayTasks.map((task, i) => (
            <div key={task.id} className="fade-in" style={{
              position: 'relative', marginBottom: 16,
            }}>
              {/* Dot */}
              <div style={{
                position: 'absolute', left: -32 + 4, top: 20,
                width: 16, height: 16, borderRadius: '50%',
                background: i === 0 ? 'var(--primary)' : 'transparent',
                border: `2px solid ${i === 0 ? 'var(--primary)' : 'var(--on-surface-variant)'}`,
                zIndex: 1,
              }} />
              {/* Card */}
              <div className="card-lavender" style={{
                padding: '16px 20px', cursor: 'pointer',
              }} onClick={() => handleToggle(task)}>
                {task.deadline && (
                  <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.6, marginBottom: 4 }}>
                    {formatTime(task.deadline)}
                  </div>
                )}
                <div style={{ fontSize: 16, fontWeight: 700 }}>{task.title}</div>
                {task.category && (
                  <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>{task.category.name}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
          Нет задач на этот день
        </div>
      )}

      {/* FAB */}
      <button className="btn btn-fab" onClick={() => setShowAdd(true)}>+</button>

      {showAdd && categories.length > 0 && (
        <AddTaskModal categories={categories} onClose={() => setShowAdd(false)} onSubmit={handleAdd} />
      )}
    </div>
  );
}
