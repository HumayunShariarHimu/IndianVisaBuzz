// scripts/gen-key.js — usage: node scripts/gen-key.js <planCode> [count]
require('dotenv').config();
const { generateKey, PLANS } = require('../lib/license');

const planCode = process.argv[2] || '3';
const count    = parseInt(process.argv[3], 10) || 1;

console.log('\n📋 Available plans:');
Object.entries(PLANS).forEach(([code, p]) => {
  console.log(`  ${code}  →  ${p.name.padEnd(12)} ${p.days == null ? '(never expires)' : p.days + ' days'}`);
});

console.log('\n🔑 Generated keys:\n');
for (let i = 0; i < count; i++) {
  const { key, plan, expiresAt } = generateKey(planCode);
  console.log(`  ${key}`);
  console.log(`    plan: ${plan}  ·  expires: ${expiresAt ? new Date(expiresAt).toISOString() : 'never'}\n`);
}
