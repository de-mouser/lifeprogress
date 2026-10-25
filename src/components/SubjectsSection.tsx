'use client';

import { useState, useCallback } from 'react';

interface Task {
  id: string;
  task_order: number;
  label: string;
  is_completed: boolean;
}

interface Subject {
  id: string;
  name: string;
  display_order: number;
  tasks: Task[];
  completed: number;
  total: number;
  percentage: number;
}

interface SubjectsSectionProps {
  subjects: Subject[];
  isOwner: boolean;
  onUpdate: () => void;
  loading: boolean;
}

const SUBJECT_ICONS: Record<string, string> = {
  'Operating Systems': 'OS',
  'Computer Organization & Architecture': 'COA',
  'Computer Organisation & Architecture': 'COA',
  'Theory of Computation': 'TOC',
  'Compiler Design': 'CD',
  'General Aptitude': 'APT',
  'Aptitude & Reasoning': 'APT',
  'Engineering Mathematics': 'EM',
  'Discrete Mathematics': 'DM',
  'Programming & Data Structures': 'PDS',
  'Algorithms': 'ALG',
  'Digital Logic': 'DL',
  'Computer Networks': 'CN',
  'Database Management Systems': 'DBMS',
};

function getAbbr(name: string): string {
  return SUBJECT_ICONS[name] ?? name.slice(0, 3).toUpperCase();
}

export default function SubjectsSection({
  subjects,
  isOwner,
  onUpdate,
  loading,
}: SubjectsSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const toggleTask = useCallback(
    async (taskId: string, currentValue: boolean) => {
      if (!isOwner || toggling) return;
      setToggling(taskId);
      try {
        await fetch('/api/tasks', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, isCompleted: !currentValue }),
        });
        onUpdate();
      } catch {}
      setToggling(null);
    },
    [isOwner, toggling, onUpdate]
  );

  if (loading) {
    return (
      <div className="subjects-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="subject-row"
            style={{
              height: 64,
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
      </div>
    );
  }

  if (!subjects.length) {
    return (
      <p style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '16px 0' }}>
        No subjects found. Make sure you've run the database migration and seeded data.
      </p>
    );
  }

  return (
    <div className="subjects-grid">
      {subjects.map((subject) => {
        const isExpanded = expandedId === subject.id;
        return (
          <div key={subject.id} className="subject-row">
            {/* Subject header row */}
            <div
              className="subject-header"
              onClick={() => setExpandedId(isExpanded ? null : subject.id)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              id={`subject-${subject.id}`}
            >
              <span className="subject-number">{String(subject.display_order).padStart(2, '0')}</span>

              <div className="subject-info">
                <div className="subject-name">{subject.name}</div>
                <div className="subject-meta">
                  {subject.completed}/{subject.total} tasks
                </div>
              </div>

              <div className="subject-bar-wrapper">
                <div className="subject-mini-bar">
                  <div
                    className="subject-mini-fill"
                    style={{ width: `${subject.percentage}%` }}
                  />
                </div>
                <div className="subject-pct">{subject.percentage}%</div>
              </div>

              <span className={`subject-chevron ${isExpanded ? 'open' : ''}`}>▼</span>
            </div>

            {/* Task list (expanded) */}
            {isExpanded && (
              <div className="task-list">
                {subject.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="task-item"
                    id={`task-${task.id}`}
                  >
                    <span className="task-number">{task.task_order}.</span>
                    <input
                      type="checkbox"
                      className="task-checkbox"
                      checked={task.is_completed}
                      disabled={!isOwner || toggling === task.id}
                      onChange={() => toggleTask(task.id, task.is_completed)}
                      id={`checkbox-${task.id}`}
                      aria-label={task.label}
                    />
                    <label
                      htmlFor={`checkbox-${task.id}`}
                      className={`task-label ${task.is_completed ? 'completed' : ''}`}
                      style={{ cursor: isOwner ? 'pointer' : 'default' }}
                    >
                      {task.label}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
