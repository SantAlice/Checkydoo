import { useEffect, useState } from 'react';
import { useStore } from './hooks/useStore';
import { AuthPage } from './pages/AuthPage';
import { TasksPage } from './pages/TasksPage';
import { TimerPage } from './pages/TimerPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

type Tab = 'tasks' | 'timer' | 'analytics';

export function App() {
  const { user, initAuth, error, clearError } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('tasks');

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {error && (
        <div className="fade-in" style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(212, 107, 107, 0.9)', color: 'white',
          padding: '10px 20px', borderRadius: 'var(--radius-md)',
          backdropFilter: 'blur(8px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', gap: 12,
          fontSize: 14, boxShadow: '0 4px 16px rgba(212, 107, 107, 0.3)',
        }}>
          {error}
          <button onClick={clearError} style={{
            background: 'none', border: 'none', color: 'white',
            cursor: 'pointer', fontSize: 18, padding: 0,
          }}>×</button>
        </div>
      )}

      {/* Блокнот */}
      <div className="binder-wrapper">
        {/* Задний лист — уходит за верх экрана */}
        <div className="binder-back-page" />

        {/* Кольца */}
        <div className="binder-rings">
          <img src="/ring.png" alt="" className="binder-ring" />
          <img src="/ring.png" alt="" className="binder-ring" />
          <img src="/ring.png" alt="" className="binder-ring" />
          <img src="/ring.png" alt="" className="binder-ring" />
        </div>

        {/* Передняя страница с дырками */}
        <div className="binder-page-container">
          <div className="binder-holes">
            <div className="binder-hole" />
            <div className="binder-hole" />
            <div className="binder-hole" />
            <div className="binder-hole" />
          </div>
          <main className="binder-page">
            {activeTab === 'tasks' && <TasksPage />}
            {activeTab === 'timer' && <TimerPage />}
            {activeTab === 'analytics' && <AnalyticsPage />}
          </main>
        </div>
      </div>

      {/* Навигация */}
      <nav className="binder-nav">
        {([
          { key: 'tasks' as Tab, label: 'Задачи' },
          { key: 'timer' as Tab, label: 'Таймер' },
          { key: 'analytics' as Tab, label: 'Аналитика' },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`binder-nav-tab ${activeTab === tab.key ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
