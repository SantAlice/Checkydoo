import { useEffect, useState } from 'react';
import { useStore } from '../hooks/useStore';
import type { Analytics } from '../types';

const TYPE_COLORS: Record<string, string> = {
  WORK: '#4A90D9',
  PERSONAL: '#6B9E78',
  HOBBY: '#D4A574',
  REST: '#9B8EC4',
  CUSTOM: '#a89e8c',
};

function PieChart({ data }: { data: Analytics['timeDistribution'] }) {
  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
        Пока нет данных. Запустите таймер для сбора статистики.
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.percentage, 0) || 1;
  let cumulative = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'center' }}>
      <svg width="160" height="160" viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }}>
        {data.map((item, i) => {
          const slice = (item.percentage / total) * Math.PI * 2;
          const startAngle = cumulative;
          cumulative += slice;

          const x1 = Math.cos(startAngle);
          const y1 = Math.sin(startAngle);
          const x2 = Math.cos(startAngle + slice);
          const y2 = Math.sin(startAngle + slice);
          const large = slice > Math.PI ? 1 : 0;

          return (
            <path
              key={i}
              d={`M 0 0 L ${x1} ${y1} A 1 1 0 ${large} 1 ${x2} ${y2} Z`}
              fill={TYPE_COLORS[item.type] || TYPE_COLORS.CUSTOM}
              stroke="var(--paper-bg)"
              strokeWidth="0.02"
            />
          );
        })}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <div style={{
              width: 12, height: 12, borderRadius: 3,
              background: TYPE_COLORS[item.type] || TYPE_COLORS.CUSTOM,
            }} />
            <span style={{ color: 'var(--text-secondary)' }}>
              {item.category}: {item.percentage}% ({item.totalMinutes}м)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data }: { data: Analytics['weeklyTrend'] }) {
  if (data.length === 0) return null;

  const maxVal = Math.max(...data.flatMap(d => [d.completed, d.created]), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, justifyContent: 'center' }}>
      {data.map((week, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 80 }}>
            <div style={{
              width: 14, background: 'var(--accent-blue)',
              height: `${(week.created / maxVal) * 80}px`,
              borderRadius: '3px 3px 0 0', opacity: 0.6,
            }} />
            <div style={{
              width: 14, background: 'var(--accent-green)',
              height: `${(week.completed / maxVal) * 80}px`,
              borderRadius: '3px 3px 0 0',
            }} />
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {new Date(week.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsPage() {
  const { analytics, loadAnalytics } = useStore();
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    loadAnalytics(period);
  }, [loadAnalytics, period]);

  if (!analytics) {
    return (
      <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
        Загрузка аналитики...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 16 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 20,
      }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Аналитика</h2>
        <select
          className="glass-input"
          value={period}
          onChange={e => setPeriod(Number(e.target.value))}
          style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
        >
          <option value={7}>7 дней</option>
          <option value={30}>30 дней</option>
          <option value={90}>90 дней</option>
        </select>
      </div>

      {/* Completion Rate */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 12, textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
          Выполнение задач
        </div>
        <div style={{ fontSize: 44, fontWeight: 700, color: 'var(--accent-green)' }}>
          {analytics.completionRate}%
        </div>
        <div style={{
          height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3,
          marginTop: 12, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${analytics.completionRate}%`,
            background: 'var(--accent-green)', borderRadius: 3,
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      <div className="ring-connector">
        <img src="/ring.png" alt="" />
      </div>

      {/* Распределение времени */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          Баланс времени
        </h3>
        <PieChart data={analytics.timeDistribution} />
      </div>

      <div className="ring-connector">
        <img src="/ring.png" alt="" />
      </div>

      {/* Недельный тренд */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
          Динамика задач
        </h3>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 12, color: 'var(--text-muted)' }}>
          <span>🔵 Создано</span>
          <span>🟢 Выполнено</span>
        </div>
        <BarChart data={analytics.weeklyTrend} />
      </div>

      <div className="ring-connector">
        <img src="/ring.png" alt="" />
      </div>

      {/* Просрочки */}
      {analytics.overdueAnalysis.totalOverdue > 0 && (
        <div className="glass-card" style={{ padding: 20, marginBottom: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
            Анализ просрочек
          </h3>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-red)', marginBottom: 8 }}>
            {analytics.overdueAnalysis.totalOverdue}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            просроченных задач
          </div>
          {analytics.overdueAnalysis.byCategory.map((cat, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 14, padding: '4px 0',
              borderBottom: '1px solid rgba(200,185,154,0.15)',
            }}>
              <span>{cat.name}</span>
              <span style={{ fontWeight: 600 }}>{cat.count}</span>
            </div>
          ))}
          {analytics.overdueAnalysis.commonPatterns.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {analytics.overdueAnalysis.commonPatterns.map((p, i) => (
                <div key={i} style={{
                  fontSize: 13, color: 'var(--text-secondary)',
                  padding: '4px 0', lineHeight: 1.4,
                }}>
                  💡 {p}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="ring-connector">
        <img src="/ring.png" alt="" />
      </div>

      {/* ИИ-рекомендации */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          🤖 Рекомендации
        </h3>
        {analytics.recommendations.map((rec, i) => (
          <div key={i} style={{
            fontSize: 14, color: 'var(--text-secondary)',
            padding: '8px 0', lineHeight: 1.5,
            borderBottom: i < analytics.recommendations.length - 1
              ? '1px solid rgba(200,185,154,0.15)' : 'none',
          }}>
            {rec}
          </div>
        ))}
      </div>
    </div>
  );
}
