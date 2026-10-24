import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/reviews — owner: full list; public: empty (private)
export async function GET(req: NextRequest) {
  const res = NextResponse.json({});
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.isOwner) return NextResponse.json({ reviews: [] });

  const { data: reviews, error } = await supabaseAdmin
    .from('daily_reviews')
    .select('id, review_date, mood, what_went_well, what_to_improve, tomorrow_plan, created_at')
    .order('review_date', { ascending: false })
    .limit(60);

  if (error) return NextResponse.json({ reviews: [] });
  return NextResponse.json({ reviews: reviews ?? [] });
}

// POST /api/reviews — create review for today (owner only)
export async function POST(req: NextRequest) {
  const resAuth = NextResponse.json({});
  const session = await getIronSession<SessionData>(req, resAuth, sessionOptions);
  if (!session.isOwner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { mood, whatWentWell, whatToImprove, tomorrowPlan } = body;

  if (!whatWentWell?.trim()) {
    return NextResponse.json({ error: '"What went well" is required.' }, { status: 400 });
  }
  if (mood < 1 || mood > 5) {
    return NextResponse.json({ error: 'Mood must be 1–5.' }, { status: 400 });
  }

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  const { data: review, error } = await supabaseAdmin
    .from('daily_reviews')
    .upsert(
      {
        review_date: today,
        mood: mood ?? 3,
        what_went_well: whatWentWell.trim(),
        what_to_improve: whatToImprove?.trim() || '',
        tomorrow_plan: tomorrowPlan?.trim() || '',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'review_date' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to save review.' }, { status: 500 });
  return NextResponse.json({ review });
}

// DELETE /api/reviews?id=<id> — owner only
export async function DELETE(req: NextRequest) {
  const resAuth = NextResponse.json({});
  const session = await getIronSession<SessionData>(req, resAuth, sessionOptions);
  if (!session.isOwner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await supabaseAdmin.from('daily_reviews').delete().eq('id', id);
  return NextResponse.json({ success: true });
}
