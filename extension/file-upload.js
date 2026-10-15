(function (root) {
  'use strict';

  const MAX_FILES = 4;
  const MAX_BYTES = 500 * 1024;

  async function hasPdfSignature(file) {
    if (!file || typeof file.slice !== 'function') return false;
    try {
      const bytes = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
      const marker = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
      outer: for (let start = 0; start <= bytes.length - marker.length; start += 1) {
        for (let offset = 0; offset < marker.length; offset += 1) {
          if (bytes[start + offset] !== marker[offset]) continue outer;
        }
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  async function validatePdfFiles(files, limits = {}) {
    const maxFiles = limits.maxFiles || MAX_FILES;
    const maxBytes = limits.maxBytes || MAX_BYTES;
    const accepted = [];
    const errors = [];
    const names = new Set();

    for (const file of Array.from(files || [])) {
      const name = String(file.name || '');
      const isPdfLabel = file.type === 'application/pdf' || name.toLowerCase().endsWith('.pdf');
      if (!isPdfLabel) {
        errors.push(`${name || 'File'}: PDF নয়`);
        continue;
      }
      if (file.size > maxBytes) {
        errors.push(`${name}: 500 KB-এর বেশি`);
        continue;
      }
      const duplicateKey = name.toLocaleLowerCase();
      if (names.has(duplicateKey)) {
        errors.push(`${name}: একই file একাধিকবার নির্বাচন করা হয়েছে`);
        continue;
      }
      if (accepted.length >= maxFiles) {
        errors.push(`সর্বোচ্চ ${maxFiles}টি PDF নির্বাচন করা যাবে`);
        continue;
      }
      if (!await hasPdfSignature(file)) {
        errors.push(`${name}: PDF file-এর content পাওয়া যায়নি`);
        continue;
      }
      names.add(duplicateKey);
      accepted.push(file);
    }
    return { files: accepted, errors, maxFiles, maxBytes };
  }

  function fileIdentity(file) {
    return JSON.stringify([String(file.name || ''), Number(file.size || 0), Number(file.lastModified || 0), String(file.type || '')]);
  }

  function isPortalPdfInputCandidate(input) {
    if (!input || input.type !== 'file' || input.disabled || input.connected === false || input.visible === false) return false;
    const accept = String(input.accept || '').toLowerCase();
    if (accept && !accept.includes('pdf') && !accept.includes('application/*') && !accept.includes('*/*')) return false;
    const description = [input.name, input.id, input.title, input.ariaLabel, input.labelText]
      .filter(Boolean).join(' ').toLowerCase();
    const documentField = /webfile|pdf|document|supporting|travel.?doc|visa.?doc|passport.*(file|doc)|(file|doc).*passport/.test(description);
    return accept.includes('pdf') || documentField;
  }

  function createMappedUploadPlan(files, inputs, targetIndices) {
    const selected = Array.from(files || []);
    const fields = Array.from(inputs || []);
    const targets = Array.from(targetIndices || []);
    if (!selected.length) return { ok: false, reason: 'no-files' };
    if (targets.length !== selected.length || targets.some(target => target === '' || target === null || target === undefined)) {
      return { ok: false, reason: 'target-required' };
    }
    if (targets.some(target => !Number.isInteger(Number(target)) || Number(target) < 0 || Number(target) >= fields.length)) {
      return { ok: false, reason: 'invalid-target' };
    }
    const groups = new Map();
    for (let index = 0; index < selected.length; index += 1) {
      const targetIndex = Number(targets[index]);
      const input = fields[targetIndex];
      if (!input || input.type !== 'file' || input.disabled) return { ok: false, reason: 'invalid-target' };
      if (input.files && input.files.length > 0) return { ok: false, reason: 'target-populated' };
      if (!groups.has(targetIndex)) groups.set(targetIndex, { input, files: [] });
      groups.get(targetIndex).files.push(selected[index]);
    }
    for (const group of groups.values()) {
      if (group.files.length > 1 && !group.input.multiple) return { ok: false, reason: 'single-field-reused' };
    }
    return { ok: true, assignments: [...groups.values()] };
  }

  function createUploadPlan(files, inputs) {
    const selected = Array.from(files || []);
    const fields = Array.from(inputs || []).filter(input =>
      input && input.type === 'file' && !input.disabled && (!input.files || input.files.length === 0)
    );
    if (!selected.length) return { ok: false, reason: 'no-files' };

    if (fields.length >= selected.length) {
      return {
        ok: true,
        mode: 'separate',
        assignments: selected.map((file, index) => ({ input: fields[index], files: [file] }))
      };
    }

    const multiInput = fields.find(input => input.multiple);
    if (multiInput) {
      return { ok: true, mode: 'multiple', assignments: [{ input: multiInput, files: selected }] };
    }

    return {
      ok: false,
      reason: 'insufficient-fields',
      required: selected.length,
      available: fields.length
    };
  }

  const api = Object.freeze({ MAX_FILES, MAX_BYTES, hasPdfSignature, validatePdfFiles, fileIdentity, isPortalPdfInputCandidate, createUploadPlan, createMappedUploadPlan });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.VisaBuzzFiles = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
