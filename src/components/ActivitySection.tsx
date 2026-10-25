'use client';

import { useState, useEffect } from 'react';

const ACTIVITY_OPTIONS = [
  { value: 'studying', label: '📖 Studying', emoji: '📖' },
  { value: 'working_out', label: '🏋️ Working Out', emoji: '🏋️' },
  { value: 'taking_a_break', label: '☕ On Break', emoji: '☕' },
  { value: 'sleeping', label: '😴 Sleeping', emoji: '😴' },
  { value: 'eating', label: '🍽️ Eating', emoji: '🍽️' },
  { value: 'working', label: '💼 Working', emoji: '💼' },
  { value: 'other', label: '🎯 Other', emoji: '🎯' },
];

interface ActivityData {
  activity: string;
  description: string | null;
  started_at: string;
  planned_duration_minutes: number | null;
}

function getElapsed(startedAt: string): string {
  const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m > 0 ? `${h}h ${m}m ago` : `${h}h ago`;
}

export default function ActivitySection({ isOwner }: { isOwner: boolean }) {
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('studying');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    fetch('/api/activity')
      .then((r) => r.json())
      .then((d) => setActivity(d.activity ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Update elapsed timer
  useEffect(() => {
    if (!activity?.started_at) return;
    const update = () => setElapsed(getElapsed(activity.started_at));
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [activity?.started_at]);

  const saveActivity = async () => {
    if (!isOwner) return;
    setSaving(true);
    try {
      const res = await fetch('/api/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity: selected,
          description: description.trim() || null,
          isPublic: true,
        }),
      });
      const d = await res.json();
      const updated = d.activity ?? d.data ?? null;
      setActivity(updated);
      setShowEdit(false);
      setDescription('');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('activity-updated', { detail: updated }));
      }
    } catch {}
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '8px 0' }}>
        Loading…
      </div>
    );
  }

  const opt = ACTIVITY_OPTIONS.find((o) => o.value === activity?.activity);

  return (
    <div className="activity-card">
      {/* Current activity display */}
      {activity && (
        <div className="activity-display" style={{ marginBottom: showEdit ? 12 : 0 }}>
          <div className="activity-icon">{opt?.emoji ?? '🎯'}</div>
          <div className="activity-info">
            <div className="activity-name">
              {opt?.label.replace(/^[^\s]+\s/, '') ?? activity.activity.replace(/_/g, ' ')}
            </div>
            {activity.description && (
              <div className="activity-since" style={{ color: 'var(--text-secondary)' }}>
                {activity.description}
              </div>
            )}
            <div className="activity-since">Started {elapsed}</div>
          </div>
          {isOwner && (
            <button
              className="btn btn-ghost"
              style={{ fontSize: '12px', padding: '4px 10px' }}
              onClick={() => setShowEdit((s) => !s)}
            >
              Change
            </button>
          )}
        </div>
      )}

      {/* No activity + owner prompt */}
      {!activity && isOwner && !showEdit && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            No activity set.
          </span>
          <button
            id="set-activity-btn"
            className="btn btn-ghost"
            style={{ fontSize: '12px' }}
            onClick={() => setShowEdit(true)}
          >
            + Set status
          </button>
        </div>
      )}

      {!activity && !isOwner && (
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          No current activity.
        </div>
      )}

      {/* Edit panel */}
      {isOwner && showEdit && (
        <div>
          <div className="activity-select-row">
            {ACTIVITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                id={`activity-${opt.value}`}
                className={`activity-chip ${selected === opt.value ? 'active' : ''}`}
                onClick={() => setSelected(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              type="text"
              className="input"
              placeholder="Optional note (e.g. 'Chapter 3 of OS')"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button
              id="save-activity-btn"
              className="btn btn-primary"
              style={{ whiteSpace: 'nowrap' }}
              onClick={saveActivity}
              disabled={saving}
            >
              {saving ? '…' : 'Set'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setShowEdit(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
