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

  // Circumference for ring
  const r = 68;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="page-wrapper">
      {/* ── Top Bar ─────────────────────────────────── */}
      <header className="top-bar">
        <div className="top-bar-inner">
          <span className="site-title">GATE Preparation</span>
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

      <main className="container">
        {/* ── Hero ──────────────────────────────────── */}
        <section className="hero">
          <div className="hero-subtitle">Personal tracker · GATE CS 2025</div>
          <div className="hero-goal">🎯 Under 100 Rank</div>

          {/* Ring progress */}
          <div className="progress-center">
            <div className="progress-ring-wrapper">
              <svg className="progress-ring" width="160" height="160" viewBox="0 0 160 160">
                <circle className="progress-ring-bg" cx="80" cy="80" r={r} />
                <circle
                  className="progress-ring-fill"
                  cx="80"
                  cy="80"
                  r={r}
                  strokeDasharray={circ}
                  strokeDashoffset={loading ? circ : offset}
                />
              </svg>
              <div className="progress-ring-text">
                <div className="progress-pct">{pct}%</div>
                <div className="progress-label">Overall</div>
              </div>
            </div>

            <div className="progress-stats">
              <div className="stat-item">
                <div className="stat-value">{completed}</div>
                <div className="stat-label">Done</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{total - completed}</div>
                <div className="stat-label">Left</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">12</div>
                <div className="stat-label">Subjects</div>
              </div>
            </div>

            <p className="progress-message">
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
            </p>
          </div>
        </section>

        {/* ── Sleep Mode Banner ─────────────────────── */}
        <SleepSection isOwner={isOwner} />

        {/* ── Current Activity ──────────────────────── */}
        <ActivitySection isOwner={isOwner} />

        {/* ── Daily Goals ───────────────────────────── */}
        <CollapsibleSection title="Today's Goals" defaultOpen={true}>
          <DailyGoals isOwner={isOwner} />
        </CollapsibleSection>

        {/* ── Subjects & Tasks ──────────────────────── */}
        <CollapsibleSection title="Subjects & Tasks" defaultOpen={true}>
          <SubjectsSection
            subjects={tasksData?.subjects ?? []}
            isOwner={isOwner}
            onUpdate={fetchTasks}
            loading={loading}
          />
        </CollapsibleSection>

        {/* ── Activity Heatmap ──────────────────────── */}
        <CollapsibleSection title="Activity Heatmap" defaultOpen={false}>
          <Heatmap />
        </CollapsibleSection>

        {/* ── Game Plan ─────────────────────────────── */}
        <CollapsibleSection title="Weekly / Monthly Plan" defaultOpen={false}>
          <GamePlanSection isOwner={isOwner} />
        </CollapsibleSection>

        {/* ── Daily Reviews ─────────────────────────── */}
        <CollapsibleSection title="Daily Reviews" defaultOpen={false}>
          <ReviewSection isOwner={isOwner} />
        </CollapsibleSection>

        {/* ── Preparation Problems ──────────────────── */}
        <CollapsibleSection title="Preparation Problems" defaultOpen={false}>
          <ProblemsSection isOwner={isOwner} />
        </CollapsibleSection>
      </main>

      {/* ── Auth Modal ────────────────────────────── */}
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} />
      )}
    </div>
  );
}

/* ── Collapsible Section Wrapper ─────────────────────── */
function CollapsibleSection({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="section">
      <button
        className="section-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="section-title">{title}</span>
        <span className={`section-toggle ${open ? 'open' : ''}`}>▼</span>
      </button>
      {open && <div className="section-content">{children}</div>}
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
