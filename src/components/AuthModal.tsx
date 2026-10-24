'use client';

import { useState } from 'react';

interface AuthModalProps {
  onClose: () => void;
  onLogin: (isOwner: boolean) => void;
}

export default function AuthModal({ onClose, onLogin }: AuthModalProps) {
  const [phrase, setPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phrase.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phrase: phrase.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        onLogin(true);
      } else {
        setError(data.error || 'Incorrect access phrase.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box" role="dialog" aria-modal="true" aria-label="Owner login">
        <h2 className="modal-title">Owner Access</h2>
        <p className="modal-sub">
          Enter your secret phrase to unlock editing.
        </p>

        <form className="modal-form" onSubmit={handleSubmit}>
          <input
            id="owner-phrase-input"
            type="password"
            className="input"
            placeholder="Enter access phrase…"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            autoFocus
            autoComplete="off"
            disabled={loading}
          />

          {error && <div className="modal-error">{error}</div>}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              id="auth-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={loading || !phrase.trim()}
              style={{ flex: 1 }}
            >
              {loading ? <span className="spin">⟳</span> : 'Unlock'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
