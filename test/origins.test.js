const test = require('node:test');
const assert = require('node:assert/strict');
const { isAllowedPortalUrl } = require('../extension/origins.js');

test('allows only exact HTTPS official portal hosts', () => {
  assert.equal(isAllowedPortalUrl('https://appointment.ivacbd.com/'), true);
  assert.equal(isAllowedPortalUrl('https://indianvisaonline.gov.in/'), true);
  assert.equal(isAllowedPortalUrl('http://appointment.ivacbd.com/'), false);
  assert.equal(isAllowedPortalUrl('https://evil.appointment.ivacbd.com/'), false);
  assert.equal(isAllowedPortalUrl('https://attacker-ivacbd.com/'), false);
  assert.equal(isAllowedPortalUrl('not-a-url'), false);
});
