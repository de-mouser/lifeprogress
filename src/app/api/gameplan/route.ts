import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// GET /api/gameplan — returns all plans (public)
export async function GET() {
  const { data: plans, error } = await supabase
    .from('game_plans')
    .select('id, plan_type, title, content, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ plans: [] });
  return NextResponse.json({ plans: plans ?? [] });
}

// POST /api/gameplan — owner creates plan
export async function POST(req: NextRequest) {
  const resAuth = NextResponse.json({});
  const session = await getIronSession<SessionData>(req, resAuth, sessionOptions);
  if (!session.isOwner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { title, content, planType } = body;

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'Title and content are required.' }, { status: 400 });
  }
  if (!['weekly', 'monthly'].includes(planType)) {
    return NextResponse.json({ error: 'Plan type must be weekly or monthly.' }, { status: 400 });
  }

  const { data: plan, error } = await supabaseAdmin
    .from('game_plans')
    .insert({
      plan_type: planType,
      title: title.trim(),
      content: content.trim(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to save plan.' }, { status: 500 });
  return NextResponse.json({ plan });
}

// PATCH /api/gameplan?id=<id> — owner updates plan
export async function PATCH(req: NextRequest) {
  const resAuth = NextResponse.json({});
  const session = await getIronSession<SessionData>(req, resAuth, sessionOptions);
  if (!session.isOwner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const body = await req.json();
  const { title, content } = body;

  const { data: plan, error } = await supabaseAdmin
    .from('game_plans')
    .update({
      title: title?.trim(),
      content: content?.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to update plan.' }, { status: 500 });
  return NextResponse.json({ plan });
}

// DELETE /api/gameplan?id=<id> — owner deletes plan
export async function DELETE(req: NextRequest) {
  const resAuth = NextResponse.json({});
  const session = await getIronSession<SessionData>(req, resAuth, sessionOptions);
  if (!session.isOwner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await supabaseAdmin.from('game_plans').delete().eq('id', id);
  return NextResponse.json({ success: true });
}
