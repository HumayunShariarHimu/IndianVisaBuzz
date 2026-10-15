const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'extension/content.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'extension/manifest.json'), 'utf8'));
const testableSource = source.replace('  const $ = id => document.getElementById(id);', '  globalThis.__testCopy = COPY;\n  const $ = id => document.getElementById(id);');
const context = {
  window: { __visaBuzzLoaded: false },
  VisaBuzzFiles: {},
  chrome: { runtime: { onMessage: { addListener() {} } }, storage: { local: { get() {}, set() {}, remove() {} } } }
};
vm.runInNewContext(testableSource, context);
const copy = context.__testCopy;

test('extension widget exposes Bengali/English choices and remembers the locale', () => {
  assert.match(source, /data-language="bn"/);
  assert.match(source, /data-language="en"/);
  assert.match(source, /const LANGUAGE_KEY = 'ivbLanguageV1'/);
  assert.match(source, /chrome\.storage\.local\.set\(\{ \[LANGUAGE_KEY\]: language \}\)/);
  assert.match(manifest.version, /^2\.1\.0$/);
});

test('every extension UI translation key exists in both locale dictionaries', () => {
  const keys = new Set([...source.matchAll(/\b([A-Za-z][A-Za-z0-9]*):/g)].map(match => match[1]));
  const used = new Set();
  for (const match of source.matchAll(/data-i18n="([A-Za-z][A-Za-z0-9]*)"/g)) used.add(match[1]);
  for (const match of source.matchAll(/data-i18n-aria="([A-Za-z][A-Za-z0-9]*)"/g)) used.add(match[1]);
  for (const match of source.matchAll(/\bstatus\('([A-Za-z][A-Za-z0-9]*)'/g)) used.add(match[1]);
  for (const match of source.matchAll(/\bt\('([A-Za-z][A-Za-z0-9]*)'/g)) used.add(match[1]);
  const fieldLabelBlock = source.match(/const fieldLabels = \{([^}]+)\}/)?.[1] || '';
  for (const match of fieldLabelBlock.matchAll(/:\s*'([^']+)'/g)) used.add(match[1]);
  for (const key of used) assert.ok(keys.has(key), `missing bilingual extension copy: ${key}`);
});

test('extension Bengali copy contains no untranslated English UI words', () => {
  const allowed = new Set(['indianvisabuzz', 'ivac', 'pdf', 'nid', 'otp', 'captcha', 'chrome', 'kb', 'file']);
  const values = Object.values(copy.bn).map(value => {
    if (typeof value !== 'function') return value;
    if (value.length > 0) return value({ count: 2, unmatched: ['NID'], index: 2, file: 'demo.pdf', error: 'demo.pdf: 500 KB-এর বেশি' });
    return value();
  });
  const unapproved = [];
  for (const original of values) {
    const text = String(original).replace(/\{[^}]+\}/g, ' ').replace(/[A-Za-z0-9_-]+\.pdf/gi, 'FILE.pdf').replace(/IndianVisaBuzz/gi, ' ');
    const words = [...text.matchAll(/[A-Za-z]+/g)].map(match => match[0].toLowerCase()).filter(word => !allowed.has(word));
    if (words.length) unapproved.push(`${original} [${words.join(', ')}]`);
  }
  assert.deepEqual(unapproved, []);
});

test('extension form option values remain stable when labels are translated', () => {
  for (const value of ['Tourist', 'Medical', 'Business', 'Student', 'Employment', 'Other', 'Dhaka', 'Chattogram', 'Rajshahi', 'Sylhet', 'Khulna']) {
    assert.match(source, new RegExp(`<option value="${value}"`));
  }
});
