import { useEffect, useState } from 'react';
import { useStore } from './hooks/useStore';
import { AuthPage } from './pages/AuthPage';
import { TasksPage } from './pages/TasksPage';
import { CalendarPage } from './pages/CalendarPage';
import { TimerPage } from './pages/TimerPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

type Tab = 'overview' | 'calendar' | 'timer' | 'analytics';

function IconOverview() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconTimer() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="13" r="8" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="13" x2="15" y2="13" />
      <line x1="10" y1="2" x2="14" y2="2" />
      <line x1="12" y1="2" x2="12" y2="5" />
    </svg>
  );
}

function IconAnalytics() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="12" width="4" height="9" rx="1" />
      <rect x="10" y="7" width="4" height="14" rx="1" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  );
}

const NAV_ITEMS: { key: Tab; label: string; icon: () => JSX.Element }[] = [
  { key: 'overview', label: 'Обзор', icon: IconOverview },
  { key: 'calendar', label: 'Календарь', icon: IconCalendar },
  { key: 'timer', label: 'Таймер', icon: IconTimer },
  { key: 'analytics', label: 'Аналитика', icon: IconAnalytics },
];

export function App() {
  const { user, initAuth, error, clearError } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

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
          background: '#93000a', color: '#ffb4ab',
          padding: '12px 24px', borderRadius: 'var(--radius-full)',
          zIndex: 1000,
          display: 'flex', alignItems: 'center', gap: 12,
          fontSize: 14, fontWeight: 600,
        }}>
          {error}
          <button onClick={clearError} style={{
            background: 'none', border: 'none', color: '#ffb4ab',
            cursor: 'pointer', fontSize: 18, padding: 0, fontFamily: 'inherit',
          }}>×</button>
        </div>
      )}

      <main className="app-content">
        {activeTab === 'overview' && <TasksPage />}
        {activeTab === 'calendar' && <CalendarPage />}
        {activeTab === 'timer' && <TimerPage />}
        {activeTab === 'analytics' && <AnalyticsPage />}
      </main>

      <nav className="bottom-nav">
        {NAV_ITEMS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
          >
            <tab.icon />
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
