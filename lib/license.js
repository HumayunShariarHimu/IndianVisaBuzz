// License helpers retained for legacy clients. No fallback secret is permitted.
const crypto = require('crypto');
const PLANS = Object.freeze({
  '1': { name: 'trial', days: 7 },
  '2': { name: 'basic', days: 30 },
  '3': { name: 'pro', days: 365 },
  '4': { name: 'enterprise', days: 3650 },
  '5': { name: 'lifetime', days: null }
});
const PLACEHOLDER = /^CHANGE_ME/i;
const RANDOM_HEX_LENGTH = 24;

function licenseConfigured() {
  const value = process.env.LICENSE_SECRET || '';
  return Buffer.byteLength(value, 'utf8') >= 32 && !PLACEHOLDER.test(value);
}
function adminConfigured() {
  const value = process.env.ADMIN_SECRET || '';
  return Buffer.byteLength(value, 'utf8') >= 24 && !PLACEHOLDER.test(value);
}
function requireLicenseSecret() {
  if (!licenseConfigured()) throw new Error('license_service_not_configured');
  return process.env.LICENSE_SECRET;
}
function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function signature(payload) {
  return crypto.createHmac('sha256', requireLicenseSecret()).update(payload).digest('hex').toUpperCase();
}

function generateKey(planCode) {
  const plan = PLANS[String(planCode)];
  if (!plan) throw new Error('invalid_plan');
  const expiry = plan.days == null ? 0 : Math.floor(Date.now() / 1000) + plan.days * 86400;
  const random = crypto.randomBytes(RANDOM_HEX_LENGTH / 2).toString('hex').toUpperCase();
  const payload = String(planCode) + expiry.toString(36).toUpperCase() + random;
  const key = `IVB-${payload}-${signature(payload)}`;
  return { key, plan: plan.name, expiresAt: expiry === 0 ? null : expiry * 1000 };
}

function verifyKey(rawKey) {
  if (!rawKey || typeof rawKey !== 'string') return { valid: false, reason: 'missing_key' };
  if (rawKey.length > 160) return { valid: false, reason: 'malformed' };
  const key = rawKey.trim().toUpperCase();
  const match = key.match(/^IVB-([1-9])([A-Z0-9]+?)([A-F0-9]{24})-([A-F0-9]{64})$/);
  if (!match) return { valid: false, reason: 'malformed' };
  const [, planCode, expiryB36, random, suppliedSignature] = match;
  const plan = PLANS[planCode];
  if (!plan) return { valid: false, reason: 'invalid_key' };
  const payload = planCode + expiryB36 + random;
  if (!safeEqual(signature(payload), suppliedSignature)) return { valid: false, reason: 'invalid_key' };
  const expirySec = parseInt(expiryB36, 36);
  if (!Number.isFinite(expirySec)) return { valid: false, reason: 'malformed' };
  if (expirySec !== 0 && Math.floor(Date.now() / 1000) > expirySec) return { valid: false, reason: 'expired' };
  return { valid: true, plan: plan.name, expiresAt: expirySec === 0 ? null : expirySec * 1000 };
}

function checkAdmin(candidate) {
  if (!adminConfigured() || typeof candidate !== 'string' || candidate.length === 0) return false;
  return safeEqual(candidate, process.env.ADMIN_SECRET);
}

module.exports = { generateKey, verifyKey, checkAdmin, licenseConfigured, adminConfigured, PLANS };
