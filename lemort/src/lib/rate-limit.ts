/**
 * Simple in-memory rate limiter.
 *
 * Works within a single server process / Netlify function instance.
 * Good enough for v1 — upgrade to Upstash Redis if multi-instance abuse
 * becomes a concern post-launch.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Prune stale buckets every 5 minutes to prevent memory growth
setInterval(() => {
  const now = Date.now();
  buckets.forEach((bucket, key) => {
    if (now > bucket.resetAt) buckets.delete(key);
  });
}, 5 * 60 * 1000);

/**
 * Returns true if the request is allowed, false if rate-limited.
 *
 * @param key      Unique key, e.g. `search:${ip}` or `watch:${ip}`
 * @param limit    Max requests per window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count++;
  return true;
}

/**
 * Extract the real client IP from a Next.js request,
 * falling back through common proxy headers.
 */
export function getIp(req: Request): string {
  const headers = req instanceof Request ? req.headers : (req as { headers: Headers }).headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
