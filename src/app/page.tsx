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

  // Video game level & rank title
  const currentLevel = Math.min(10, Math.floor(pct / 10) + 1);
  const rankTitle =
    pct === 100
      ? '🏆 AIR < 100 ELITE'
      : pct >= 80
      ? '⚡ GATE TOPPER'
      : pct >= 60
      ? '⚔️ SYLLABUS SLAYER'
      : pct >= 40
      ? '🔥 CONCEPT GRINDER'
      : pct >= 20
      ? '🛡️ APPRENTICE SCHOLAR'
      : '🔰 RECRUIT CADET';

  const nextMilestone =
    pct < 25 ? 25 : pct < 50 ? 50 : pct < 75 ? 75 : pct < 100 ? 100 : 100;

  return (
    <div className="page-wrapper">
      {/* ── Top Bar ─────────────────────────────────── */}
      <header className="top-bar">
        <div className="top-bar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="site-title">GATE CS 2027</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 4,
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                letterSpacing: '0.05em',
              }}
            >
              MISSION 100
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

      <main className="container">
        {/* ── Hero & Video Game Progress HUD ────────────── */}
        <section className="hero" style={{ paddingBottom: 16 }}>
          <div className="hero-subtitle">Personal tracker · GATE CS 2027</div>
          <div className="hero-goal">🎯 Under 100 Rank</div>

          {/* 🎮 Video Game Horizontal XP Progress Bar HUD */}
          <div className="game-progress-wrapper" role="region" aria-label="GATE CS 2027 XP Bar">
            <div className="game-hud-top">
              <div className="game-rank-badge">
                <span className="game-rank-icon">⚡</span>
                <span>LVL {currentLevel} · {rankTitle}</span>
              </div>
              <div className="game-xp-counter">
                <span>EXP: {completed} / {total} TASKS</span>
                <span className="game-xp-pct">{pct}%</span>
              </div>
            </div>

            {/* Main Long Horizontal Bar */}
            <div className="game-bar-track">
              <div
                className="game-bar-fill"
                style={{ width: `${loading ? 0 : Math.max(2, pct)}%` }}
              />
            </div>

            {/* Milestones / Notches */}
            <div className="game-notches-row">
              <div className="game-notch-item">
                <div className={`game-notch-point ${pct >= 0 ? 'active' : ''}`} />
                <span>0% Start</span>
              </div>
              <div className="game-notch-item">
                <div className={`game-notch-point ${pct >= 25 ? 'active' : ''}`} />
                <span>25% Core</span>
              </div>
              <div className="game-notch-item">
                <div className={`game-notch-point ${pct >= 50 ? 'active' : ''}`} />
                <span>50% Mid</span>
              </div>
              <div className="game-notch-item">
                <div className={`game-notch-point ${pct >= 75 ? 'active' : ''}`} />
                <span>75% Master</span>
              </div>
              <div className="game-notch-item">
                <div className={`game-notch-point ${pct >= 100 ? 'active' : ''}`} />
                <span>100% Rank &lt;100</span>
              </div>
            </div>

            {/* HUD Stats */}
            <div className="game-hud-stats">
              <div className="game-hud-stat-box">
                <div className="game-hud-stat-val" style={{ color: '#10b981' }}>{completed}</div>
                <div className="game-hud-stat-lbl">Tasks Done</div>
              </div>
              <div className="game-hud-stat-box">
                <div className="game-hud-stat-val" style={{ color: '#38bdf8' }}>{total - completed}</div>
                <div className="game-hud-stat-lbl">Tasks Remaining</div>
              </div>
              <div className="game-hud-stat-box">
                <div className="game-hud-stat-val" style={{ color: '#a855f7' }}>12</div>
                <div className="game-hud-stat-lbl">GATE Subjects</div>
              </div>
            </div>

            {/* Quest motivational message */}
            <div className="game-quest-status">
              {pct === 100
                ? '🏆 Quest Complete! Full syllabus conquered. Under 100 Rank unlocked!'
                : `⚔️ CURRENT QUEST: Clear PYQs, lectures & revision modules. Next milestone at ${nextMilestone}%.`}
            </div>
          </div>
        </section>

        {/* ── Sleep Mode Banner ─────────────────────── */}
        <SleepSection isOwner={isOwner} />

        {/* ── Current Activity ──────────────────────── */}
        <ActivitySection isOwner={isOwner} />

        {/* ── Subjects & Tasks (Fixed directly below progress bar!) ──────── */}
        <div className="section" style={{ marginBottom: 24 }}>
          <div className="section-static-header">
            <span className="section-title">📚 Subjects &amp; Tasks (72 Tasks · 12 Subjects)</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {completed}/{total} Completed ({pct}%)
            </span>
          </div>
          <div style={{ padding: '16px 18px' }}>
            <SubjectsSection
              subjects={tasksData?.subjects ?? []}
              isOwner={isOwner}
              onUpdate={fetchTasks}
              loading={loading}
            />
          </div>
        </div>

        {/* ── Dashboard Two-Column Grid ────────────────────────── */}
        <div className="dashboard-grid">
          {/* Left Column: Today's Goals + Weekly/Monthly Plan */}
          <div className="dashboard-col dashboard-left">
            {/* Today's Goals */}
            <CollapsibleSection title="🎯 Today's Goals" defaultOpen={true}>
              <DailyGoals isOwner={isOwner} />
            </CollapsibleSection>

            {/* Weekly / Monthly Plan */}
            <CollapsibleSection title="📋 Weekly / Monthly Game Plan" defaultOpen={true}>
              <GamePlanSection isOwner={isOwner} />
            </CollapsibleSection>
          </div>

          {/* Right Column: Preparation Problems + Daily Reviews */}
          <div className="dashboard-col dashboard-right">
            {/* Preparation Problems (Fixed, not a dropdown!) */}
            <div className="section">
              <div className="section-static-header">
                <span className="section-title">🐛 Preparation Problems</span>
              </div>
              <div style={{ padding: '16px 18px' }}>
                <ProblemsSection isOwner={isOwner} />
              </div>
            </div>

            {/* Daily Reviews (Fixed below problems, with anchor for heatmap jumps) */}
            <div className="section" id="review-section-anchor">
              <div className="section-static-header">
                <span className="section-title">📝 Daily Reviews &amp; Sleep Tracker</span>
              </div>
              <div style={{ padding: '16px 18px' }}>
                <ReviewSection isOwner={isOwner} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Fixed Bottom Heatmap Dock (Oct 28 - Feb 7) ───────────────── */}
      <Heatmap isOwner={isOwner} />

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
