'use client';

import { useState, useEffect, useCallback } from 'react';
import SubjectsSection from '@/components/SubjectsSection';
import DailyGoals from '@/components/DailyGoals';
import Heatmap from '@/components/Heatmap';
import ActivitySection from '@/components/ActivitySection';
import SleepSection from '@/components/SleepSection';
import ProblemsSection from '@/components/ProblemsSection';
import GamePlanSection from '@/components/GamePlanSection';
import ReviewSection from '@/components/ReviewSection';
import AuthModal from '@/components/AuthModal';

function getRemainingTime(): { days: number; weeks: string } {
  // Target: GATE CS 2027 Exam (Feb 7, 2027)
  const target = new Date('2027-02-07T00:00:00+05:30').getTime();
  const now = Date.now();
  const diffMs = Math.max(0, target - now);
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const weeks = (days / 7).toFixed(1);
  return { days, weeks };
}

export default function HomePage() {
  const [isOwner, setIsOwner] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [tasksData, setTasksData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    fetch('/api/auth/logout', { method: 'GET' })
      .then((r) => r.json())
      .then((d) => setIsOwner(!!d.isOwner))
      .catch(() => {});
  }, []);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasksData(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleLogin = (owner: boolean) => {
    setIsOwner(owner);
    setShowAuth(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsOwner(false);
  };

  const pct = tasksData?.overallPercentage ?? 0;
  const completed = tasksData?.totalCompleted ?? 0;
  const total = tasksData?.totalTasks ?? 72;

  const { days: daysLeft, weeks: weeksLeft } = getRemainingTime();

  return (
    <div className="page-wrapper">
      {/* ── Top Bar ─────────────────────────────────── */}
      <header className="top-bar">
        <div className="top-bar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="site-title">GATE CS 2027</span>
            {/* Days & Weeks Remaining Header Pill */}
            <span className="header-countdown-pill" title="Time remaining until GATE CS 2027 Exam (Feb 7, 2027)">
              ⏳ {daysLeft} Days / {weeksLeft} Weeks Left
            </span>
          </div>

          <div className="top-bar-right">
            <ActivityBadge />
            <button
              id="lock-toggle-btn"
              className={`lock-btn ${isOwner ? 'unlocked' : ''}`}
              onClick={() => (isOwner ? handleLogout() : setShowAuth(true))}
              title={isOwner ? 'Lock (log out)' : 'Owner unlock'}
            >
              {isOwner ? '🔓' : '🔒'}
            </button>
          </div>
        </div>
      </header>

      <main className="container panoramic-container">
        {/* ── Hero Headline ───────────────────────────── */}
        <section className="hero" style={{ padding: '24px 0 16px', textAlign: 'center' }}>
          <div className="hero-subtitle">Personal tracker · GATE CS 2027</div>
          <div className="hero-goal">🎯 Under 100 Rank</div>
        </section>

        {/* ── Panoramic Dashboard: Left Column | Center (Progress + Tasks) | Right Column ── */}
        <div className="panoramic-dashboard">
          {/* ── LEFT COLUMN: Today's Goals + Weekly/Monthly Plan ── */}
          <aside className="panoramic-col col-left">
            <div className="section">
              <div className="section-static-header">
                <span className="section-title">🎯 Today's Goals</span>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <DailyGoals isOwner={isOwner} />
              </div>
            </div>

            <div className="section">
              <div className="section-static-header">
                <span className="section-title">📋 Weekly &amp; Monthly Plan</span>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <GamePlanSection isOwner={isOwner} />
              </div>
            </div>
          </aside>

          {/* ── CENTER COLUMN: Clean Horizontal Progress Bar + Subjects & Tasks ── */}
          <section className="panoramic-col col-center">
            {/* Clean, Simple & Easy to Read Horizontal Progress Bar */}
            <div className="simple-progress-card">
              <div className="simple-progress-top">
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Syllabus Progress
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-bright)' }}>
                  {pct}% <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>({completed}/{total} tasks)</span>
                </span>
              </div>

              {/* Clean Horizontal Track */}
              <div className="simple-progress-track">
                <div
                  className="simple-progress-fill"
                  style={{ width: `${loading ? 0 : Math.max(1, pct)}%` }}
                />
              </div>

              {/* Plain Simple Stats Line */}
              <div className="simple-progress-stats">
                <span><strong>{completed}</strong> Done</span>
                <span>•</span>
                <span><strong>{total - completed}</strong> Remaining</span>
                <span>•</span>
                <span><strong>12</strong> Subjects</span>
              </div>

              <div className="simple-progress-message">
                {pct === 0
                  ? 'Every expert was once a beginner. Start today.'
                  : pct < 25
                  ? 'Great start! Keep the momentum going.'
                  : pct < 50
                  ? 'Almost halfway there. Stay consistent!'
                  : pct < 75
                  ? 'Past the halfway mark. The finish line is closer!'
                  : pct < 100
                  ? 'Almost there! Push through the final stretch!'
                  : '🏆 All tasks complete! Under 100 Rank incoming!'}
              </div>
            </div>

            {/* Sleep Mode Banner */}
            <SleepSection isOwner={isOwner} />

            {/* Current Activity */}
            <ActivitySection isOwner={isOwner} />

            {/* Subjects & Tasks (Fixed directly below progress bar!) */}
            <div className="section">
              <div className="section-static-header">
                <span className="section-title">📚 Subjects &amp; Tasks</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {completed}/{total} Tasks Done
                </span>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <SubjectsSection
                  subjects={tasksData?.subjects ?? []}
                  isOwner={isOwner}
                  onUpdate={fetchTasks}
                  loading={loading}
                />
              </div>
            </div>
          </section>

          {/* ── RIGHT COLUMN: Preparation Problems + Daily Reviews ── */}
          <aside className="panoramic-col col-right">
            {/* Preparation Problems (Fixed, not a dropdown) */}
            <div className="section">
              <div className="section-static-header">
                <span className="section-title">🐛 Preparation Problems</span>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <ProblemsSection isOwner={isOwner} />
              </div>
            </div>

            {/* Daily Reviews (Fixed below problems, with anchor for heatmap jumps) */}
            <div className="section" id="review-section-anchor">
              <div className="section-static-header">
                <span className="section-title">📝 Daily Reviews &amp; Health</span>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <ReviewSection isOwner={isOwner} />
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ── Stretched Heatmap (Full Screen Bottom Dock, Oct 28 - Feb 7) ──── */}
      <Heatmap isOwner={isOwner} />

      {/* ── Auth Modal ────────────────────────────── */}
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} />
      )}
    </div>
  );
}

/* ── Activity Badge (top bar) ─────────────────────────── */
function ActivityBadge() {
  const [activity, setActivity] = useState<string | null>(null);

  const updateFromData = (actData: any) => {
    if (actData?.activity) {
      const map: Record<string, string> = {
        studying: 'Studying',
        working_out: 'Working Out',
        taking_a_break: 'On Break',
        sleeping: 'Sleeping',
        eating: 'Eating',
        working: 'Working',
        other: 'Active',
      };
      setActivity(map[actData.activity] ?? actData.activity);
    } else {
      setActivity(null);
    }
  };

  useEffect(() => {
    fetch('/api/activity')
      .then((r) => r.json())
      .then((d) => updateFromData(d.activity))
      .catch(() => {});

    const onUpdate = (e: any) => {
      updateFromData(e.detail);
    };
    window.addEventListener('activity-updated', onUpdate);
    return () => window.removeEventListener('activity-updated', onUpdate);
  }, []);

  if (!activity) return null;

  return (
    <div className="activity-pill">
      <span className="activity-dot" />
      {activity}
    </div>
  );
}
