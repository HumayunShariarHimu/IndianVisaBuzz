const test = require('node:test');
const assert = require('node:assert/strict');
const { MAX_BYTES, MAX_FILES, validatePdfFiles, fileIdentity, isPortalPdfInputCandidate, createUploadPlan, createMappedUploadPlan } = require('../extension/file-upload.js');

const file = (name, size = 1024, type = 'application/pdf', header = '%PDF-1.7') => ({
  name,
  size,
  type,
  slice(start, end) {
    const bytes = Buffer.from(header).subarray(start, end);
    return { arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
  }
});
const input = (multiple = false, existing = []) => ({ type: 'file', multiple, files: existing });

test('accepts four distinct signed PDFs, including exact 500 KB boundary', async () => {
  const result = await validatePdfFiles([file('one.pdf'), file('two.pdf'), file('three.pdf'), file('four.pdf', MAX_BYTES)]);
  assert.equal(result.files.length, 4);
  assert.deepEqual(result.errors, []);
  assert.equal(MAX_FILES, 4);
});

test('rejects non-PDF, oversized, duplicate, invalid signature, and fifth file', async () => {
  const result = await validatePdfFiles([
    file('ok.pdf'), file('not-pdf.txt', 40, 'text/plain'), file('large.pdf', MAX_BYTES + 1),
    file('fake.pdf', 40, 'application/pdf', 'NOT A PDF'), file('ok.pdf'), file('two.pdf'),
    file('three.pdf'), file('four.pdf'), file('five.pdf')
  ]);
  assert.equal(result.files.length, 4);
  assert.equal(result.errors.length, 5);
  assert.ok(result.errors.some(message => message.includes('PDF')));
  assert.ok(result.errors.some(message => message.includes('PDF file-এর content')));
  assert.ok(result.errors.some(message => message.includes('500 KB')));
  assert.ok(result.errors.some(message => message.includes('একই file')));
  assert.ok(result.errors.some(message => message.includes('সর্বোচ্চ')));
});

test('distinguishes files sharing a name but having different metadata', () => {
  assert.notEqual(fileIdentity(file('same.pdf', 100)), fileIdentity(file('same.pdf', 101)));
  assert.equal(fileIdentity(file('same.pdf', 100)), fileIdentity(file('same.pdf', 100)));
});

test('recognizes a PDF header within the first 1024 bytes', async () => {
  const bytes = Buffer.concat([Buffer.alloc(50, 0), Buffer.from('%PDF-1.7')]);
  const candidate = { slice: (start, end) => ({ arrayBuffer: async () => { const data = bytes.subarray(start, end); return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength); } }) };
  assert.equal(await require('../extension/file-upload.js').hasPdfSignature(candidate), true);
});

test('selects only visible, semantically relevant PDF document inputs', () => {
  assert.equal(isPortalPdfInputCandidate({ type: 'file', accept: 'application/pdf', visible: true }), true);
  assert.equal(isPortalPdfInputCandidate({ type: 'file', name: 'webfile', visible: true }), true);
  assert.equal(isPortalPdfInputCandidate({ type: 'file', name: 'profile-photo', accept: 'image/*', labelText: 'photo document', visible: true }), false);
  assert.equal(isPortalPdfInputCandidate({ type: 'file', id: 'unrelated', visible: true }), false);
  assert.equal(isPortalPdfInputCandidate({ type: 'file', id: 'webfile', visible: false }), false);
});

test('count-based plan keeps all PDFs together on a multi-file field', () => {
  const files = [file('a.pdf'), file('b.pdf'), file('c.pdf'), file('d.pdf')];
  const plan = createUploadPlan(files, [input(true)]);
  assert.equal(plan.ok, true);
  assert.equal(plan.mode, 'multiple');
  assert.deepEqual(plan.assignments[0].files, files);
});

test('count-based plan refuses insufficient or populated portal slots', () => {
  const files = [file('a.pdf'), file('b.pdf'), file('c.pdf'), file('d.pdf')];
  const occupied = createUploadPlan(files, [input(false, [file('already-selected.pdf')])]);
  assert.equal(occupied.ok, false);
  assert.equal(occupied.available, 0);
  const insufficient = createUploadPlan(files, [input()]);
  assert.equal(insufficient.ok, false);
  assert.equal(insufficient.available, 1);
  assert.equal(insufficient.required, 4);
});

test('mapped plan requires an explicit unique destination for every separate PDF', () => {
  const files = [file('passport.pdf'), file('photo.pdf')];
  const fields = [input(), input()];
  const plan = createMappedUploadPlan(files, fields, [1, 0]);
  assert.equal(plan.ok, true);
  assert.deepEqual(plan.assignments.map(item => item.input), [fields[1], fields[0]]);
  assert.deepEqual(plan.assignments.map(item => item.files[0]), files);
});

test('mapped plan allows grouping only on a multiple input', () => {
  const files = [file('a.pdf'), file('b.pdf')];
  const grouped = createMappedUploadPlan(files, [input(true)], [0, 0]);
  assert.equal(grouped.ok, true);
  assert.equal(grouped.assignments.length, 1);
  assert.deepEqual(grouped.assignments[0].files, files);
  const refused = createMappedUploadPlan(files, [input(false)], [0, 0]);
  assert.equal(refused.ok, false);
  assert.equal(refused.reason, 'single-field-reused');
});

test('mapped plan refuses missing, invalid, or already populated target inputs', () => {
  const files = [file('a.pdf')];
  assert.equal(createMappedUploadPlan(files, [input()], []).reason, 'target-required');
  assert.equal(createMappedUploadPlan(files, [input()], [3]).reason, 'invalid-target');
  assert.equal(createMappedUploadPlan(files, [input(false, [file('existing.pdf')])], [0]).reason, 'target-populated');
});

test('missing input fields are a stop condition', () => {
  assert.deepEqual(createUploadPlan([file('a.pdf')], []), { ok: false, reason: 'insufficient-fields', required: 1, available: 0 });
});
