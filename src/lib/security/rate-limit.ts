/**
 * Simple in-memory rate limiter for API routes.
 * For production at scale, replace with Redis-backed solution (e.g. @upstash/ratelimit).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodically clean up expired entries to prevent memory leaks
const CLEANUP_INTERVAL = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const existing = store.get(key);

  if (!existing || now > existing.resetAt) {
    // New window
    const entry: RateLimitEntry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return { success: true, limit: config.limit, remaining: config.limit - 1, resetAt: entry.resetAt };
  }

  existing.count++;
  const remaining = Math.max(0, config.limit - existing.count);

  if (existing.count > config.limit) {
    return { success: false, limit: config.limit, remaining: 0, resetAt: existing.resetAt };
  }

  return { success: true, limit: config.limit, remaining, resetAt: existing.resetAt };
}

/**
 * Extract client identifier from request for rate limiting.
 * Uses X-Forwarded-For (for proxied environments) or falls back to a default.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  // Fallback — in serverless envs there may be no direct IP
  return "unknown";
}
