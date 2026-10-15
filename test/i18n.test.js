const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
const catalogSource = fs.readFileSync(path.join(root, 'public/i18n.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(catalogSource, sandbox);
const catalog = sandbox.window.IVB_I18N;

function decodeEntities(value) {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function normalize(value) {
  return decodeEntities(value).replace(/\s+/g, ' ').trim();
}

function staticTextNodes() {
  return [...html.matchAll(/>([^<>]+)</g)].map(match => normalize(match[1])).filter(Boolean);
}

test('translation catalog has equivalent Bengali and English dynamic messages', () => {
  assert.equal(catalog.defaultLanguage, 'bn');
  assert.deepEqual(Object.keys(catalog.messages.bn).sort(), Object.keys(catalog.messages.en).sort());
  for (const [key, phrase] of Object.entries(catalog.copy)) {
    assert.ok(phrase.bn, `missing Bengali copy for ${key}`);
    assert.ok(phrase.en, `missing English copy for ${key}`);
  }
});

test('every Bengali text node in the page has both localized versions', () => {
  const missing = staticTextNodes().filter(text => /[\u0980-\u09ff]/.test(text) && !catalog.copy[text]);
  assert.deepEqual(missing, []);
});

test('Bengali copy keeps only standard acronyms, product/source names, and file formats in English', () => {
  const allowed = new Set(['indianvisabuzz', 'ivac', 'pdf', 'nid', 'otp', 'captcha', 'hci', 'chrome', 'zip', 'kb', 'v3', 'bangladesh', 'dhaka', 'slot', 'buddy']);
  const strings = [
    ...Object.values(catalog.copy).map(phrase => phrase.bn),
    ...Object.values(catalog.messages.bn).filter(value => typeof value === 'string')
  ];
  const unapproved = [];
  for (const original of strings) {
    const text = original
      .replace(/\{[^}]+\}/g, ' ')
      .replace(/appointment\.ivacbd\.com|name@example\.com|chrome:\/\/extensions|Indian Visa Online|IVAC Bangladesh|HCI Dhaka|Slot Buddy|Load unpacked|Manifest V3/gi, ' ')
      .replace(/IndianVisaBuzz/gi, ' ');
    const words = [...text.matchAll(/[A-Za-z]+/g)].map(match => match[0].toLowerCase()).filter(word => !allowed.has(word));
    if (words.length) unapproved.push(`${original} [${words.join(', ')}]`);
  }
  assert.deepEqual(unapproved, []);
});

test('Bengali view does not leave untranslated English UI phrases', () => {
  const technicalNames = new Set(['IndianVisaBuzz', 'PDF', 'IVAC', 'OTP', 'CAPTCHA', 'NID', 'HCI', 'ZIP', 'KB', 'Manifest V3', 'chrome://extensions', 'extension']);
  const missing = staticTextNodes().filter(text => {
    if (!/[A-Za-z]{3}/.test(text) || catalog.copy[text] || technicalNames.has(text)) return false;
    if (/^\d+(?:%|:\d+|\.\d+)?$/.test(text)) return false;
    if (/^[\d\s/.,:;•·–—-]+(?:PDF|KB|%)?$/.test(text)) return false;
    return true;
  });
  assert.deepEqual(missing, []);
});

test('language preference and stable portal option values are implemented', () => {
  assert.match(html, /data-language="bn"/);
  assert.match(html, /data-language="en"/);
  assert.match(app, /ivb\.language\.v1/);
  assert.match(app, /document\.documentElement\.lang = language/);
  for (const value of ['Tourist', 'Medical', 'Business', 'Student', 'Employment', 'Other', 'Dhaka', 'Chattogram', 'Rajshahi', 'Sylhet', 'Khulna']) {
    assert.match(html, new RegExp(`<option value="${value}">`));
  }
});

test('Bengali accessibility labels have English translations', () => {
  const attributes = [...html.matchAll(/\b(?:aria-label|aria-description|placeholder|title|alt)="([^"]+)"/g)].map(match => normalize(match[1]));
  const missing = attributes.filter(text => /[\u0980-\u09ff]/.test(text) && !catalog.attributes[text] && !catalog.copy[text]);
  assert.deepEqual(missing, []);
});
