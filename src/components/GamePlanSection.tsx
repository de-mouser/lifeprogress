'use client';

import { useState, useEffect, useCallback } from 'react';

interface GamePlan {
  id: string;
  plan_type: 'weekly' | 'monthly';
  title: string;
  content: string;
  week_number: number | null;
  month: number | null;
  year: number;
  created_at: string;
  updated_at: string;
}

export default function GamePlanSection({ isOwner }: { isOwner: boolean }) {
  const [plans, setPlans] = useState<GamePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [saving, setSaving] = useState(false);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<'weekly' | 'monthly'>('weekly');
  const [adding, setAdding] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/gameplan');
      const data = await res.json();
      setPlans(data.plans ?? []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const startEdit = (plan: GamePlan) => {
    setEditingId(plan.id);
    setEditContent(plan.content);
    setEditTitle(plan.title);
  };

  const saveEdit = async (planId: string) => {
    setSaving(true);
    try {
      await fetch(`/api/gameplan?id=${planId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent, title: editTitle }),
      });
      setEditingId(null);
      await fetchPlans();
    } catch {}
    setSaving(false);
  };

  const addPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setAdding(true);
    try {
      await fetch('/api/gameplan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          planType: newType,
        }),
      });
      setNewTitle('');
      setNewContent('');
      setShowAdd(false);
      await fetchPlans();
    } catch {}
    setAdding(false);
  };

  const deletePlan = async (planId: string) => {
    if (!isOwner) return;
    if (!confirm('Delete this plan?')) return;
    try {
      await fetch(`/api/gameplan?id=${planId}`, { method: 'DELETE' });
      await fetchPlans();
    } catch {}
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>Loading…</div>;
  }

  return (
    <div style={{ paddingBottom: 16 }}>
      {plans.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic', padding: '8px 0' }}>
          No plans written yet.
        </div>
      )}

      {plans.map((plan) => (
        <div
          key={plan.id}
          id={`plan-${plan.id}`}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '14px 16px',
            marginBottom: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
            <div>
              {editingId === plan.id ? (
                <input
                  type="text"
                  className="input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ marginBottom: 6, fontWeight: 500 }}
                />
              ) : (
                <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text-primary)' }}>
                  {plan.title}
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                <span
                  style={{
                    padding: '1px 8px',
                    background: plan.plan_type === 'weekly' ? 'var(--accent-glow)' : 'rgba(16,185,129,0.1)',
                    color: plan.plan_type === 'weekly' ? 'var(--accent-bright)' : 'var(--success)',
                    borderRadius: 12,
                    marginRight: 8,
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {plan.plan_type}
                </span>
                Updated{' '}
                {new Date(plan.updated_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short',
                })}
              </div>
            </div>

            {isOwner && (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {editingId === plan.id ? (
                  <>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: 12, padding: '4px 10px' }}
                      onClick={() => saveEdit(plan.id)}
                      disabled={saving}
                    >
                      {saving ? '…' : 'Save'}
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: 12, padding: '4px 10px' }}
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="icon-btn"
                      style={{ fontSize: 14 }}
                      onClick={() => startEdit(plan)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="icon-btn danger"
                      onClick={() => deletePlan(plan.id)}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {editingId === plan.id ? (
            <textarea
              className="input"
              style={{ minHeight: 140, resize: 'vertical', fontFamily: 'inherit' }}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
          ) : (
            <div
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
              }}
            >
              {plan.content}
            </div>
          )}
        </div>
      ))}

      {/* Add new plan (owner) */}
      {isOwner && (
        <div style={{ marginTop: 8 }}>
          {!showAdd ? (
            <button
              id="add-plan-btn"
              className="btn btn-ghost"
              style={{ fontSize: 12, padding: '5px 12px' }}
              onClick={() => setShowAdd(true)}
            >
              + Add plan
            </button>
          ) : (
            <form
              onSubmit={addPlan}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Plan title (e.g. Week 3 Plan)…"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  required
                  style={{ flex: 1 }}
                />
                <select
                  className="input"
                  style={{ width: 110 }}
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as 'weekly' | 'monthly')}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <textarea
                className="input"
                style={{ minHeight: 120, resize: 'vertical' }}
                placeholder="Write your plan, goals, strategy…"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                required
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  id="submit-plan-btn"
                  type="submit"
                  className="btn btn-primary"
                  disabled={adding || !newTitle.trim() || !newContent.trim()}
                >
                  {adding ? '…' : 'Save Plan'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowAdd(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
