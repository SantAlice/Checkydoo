import { useEffect, useRef, useState } from 'react';
import { useStore } from '../hooks/useStore';

function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function TimerPage() {
  const {
    activeTimer, timerElapsed, setTimerElapsed,
    loadActiveTimer, startTimer, stopTimer,
    tasks, loadTasks,
  } = useStore();

  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    loadActiveTimer();
    loadTasks();
  }, [loadActiveTimer, loadTasks]);

  // Тикание таймера
  useEffect(() => {
    if (activeTimer) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.round((Date.now() - new Date(activeTimer.startedAt).getTime()) / 1000);
        setTimerElapsed(elapsed);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeTimer, setTimerElapsed]);

  const handleStart = async () => {
    await startTimer(selectedTaskId || undefined);
  };

  const handleStop = async () => {
    await stopTimer();
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const incompleteTasks = tasks.filter(t => t.status !== 'COMPLETED');

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', paddingBottom: 16, textAlign: 'center' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 32 }}>Таймер</h2>

      {/* Циферблат */}
      <div className="glass-card" style={{
        width: 260, height: 260, margin: '0 auto 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '50%',
      }}>
        <div>
          <div style={{
            fontSize: 44, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
            color: activeTimer ? 'var(--accent-green)' : 'var(--text-primary)',
          }}>
            {formatTimer(timerElapsed)}
          </div>
          {activeTimer?.task && (
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>
              {activeTimer.task.title}
            </div>
          )}
        </div>
      </div>

      {/* Выбор задачи */}
      {!activeTimer && (
        <div style={{ marginBottom: 20 }}>
          <select
            className="glass-input"
            value={selectedTaskId}
            onChange={e => setSelectedTaskId(e.target.value)}
            style={{ textAlign: 'center', maxWidth: 300, margin: '0 auto' }}
          >
            <option value="">Без привязки к задаче</option>
            {incompleteTasks.map(t => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Кнопка старт/стоп */}
      {activeTimer ? (
        <button
          className="btn"
          onClick={handleStop}
          style={{
            background: 'var(--accent-red)', color: 'white',
            padding: '16px 48px', fontSize: 16, borderRadius: 'var(--radius-xl)',
            boxShadow: '0 4px 16px rgba(212, 107, 107, 0.3)',
          }}
        >
          ⏹ Остановить
        </button>
      ) : (
        <button
          className="btn btn-primary"
          onClick={handleStart}
          style={{
            padding: '16px 48px', fontSize: 16, borderRadius: 'var(--radius-xl)',
          }}
        >
          ▶ Начать
        </button>
      )}

      {/* Подсказка */}
      <p style={{
        marginTop: 24, fontSize: 13, color: 'var(--text-muted)',
        lineHeight: 1.5,
      }}>
        {activeTimer
          ? 'Таймер идёт. Нажмите «Остановить» когда закончите.'
          : 'Выберите задачу и запустите таймер для отслеживания времени.'}
      </p>
    </div>
  );
}
