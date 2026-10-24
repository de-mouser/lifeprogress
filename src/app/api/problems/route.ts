import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getRateLimitKey } from '@/lib/auth';

// GET /api/problems — returns all published problems with comments
export async function GET(req: NextRequest) {
  const res = NextResponse.json({});
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  const isOwner = session.isOwner === true;

  const client = isOwner ? supabaseAdmin : supabase;

  const { data: problems, error } = await client
    .from('problems')
    .select('*, problem_comments(*)')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to load problems' }, { status: 500 });
  }

  // Normalize comments: public only sees approved, owner sees all
  const normalized = (problems ?? []).map((p: any) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    subject_tag: p.subject_tag,
    is_solved: p.is_solved,
    created_at: p.created_at,
    comments: (p.problem_comments ?? [])
      .filter((c: any) => isOwner || c.is_approved)
      .map((c: any) => ({
        id: c.id,
        author_name: c.author_name || 'Anonymous',
        content: c.content,
        created_at: c.created_at,
        is_approved: c.is_approved,
      })),
  }));

  return NextResponse.json({ problems: normalized });
}

// POST /api/problems — owner creates problem
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const problemId = searchParams.get('id');

  if (problemId) {
    // Public submits a comment on a problem
    const key = `comments:${getRateLimitKey(req)}`;
    const rl = checkRateLimit(key, 5, 10 * 60 * 1000, 30 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many submissions. Please wait.' }, { status: 429 });
    }

    const body = await req.json();
    const { content, authorName } = body;
    if (!content || typeof content !== 'string' || content.trim().length < 3) {
      return NextResponse.json({ error: 'Content too short' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const ipHash = Buffer.from(ip).toString('base64');

    const { error } = await supabaseAdmin.from('problem_comments').insert({
      problem_id: problemId,
      content: content.trim().slice(0, 2000),
      author_name: authorName?.trim().slice(0, 50) || 'Anonymous',
      ip_hash: ipHash,
      is_approved: false,
    });

    if (error) return NextResponse.json({ error: 'Failed to submit comment' }, { status: 500 });
    return NextResponse.json({ success: true, message: 'Submitted for review.' });
  }

  // Owner creates problem
  const resAuth = NextResponse.json({});
  const session = await getIronSession<SessionData>(req, resAuth, sessionOptions);
  if (!session.isOwner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { title, description, subjectTag } = body;
  if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 });

  const { data: problem, error } = await supabaseAdmin
    .from('problems')
    .insert({
      title: title.trim(),
      description: description?.trim() || '',
      subject_tag: subjectTag || 'General',
      is_solved: false,
      is_published: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to create problem' }, { status: 500 });
  return NextResponse.json({ problem });
}

// PATCH /api/problems?id=<problemId> — mark solved/unsolved (owner)
//       /api/problems?commentId=<id> — approve comment (owner)
export async function PATCH(req: NextRequest) {
  const resAuth = NextResponse.json({});
  const session = await getIronSession<SessionData>(req, resAuth, sessionOptions);
  if (!session.isOwner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const problemId = searchParams.get('id');
  const commentId = searchParams.get('commentId');
  const body = await req.json();

  if (commentId && body.approveComment) {
    await supabaseAdmin
      .from('problem_comments')
      .update({ is_approved: true, updated_at: new Date().toISOString() })
      .eq('id', commentId);
    return NextResponse.json({ success: true });
  }

  if (problemId && body.isSolved !== undefined) {
    await supabaseAdmin
      .from('problems')
      .update({ is_solved: body.isSolved, updated_at: new Date().toISOString() })
      .eq('id', problemId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}

// DELETE /api/problems?id=<problemId> — delete problem (owner)
//        /api/problems?commentId=<id> — delete comment (owner)
export async function DELETE(req: NextRequest) {
  const resAuth = NextResponse.json({});
  const session = await getIronSession<SessionData>(req, resAuth, sessionOptions);
  if (!session.isOwner) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const problemId = searchParams.get('id');
  const commentId = searchParams.get('commentId');

  if (commentId) {
    await supabaseAdmin.from('problem_comments').delete().eq('id', commentId);
    return NextResponse.json({ success: true });
  }

  if (problemId) {
    await supabaseAdmin.from('problems').update({ is_published: false }).eq('id', problemId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Missing id or commentId' }, { status: 400 });
}
