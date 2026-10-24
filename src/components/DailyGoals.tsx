'use client';

import { useState, useEffect, useCallback } from 'react';

interface Goal {
  id: string;
  content: string;
  target_hours: number | null;
  target_questions: number | null;
  is_completed: boolean;
  display_order: number;
}

export default function DailyGoals({ isOwner }: { isOwner: boolean }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [newHours, setNewHours] = useState('');
  const [adding, setAdding] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch('/api/goals');
      const data = await res.json();
      setGoals(data.goals ?? []);
      setDate(data.date ?? '');
      setCompletedCount(data.completedCount ?? 0);
      setTotalCount(data.totalCount ?? 0);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const toggleGoal = async (goalId: string, current: boolean) => {
    if (!isOwner || toggling) return;
    setToggling(goalId);
    try {
      await fetch('/api/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId, isCompleted: !current }),
      });
      await fetchGoals();
    } catch {}
    setToggling(null);
  };

  const deleteGoal = async (goalId: string) => {
    if (!isOwner) return;
    if (!confirm('Delete this goal?')) return;
    try {
      await fetch(`/api/goals?id=${goalId}`, { method: 'DELETE' });
      await fetchGoals();
    } catch {}
  };

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim() || !isOwner) return;
    setAdding(true);
    try {
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newGoal.trim(),
          targetHours: newHours ? parseFloat(newHours) : null,
        }),
      });
      setNewGoal('');
      setNewHours('');
      setShowAddForm(false);
      await fetchGoals();
    } catch {}
    setAdding(false);
  };

  if (loading) {
    return (
      <div className="goals-section">
        <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '8px 0' }}>
          Loading goals…
        </div>
      </div>
    );
  }

  const dateLabel = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div className="goals-section">
      <div className="goals-header-row">
        <span className="goals-date">{dateLabel}</span>
        {totalCount > 0 && (
          <span className="goals-completion">
            {completedCount}/{totalCount} completed
          </span>
        )}
      </div>

      {goals.length === 0 && !showAddForm && (
        <div
          style={{
            color: 'var(--text-muted)',
            fontSize: '13px',
            padding: '12px 0',
            fontStyle: 'italic',
          }}
        >
          No goals set for today.{' '}
          {isOwner && (
            <button
              className="btn btn-ghost"
              style={{ display: 'inline', padding: '2px 8px', fontSize: '12px' }}
              onClick={() => setShowAddForm(true)}
            >
              + Add goal
            </button>
          )}
        </div>
      )}

      {goals.map((goal) => (
        <div
          key={goal.id}
          className="goal-item"
          id={`goal-${goal.id}`}
          style={goal.is_completed ? { opacity: 0.55 } : {}}
        >
          <input
            type="checkbox"
            className="task-checkbox"
            checked={goal.is_completed}
            disabled={!isOwner || toggling === goal.id}
            onChange={() => toggleGoal(goal.id, goal.is_completed)}
            aria-label={goal.content}
          />
          <div className={`goal-content ${goal.is_completed ? 'done' : ''}`}>
            {goal.content}
            {goal.target_hours && (
              <span className="goal-target"> · {goal.target_hours}h target</span>
            )}
          </div>
          {isOwner && (
            <div className="goal-actions">
              <button
                className="icon-btn danger"
                onClick={() => deleteGoal(goal.id)}
                title="Delete goal"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Add form */}
      {isOwner && showAddForm && (
        <form
          onSubmit={addGoal}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            marginTop: '8px',
          }}
        >
          <div className="add-goal-form">
            <input
              type="text"
              className="input"
              placeholder="Goal description…"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              autoFocus
            />
            <input
              type="number"
              className="input"
              style={{ maxWidth: 80 }}
              placeholder="Hours"
              min="0"
              max="24"
              step="0.5"
              value={newHours}
              onChange={(e) => setNewHours(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              id="add-goal-submit"
              type="submit"
              className="btn btn-primary"
              disabled={adding || !newGoal.trim()}
            >
              {adding ? '…' : 'Add'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isOwner && goals.length > 0 && !showAddForm && (
        <button
          id="show-add-goal-btn"
          className="btn btn-ghost"
          style={{ marginTop: '8px', fontSize: '12px', padding: '5px 10px' }}
          onClick={() => setShowAddForm(true)}
        >
          + Add goal
        </button>
      )}
    </div>
  );
}
