import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/heatmap - get sprint activity grid from Oct 28, 2026 to Feb 7, 2027
export async function GET() {
  // Query periods from Supabase
  const { data: periods } = await supabase
    .from('daily_periods')
    .select('id, period_date')
    .eq('is_published', true)
    .order('period_date');

  const { data: goals } = await supabase
    .from('daily_goals')
    .select('period_id, is_completed');

  const { data: reviews } = await supabase
    .from('daily_reviews')
    .select('id, review_date, mood, what_went_well, what_to_improve, tomorrow_plan, sleep_time, wake_time, energy_level, exercise');

  const goalsByPeriod = new Map<string, { total: number; completed: number }>();
  for (const goal of goals ?? []) {
    const existing = goalsByPeriod.get(goal.period_id) ?? { total: 0, completed: 0 };
    goalsByPeriod.set(goal.period_id, {
      total: existing.total + 1,
      completed: existing.completed + (goal.is_completed ? 1 : 0),
    });
  }

  const periodByDate = new Map<string, string>();
  for (const p of periods ?? []) {
    periodByDate.set(p.period_date, p.id);
  }

  const reviewByDate = new Map<string, any>();
  for (const r of reviews ?? []) {
    reviewByDate.set(r.review_date, r);
  }

  // Exactly October 28, 2026 to February 7, 2027
  const startDate = new Date('2026-10-28T00:00:00');
  const endDate = new Date('2027-02-07T00:00:00');

  const days: {
    date: string;
    total: number;
    completed: number;
    percentage: number;
    hasData: boolean;
    hasReview: boolean;
    review: any | null;
  }[] = [];

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toLocaleDateString('en-CA');
    const periodId = periodByDate.get(dateStr);
    const stats = periodId ? goalsByPeriod.get(periodId) : undefined;
    const hasData = !!stats && stats.total > 0;
    const total = stats?.total ?? 0;
    const completed = stats?.completed ?? 0;
    const percentage = hasData ? Math.round((completed / total) * 100) : 0;
    const review = reviewByDate.get(dateStr) ?? null;

    days.push({
      date: dateStr,
      total,
      completed,
      percentage,
      hasData,
      hasReview: !!review,
      review,
    });
  }

  return NextResponse.json({ heatmap: days, startDate: '2026-10-28', endDate: '2027-02-07' });
}
