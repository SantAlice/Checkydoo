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

      <main style={{ flex: 1, overflow: 'auto', padding: '16px 16px 0' }}>
        {activeTab === 'tasks' && <TasksPage />}
        {activeTab === 'timer' && <TimerPage />}
        {activeTab === 'analytics' && <AnalyticsPage />}
      </main>

      <nav style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '12px 0 max(12px, env(safe-area-inset-bottom))',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--blur))',
        borderTop: '1px solid var(--glass-border)',
      }}>
        {([
          { key: 'tasks' as Tab, icon: '🏠', label: 'Задачи' },
          { key: 'timer' as Tab, icon: '⏱', label: 'Таймер' },
          { key: 'analytics' as Tab, icon: '📊', label: 'Аналитика' },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: 12, fontWeight: activeTab === tab.key ? 600 : 400,
              fontFamily: 'inherit', transition: 'color var(--transition)',
            }}
          >
            <span style={{ fontSize: 22 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
