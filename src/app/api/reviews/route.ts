import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/reviews — public read (viewable by anyone clicking heatmap or viewing log)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get('date');

  let query = supabaseAdmin
    .from('daily_reviews')
    .select('id, review_date, mood, what_went_well, what_to_improve, tomorrow_plan, sleep_time, wake_time, created_at')
    .order('review_date', { ascending: false });

  if (dateParam) {
    query = query.eq('review_date', dateParam);
  } else {
    query = query.limit(150);
  }

  const { data: reviews, error } = await query;

  if (error) return NextResponse.json({ reviews: [] });
  return NextResponse.json({ reviews: reviews ?? [] });
}

// POST /api/reviews — create or update review for a date (owner only)
export async function POST(req: NextRequest) {
  const resAuth = NextResponse.json({});
  const session = await getIronSession<SessionData>(req, resAuth, sessionOptions);
  if (!session.isOwner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { mood, whatWentWell, whatToImprove, tomorrowPlan, sleepTime, wakeTime, reviewDate } = body;

  if (!whatWentWell?.trim()) {
    return NextResponse.json({ error: '"What went well" is required.' }, { status: 400 });
  }
  if (mood && (mood < 1 || mood > 5)) {
    return NextResponse.json({ error: 'Mood must be 1–5.' }, { status: 400 });
  }

  const todayKolkata = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const targetDate = reviewDate || todayKolkata;

  const { data: review, error } = await supabaseAdmin
    .from('daily_reviews')
    .upsert(
      {
        review_date: targetDate,
        mood: mood ?? 3,
        what_went_well: whatWentWell.trim(),
        what_to_improve: whatToImprove?.trim() || '',
        tomorrow_plan: tomorrowPlan?.trim() || '',
        sleep_time: sleepTime?.trim() || null,
        wake_time: wakeTime?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'review_date' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to save review: ' + error.message }, { status: 500 });
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
