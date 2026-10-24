import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/heatmap - get daily goal completion data for heatmap
export async function GET() {
  // Get all daily periods with their goal completion
  const { data: periods } = await supabase
    .from('daily_periods')
    .select('id, period_date')
    .eq('is_published', true)
    .order('period_date');

  if (!periods || periods.length === 0) {
    return NextResponse.json({ heatmap: [] });
  }

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

  const heatmap = periods.map(p => {
    const stats = goalsByPeriod.get(p.id);
    return {
      date: p.period_date,
      total: stats?.total ?? 0,
      completed: stats?.completed ?? 0,
      percentage: stats && stats.total > 0
        ? Math.round((stats.completed / stats.total) * 100)
        : 0,
      hasData: !!stats,
    };
  });

  return NextResponse.json({ heatmap });
}
