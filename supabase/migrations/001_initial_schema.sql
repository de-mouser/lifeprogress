-- ============================================================
-- GATE TRACKER - Supabase PostgreSQL Schema v2
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- APP CONFIG
-- ============================================================
CREATE TABLE IF NOT EXISTS app_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deployment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_year INTEGER NOT NULL DEFAULT 2027,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  owner_secret_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SUBJECTS (12 GATE subjects)
-- ============================================================
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT subjects_display_order_unique UNIQUE (display_order)
);

-- ============================================================
-- TASKS (6 per subject = 72 total)
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  task_order INTEGER NOT NULL,
  label TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tasks_unique_per_subject UNIQUE (subject_id, task_order)
);

-- ============================================================
-- DAILY GOAL PERIODS
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_date DATE NOT NULL UNIQUE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DAILY GOALS
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_id UUID NOT NULL REFERENCES daily_periods(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  target_hours DECIMAL(4,1),
  target_questions INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CURRENT ACTIVITY
-- ============================================================
DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM (
    'studying', 'working_out', 'taking_a_break', 'sleeping', 'eating', 'working', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS current_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity activity_type NOT NULL DEFAULT 'other',
  description TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  planned_duration_minutes INTEGER,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SLEEP SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS sleep_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one active sleep session allowed
CREATE UNIQUE INDEX IF NOT EXISTS sleep_sessions_active_unique
  ON sleep_sessions (is_active)
  WHERE is_active = TRUE;

-- ============================================================
-- PREPARATION PROBLEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  subject_tag TEXT NOT NULL DEFAULT 'General',
  is_solved BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PROBLEM COMMENTS (public suggestions)
-- ============================================================
CREATE TABLE IF NOT EXISTS problem_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'Anonymous',
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- GAME PLANS (weekly / monthly)
-- ============================================================
CREATE TABLE IF NOT EXISTS game_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('weekly', 'monthly')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DAILY REVIEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_date DATE NOT NULL UNIQUE,
  mood INTEGER NOT NULL DEFAULT 3 CHECK (mood BETWEEN 1 AND 5),
  what_went_well TEXT NOT NULL DEFAULT '',
  what_to_improve TEXT NOT NULL DEFAULT '',
  tomorrow_plan TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VISIBILITY SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS visibility_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  show_activity BOOLEAN NOT NULL DEFAULT TRUE,
  show_daily_goals BOOLEAN NOT NULL DEFAULT TRUE,
  show_heatmap BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE visibility_settings ENABLE ROW LEVEL SECURITY;

-- Public READ policies
CREATE POLICY "subjects_public_read" ON subjects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "tasks_public_read" ON tasks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "daily_periods_public_read" ON daily_periods FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "daily_goals_public_read" ON daily_goals FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "current_activity_public_read" ON current_activity FOR SELECT TO anon, authenticated USING (is_public = true);
CREATE POLICY "problems_public_read" ON problems FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "comments_public_read" ON problem_comments FOR SELECT TO anon, authenticated USING (is_approved = true);
CREATE POLICY "game_plans_public_read" ON game_plans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "visibility_public_read" ON visibility_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "daily_reviews_public_read" ON daily_reviews FOR SELECT TO anon, authenticated USING (true);

-- App config: no public read (contains secret hash)
CREATE POLICY "config_no_public_read" ON app_config FOR SELECT TO anon USING (false);

-- Sleep sessions: completely private
CREATE POLICY "sleep_private" ON sleep_sessions FOR SELECT TO anon USING (false);

-- Public comment INSERT (rate-limited in app layer)
CREATE POLICY "comments_public_insert" ON problem_comments FOR INSERT TO anon, authenticated
  WITH CHECK (is_approved = false);

-- Service role has full access to all tables
CREATE POLICY "service_full_access_config" ON app_config TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_access_subjects" ON subjects TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_access_tasks" ON tasks TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_access_periods" ON daily_periods TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_access_goals" ON daily_goals TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_access_activity" ON current_activity TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_access_sleep" ON sleep_sessions TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_access_problems" ON problems TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_access_comments" ON problem_comments TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_access_plans" ON game_plans TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_access_reviews" ON daily_reviews TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_full_access_visibility" ON visibility_settings TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- SEED DATA
-- ============================================================

-- 12 GATE CS Subjects
INSERT INTO subjects (name, display_order) VALUES
  ('Operating Systems', 1),
  ('Computer Organisation & Architecture', 2),
  ('Theory of Computation', 3),
  ('Compiler Design', 4),
  ('Aptitude & Reasoning', 5),
  ('Engineering Mathematics', 6),
  ('Discrete Mathematics', 7),
  ('Programming & Data Structures', 8),
  ('Algorithms', 9),
  ('Digital Logic', 10),
  ('Computer Networks', 11),
  ('Database Management Systems', 12)
ON CONFLICT DO NOTHING;

-- 6 tasks per subject (same tasks for every subject)
INSERT INTO tasks (subject_id, task_order, label)
SELECT
  s.id,
  t.task_order,
  t.label
FROM subjects s
CROSS JOIN (VALUES
  (1, 'Complete video lectures'),
  (2, 'Complete Previous Year Questions (PYQs)'),
  (3, 'Revise the subject'),
  (4, 'Reattempt PYQs'),
  (5, 'Complete part tests'),
  (6, 'Complete full-length tests')
) AS t(task_order, label)
ON CONFLICT DO NOTHING;

-- Default visibility settings
INSERT INTO visibility_settings (show_activity, show_daily_goals, show_heatmap)
VALUES (true, true, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- IMPORTANT: Insert app_config with your bcrypt hash.
-- Run this AFTER generating your hash (see README for steps):
--
-- Step 1 — Generate hash in Supabase SQL Editor:
--   SELECT crypt('UNDER100RANK', gen_salt('bf', 12));
--
-- Step 2 — Copy the hash and insert:
--   INSERT INTO app_config (deployment_date, target_year, timezone, owner_secret_hash)
--   VALUES (CURRENT_DATE, 2025, 'Asia/Kolkata', '<PASTE_HASH_HERE>');
-- ============================================================
