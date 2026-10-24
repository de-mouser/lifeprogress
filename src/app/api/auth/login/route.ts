import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getRateLimitKey } from '@/lib/auth';

export async function POST(req: NextRequest) {
  // Rate limit: 5 attempts per 10 min, 15 min lockout
  const key = `auth:${getRateLimitKey(req)}`;
  const rl = checkRateLimit(key, 5, 10 * 60 * 1000, 15 * 60 * 1000);
  if (!rl.allowed) {
    const waitMin = Math.ceil(((rl.lockedUntil ?? Date.now()) - Date.now()) / 60000);
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${waitMin} minute(s).` },
      { status: 429 }
    );
  }

  let phrase: string;
  try {
    const body = await req.json();
    phrase = body.phrase;
    if (!phrase || typeof phrase !== 'string' || phrase.length > 200) {
      return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // Fetch the stored hash from app_config (server-side only)
  const { data: config } = await supabaseAdmin
    .from('app_config')
    .select('owner_secret_hash')
    .single();

  if (!config?.owner_secret_hash) {
    return NextResponse.json({ error: 'System not configured.' }, { status: 503 });
  }

  // Timing-safe bcrypt compare
  const isValid = await bcrypt.compare(phrase, config.owner_secret_hash);

  if (!isValid) {
    // Generic error - don't reveal why it failed
    return NextResponse.json({ error: 'Incorrect access phrase.' }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  session.isOwner = true;
  session.loginTime = Date.now();
  await session.save();

  return res;
}
