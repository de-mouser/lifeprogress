'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Review {
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
  created_at: string;
}

export const MOOD_LABELS: Record<number, string> = {
  1: '😞 Terrible',
  2: '😕 Bad',
  3: '😐 Okay',
  4: '🙂 Good',
  5: '😁 Great',
};

export const ENERGY_LABELS: Record<number, string> = {
  1: '⚡ Low',
  2: '⚡ Moderate',
  3: '⚡ Good',
  4: '⚡ High',
  5: '⚡ Peak (Max)',
};

export default function ReviewSection({ isOwner }: { isOwner: boolean }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);

  // Form state
  const [reviewDate, setReviewDate] = useState('');
  const [mood, setMood] = useState(3);
  const [wentWell, setWentWell] = useState('');
  const [toImprove, setToImprove] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');
  const [sleepTime, setSleepTime] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [energyLevel, setEnergyLevel] = useState(3);
  const [exercise, setExercise] = useState('');

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

  // Listen for open-review-date event (e.g. from clicking heatmap day)
  useEffect(() => {
    const handler = (e: any) => {
      if (!isOwner) return;
      const targetDate = e.detail?.date;
      if (targetDate) {
        setReviewDate(targetDate);
        setShowAddForm(true);
        // If review already exists for this date, prepopulate it
        const existing = reviews.find((r) => r.review_date === targetDate);
        if (existing) {
          setMood(existing.mood);
          setWentWell(existing.what_went_well);
          setToImprove(existing.what_to_improve);
          setTomorrowPlan(existing.tomorrow_plan);
          setSleepTime(existing.sleep_time || '');
          setWakeTime(existing.wake_time || '');
          setEnergyLevel(existing.energy_level || 3);
          setExercise(existing.exercise || '');
        } else {
          setWentWell('');
          setToImprove('');
          setTomorrowPlan('');
          setSleepTime('');
          setWakeTime('');
          setEnergyLevel(3);
          setExercise('');
          setMood(3);
        }
      }
    };
    window.addEventListener('open-review-date', handler);
    return () => window.removeEventListener('open-review-date', handler);
  }, [isOwner, reviews]);

  const addReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wentWell.trim() || !isOwner) return;
    setAdding(true);
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewDate: reviewDate || undefined,
          mood,
          whatWentWell: wentWell.trim(),
          whatToImprove: toImprove.trim(),
          tomorrowPlan: tomorrowPlan.trim(),
          sleepTime: sleepTime.trim() || null,
          wakeTime: wakeTime.trim() || null,
          energyLevel,
          exercise: exercise.trim() || null,
        }),
      });
      setMood(3);
      setWentWell('');
      setToImprove('');
      setTomorrowPlan('');
      setSleepTime('');
      setWakeTime('');
      setEnergyLevel(3);
      setExercise('');
      setReviewDate('');
      setShowAddForm(false);
      await fetchReviews();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('reviews-updated'));
      }
    } catch {}
    setAdding(false);
  };

  const deleteReview = async (id: string) => {
    if (!isOwner) return;
    if (!confirm('Delete this review?')) return;
    try {
      await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' });
      await fetchReviews();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('reviews-updated'));
      }
    } catch {}
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>Loading reviews…</div>;
  }

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          📝 Daily Reviews ({reviews.length})
        </div>
        {isOwner && !showAddForm && (
          <button
            id="add-review-btn"
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={() => {
              setReviewDate('');
              setShowAddForm(true);
            }}
          >
            + Write review
          </button>
        )}
      </div>

      {/* Add review form */}
      {isOwner && showAddForm && (
        <form
          onSubmit={addReview}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--accent-dim)',
            borderRadius: 'var(--radius)',
            padding: 16,
            marginBottom: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: '0 0 15px rgba(59, 130, 246, 0.1)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {reviewDate ? `Review for ${reviewDate}` : "Today's Review"}
            </span>
            <input
              type="date"
              className="input"
              style={{ maxWidth: 150, fontSize: 12, padding: '3px 8px' }}
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
              title="Target Review Date"
            />
          </div>

          {/* Mood selection */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              How was your day?
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5].map((m) => (
                <button
                  key={m}
                  type="button"
                  id={`mood-${m}`}
                  onClick={() => setMood(m)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${mood === m ? 'var(--accent)' : 'var(--border)'}`,
                    background: mood === m ? 'var(--accent-glow)' : 'transparent',
                    color: mood === m ? 'var(--accent-bright)' : 'var(--text-muted)',
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.18s',
                  }}
                >
                  {MOOD_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          {/* Sleep & Wake Time Metric Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                🛌 Sleep Time (Bedtime)
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. 11:30 PM or 23:30"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                ☀️ Wake Up Time
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. 06:30 AM or 06:30"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
              />
            </div>
          </div>

          {/* Energy & Exercise Tracking */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                ⚡ Energy Level
              </label>
              <select
                className="input"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(Number(e.target.value))}
              >
                <option value={1}>⚡ 1 - Low (Exhausted)</option>
                <option value={2}>⚡ 2 - Moderate (Sluggish)</option>
                <option value={3}>⚡ 3 - Good (Balanced)</option>
                <option value={4}>⚡ 4 - High (Driven)</option>
                <option value={5}>⚡ 5 - Peak (Laser Focused)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                🏋️ Exercise / Workout
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. 45m Gym, 5km run, Yoga, Rest"
                value={exercise}
                onChange={(e) => setExercise(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              What went well? *
            </label>
            <textarea
              className="input"
              style={{ minHeight: 64, resize: 'vertical' }}
              placeholder="What syllabus or problem milestones did I accomplish?"
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
              style={{ minHeight: 52, resize: 'vertical' }}
              placeholder="What could be handled better tomorrow?"
              value={toImprove}
              onChange={(e) => setToImprove(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Tomorrow's Priority
            </label>
            <textarea
              className="input"
              style={{ minHeight: 52, resize: 'vertical' }}
              placeholder="Primary goal for the next study session…"
              value={tomorrowPlan}
              onChange={(e) => setTomorrowPlan(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
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
        <div style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic', padding: '12px 0' }}>
          No daily reviews yet.{isOwner ? ' Write your first review above!' : ' No logs posted yet.'}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {reviews.map((review) => (
          <div
            key={review.id}
            id={`review-${review.id}`}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>{MOOD_LABELS[review.mood]?.split(' ')[0]}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
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
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: 11, padding: '2px 8px' }}
                    onClick={() => {
                      setReviewDate(review.review_date);
                      setMood(review.mood);
                      setWentWell(review.what_went_well);
                      setToImprove(review.what_to_improve);
                      setTomorrowPlan(review.tomorrow_plan);
                      setSleepTime(review.sleep_time || '');
                      setWakeTime(review.wake_time || '');
                      setEnergyLevel(review.energy_level || 3);
                      setExercise(review.exercise || '');
                      setShowAddForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={() => deleteReview(review.id)}
                    title="Delete review"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Health & Routine Metrics display (Sleep, Wake, Energy, Exercise) */}
            {(review.sleep_time || review.wake_time || review.energy_level || review.exercise) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 12px',
                  marginBottom: 10,
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                }}
              >
                {review.sleep_time && (
                  <span>
                    🛌 <strong>Slept:</strong> {review.sleep_time}
                  </span>
                )}
                {review.wake_time && (
                  <span>
                    ☀️ <strong>Woke:</strong> {review.wake_time}
                  </span>
                )}
                {review.energy_level && (
                  <span>
                    {ENERGY_LABELS[review.energy_level] || `⚡ Energy: ${review.energy_level}/5`}
                  </span>
                )}
                {review.exercise && (
                  <span>
                    🏋️ <strong>Exercise:</strong> {review.exercise}
                  </span>
                )}
              </div>
            )}

            {/* Went well */}
            {review.what_went_well && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--success)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                  ✓ Went Well
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {review.what_went_well}
                </div>
              </div>
            )}

            {/* To improve */}
            {review.what_to_improve && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--warning)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                  ↑ To Improve
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {review.what_to_improve}
                </div>
              </div>
            )}

            {/* Tomorrow */}
            {review.tomorrow_plan && (
              <div>
                <div style={{ fontSize: 10, color: 'var(--accent-bright)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                  → Priority
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {review.tomorrow_plan}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
