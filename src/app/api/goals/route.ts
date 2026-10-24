import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';
import { supabase, supabaseAdmin } from '@/lib/supabase';

function getTodayInKolkata(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

// GET /api/goals?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || getTodayInKolkata();

  // Get or create period for date
  const { data: period } = await supabase
    .from('daily_periods')
    .select('id, period_date, is_published')
    .eq('period_date', date)
    .single();

  if (!period) {
    return NextResponse.json({ period: null, goals: [], date });
  }

  const { data: goals } = await supabase
    .from('daily_goals')
    .select('*')
    .eq('period_id', period.id)
    .order('display_order');

  const completedCount = (goals ?? []).filter(g => g.is_completed).length;
  const totalCount = (goals ?? []).length;

  return NextResponse.json({
    period,
    goals: goals ?? [],
    date,
    completedCount,
    totalCount,
    completionPercentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
  });
}

// POST /api/goals - add a goal (owner only)
export async function POST(req: NextRequest) {
  const res = NextResponse.json({});
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.isOwner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { content, targetHours, targetQuestions, date } = body;
  const goalDate = date || getTodayInKolkata();

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'Goal content required' }, { status: 400 });
  }

  // Get or create period
  let period;
  const { data: existing } = await supabaseAdmin
    .from('daily_periods')
    .select('id')
    .eq('period_date', goalDate)
    .single();

  if (existing) {
    period = existing;
  } else {
    const { data: created } = await supabaseAdmin
      .from('daily_periods')
      .insert({ period_date: goalDate, is_published: true })
      .select('id')
      .single();
    period = created;
  }

  if (!period) return NextResponse.json({ error: 'Could not create period' }, { status: 500 });

  // Get next display order
  const { count } = await supabaseAdmin
    .from('daily_goals')
    .select('*', { count: 'exact', head: true })
    .eq('period_id', period.id);

  const { data: goal, error } = await supabaseAdmin
    .from('daily_goals')
    .insert({
      period_id: period.id,
      content: content.trim(),
      display_order: (count ?? 0),
      target_hours: targetHours || null,
      target_questions: targetQuestions || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });

  return NextResponse.json({ goal });
}

// PATCH /api/goals - update a goal (owner only)
export async function PATCH(req: NextRequest) {
  const res = NextResponse.json({});
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.isOwner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, goalId, isCompleted, content, displayOrder } = body;
  const targetId = id ?? goalId;

  if (!targetId) return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof isCompleted === 'boolean') {
    updates.is_completed = isCompleted;
    updates.completed_at = isCompleted ? new Date().toISOString() : null;
  }
  if (content !== undefined) updates.content = content.trim();
  if (displayOrder !== undefined) updates.display_order = displayOrder;

  const { error } = await supabaseAdmin.from('daily_goals').update(updates).eq('id', targetId);
  if (error) return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });

  return NextResponse.json({ success: true });
}

// DELETE /api/goals?id=xxx (owner only)
export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({});
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.isOwner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });

  const { error } = await supabaseAdmin.from('daily_goals').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });

  return NextResponse.json({ success: true });
}
