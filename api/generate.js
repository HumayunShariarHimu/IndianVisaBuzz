// api/generate.js
const { generateKey, checkAdmin, PLANS } = require('../lib/license');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'method_not_allowed' });

  try {
    const { adminSecret, plan, count } = req.body || {};
    if (!checkAdmin(adminSecret)) return res.status(401).json({ error: 'unauthorized' });

    const n = Math.max(1, Math.min(50, parseInt(count, 10) || 1));
    const keys = [];
    for (let i = 0; i < n; i++) keys.push(generateKey(plan));

    return res.status(200).json({ keys, plans: PLANS });
  } catch (err) {
    console.error('generate error:', err);
    return res.status(400).json({ error: err.message });
  }
};
