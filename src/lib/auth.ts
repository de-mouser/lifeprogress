import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from './session';

// Rate limiting store (in-memory, replace with Redis for multi-instance)
const rateLimitStore = new Map<string, { count: number; resetAt: number; lockedUntil?: number }>();

export function getRateLimitKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}

export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
  lockoutMs: number
): { allowed: boolean; lockedUntil?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (record) {
    if (record.lockedUntil && now < record.lockedUntil) {
      return { allowed: false, lockedUntil: record.lockedUntil };
    }
    if (now > record.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true };
    }
    if (record.count >= maxAttempts) {
      const lockedUntil = now + lockoutMs;
      rateLimitStore.set(key, { ...record, lockedUntil });
      return { allowed: false, lockedUntil };
    }
    rateLimitStore.set(key, { ...record, count: record.count + 1 });
    return { allowed: true };
  }

  rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
  return { allowed: true };
}

export async function getSession(req: NextRequest, res: NextResponse) {
  return getIronSession<SessionData>(req, res, sessionOptions);
}

export function isOwnerAuthenticated(session: SessionData): boolean {
  return session.isOwner === true && !!session.loginTime;
}
