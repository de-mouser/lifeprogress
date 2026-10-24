import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/sleep — owner only
export async function GET(req: NextRequest) {
  const res = NextResponse.json({});
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.isOwner) return NextResponse.json({ isOwner: false, activeSession: null });

  const { data: activeSession } = await supabaseAdmin
    .from('sleep_sessions')
    .select('*')
    .eq('is_active', true)
    .single();

  const { data: recentSessions } = await supabaseAdmin
    .from('sleep_sessions')
    .select('*')
    .eq('is_active', false)
    .order('started_at', { ascending: false })
    .limit(7);

  return NextResponse.json({ isOwner: true, activeSession, recentSessions: recentSessions ?? [] });
}

// POST /api/sleep — { action: 'start', notes? } | { action: 'end', sessionId }
export async function POST(req: NextRequest) {
  const resAuth = NextResponse.json({});
  const session = await getIronSession<SessionData>(req, resAuth, sessionOptions);
  if (!session.isOwner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action, notes, sessionId } = body;

  if (action === 'start') {
    // Prevent duplicate active sessions
    const { data: existing } = await supabaseAdmin
      .from('sleep_sessions')
      .select('id')
      .eq('is_active', true)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Sleep session already active.' }, { status: 409 });
    }

    const now = new Date().toISOString();

    // Set activity to sleeping
    await supabaseAdmin.from('current_activity').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseAdmin.from('current_activity').insert({
      activity: 'sleeping',
      description: notes || 'Sleep mode',
      is_public: true,
      started_at: now,
    });

    const { data: sleepSession, error } = await supabaseAdmin
      .from('sleep_sessions')
      .insert({ started_at: now, is_active: true, notes: notes || null })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to start sleep session.' }, { status: 500 });
    return NextResponse.json({ success: true, session: sleepSession });
  }

  if (action === 'end') {
    const { data: activeSession } = await supabaseAdmin
      .from('sleep_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('is_active', true)
      .single();

    if (!activeSession) {
      return NextResponse.json({ error: 'No active session found.' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const durationMinutes = Math.round(
      (new Date(now).getTime() - new Date(activeSession.started_at).getTime()) / 60000
    );

    const { error } = await supabaseAdmin
      .from('sleep_sessions')
      .update({
        ended_at: now,
        duration_minutes: durationMinutes,
        is_active: false,
        updated_at: now,
      })
      .eq('id', sessionId);

    if (error) return NextResponse.json({ error: 'Failed to end sleep session.' }, { status: 500 });

    // Clear sleeping activity
    await supabaseAdmin.from('current_activity').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseAdmin.from('current_activity').insert({
      activity: 'other',
      description: 'Just woke up ☀️',
      is_public: true,
      started_at: now,
    });

    return NextResponse.json({
      success: true,
      durationMinutes,
      durationFormatted: `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`,
    });
  }

  return NextResponse.json({ error: 'Invalid action. Use start or end.' }, { status: 400 });
}
