const { verifyKey, licenseConfigured } = require('../lib/license');
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
  if (req.method !== 'POST') return res.status(405).json({ valid: false, reason: 'method_not_allowed' });

  const rate = checkRateLimit(req, 'verify', 60);
  if (!rate.allowed) {
    res.setHeader('Retry-After', String(rate.retryAfter));
    return res.status(429).json({ valid: false, reason: 'rate_limited', retryAfter: rate.retryAfter });
  }
  if (!licenseConfigured()) return res.status(503).json({ valid: false, reason: 'license_service_not_configured' });

  try {
    const { key } = req.body || {};
    return res.status(200).json(verifyKey(key));
  } catch (error) {
    if (error.message === 'license_service_not_configured') return res.status(503).json({ valid: false, reason: 'license_service_not_configured' });
    console.error('verify error:', error.message);
    return res.status(500).json({ valid: false, reason: 'server_error' });
  }
};
