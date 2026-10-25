import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/heatmap - get 365-day activity grid for heatmap
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

  // Generate 52 full weeks (364 days) ending today in Asia/Kolkata
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const today = new Date(todayStr + 'T00:00:00');

  const days: {
    date: string;
    total: number;
    completed: number;
    percentage: number;
    hasData: boolean;
  }[] = [];

  for (let i = 363; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toLocaleDateString('en-CA');
    const periodId = periodByDate.get(dateStr);
    const stats = periodId ? goalsByPeriod.get(periodId) : undefined;
    const hasData = !!stats && stats.total > 0;
    const total = stats?.total ?? 0;
    const completed = stats?.completed ?? 0;
    const percentage = hasData ? Math.round((completed / total) * 100) : 0;

    days.push({
      date: dateStr,
      total,
      completed,
      percentage,
      hasData,
    });
  }

  return NextResponse.json({ heatmap: days });
}
