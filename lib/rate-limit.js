const WINDOW_MS = 60 * 1000;
const buckets = globalThis.__ivbRateLimitBuckets || new Map();
globalThis.__ivbRateLimitBuckets = buckets;

function clientKey(req) {
  const headers = req && req.headers ? req.headers : {};
  const direct = headers['x-real-ip'];
  const forwarded = headers['x-forwarded-for'];
  const ip = direct || (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') || 'unknown';
  return String(ip).slice(0, 128);
}

function checkRateLimit(req, scope, limit, now = Date.now()) {
  const key = `${scope}:${clientKey(req)}`;
  const previous = buckets.get(key);
  if (!previous || now - previous.start >= WINDOW_MS) {
    buckets.set(key, { start: now, count: 1 });
    if (buckets.size > 10000) {
      for (const [entry, bucket] of buckets) {
        if (now - bucket.start >= WINDOW_MS) buckets.delete(entry);
      }
    }
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }
  if (previous.count >= limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.max(1, Math.ceil((WINDOW_MS - (now - previous.start)) / 1000)) };
  }
  previous.count += 1;
  return { allowed: true, remaining: limit - previous.count, retryAfter: 0 };
}

function resetRateLimits() {
  buckets.clear();
}

module.exports = { checkRateLimit, resetRateLimits, WINDOW_MS };
