'use client';

import { useState, useEffect, useCallback } from 'react';

interface Review {
  id: string;
  review_date: string;
  mood: number;
  what_went_well: string;
  what_to_improve: string;
  tomorrow_plan: string;
  created_at: string;
}

const MOOD_LABELS: Record<number, string> = {
  1: '😞 Terrible',
  2: '😕 Bad',
  3: '😐 Okay',
  4: '🙂 Good',
  5: '😁 Great',
};

export default function ReviewSection({ isOwner }: { isOwner: boolean }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);

  // Form state
  const [mood, setMood] = useState(3);
  const [wentWell, setWentWell] = useState('');
  const [toImprove, setToImprove] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      setReviews(data.reviews ?? []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const addReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wentWell.trim() || !isOwner) return;
    setAdding(true);
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood,
          whatWentWell: wentWell.trim(),
          whatToImprove: toImprove.trim(),
          tomorrowPlan: tomorrowPlan.trim(),
        }),
      });
      setMood(3);
      setWentWell('');
      setToImprove('');
      setTomorrowPlan('');
      setShowAddForm(false);
      await fetchReviews();
    } catch {}
    setAdding(false);
  };

  const deleteReview = async (id: string) => {
    if (!isOwner) return;
    if (!confirm('Delete this review?')) return;
    try {
      await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' });
      await fetchReviews();
    } catch {}
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>Loading…</div>;
  }

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Add review button (owner) */}
      {isOwner && !showAddForm && (
        <button
          id="add-review-btn"
          className="btn btn-ghost"
          style={{ fontSize: 12, padding: '5px 12px', marginBottom: 12 }}
          onClick={() => setShowAddForm(true)}
        >
          + Write today's review
        </button>
      )}

      {/* Add review form */}
      {isOwner && showAddForm && (
        <form
          onSubmit={addReview}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 16,
            marginBottom: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
            Daily Review
          </div>

          {/* Mood */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              How was today?
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2, 3, 4, 5].map((m) => (
                <button
                  key={m}
                  type="button"
                  id={`mood-${m}`}
                  onClick={() => setMood(m)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${mood === m ? 'var(--accent)' : 'var(--border)'}`,
                    background: mood === m ? 'var(--accent-glow)' : 'transparent',
                    color: mood === m ? 'var(--accent-bright)' : 'var(--text-muted)',
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'all 0.18s',
                  }}
                >
                  {MOOD_LABELS[m].split(' ')[0]}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {MOOD_LABELS[mood]}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              What went well? *
            </label>
            <textarea
              className="input"
              style={{ minHeight: 72, resize: 'vertical' }}
              placeholder="What did I accomplish today?"
              value={wentWell}
              onChange={(e) => setWentWell(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              What to improve?
            </label>
            <textarea
              className="input"
              style={{ minHeight: 60, resize: 'vertical' }}
              placeholder="What can I do better tomorrow?"
              value={toImprove}
              onChange={(e) => setToImprove(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Tomorrow's plan
            </label>
            <textarea
              className="input"
              style={{ minHeight: 60, resize: 'vertical' }}
              placeholder="What's the priority for tomorrow?"
              value={tomorrowPlan}
              onChange={(e) => setTomorrowPlan(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              id="submit-review-btn"
              type="submit"
              className="btn btn-primary"
              disabled={adding || !wentWell.trim()}
            >
              {adding ? '…' : 'Save Review'}
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

      {/* Reviews list */}
      {reviews.length === 0 && !showAddForm && (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic', padding: '8px 0' }}>
          No daily reviews yet.{isOwner ? ' Use the button above to write your first review.' : ''}
        </div>
      )}

      {reviews.map((review) => (
        <div
          key={review.id}
          id={`review-${review.id}`}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '14px 16px',
            marginBottom: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>{MOOD_LABELS[review.mood]?.split(' ')[0]}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                  {new Date(review.review_date + 'T00:00:00').toLocaleDateString('en-IN', {
                    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {MOOD_LABELS[review.mood]}
                </div>
              </div>
            </div>
            {isOwner && (
              <button
                className="icon-btn danger"
                onClick={() => deleteReview(review.id)}
                title="Delete review"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sections */}
          {review.what_went_well && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--success)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                ✓ Went Well
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {review.what_went_well}
              </div>
            </div>
          )}

          {review.what_to_improve && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--warning)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                ↑ To Improve
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {review.what_to_improve}
              </div>
            </div>
          )}

          {review.tomorrow_plan && (
            <div>
              <div style={{ fontSize: 10, color: 'var(--accent-bright)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                → Tomorrow
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {review.tomorrow_plan}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
