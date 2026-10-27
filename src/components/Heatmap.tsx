'use client';

import { useState, useEffect, useCallback } from 'react';

export interface HeatmapDay {
  date: string;
  level?: number;
  completed: number;
  total: number;
  percentage: number;
  hasData: boolean;
  hasReview?: boolean;
  review?: {
    id: string;
    review_date: string;
    mood: number;
    what_went_well: string;
    what_to_improve: string;
    tomorrow_plan: string;
    sleep_time?: string | null;
    wake_time?: string | null;
    energy_level?: number | null;
    exercise?: string | null;
  } | null;
}

const MOOD_EMOJIS: Record<number, string> = {
  1: '😞 Terrible',
  2: '😕 Bad',
  3: '😐 Okay',
  4: '🙂 Good',
  5: '😁 Great',
};

function chunkIntoWeeks(days: HeatmapDay[]): HeatmapDay[][] {
  const weeks: HeatmapDay[][] = [];
  let week: HeatmapDay[] = [];

  const firstDay = days[0];
  if (firstDay) {
    const dow = new Date(firstDay.date + 'T00:00:00').getDay();
    for (let i = 0; i < dow; i++) {
      week.push({ date: '', completed: 0, total: 0, percentage: 0, hasData: false, hasReview: false, review: null });
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
      week.push({ date: '', completed: 0, total: 0, percentage: 0, hasData: false, hasReview: false, review: null });
    }
    weeks.push(week);
  }
  return weeks;
}

const LEVEL_LABELS = ['No goals', 'Low (<50%)', 'Medium (50–75%)', 'High (75–99%)', 'Complete (100%)'];

