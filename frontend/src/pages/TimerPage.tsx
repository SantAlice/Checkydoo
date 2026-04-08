import { useEffect, useRef, useState } from 'react';
import { useStore } from '../hooks/useStore';

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(m)}:${pad(s)}`;
}

function TimerRing({ elapsed, size = 280 }: { elapsed: number; size?: number }) {
  const stroke = 8;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const progress = Math.min((elapsed / (25 * 60)) * 100, 100);
  const filled = (progress / 100) * circ;

  return (
    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--surface-container-high)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--primary)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 1s linear' }} />
    </svg>
  );
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
  const nextTask = incompleteTasks.find(t => t.id !== activeTimer?.taskId);

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', paddingBottom: 16, textAlign: 'center' }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Таймер</h2>

      {activeTimer?.task ? (
        <div style={{ marginBottom: 24 }}>
          <div className="section-label" style={{ marginBottom: 6 }}>Текущая задача</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>
            {activeTimer.task.title}
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 24, height: 32 }} />
      )}

      <div style={{ position: 'relative', marginBottom: 32 }}>
        <TimerRing elapsed={timerElapsed} />
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', textAlign: 'center',
        }}>
          <div style={{
            fontSize: '3.5rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums',
            color: 'var(--on-surface)', letterSpacing: -2,
          }}>
            {formatTimer(timerElapsed)}
          </div>
          <div style={{ fontSize: 14, color: 'var(--on-surface-variant)', fontWeight: 600 }}>
            {activeTimer ? 'Фокус' : 'Готов'}
          </div>
        </div>
      </div>

      {!activeTimer && (
        <div style={{ marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>
          <select className="input" value={selectedTaskId}
            onChange={e => setSelectedTaskId(e.target.value)}
            style={{ textAlign: 'center' }}>
            <option value="">Без привязки к задаче</option>
            {incompleteTasks.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 40 }}>
        <button className="btn btn-icon btn-surface" style={{
          width: 56, height: 56, opacity: activeTimer ? 1 : 0.4,
        }} disabled={!activeTimer}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>

        {activeTimer ? (
          <button className="btn btn-icon" onClick={handleStop} style={{
            width: 72, height: 72, background: '#93000a', color: '#ffb4ab', fontSize: 24,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        ) : (
          <button className="btn btn-icon btn-primary" onClick={handleStart} style={{
            width: 72, height: 72, fontSize: 28,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </button>
        )}

        <button className="btn btn-icon btn-surface" onClick={activeTimer ? handleStop : undefined} style={{
          width: 56, height: 56, opacity: activeTimer ? 1 : 0.4,
        }} disabled={!activeTimer}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <div className="card-lavender" style={{ flex: 1, padding: '20px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6 }}>
            Сессии
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>
            {activeTimer ? 1 : 0}
          </div>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>Завершено циклов</div>
        </div>
        <div className="card-green" style={{ flex: 1, padding: '20px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7 }}>
            Фокус
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>
            {Math.round(timerElapsed / 60)}м
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Время в потоке</div>
        </div>
      </div>

      {nextTask && (
        <div className="card-elevated" style={{
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', fontWeight: 600 }}>Следующая задача</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{nextTask.title}</div>
          </div>
          <span style={{ color: 'var(--on-surface-variant)', fontSize: 18 }}>›</span>
        </div>
      )}
    </div>
  );
}
