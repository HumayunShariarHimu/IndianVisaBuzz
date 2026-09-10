// api/verify.js
const { verifyKey } = require('../lib/license');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ valid: false, reason: 'method_not_allowed' });

  try {
    const { key } = req.body || {};
    const result = verifyKey(key);
    return res.status(200).json(result);
  } catch (err) {
    console.error('verify error:', err);
    return res.status(500).json({ valid: false, reason: 'server_error' });
  }
};
