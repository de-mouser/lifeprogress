'use client';

import { useState, useEffect, useCallback } from 'react';

interface SleepSession {
  id: string;
  started_at: string;
  is_active: boolean;
  notes: string | null;
  planned_wake_at: string | null;
  ended_at: string | null;
}

function formatDuration(startedAt: string, endedAt?: string | null): string {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const diff = Math.floor((end - start) / 60000);
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default function SleepSection({ isOwner }: { isOwner: boolean }) {
  const [activeSession, setActiveSession] = useState<SleepSession | null>(null);
  const [recentSessions, setRecentSessions] = useState<SleepSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [ending, setEnding] = useState(false);
  const [starting, setStarting] = useState(false);
  const [showStart, setShowStart] = useState(false);

  const fetchSleep = useCallback(async () => {
    if (!isOwner) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/sleep');
      const data = await res.json();
      setActiveSession(data.activeSession ?? null);
      setRecentSessions(data.recentSessions ?? []);
    } catch {}
    setLoading(false);
  }, [isOwner]);

  useEffect(() => {
    fetchSleep();
  }, [fetchSleep]);

  // Live duration update
  useEffect(() => {
    if (!activeSession) return;
    const update = () => setDuration(formatDuration(activeSession.started_at));
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [activeSession]);

  const startSleep = async () => {
    setStarting(true);
    try {
      await fetch('/api/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', notes: notes.trim() || null }),
      });
      setNotes('');
      setShowStart(false);
      await fetchSleep();
    } catch {}
    setStarting(false);
  };

  const endSleep = async () => {
    if (!activeSession) return;
    setEnding(true);
    try {
      await fetch('/api/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end', sessionId: activeSession.id }),
      });
      await fetchSleep();
    } catch {}
    setEnding(false);
  };

  if (!isOwner) return null;
  if (loading) return null;

  return (
    <div className="section" style={{ marginBottom: '1rem' }}>
      <div
        className="section-header"
        style={{ cursor: 'default' }}
        role="region"
        aria-label="Sleep tracking"
      >
        <span className="section-title">😴 Sleep Mode</span>
        {!activeSession && !showStart && (
          <button
            id="start-sleep-btn"
            className="btn btn-ghost"
            style={{ fontSize: '12px', padding: '4px 10px' }}
            onClick={() => setShowStart(true)}
          >
            Start sleep
          </button>
        )}
      </div>

      {/* Active sleep session banner */}
      {activeSession && (
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--accent-dim)',
            borderRadius: 'var(--radius)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>😴</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                Sleeping · {duration}
              </div>
              {activeSession.notes && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {activeSession.notes}
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Started{' '}
                {new Date(activeSession.started_at).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
          <button
            id="end-sleep-btn"
            className="btn btn-secondary"
            style={{ fontSize: '12px' }}
            onClick={endSleep}
            disabled={ending}
          >
            {ending ? '…' : '☀️ Wake up'}
          </button>
        </div>
      )}

      {/* Start form */}
      {!activeSession && showStart && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 4,
          }}
        >
          <input
            type="text"
            className="input"
            placeholder="Optional note (e.g. 'Power nap')…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            autoFocus
          />
          <button
            id="confirm-sleep-btn"
            className="btn btn-primary"
            onClick={startSleep}
            disabled={starting}
            style={{ whiteSpace: 'nowrap' }}
          >
            {starting ? '…' : '😴 Sleep'}
          </button>
          <button className="btn btn-ghost" onClick={() => setShowStart(false)}>
            Cancel
          </button>
        </div>
      )}

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Recent sessions
          </div>
          {recentSessions.slice(0, 3).map((s) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                color: 'var(--text-secondary)',
                padding: '4px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span>
                {new Date(s.started_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}{' '}
                {new Date(s.started_at).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {s.notes ? ` · ${s.notes}` : ''}
              </span>
              <span style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                {s.ended_at ? formatDuration(s.started_at, s.ended_at) : 'ongoing'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
