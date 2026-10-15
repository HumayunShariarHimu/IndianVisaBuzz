const test = require('node:test');
const assert = require('node:assert/strict');
const { checkRateLimit, resetRateLimits, WINDOW_MS } = require('../lib/rate-limit.js');

test('limits a client in a fixed window, then resets after the window', () => {
  resetRateLimits();
  const req = { headers: { 'x-real-ip': '192.0.2.1' } };
  assert.equal(checkRateLimit(req, 'verify', 2, 1000).allowed, true);
  assert.equal(checkRateLimit(req, 'verify', 2, 1001).remaining, 0);
  const limited = checkRateLimit(req, 'verify', 2, 1002);
  assert.equal(limited.allowed, false);
  assert.equal(limited.retryAfter, 60);
  assert.equal(checkRateLimit(req, 'verify', 2, 1000 + WINDOW_MS).allowed, true);
});

test('separates scopes and client IPs', () => {
  resetRateLimits();
  assert.equal(checkRateLimit({ headers: { 'x-real-ip': '192.0.2.1' } }, 'verify', 1, 5000).allowed, true);
  assert.equal(checkRateLimit({ headers: { 'x-real-ip': '192.0.2.2' } }, 'verify', 1, 5000).allowed, true);
  assert.equal(checkRateLimit({ headers: { 'x-real-ip': '192.0.2.1' } }, 'generate', 1, 5000).allowed, true);
});
