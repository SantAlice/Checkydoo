import { useEffect, useState } from 'react';
import { useStore } from '../hooks/useStore';
import type { Analytics } from '../types';

const TYPE_COLORS: Record<string, string> = {
  WORK: '#c9beff',
  PERSONAL: '#eef567',
  HOBBY: '#E8C97A',
  REST: '#9B8EC4',
  CUSTOM: '#c9c8b0',
};

function ScoreRing({ percentage, size = 200 }: { percentage: number; size?: number }) {
  const stroke = 10;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (percentage / 100) * circ;

  return (
    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--surface-container-high)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--primary)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      <text x={size / 2} y={size / 2 - 4} textAnchor="middle" fill="var(--primary)"
        fontSize="3rem" fontWeight="800" fontFamily="Manrope">{percentage}%</text>
      <text x={size / 2} y={size / 2 + 24} textAnchor="middle" fill="var(--on-surface-variant)"
        fontSize="0.65rem" fontWeight="700" letterSpacing="2" fontFamily="Manrope">
        DAILY EQUILIBRIUM
      </text>
    </svg>
  );
}

function DonutChart({ data }: { data: Analytics['timeDistribution'] }) {
  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 32, color: 'var(--on-secondary)', opacity: 0.6 }}>
        Пока нет данных
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.totalMinutes, 0) || 1;
  let cumulative = 0;
  const size = 140;
  const outerR = 65;
  const innerR = 42;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((item, i) => {
          const slice = (item.totalMinutes / total) * Math.PI * 2;
          const startAngle = cumulative;
          cumulative += slice;
          const x1o = size / 2 + outerR * Math.cos(startAngle - Math.PI / 2);
          const y1o = size / 2 + outerR * Math.sin(startAngle - Math.PI / 2);
          const x2o = size / 2 + outerR * Math.cos(startAngle + slice - Math.PI / 2);
          const y2o = size / 2 + outerR * Math.sin(startAngle + slice - Math.PI / 2);
          const x1i = size / 2 + innerR * Math.cos(startAngle + slice - Math.PI / 2);
          const y1i = size / 2 + innerR * Math.sin(startAngle + slice - Math.PI / 2);
          const x2i = size / 2 + innerR * Math.cos(startAngle - Math.PI / 2);
          const y2i = size / 2 + innerR * Math.sin(startAngle - Math.PI / 2);
          const large = slice > Math.PI ? 1 : 0;

          return (
            <path key={i}
              d={`M ${x1o} ${y1o} A ${outerR} ${outerR} 0 ${large} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${innerR} ${innerR} 0 ${large} 0 ${x2i} ${y2i} Z`}
              fill={TYPE_COLORS[item.type] || TYPE_COLORS.CUSTOM}
            />
          );
        })}
        <text x={size / 2} y={size / 2 - 6} textAnchor="middle" fill="var(--on-secondary)"
          fontSize="11" fontWeight="700" fontFamily="Manrope">Всего</text>
        <text x={size / 2} y={size / 2 + 12} textAnchor="middle" fill="var(--on-secondary)"
          fontSize="16" fontWeight="800" fontFamily="Manrope">
          {Math.round(total / 60)}ч
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <div style={{
              width: 10, height: 10, borderRadius: 'var(--radius-full)',
              background: TYPE_COLORS[item.type] || TYPE_COLORS.CUSTOM,
            }} />
            <span style={{ color: 'var(--on-secondary)' }}>
              {item.category} ({item.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyBars({ data }: { data: Analytics['weeklyTrend'] }) {
  if (data.length === 0) return null;
  const maxVal = Math.max(...data.flatMap(d => [d.completed, d.created]), 1);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, justifyContent: 'center' }}>
      {data.map((week, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 80 }}>
            <div style={{
              width: 14,
              background: 'var(--secondary)',
              height: `${Math.max((week.created / maxVal) * 80, 4)}px`,
              borderRadius: 'var(--radius-full)',
              opacity: 0.5,
            }} />
            <div style={{
              width: 14,
              background: week.completed < week.created ? 'var(--error)' : 'var(--secondary)',
              height: `${Math.max((week.completed / maxVal) * 80, 4)}px`,
              borderRadius: 'var(--radius-full)',
            }} />
          </div>
          <span style={{ fontSize: 10, color: 'var(--on-surface-variant)' }}>
            {new Date(week.date).toLocaleDateString('ru-RU', { weekday: 'short' }).toUpperCase()}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsPage() {
  const {
    analytics, loadAnalytics,
    loadScheduleStatus,
    scheduleProposal, loading,
    optimizeSchedule, applyOptimization, clearProposal,
  } = useStore();
  const [period, setPeriod] = useState(30);
  const [showOptimize, setShowOptimize] = useState(false);
  const [preferences, setPreferences] = useState('');

  useEffect(() => {
    loadAnalytics(period);
    loadScheduleStatus();
  }, [loadAnalytics, loadScheduleStatus, period]);

  if (!analytics) {
    return (
      <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
        Загрузка аналитики...
      </div>
    );
  }

  const handleOptimize = async () => {
    await optimizeSchedule(preferences || undefined);
  };

  const handleApply = async () => {
    await applyOptimization();
    setShowOptimize(false);
    setPreferences('');
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', paddingBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Аналитика</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setPeriod(d)} className="chip" style={{
              cursor: 'pointer', padding: '6px 14px',
              background: period === d ? 'var(--primary)' : 'var(--surface-container-high)',
              color: period === d ? 'var(--on-primary)' : 'var(--on-surface-variant)',
            }}>
              {d}д
            </button>
          ))}
        </div>
      </div>

      {/* Score */}
      <div className="card" style={{ padding: '32px 24px', marginBottom: 32, textAlign: 'center' }}>
        <ScoreRing percentage={analytics.completionRate} />
        <div style={{
          marginTop: 12, fontSize: 14, color: 'var(--on-surface-variant)', textAlign: 'center',
        }}>
          Общий балл продуктивности и баланса
        </div>
      </div>

      {/* Time distribution */}
      <h3 className="section-title" style={{ marginBottom: 12 }}>Время по категориям</h3>
      <div className="card-lavender" style={{ padding: '24px 20px', marginBottom: 32 }}>
        <DonutChart data={analytics.timeDistribution} />
      </div>

      {/* Weekly trend */}
      <h3 className="section-title" style={{ marginBottom: 12 }}>Утечка эффективности</h3>
      <div className="card" style={{ padding: '24px 20px', marginBottom: 32 }}>
        <WeeklyBars data={analytics.weeklyTrend} />
        <div style={{
          fontSize: 12, color: 'var(--on-surface-variant)', textAlign: 'center', marginTop: 12,
        }}>
          Красные столбцы показывают критическую потерю фокуса.
        </div>
      </div>

      {/* Recommendations as AI Insight */}
      {analytics.recommendations.length > 0 && (
        <>
          <div className="card-lavender" style={{
            padding: '20px 24px', marginBottom: 32,
            display: 'flex', gap: 14, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--radius-full)',
              background: 'rgba(48,32,118,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 18 }}>✦</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>AI Инсайт</div>
              <div style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.85 }}>
                {analytics.recommendations[0]}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Overdue */}
      {analytics.overdueAnalysis.totalOverdue > 0 && (
        <div className="card" style={{ padding: '24px 20px', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--error)' }}>
              {analytics.overdueAnalysis.totalOverdue}
            </span>
            <span style={{ fontSize: 14, color: 'var(--on-surface-variant)' }}>просроченных задач</span>
          </div>
          {analytics.overdueAnalysis.byCategory.map((cat, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 14, padding: '8px 0',
            }}>
              <span style={{ color: 'var(--on-surface-variant)' }}>{cat.name}</span>
              <span style={{ fontWeight: 700 }}>{cat.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Optimize button */}
      <button className="optimize-btn" onClick={() => setShowOptimize(true)}>
        ✦ Оптимизировать расписание
      </button>

      {/* Optimize modal */}
      {showOptimize && (
        <div className="modal-overlay" onClick={() => { setShowOptimize(false); clearProposal(); }}>
          <div className="modal-card slide-up" onClick={e => e.stopPropagation()}
            style={{ maxHeight: '80vh', overflow: 'auto' }}>
            {!scheduleProposal ? (
              <>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Оптимизация</h3>
                <textarea className="input-textarea" rows={3}
                  placeholder="Ваши пожелания (необязательно)..."
                  value={preferences} onChange={e => setPreferences(e.target.value)}
                  style={{ marginBottom: 16 }} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-surface" onClick={() => setShowOptimize(false)} style={{ flex: 1 }}>
                    Отмена
                  </button>
                  <button className="btn btn-primary" onClick={handleOptimize} disabled={loading} style={{ flex: 1 }}>
                    {loading ? 'Анализ...' : 'Оптимизировать'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Предложение</h3>
                <p style={{ fontSize: 14, color: 'var(--on-surface-variant)', marginBottom: 16 }}>
                  Переносим <strong style={{ color: 'var(--primary)' }}>{scheduleProposal.movedCount}</strong> задач
                </p>
                {scheduleProposal.changes.map(c => (
                  <div key={c.taskId} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 14,
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                    <span style={{ flex: 1 }}>{c.title}</span>
                    <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                      {new Date(c.newDeadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button className="btn btn-surface" onClick={() => { setShowOptimize(false); clearProposal(); }}
                    style={{ flex: 1 }}>Отмена</button>
                  <button className="btn btn-primary" onClick={handleApply} disabled={loading} style={{ flex: 1 }}>
                    {loading ? 'Применяем...' : 'Применить'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
