const { generateKey, checkAdmin, adminConfigured, licenseConfigured, PLANS } = require('../lib/license');
const { checkRateLimit } = require('../lib/rate-limit');

module.exports = async (req, res) => {
  const appOrigin = process.env.APP_ORIGIN;
  const origin = req.headers && req.headers.origin;
  if (appOrigin && origin === appOrigin) {
    res.setHeader('Access-Control-Allow-Origin', appOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.status(appOrigin && origin === appOrigin ? 204 : 403).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const rate = checkRateLimit(req, 'generate', 10);
  if (!rate.allowed) {
    res.setHeader('Retry-After', String(rate.retryAfter));
    return res.status(429).json({ error: 'rate_limited', retryAfter: rate.retryAfter });
  }
  if (!licenseConfigured() || !adminConfigured()) return res.status(503).json({ error: 'license_service_not_configured' });

  try {
    const { adminSecret, plan, count } = req.body || {};
    if (!checkAdmin(adminSecret)) return res.status(401).json({ error: 'unauthorized' });
    const n = Math.max(1, Math.min(50, parseInt(count, 10) || 1));
    const keys = Array.from({ length: n }, () => generateKey(plan));
    return res.status(200).json({ keys, plans: PLANS });
  } catch (error) {
    if (error.message === 'license_service_not_configured') return res.status(503).json({ error: 'license_service_not_configured' });
    console.error('generate error:', error.message);
    return res.status(400).json({ error: 'invalid_request' });
  }
};
