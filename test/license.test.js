const test = require('node:test');
const assert = require('node:assert/strict');
const { generateKey, verifyKey, checkAdmin, licenseConfigured, adminConfigured } = require('../lib/license.js');

test('license endpoints fail closed when environment secrets are missing', () => {
  const previousLicense = process.env.LICENSE_SECRET;
  const previousAdmin = process.env.ADMIN_SECRET;
  delete process.env.LICENSE_SECRET;
  delete process.env.ADMIN_SECRET;
  try {
    assert.equal(licenseConfigured(), false);
    assert.equal(adminConfigured(), false);
    assert.throws(() => generateKey('1'), /license_service_not_configured/);
    assert.equal(checkAdmin('CHANGE_ME_ADMIN_SECRET'), false);
  } finally {
    if (previousLicense === undefined) delete process.env.LICENSE_SECRET;
    else process.env.LICENSE_SECRET = previousLicense;
    if (previousAdmin === undefined) delete process.env.ADMIN_SECRET;
    else process.env.ADMIN_SECRET = previousAdmin;
  }
});

test('generated license uses a full SHA-256 HMAC, strong nonce, and verifies', () => {
  const previousLicense = process.env.LICENSE_SECRET;
  const previousAdmin = process.env.ADMIN_SECRET;
  process.env.LICENSE_SECRET = 'test-license-secret-that-is-long-enough-123456';
  process.env.ADMIN_SECRET = 'test-admin-secret-that-is-long-enough-123';
  try {
    const generated = generateKey('1');
    assert.equal(generated.key.split('-').at(-1).length, 64);
    assert.equal(verifyKey(generated.key).valid, true);
    const segments = generated.key.split('-');
    const signature = segments.pop();
    segments.push(`${signature[0] === 'A' ? 'B' : 'A'}${signature.slice(1)}`);
    assert.equal(verifyKey(segments.join('-')).valid, false);
    assert.notEqual(generateKey('1').key, generated.key);
    assert.equal(checkAdmin(process.env.ADMIN_SECRET), true);
    assert.equal(checkAdmin('wrong-secret'), false);
    assert.equal(verifyKey('IVB-legacy-short-signature').valid, false);
  } finally {
    if (previousLicense === undefined) delete process.env.LICENSE_SECRET;
    else process.env.LICENSE_SECRET = previousLicense;
    if (previousAdmin === undefined) delete process.env.ADMIN_SECRET;
    else process.env.ADMIN_SECRET = previousAdmin;
  }
});
