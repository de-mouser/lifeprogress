import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// GET /api/activity - public read
export async function GET() {
  const { data: settings } = await supabase
    .from('visibility_settings')
    .select('show_activity')
    .single();

  if (!settings?.show_activity) {
    return NextResponse.json({ activity: null });
  }

  const { data: activity } = await supabase
    .from('current_activity')
    .select('activity, description, started_at, planned_duration_minutes')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({ activity });
}

// POST /api/activity - set activity (owner only)
export async function POST(req: NextRequest) {
  const res = NextResponse.json({});
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.isOwner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { activity, description, plannedDurationMinutes, isPublic } = body;

  const validActivities = ['studying', 'working_out', 'taking_a_break', 'sleeping', 'eating', 'working', 'other'];
  if (!activity || !validActivities.includes(activity)) {
    return NextResponse.json({ error: 'Invalid activity' }, { status: 400 });
  }

  // Delete previous entries (keep it simple - only one active)
  await supabaseAdmin.from('current_activity').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const { data, error } = await supabaseAdmin
    .from('current_activity')
    .insert({
      activity,
      description: description || null,
      planned_duration_minutes: plannedDurationMinutes || null,
      is_public: isPublic !== false,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 });

  return NextResponse.json({ activity: data });
}