export default function Heatmap({ isOwner = false }: { isOwner?: boolean }) {
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedDay, setSelectedDay] = useState<HeatmapDay | null>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const fetchHeatmap = useCallback(async () => {
    try {
      const res = await fetch('/api/heatmap');
      const d = await res.json();
      setHeatmap(d.heatmap ?? []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHeatmap();
  }, [fetchHeatmap]);

  // Re-fetch when reviews are updated
  useEffect(() => {
    const handleUpdate = () => fetchHeatmap();
    window.addEventListener('reviews-updated', handleUpdate);
    return () => window.removeEventListener('reviews-updated', handleUpdate);
  }, [fetchHeatmap]);

  const handleDayClick = (day: HeatmapDay) => {
    if (!day.date) return;
    setSelectedDay(day);
  };

  const handleWriteReview = (targetDate: string) => {
    setSelectedDay(null);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-review-date', { detail: { date: targetDate } }));
      // Smooth scroll down to review section
      const el = document.getElementById('review-section-anchor');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  if (loading) {
    return (
      <div className="heatmap-fixed-dock">
        <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '6px 0' }}>
          Loading GATE CS 2027 Sprint Heatmap…
        </div>
      </div>
    );
  }

  const weeks = chunkIntoWeeks(heatmap);

  // Month labels
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
    <>
      {/* ── Fixed Bottom Dock ────────────────────────────────────────── */}
      <aside className={`heatmap-fixed-dock ${isMinimized ? 'minimized' : ''}`} aria-label="GATE Sprint Heatmap">
        <div className="heatmap-dock-header">
          <div className="heatmap-dock-title">
            <span className="heatmap-dock-icon">🔥</span>
            <span>
              <strong>GATE CS 2027 Sprint Heatmap</strong> · <span style={{ opacity: 0.8 }}>Oct 28 – Feb 7</span>
            </span>
            <span className="heatmap-dock-hint">Click any day to view daily review & sleep metrics</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Quick legend */}
            {!isMinimized && (
              <div className="heatmap-legend" style={{ margin: 0 }}>
                <span>Less</span>
                {[0, 1, 2, 3, 4].map((lvl) => (
                  <div
                    key={lvl}
                    className="heatmap-cell"
                    style={{
                      background: ['var(--border)', 'rgba(59, 130, 246, 0.25)', 'rgba(59, 130, 246, 0.5)', 'rgba(59, 130, 246, 0.75)', 'var(--accent)'][lvl],
                      width: 9,
                      height: 9,
                    }}
                    title={LEVEL_LABELS[lvl]}
                  />
                ))}
                <span>More</span>
                <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text-muted)' }}>
                  (🟣 = Review logged)
                </span>
              </div>
            )}

            <button
              className="btn btn-ghost"
              style={{ fontSize: 11, padding: '2px 8px' }}
              onClick={() => setIsMinimized((m) => !m)}
              title={isMinimized ? 'Expand heatmap dock' : 'Minimize heatmap dock'}
            >
              {isMinimized ? '▲ Expand Heatmap' : '▼ Minimize'}
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="heatmap-dock-body">
            {/* Day of week labels */}
            <div className="heatmap-dow-col">
              <span>S</span>
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
            </div>

            <div className="heatmap-wrapper" style={{ width: '100%', paddingBottom: 0, overflowX: 'auto' }}>
              {/* Month labels */}
              <div
                className="heatmap-month-labels"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${weeks.length}, minmax(18px, 1fr))`,
                  width: '100%',
                  gap: 4,
                  textAlign: 'center',
                }}
              >
                {weeks.map((_, wi) => {
                  const ml = monthLabels.find((m) => m.weekIndex === wi);
                  return (
                    <div key={wi} className="heatmap-month-label" style={{ width: 'auto' }}>
                      {ml ? ml.label : ''}
                    </div>
                  );
                })}
              </div>

              {/* Grid columns */}
              <div
                className="heatmap-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${weeks.length}, minmax(18px, 1fr))`,
                  width: '100%',
                  gap: 4,
                }}
              >
                {weeks.map((week, wi) => (
                  <div key={wi} className="heatmap-col" style={{ width: '100%', gap: 3 }}>
                    {week.map((day, di) => {
                      if (!day.date) {
                        return <div key={di} className="heatmap-cell" style={{ background: 'transparent', width: '100%', height: 13 }} />;
                      }

                      const lvl = day.hasData ? Math.min(4, Math.ceil((day.percentage / 100) * 4)) : 0;
                      const levelColors = [
                        'var(--border)',
                        'rgba(59, 130, 246, 0.25)',
                        'rgba(59, 130, 246, 0.5)',
                        'rgba(59, 130, 246, 0.75)',
                        'var(--accent)',
                      ];

                      const displayDate = new Date(day.date + 'T00:00:00').toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      });

                      const reviewNote = day.hasReview ? ' · 📝 Click to read review' : '';

                      return (
                        <div
                          key={di}
                          className="heatmap-cell"
                          id={`heatmap-${day.date}`}
                          style={{
                            background: levelColors[lvl],
                            width: '100%',
                            height: 13,
                            cursor: 'pointer',
                            outline: day.hasReview ? '1.5px solid #a855f7' : undefined,
                            boxShadow: day.hasReview ? '0 0 6px rgba(168, 85, 247, 0.6)' : undefined,
                          }}
                          onClick={() => handleDayClick(day)}
                          onMouseEnter={(e) => {
                            const rect = (e.target as HTMLElement).getBoundingClientRect();
                            const text = day.hasData
                              ? `${displayDate}: ${day.completed}/${day.total} goals (${day.percentage}%)${reviewNote}`
                              : `${displayDate}: No goals logged${reviewNote}`;
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
          </div>
        )}
      </aside>

      {/* Floating Hover Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            top: Math.max(10, tooltip.y - 36),
            left: Math.max(10, tooltip.x - 20),
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-light)',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 11,
            color: 'var(--text-primary)',
            pointerEvents: 'none',
            zIndex: 1000,
            whiteSpace: 'nowrap',
            boxShadow: 'var(--shadow)',
          }}
        >
          {tooltip.text}
        </div>
      )}

      {/* ── Day Details & Review Modal ─────────────────────────────── */}
      {selectedDay && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setSelectedDay(null)}
        >
          <div
            className="modal-box"
            role="dialog"
            aria-modal="true"
            style={{ maxWidth: 480, width: '92%' }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  📅 {new Date(selectedDay.date + 'T00:00:00').toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  GATE CS 2027 Sprint Day
                </div>
              </div>
              <button
                className="icon-btn"
                onClick={() => setSelectedDay(null)}
                title="Close"
                style={{ fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            {/* Goals completion badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 12px',
                marginBottom: 14,
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                <strong>Daily Goals:</strong>{' '}
                {selectedDay.hasData
                  ? `${selectedDay.completed} / ${selectedDay.total} completed (${selectedDay.percentage}%)`
                  : 'No goals recorded on this day'}
              </div>
              {selectedDay.hasData && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: selectedDay.percentage === 100 ? 'var(--success-dim)' : 'var(--accent-glow)',
                    color: selectedDay.percentage === 100 ? 'var(--success)' : 'var(--accent-bright)',
                  }}
                >
                  {selectedDay.percentage}%
                </span>
              )}
            </div>

            {/* Daily Review content if exists */}
            {selectedDay.review ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Mood row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{MOOD_EMOJIS[selectedDay.review.mood]?.split(' ')[0]}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Mood: {MOOD_EMOJIS[selectedDay.review.mood]}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Daily Reflection</div>
                  </div>
                </div>

                {/* Sleep, Wake, Energy & Exercise Metrics */}
                {(selectedDay.review.sleep_time || selectedDay.review.wake_time || selectedDay.review.energy_level || selectedDay.review.exercise) && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 12,
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid var(--accent-dim)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      fontSize: 12,
                    }}
                  >
                    {selectedDay.review.sleep_time && (
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>🛌 Bedtime: </span>
                        <strong>{selectedDay.review.sleep_time}</strong>
                      </div>
                    )}
                    {selectedDay.review.wake_time && (
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>☀️ Woke up: </span>
                        <strong>{selectedDay.review.wake_time}</strong>
                      </div>
                    )}
                    {selectedDay.review.energy_level && (
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>⚡ Energy: </span>
                        <strong>{selectedDay.review.energy_level}/5</strong>
                      </div>
                    )}
                    {selectedDay.review.exercise && (
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>🏋️ Exercise: </span>
                        <strong>{selectedDay.review.exercise}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Went well */}
                {selectedDay.review.what_went_well && (
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 10 }}>
                    <div style={{ fontSize: 10, color: 'var(--success)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                      ✓ What Went Well
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {selectedDay.review.what_went_well}
                    </div>
                  </div>
                )}

                {/* To improve */}
                {selectedDay.review.what_to_improve && (
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 10 }}>
                    <div style={{ fontSize: 10, color: 'var(--warning)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                      ↑ To Improve
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {selectedDay.review.what_to_improve}
                    </div>
                  </div>
                )}

                {/* Tomorrow priority */}
                {selectedDay.review.tomorrow_plan && (
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 10 }}>
                    <div style={{ fontSize: 10, color: 'var(--accent-bright)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                      → Tomorrow's Priority
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {selectedDay.review.tomorrow_plan}
                    </div>
                  </div>
                )}

                {isOwner && (
                  <button
                    className="btn btn-ghost"
                    style={{ marginTop: 4, fontSize: 12 }}
                    onClick={() => handleWriteReview(selectedDay.date)}
                  >
                    ✏️ Edit Review for this Day
                  </button>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📝</div>
                <div style={{ fontSize: 13, marginBottom: 12 }}>No daily review recorded for this date.</div>
                {isOwner && (
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: 12 }}
                    onClick={() => handleWriteReview(selectedDay.date)}
                  >
                    + Write Review for this Day
                  </button>
                )}
              </div>
            )}

            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setSelectedDay(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
