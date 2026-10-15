const test = require('node:test');
const assert = require('node:assert/strict');
const manifest = require('../extension/manifest.json');

test('extension scripts and permissions are restricted to exact official portal origins', () => {
  const allowed = [
    'https://appointment.ivacbd.com/*',
    'https://indianvisaonline.gov.in/*'
  ];
  assert.deepEqual(manifest.host_permissions, allowed);
  assert.deepEqual(manifest.content_scripts[0].matches, allowed);
  assert.ok(manifest.host_permissions.every(pattern => !pattern.includes('*.')));
  assert.ok(!manifest.permissions.includes('scripting'));
  assert.ok(manifest.background.service_worker === 'background.js');
});
