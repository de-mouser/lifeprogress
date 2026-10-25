'use client';

import { useState, useEffect } from 'react';

interface HeatmapDay {
  date: string;
  level: number;
  completed: number;
  total: number;
  percentage: number;
  hasData: boolean;
}

function chunkIntoWeeks(days: HeatmapDay[]): HeatmapDay[][] {
  const weeks: HeatmapDay[][] = [];
  let week: HeatmapDay[] = [];

  // Pad the start so first day aligns to correct weekday (0=Sun)
  const firstDay = days[0];
  if (firstDay) {
    const dow = new Date(firstDay.date + 'T00:00:00').getDay();
    for (let i = 0; i < dow; i++) {
      week.push({ date: '', level: -1, completed: 0, total: 0, percentage: 0, hasData: false });
    }
  }

  for (const day of days) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) {
      week.push({ date: '', level: -1, completed: 0, total: 0, percentage: 0, hasData: false });
    }
    weeks.push(week);
  }
  return weeks;
}

const LEVEL_LABELS = ['No data', 'Low (<50%)', 'Medium (50–75%)', 'High (75–99%)', 'Complete (100%)'];

export default function Heatmap() {
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    fetch('/api/heatmap')
      .then((r) => r.json())
      .then((d) => {
        setHeatmap(d.heatmap ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '8px 0' }}>
        Loading heatmap…
      </div>
    );
  }

  if (!heatmap.length) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '8px 0', fontStyle: 'italic' }}>
        No activity data yet. Complete daily goals to see your heatmap!
      </div>
    );
  }

  const weeks = chunkIntoWeeks(heatmap);

  // Get month labels
  const monthLabels: { label: string; weekIndex: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstValid = week.find((d) => d.date);
    if (firstValid) {
      const m = new Date(firstValid.date + 'T00:00:00').getMonth();
      if (m !== lastMonth) {
        monthLabels.push({
          label: new Date(firstValid.date + 'T00:00:00').toLocaleString('default', { month: 'short' }),
          weekIndex: wi,
        });
        lastMonth = m;
      }
    }
  });

  return (
    <div style={{ paddingBottom: 16, position: 'relative' }}>
      {/* Month labels */}
      <div className="heatmap-month-labels">
        {weeks.map((_, wi) => {
          const ml = monthLabels.find((m) => m.weekIndex === wi);
          return (
            <div
              key={wi}
              className="heatmap-month-label"
            >
              {ml ? ml.label : ''}
            </div>
          );
        })}
      </div>

      <div className="heatmap-wrapper">
        <div className="heatmap-grid">
          {weeks.map((week, wi) => (
            <div key={wi} className="heatmap-col">
              {week.map((day, di) => {
                if (!day.date) {
                  return (
                    <div key={di} className="heatmap-cell" style={{ background: 'transparent' }} />
                  );
                }
                const lvl = day.hasData ? Math.min(4, Math.ceil((day.percentage / 100) * 4)) : 0;
                const levelColors = [
                  'var(--border)',
                  '#1d3f77',
                  '#1d4faa',
                  '#2563eb',
                  '#3b82f6',
                ];
                const pctAttr = !day.hasData
                  ? 'empty'
                  : day.percentage === 0
                  ? '0'
                  : day.percentage < 50
                  ? 'low'
                  : day.percentage < 75
                  ? 'mid'
                  : day.percentage < 100
                  ? 'high'
                  : 'full';
                const displayDate = new Date(day.date + 'T00:00:00').toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                });
                return (
                  <div
                    key={di}
                    className="heatmap-cell"
                    id={`heatmap-${day.date}`}
                    data-pct={pctAttr}
                    style={{ background: levelColors[lvl] }}
                    onMouseEnter={(e) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      const text = day.hasData
                        ? `${displayDate}: ${day.completed}/${day.total} goals (${day.percentage}%)`
                        : `${displayDate}: No goals`;
                      setTooltip({ text, x: rect.left, y: rect.top });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Less</span>
        {[0, 1, 2, 3, 4].map((lvl) => (
          <div
            key={lvl}
            className="heatmap-cell"
            style={{
              background: ['var(--border)', '#1d3f77', '#1d4faa', '#2563eb', '#3b82f6'][lvl],
              flexShrink: 0,
            }}
            title={LEVEL_LABELS[lvl]}
          />
        ))}
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>More</span>
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            top: tooltip.y - 36,
            left: tooltip.x,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-light)',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 11,
            color: 'var(--text-primary)',
            pointerEvents: 'none',
            zIndex: 200,
            whiteSpace: 'nowrap',
            boxShadow: 'var(--shadow)',
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
