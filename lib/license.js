// lib/license.js
const crypto = require('crypto');

const SECRET       = process.env.LICENSE_SECRET || 'CHANGE_ME_LICENSE_SECRET';
const ADMIN_SECRET = process.env.ADMIN_SECRET   || 'CHANGE_ME_ADMIN_SECRET';

// Plan codes — extend this map freely, old keys keep working.
// code → { name, days }  (days = null means never expires)
const PLANS = {
  '1': { name: 'trial',      days: 7     },
  '2': { name: 'basic',      days: 30    },
  '3': { name: 'pro',        days: 365   },
  '4': { name: 'enterprise', days: 3650  },
  '5': { name: 'lifetime',   days: null  },
};

function _sig(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 8).toUpperCase();
}

/**
 * Generate a license key. Format:  IVB-{plan}{expiryBase36}{random8}-{sig8}
 * Example: IVB-3M9Z2K4A7F3B1C-4D7E9A02
 */
function generateKey(planCode) {
  const plan = PLANS[String(planCode)];
  if (!plan) throw new Error('Invalid plan code: ' + planCode);
  const expiry  = plan.days == null ? 0 : Math.floor(Date.now() / 1000) + plan.days * 86400;
  const random  = crypto.randomBytes(4).toString('hex'); // 8 hex chars
  const payload = String(planCode) + expiry.toString(36) + random;
  const sig     = _sig(payload);
  const key     = ('IVB-' + payload + '-' + sig).toUpperCase();
  return {
    key,
    plan: plan.name,
    expiresAt: expiry === 0 ? null : expiry * 1000,
  };
}

/**
 * Verify a key. Returns { valid, plan?, expiresAt?, reason? }
 * Reasons: missing_key | invalid_key | expired | malformed
 */
function verifyKey(rawKey) {
  if (!rawKey || typeof rawKey !== 'string') return { valid: false, reason: 'missing_key' };
  const key = rawKey.trim().toUpperCase();

  // IVB - {planCode}{expiryB36}{random8} - {sig8}
  const m = key.match(/^IVB-([1-9])([A-Z0-9]+)([A-F0-9]{8})-([A-F0-9]{8})$/);
  if (!m) return { valid: false, reason: 'malformed' };

  const [, planCode, expiryB36, random, sig] = m;
  const plan = PLANS[planCode];
  if (!plan) return { valid: false, reason: 'invalid_key' };

  const payload  = planCode + expiryB36 + random;
  const expected = _sig(payload);
  if (sig !== expected) return { valid: false, reason: 'invalid_key' };

  const expirySec = parseInt(expiryB36, 36);
  const nowSec    = Math.floor(Date.now() / 1000);

  // expiry 0 = lifetime
  if (expirySec !== 0 && nowSec > expirySec) {
    return { valid: false, reason: 'expired' };
  }

  return {
    valid: true,
    plan: plan.name,
    expiresAt: expirySec === 0 ? null : expirySec * 1000,
  };
}

function checkAdmin(secret) {
  return typeof secret === 'string' && secret.length > 0 && secret === ADMIN_SECRET;
}

module.exports = { generateKey, verifyKey, checkAdmin, PLANS };
