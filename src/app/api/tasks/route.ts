import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// GET /api/tasks - public read of all subjects + tasks
export async function GET() {
  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('id, name, display_order')
    .order('display_order');

  if (subjectsError) {
    return NextResponse.json({ error: 'Failed to load subjects' }, { status: 500 });
  }

  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, subject_id, task_order, label, is_completed, completed_at');

  if (tasksError) {
    return NextResponse.json({ error: 'Failed to load tasks' }, { status: 500 });
  }

  // Build response
  const subjectsWithTasks = subjects?.map(s => {
    const subjectTasks = (tasks ?? [])
      .filter(t => t.subject_id === s.id)
      .sort((a, b) => a.task_order - b.task_order);
    const completed = subjectTasks.filter(t => t.is_completed).length;
    return {
      ...s,
      tasks: subjectTasks,
      completed,
      total: subjectTasks.length,
      percentage: subjectTasks.length > 0 ? Math.round((completed / subjectTasks.length) * 100) : 0,
    };
  }) ?? [];

  const totalCompleted = (tasks ?? []).filter(t => t.is_completed).length;
  const totalTasks = (tasks ?? []).length;

  return NextResponse.json({
    subjects: subjectsWithTasks,
    totalCompleted,
    totalTasks,
    overallPercentage: totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0,
  });
}

// PATCH /api/tasks - toggle task completion (owner only)
export async function PATCH(req: NextRequest) {
  const res = NextResponse.json({});
  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  if (!session.isOwner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { taskId, isCompleted } = body;

  if (!taskId || typeof isCompleted !== 'boolean') {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('tasks')
    .update({
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  if (error) {
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
