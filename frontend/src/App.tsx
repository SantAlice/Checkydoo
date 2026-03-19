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
    <div className="app-layout">
      {error && (
        <div className="fade-in" style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--scarlet)', color: 'white',
          padding: '10px 20px', borderRadius: 'var(--radius-md)',
          zIndex: 1000,
          display: 'flex', alignItems: 'center', gap: 12,
          fontSize: 14, boxShadow: '0 4px 16px var(--scarlet-glow)',
        }}>
          {error}
          <button onClick={clearError} style={{
            background: 'none', border: 'none', color: 'white',
            cursor: 'pointer', fontSize: 18, padding: 0,
          }}>×</button>
        </div>
      )}

      <main className="app-content">
        {activeTab === 'tasks' && <TasksPage />}
        {activeTab === 'timer' && <TimerPage />}
        {activeTab === 'analytics' && <AnalyticsPage />}
      </main>

      <nav className="bottom-nav">
        {([
          { key: 'tasks' as Tab, label: 'Задачи' },
          { key: 'timer' as Tab, label: 'Таймер' },
          { key: 'analytics' as Tab, label: 'Аналитика' },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
