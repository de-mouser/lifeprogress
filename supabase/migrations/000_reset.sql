-- ============================================================
-- GATE TRACKER — Clean Reset Script
-- Run this BEFORE the main migration if you're getting
-- "already exists" errors from a previous partial run.
-- ============================================================

-- Drop all policies
DROP POLICY IF EXISTS "subjects_public_read" ON subjects;
DROP POLICY IF EXISTS "tasks_public_read" ON tasks;
DROP POLICY IF EXISTS "daily_periods_public_read" ON daily_periods;
DROP POLICY IF EXISTS "daily_goals_public_read" ON daily_goals;
DROP POLICY IF EXISTS "current_activity_public_read" ON current_activity;
DROP POLICY IF EXISTS "problems_public_read" ON problems;
DROP POLICY IF EXISTS "comments_public_read" ON problem_comments;
DROP POLICY IF EXISTS "game_plans_public_read" ON game_plans;
DROP POLICY IF EXISTS "visibility_public_read" ON visibility_settings;
DROP POLICY IF EXISTS "daily_reviews_public_read" ON daily_reviews;
DROP POLICY IF EXISTS "config_no_public_read" ON app_config;
DROP POLICY IF EXISTS "sleep_private" ON sleep_sessions;
DROP POLICY IF EXISTS "comments_public_insert" ON problem_comments;
DROP POLICY IF EXISTS "service_full_access_config" ON app_config;
DROP POLICY IF EXISTS "service_full_access_subjects" ON subjects;
DROP POLICY IF EXISTS "service_full_access_tasks" ON tasks;
DROP POLICY IF EXISTS "service_full_access_periods" ON daily_periods;
DROP POLICY IF EXISTS "service_full_access_goals" ON daily_goals;
DROP POLICY IF EXISTS "service_full_access_activity" ON current_activity;
DROP POLICY IF EXISTS "service_full_access_sleep" ON sleep_sessions;
DROP POLICY IF EXISTS "service_full_access_problems" ON problems;
DROP POLICY IF EXISTS "service_full_access_comments" ON problem_comments;
DROP POLICY IF EXISTS "service_full_access_plans" ON game_plans;
DROP POLICY IF EXISTS "service_full_access_reviews" ON daily_reviews;
DROP POLICY IF EXISTS "service_full_access_visibility" ON visibility_settings;

-- Drop all tables (order matters due to foreign keys)
DROP TABLE IF EXISTS problem_comments CASCADE;
DROP TABLE IF EXISTS problems CASCADE;
DROP TABLE IF EXISTS daily_goals CASCADE;
DROP TABLE IF EXISTS daily_periods CASCADE;
DROP TABLE IF EXISTS sleep_sessions CASCADE;
DROP TABLE IF EXISTS current_activity CASCADE;
DROP TABLE IF EXISTS daily_reviews CASCADE;
DROP TABLE IF EXISTS game_plans CASCADE;
DROP TABLE IF EXISTS visibility_settings CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS app_config CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS activity_type CASCADE;

-- Done! Now run 001_initial_schema.sql
