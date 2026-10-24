'use client';

import { useState, useEffect, useCallback } from 'react';

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
  is_approved: boolean;
}

interface Problem {
  id: string;
  title: string;
  description: string;
  subject_tag: string;
  is_solved: boolean;
  created_at: string;
  comments: Comment[];
}

const SUBJECTS = [
  'Operating Systems', 'Computer Organization & Architecture',
  'Theory of Computation', 'Compiler Design', 'General Aptitude',
  'Engineering Mathematics', 'Discrete Mathematics',
  'Programming & Data Structures', 'Algorithms', 'Digital Logic',
  'Computer Networks', 'Database Management Systems', 'General',
];

export default function ProblemsSection({ isOwner }: { isOwner: boolean }) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add problem form
  const [showAddProblem, setShowAddProblem] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSubject, setNewSubject] = useState('General');
  const [addingProblem, setAddingProblem] = useState(false);

  // Comment form (per problem)
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [commentAuthor, setCommentAuthor] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);

  const fetchProblems = useCallback(async () => {
    try {
      const res = await fetch('/api/problems');
      const data = await res.json();
      setProblems(data.problems ?? []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const addProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !isOwner) return;
    setAddingProblem(true);
    try {
      await fetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          subjectTag: newSubject,
        }),
      });
      setNewTitle('');
      setNewDesc('');
      setNewSubject('General');
      setShowAddProblem(false);
      await fetchProblems();
    } catch {}
    setAddingProblem(false);
  };

  const markSolved = async (problemId: string, solved: boolean) => {
    if (!isOwner) return;
    try {
      await fetch(`/api/problems?id=${problemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSolved: !solved }),
      });
      await fetchProblems();
    } catch {}
  };

  const submitComment = async (problemId: string) => {
    const text = commentText[problemId]?.trim();
    const author = commentAuthor[problemId]?.trim() || 'Anonymous';
    if (!text) return;
    setSubmittingComment(problemId);
    try {
      await fetch(`/api/problems?id=${problemId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, authorName: author }),
      });
      setCommentText((prev) => ({ ...prev, [problemId]: '' }));
      setCommentAuthor((prev) => ({ ...prev, [problemId]: '' }));
      await fetchProblems();
    } catch {}
    setSubmittingComment(null);
  };

  const approveComment = async (commentId: string) => {
    if (!isOwner) return;
    try {
      await fetch(`/api/problems?commentId=${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approveComment: true }),
      });
      await fetchProblems();
    } catch {}
  };

  const deleteComment = async (commentId: string) => {
    if (!isOwner) return;
    try {
      await fetch(`/api/problems?commentId=${commentId}`, { method: 'DELETE' });
      await fetchProblems();
    } catch {}
  };

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '8px 0' }}>Loading…</div>;
  }

  return (
    <div style={{ paddingBottom: 16 }}>
      {problems.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic', padding: '8px 0' }}>
          No preparation problems posted yet.
        </div>
      )}

      {/* Problem list */}
      {problems.map((problem) => {
        const isExpanded = expandedId === problem.id;
        const approvedComments = problem.comments.filter((c) => c.is_approved);
        const pendingComments = problem.comments.filter((c) => !c.is_approved);

        return (
          <div
            key={problem.id}
            id={`problem-${problem.id}`}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              marginBottom: 8,
              overflow: 'hidden',
            }}
          >
            {/* Problem header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '12px 16px',
                cursor: 'pointer',
              }}
              onClick={() => setExpandedId(isExpanded ? null : problem.id)}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: problem.is_solved ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: problem.is_solved ? 'line-through' : 'none',
                    }}
                  >
                    {problem.title}
                  </span>
                  {problem.is_solved && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: '1px 8px',
                        background: 'var(--success-dim)',
                        color: 'var(--success)',
                        borderRadius: 12,
                      }}
                    >
                      Solved ✓
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '1px 8px',
                      background: 'var(--accent-glow)',
                      color: 'var(--accent-bright)',
                      borderRadius: 12,
                    }}
                  >
                    {problem.subject_tag}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {approvedComments.length} suggestion{approvedComments.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 12, transition: 'transform 0.18s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▼</span>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
                {problem.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
                    {problem.description}
                  </p>
                )}

                {/* Owner actions */}
                {isOwner && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: 12, padding: '4px 10px' }}
                      onClick={() => markSolved(problem.id, problem.is_solved)}
                    >
                      {problem.is_solved ? '↩ Mark Unsolved' : '✓ Mark Solved'}
                    </button>
                  </div>
                )}

                {/* Approved comments */}
                {approvedComments.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Suggestions ({approvedComments.length})
                    </div>
                    {approvedComments.map((c) => (
                      <div
                        key={c.id}
                        id={`comment-${c.id}`}
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border)',
                          borderLeft: '2px solid var(--accent-dim)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 12px',
                          marginBottom: 4,
                        }}
                      >
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>
                          {c.author_name} ·{' '}
                          {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          {isOwner && (
                            <button
                              className="icon-btn danger"
                              style={{ marginLeft: 8 }}
                              onClick={() => deleteComment(c.id)}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.content}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pending comments (owner only) */}
                {isOwner && pendingComments.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--warning)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Pending Approval ({pendingComments.length})
                    </div>
                    {pendingComments.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border)',
                          borderLeft: '2px solid var(--warning)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 12px',
                          marginBottom: 4,
                          opacity: 0.8,
                        }}
                      >
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {c.author_name}
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: 11, padding: '2px 8px' }}
                            onClick={() => approveComment(c.id)}
                          >
                            ✓ Approve
                          </button>
                          <button
                            className="icon-btn danger"
                            onClick={() => deleteComment(c.id)}
                          >
                            ✕
                          </button>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{c.content}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Submit comment (public) */}
                {!problem.is_solved && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Suggest a solution (public):
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <input
                        type="text"
                        className="input"
                        placeholder="Your name (optional)"
                        value={commentAuthor[problem.id] ?? ''}
                        onChange={(e) =>
                          setCommentAuthor((prev) => ({ ...prev, [problem.id]: e.target.value }))
                        }
                      />
                      <textarea
                        className="input"
                        style={{ minHeight: 72, resize: 'vertical' }}
                        placeholder="Write your suggestion or approach…"
                        value={commentText[problem.id] ?? ''}
                        onChange={(e) =>
                          setCommentText((prev) => ({ ...prev, [problem.id]: e.target.value }))
                        }
                      />
                      <button
                        id={`submit-comment-${problem.id}`}
                        className="btn btn-secondary"
                        style={{ alignSelf: 'flex-start', fontSize: 12 }}
                        onClick={() => submitComment(problem.id)}
                        disabled={submittingComment === problem.id || !commentText[problem.id]?.trim()}
                      >
                        {submittingComment === problem.id ? '…' : 'Submit Suggestion'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add problem (owner) */}
      {isOwner && (
        <div style={{ marginTop: 12 }}>
          {!showAddProblem ? (
            <button
              id="add-problem-btn"
              className="btn btn-ghost"
              style={{ fontSize: 12, padding: '5px 12px' }}
              onClick={() => setShowAddProblem(true)}
            >
              + Add preparation problem
            </button>
          ) : (
            <form
              onSubmit={addProblem}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <input
                type="text"
                className="input"
                placeholder="Problem title…"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
                required
              />
              <textarea
                className="input"
                style={{ minHeight: 80, resize: 'vertical' }}
                placeholder="Describe the problem (optional)…"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
              <select
                className="input"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  id="submit-problem-btn"
                  type="submit"
                  className="btn btn-primary"
                  disabled={addingProblem || !newTitle.trim()}
                >
                  {addingProblem ? '…' : 'Post Problem'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowAddProblem(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
