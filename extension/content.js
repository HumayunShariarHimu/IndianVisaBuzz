(() => {
  'use strict';
  if (window.__visaBuzzLoaded) return;
  window.__visaBuzzLoaded = true;

  const FILES = globalThis.VisaBuzzFiles;
  const PROFILE_KEY = 'ivbProfileV2';
  const LANGUAGE_KEY = 'ivbLanguageV1';
  let language = 'bn';
  let selectedPdfs = [];
  let targetKeys = [];
  let currentStatus = { key: 'ready', params: {}, kind: 'info' };

  const COPY = {
    bn: {
      assistantLabel: 'IndianVisaBuzz সহায়ক', subtitle: 'ভিসা প্রস্তুতি সহায়ক', close: 'বন্ধ করুন',
      chooseLanguage: 'ভাষা নির্বাচন', languageBn: 'বাংলা', languageEn: 'ইংরেজি',
      notice: 'প্রোফাইল এই ব্রাউজারেই থাকে। ফাইল যুক্ত করলে সরকারি পোর্টাল সঙ্গে সঙ্গে আপলোড করতে পারে—নথির ঘর ও ফলাফল যাচাই করুন।',
      fullName: 'পূর্ণ নাম', email: 'ইমেইল', mobile: 'মোবাইল নম্বর', dob: 'জন্মতারিখ', passport: 'পাসপোর্ট নম্বর', nid: 'NID নম্বর',
      visaType: 'ভিসার ধরন', selectOption: 'নির্বাচন করুন', tourist: 'পর্যটন', medical: 'চিকিৎসা', business: 'ব্যবসা', student: 'শিক্ষার্থী', employment: 'চাকরি',
      center: 'IVAC কেন্দ্র', dhaka: 'ঢাকা', chattogram: 'চট্টগ্রাম', rajshahi: 'রাজশাহী', sylhet: 'সিলেট', khulna: 'খুলনা', other: 'অন্যান্য',
      remember: 'এই ডিভাইসে প্রোফাইল মনে রাখুন', fillForm: 'তথ্য দিয়ে ফর্ম পূরণ করুন', pdfDocs: 'PDF নথি', maxFiles: 'সর্বোচ্চ ৪টি · প্রতিটি 500 KB',
      pdfSelect: 'PDF ফাইল নির্বাচন করুন', attach: 'নির্বাচিত ঘরে ফাইল যুক্ত করুন', safety: 'ফাইল যুক্ত করলে সরকারি পোর্টাল আপলোড করতে পারে। এক্সটেনশন পাসওয়ার্ড নেয় না, CAPTCHA/OTP পাশ কাটায় না, জমা বা বুকিং করে না।', ready: 'প্রস্তুত।',
      emptyFiles: 'এখনও কোনো PDF নির্বাচন করা হয়নি।', primary: 'প্রধান', extra: 'অতিরিক্ত {index}', remove: '{file} সরান',
      targetAria: '{file}-এর নথির ঘর', chooseField: 'সরকারি পোর্টালের নথির ঘর বাছুন', openUpload: 'আগে পোর্টালের আপলোড ফর্ম খুলুন', filePresent: 'ফাইল আছে',
      profileSaved: 'প্রোফাইল এই ব্রাউজারে সংরক্ষিত হয়েছে।', sessionOnly: 'এই তথ্য শুধু এই ট্যাবে থাকবে।', noFields: 'চেনা কোনো প্রোফাইল ঘর পাওয়া যায়নি। পোর্টালের লেখা দেখে নিজে পূরণ করুন।',
      filledFields: ({ count, unmatched }) => unmatched.length ? `${count}টি ঘর পূরণ হয়েছে। ${unmatched.join(', ')} নিজে দেখুন।` : `${count}টি ঘর পূরণ হয়েছে। প্রতিটি তথ্য পোর্টালে মিলিয়ে নিন।`,
      checkingFiles: 'PDF ফাইলের বিষয়বস্তু যাচাই করা হচ্ছে…', filesChecked: '{count}টি PDF যাচাই হয়েছে। আপলোডের ফল পোর্টালে দেখুন।', fileCheckFailed: 'PDF যাচাই করা যায়নি; পোর্টালে নিজে ফাইল বাছুন।',
      selectFiles: 'আগে সর্বোচ্চ চারটি PDF নির্বাচন করুন।', noFiles: 'কোনো PDF নির্বাচন করা হয়নি।', targetRequired: 'প্রতিটি PDF-এর জন্য পোর্টালের সঠিক নথির ঘর বেছে নিন।',
      invalidTarget: 'পোর্টালের আপলোড ঘর বদলে গেছে। বর্তমান ফর্ম দেখে ঘর আবার বেছে নিন।', targetPopulated: 'নির্বাচিত পোর্টাল ঘরে আগে থেকেই ফাইল আছে। কোনো ফাইলের জায়গা নেওয়া হয়নি।',
      singleFieldReused: 'একটি একক-ফাইল ঘর একাধিক PDF-এর জন্য বেছে নেওয়া হয়েছে। আলাদা ঘর বাছুন.', unknownField: 'আপলোডের ঘর নিরাপদে নির্ধারণ করা যায়নি; পোর্টালে নিজে ফাইল যুক্ত করুন।',
      attaching: 'নির্বাচিত নথির ঘরে PDF যুক্ত করা হচ্ছে…', fieldChanged: 'পোর্টালের নির্বাচিত ঘর বদলে গেছে বা তাতে ফাইল আছে। কোনো ফাইলের জায়গা নেওয়া বা জমা দেওয়া হয়নি।',
      partialAttachment: ({ count }) => `সব PDF নিশ্চিত করা যায়নি (${count}টি ফাইল ইনপুটে দেখা যাচ্ছে)। পোর্টালে নিজে যাচাই করুন; এক্সটেনশন কিছু জমা দেয়নি।`,
      attached: ({ count }) => `${count}/${count}টি PDF আপনার বেছে নেওয়া পোর্টাল ঘরে যুক্ত হয়েছে। নথি ও নাম দেখে আপলোড/জমা নিজে করুন।`,
      attachException: 'ব্রাউজার ফাইল যুক্ত করতে দেয়নি। আগের ঘরে কিছু ফাইল যুক্ত হয়ে থাকতে পারে—পোর্টালে নিজে দেখুন; কিছু জমা হয়নি।',
      validationError: ({ error }) => translateValidationError(error, 'bn'),
      fallbackField: 'নথির ঘর {index}'
    },
    en: {
      assistantLabel: 'IndianVisaBuzz assistant', subtitle: 'Visa preparation assistant', close: 'Close',
      chooseLanguage: 'Choose language', languageBn: 'Bengali', languageEn: 'English',
      notice: 'Your profile stays in this browser. Attaching a file may upload it immediately on the official portal—check the document field and result.',
      fullName: 'Full name', email: 'Email', mobile: 'Mobile number', dob: 'Date of birth', passport: 'Passport number', nid: 'NID number',
      visaType: 'Visa type', selectOption: 'Select an option', tourist: 'Tourist', medical: 'Medical', business: 'Business', student: 'Student', employment: 'Employment',
      center: 'IVAC centre', dhaka: 'Dhaka', chattogram: 'Chattogram', rajshahi: 'Rajshahi', sylhet: 'Sylhet', khulna: 'Khulna', other: 'Other',
      remember: 'Remember this profile on this device', fillForm: 'Fill form with profile', pdfDocs: 'PDF documents', maxFiles: 'Up to 4 files · 500 KB each',
      pdfSelect: 'Choose PDF files', attach: 'Attach to selected fields', safety: 'Attaching a file may upload it on the official portal. The extension does not store passwords, bypass CAPTCHA/OTP, submit forms, or book appointments.', ready: 'Ready.',
      emptyFiles: 'No PDF selected yet.', primary: 'Primary', extra: 'Additional {index}', remove: 'Remove {file}',
      targetAria: 'Document field for {file}', chooseField: 'Choose an official portal document field', openUpload: 'Open the portal upload form first', filePresent: 'file already present',
      profileSaved: 'Profile saved in this browser.', sessionOnly: 'These details stay in this tab only.', noFields: 'No recognized profile fields found. Review the portal labels and fill them yourself.',
      filledFields: ({ count, unmatched }) => unmatched.length ? `${count} field(s) filled. Review ${unmatched.join(', ')} yourself.` : `${count} field(s) filled. Verify every detail on the portal.`,
      checkingFiles: 'Checking PDF file contents…', filesChecked: '{count} PDF(s) verified. Check the upload result on the portal.', fileCheckFailed: 'Could not verify the PDF; choose the file on the portal yourself.',
      selectFiles: 'Select up to four PDFs first.', noFiles: 'No PDF selected.', targetRequired: 'Choose the correct portal document field for every PDF.',
      invalidTarget: 'The portal upload fields changed. Review the current form and select the fields again.', targetPopulated: 'The selected portal field already contains a file. No file was overwritten.',
      singleFieldReused: 'One single-file field was selected for multiple PDFs. Choose separate fields.', unknownField: 'Upload fields could not be assigned safely; attach the files on the portal yourself.',
      attaching: 'Attaching PDFs to the selected document fields…', fieldChanged: 'A selected portal field changed or already contains a file. No file was overwritten or submitted.',
      partialAttachment: ({ count }) => `Could not confirm every PDF (${count} file(s) are visible in inputs). Check the portal yourself; the extension submitted nothing.`,
      attached: ({ count }) => `${count}/${count} PDFs attached to the portal fields you chose. Review the document names and upload/submit yourself.`,
      attachException: 'The browser rejected the file attachment. Some files may already be attached—check the portal yourself; nothing was submitted.',
      validationError: ({ error }) => translateValidationError(error, 'en'),
      fallbackField: 'Document field {index}'
    }
  };

  const $ = id => document.getElementById(id);
  const fieldNames = ['fullName', 'email', 'phone', 'dob', 'passport', 'nid', 'visaType', 'center'];
  const fieldLabels = { fullName: 'fullName', email: 'email', phone: 'mobile', dob: 'dob', passport: 'passport', nid: 'nid', visaType: 'visaType', center: 'center' };

  function t(key, params = {}, languageCode = language) {
    const value = COPY[languageCode][key];
    if (typeof value === 'function') return value(params);
    return String(value || '').replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ''));
  }

  function translateValidationError(message, lang) {
    const text = String(message || '');
    let match;
    if ((match = text.match(/^(.+): PDF নয়$/))) return `${match[1]}: ${lang === 'bn' ? 'PDF নয়' : 'not a PDF file'}`;
    if ((match = text.match(/^(.+): 500 KB-এর বেশি$/))) return `${match[1]}: ${lang === 'bn' ? '500 KB-এর বেশি' : 'exceeds 500 KB'}`;
    if ((match = text.match(/^(.+): একই file একাধিকবার নির্বাচন করা হয়েছে$/))) return `${match[1]}: ${lang === 'bn' ? 'একই ফাইল একাধিকবার নির্বাচন করা হয়েছে' : 'duplicate file selected'}`;
    if ((match = text.match(/^সর্বোচ্চ (\d+)টি PDF নির্বাচন করা যাবে$/))) return lang === 'bn' ? `সর্বোচ্চ ${match[1]}টি PDF নির্বাচন করা যাবে` : `You can select up to ${match[1]} PDFs`;
    if ((match = text.match(/^(.+): PDF file-এর content পাওয়া যায়নি$/))) return `${match[1]}: ${lang === 'bn' ? 'PDF-এর বিষয়বস্তু সঠিক নয়' : 'valid PDF content was not found'}`;
    return text;
  }

  function status(key, kind = 'info', params = {}) {
    currentStatus = { key, kind, params };
    renderStatus();
  }

  function renderStatus() {
    const node = $('ivb-status');
    if (!node) return;
    node.textContent = t(currentStatus.key, currentStatus.params);
    node.dataset.kind = currentStatus.kind;
  }

  function applyLocale() {
    const panel = $('ivb-widget');
    if (!panel) return;
    panel.lang = language;
    panel.setAttribute('aria-label', t('assistantLabel'));
    panel.querySelectorAll('[data-i18n]').forEach(element => { element.textContent = t(element.dataset.i18n); });
    panel.querySelectorAll('[data-i18n-aria]').forEach(element => { element.setAttribute('aria-label', t(element.dataset.i18nAria)); });
    panel.querySelectorAll('[data-language]').forEach(button => {
      const active = button.dataset.language === language;
      button.textContent = t(button.dataset.language === 'bn' ? 'languageBn' : 'languageEn');
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const group = panel.querySelector('.ivb-language');
    if (group) group.setAttribute('aria-label', t('chooseLanguage'));
    renderStatus();
    renderFiles();
  }

  function setLanguage(nextLanguage) {
    if (nextLanguage !== 'bn' && nextLanguage !== 'en') return;
    language = nextLanguage;
    chrome.storage.local.set({ [LANGUAGE_KEY]: language });
    applyLocale();
  }

  function getProfile() {
    return Object.fromEntries(fieldNames.map(name => [name, $(`ivb-${name}`).value.trim()]));
  }

  function persistProfile() {
    if ($('ivb-remember').checked) {
      chrome.storage.local.set({ [PROFILE_KEY]: getProfile() });
      status('profileSaved', 'success');
    } else {
      chrome.storage.local.remove(PROFILE_KEY);
      status('sessionOnly', 'info');
    }
  }

  function safeFillValue(input, value) {
    let nextValue = value;
    if (input.tagName === 'SELECT') {
      const desired = String(value).trim().toLocaleLowerCase();
      const option = [...input.options].find(item => item.value.trim().toLocaleLowerCase() === desired || item.textContent.trim().toLocaleLowerCase() === desired);
      if (!option) return false;
      nextValue = option.value;
    }
    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value');
    if (descriptor && descriptor.set) descriptor.set.call(input, nextValue);
    else input.value = nextValue;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return String(input.value).trim().toLocaleLowerCase() === String(nextValue).trim().toLocaleLowerCase();
  }

  function fieldText(input) {
    const parts = [input.name, input.id, input.placeholder, input.getAttribute('aria-label'), input.autocomplete];
    if (input.labels) parts.push(...Array.from(input.labels, label => label.textContent));
    const labelledBy = input.getAttribute('aria-labelledby');
    if (labelledBy) parts.push(...labelledBy.split(/\s+/).map(id => document.getElementById(id)?.textContent || ''));
    return parts.filter(Boolean).join(' ').toLowerCase();
  }

  const patterns = {
    fullName: /full.?name|applicant.?name|name.?of.?applicant|name.?as.?in.?passport/,
    email: /e.?mail/,
    phone: /mobile|phone|contact.?number|telephone/,
    dob: /date.?of.?birth|birth.?date|\bdob\b/,
    passport: /passport.?number|passport.?no|passport.?id|passport.?num/,
    nid: /national.?id|\bnid\b|identity.?number/,
    visaType: /visa.?type|type.?of.?visa|visa.?category|category.?of.?visa|purpose.?of.?visit/,
    center: /ivac|consulate|centre|center|mission/
  };

  function fillForm() {
    const profile = getProfile();
    const inputs = [...document.querySelectorAll('input:not([type="file"]):not([type="password"]):not([type="hidden"]),textarea,select')]
      .filter(input => !input.closest('#ivb-widget') && !input.disabled && input.type !== 'checkbox' && input.type !== 'radio');
    const filled = [];
    const unmatched = [];
    for (const key of fieldNames) {
      if (!profile[key]) continue;
      const field = inputs.find(input => patterns[key].test(fieldText(input)) && !filled.some(item => item.input === input));
      if (!field) {
        unmatched.push(t(fieldLabels[key]));
        continue;
      }
      if (!safeFillValue(field, profile[key])) {
        unmatched.push(t(fieldLabels[key]));
        continue;
      }
      filled.push({ input: field, key });
    }
    if ($('ivb-remember').checked) persistProfile();
    if (!filled.length) {
      status('noFields', 'error');
      return;
    }
    status('filledFields', 'success', { count: filled.length, unmatched });
  }

  function portalFieldLabel(input, index) {
    const labels = Array.from(input.labels || []).map(label => label.textContent.trim()).filter(Boolean);
    return labels[0] || input.getAttribute('aria-label') || input.name || input.id || t('fallbackField', { index: index + 1 });
  }

  function portalFieldKey(input, index) {
    const labels = Array.from(input.labels || []).map(label => label.textContent.trim()).join(' ');
    return `${index}|${input.id}|${input.name}|${labels}|${input.accept || ''}`;
  }

  function renderFiles() {
    const list = $('ivb-file-list');
    if (!list) return;
    const targets = portalFileInputs();
    list.replaceChildren();
    if (!selectedPdfs.length) {
      const empty = document.createElement('li');
      empty.className = 'ivb-empty';
      empty.textContent = t('emptyFiles');
      list.append(empty);
      $('ivb-file-summary').textContent = language === 'bn' ? '০ / ৪ PDF' : '0 / 4 PDFs';
      return;
    }
    $('ivb-file-summary').textContent = language === 'bn' ? `${selectedPdfs.length} / ৪ PDF` : `${selectedPdfs.length} / 4 PDFs`;
    selectedPdfs.forEach((file, index) => {
      const item = document.createElement('li');
      item.className = 'ivb-file';
      const label = document.createElement('span');
      label.className = 'ivb-file-index';
      label.textContent = index === 0 ? t('primary') : t('extra', { index });
      const name = document.createElement('span');
      name.className = 'ivb-file-name';
      name.textContent = file.name;
      name.title = file.name;
      const size = document.createElement('small');
      size.textContent = `${Math.ceil(file.size / 1024)} KB`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'ivb-remove';
      remove.textContent = '×';
      remove.setAttribute('aria-label', t('remove', { file: file.name }));
      remove.addEventListener('click', () => {
        selectedPdfs.splice(index, 1);
        targetKeys.splice(index, 1);
        renderFiles();
      });
      const target = document.createElement('select');
      target.className = 'ivb-target';
      target.setAttribute('aria-label', t('targetAria', { file: file.name }));
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = targets.length ? t('chooseField') : t('openUpload');
      target.append(placeholder);
      targets.forEach((input, targetIndex) => {
        const option = document.createElement('option');
        option.value = portalFieldKey(input, targetIndex);
        option.textContent = `${portalFieldLabel(input, targetIndex)}${input.files && input.files.length ? ` · ${t('filePresent')}` : ''}`;
        option.disabled = Boolean(input.files && input.files.length);
        target.append(option);
      });
      target.value = targetKeys[index] || '';
      target.disabled = targets.length === 0;
      target.addEventListener('change', () => { targetKeys[index] = target.value; });
      item.append(label, name, size, target, remove);
      list.append(item);
    });
  }

  async function onFilesPicked(event) {
    const picker = event.target;
    const incoming = [...(picker.files || [])];
    picker.value = '';
    picker.disabled = true;
    status('checkingFiles', 'info');
    try {
      const previousTargets = new Map(selectedPdfs.map((file, index) => [file, targetKeys[index]]));
      const result = await FILES.validatePdfFiles([...selectedPdfs, ...incoming]);
      selectedPdfs = result.files;
      targetKeys = selectedPdfs.map(file => previousTargets.get(file) || '');
      renderFiles();
      if (result.errors.length) status('validationError', 'error', { error: result.errors[0] });
      else if (selectedPdfs.length) status('filesChecked', 'success', { count: selectedPdfs.length });
    } catch (_) {
      status('fileCheckFailed', 'error');
    } finally {
      picker.disabled = false;
    }
  }

  function portalFileInputs() {
    return [...document.querySelectorAll('input[type="file"]')].filter(input => {
      if (input.closest('#ivb-widget')) return false;
      const style = getComputedStyle(input);
      const rect = input.getBoundingClientRect();
      const inputVisible = rect.width > 2 && rect.height > 2 && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      const labels = Array.from(input.labels || []);
      const visibleLabel = labels.some(label => {
        const labelStyle = getComputedStyle(label);
        const labelRect = label.getBoundingClientRect();
        return labelRect.width > 2 && labelRect.height > 2 && labelStyle.display !== 'none' && labelStyle.visibility !== 'hidden';
      });
      return FILES.isPortalPdfInputCandidate({
        type: input.type, accept: input.accept, name: input.name, id: input.id, title: input.title,
        ariaLabel: input.getAttribute('aria-label'), labelText: labels.map(label => label.textContent).join(' '),
        disabled: input.disabled, connected: input.isConnected, visible: inputVisible || visibleLabel
      });
    });
  }

  function assignFileList(input, files) {
    const transfer = new DataTransfer();
    files.forEach(file => transfer.items.add(file));
    input.files = transfer.files;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function fileNames(input) {
    return [...(input.files || [])].map(file => file.name);
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function attachFiles() {
    if (!selectedPdfs.length) {
      status('selectFiles', 'error');
      return;
    }
    const fields = portalFileInputs();
    const fieldKeys = fields.map((input, index) => portalFieldKey(input, index));
    const targetIndices = targetKeys.map(key => key ? fieldKeys.indexOf(key) : '');
    const plan = FILES.createMappedUploadPlan(selectedPdfs, fields, targetIndices);
    if (!plan.ok) {
      const messageKeys = {
        'no-files': 'noFiles', 'target-required': 'targetRequired', 'invalid-target': 'invalidTarget',
        'target-populated': 'targetPopulated', 'single-field-reused': 'singleFieldReused'
      };
      status(messageKeys[plan.reason] || 'unknownField', 'error');
      return;
    }

    status('attaching', 'info');
    const targets = plan.assignments.map(assignment => ({
      key: portalFieldKey(assignment.input, fields.indexOf(assignment.input)),
      files: assignment.files
    }));
    try {
      for (const assignment of plan.assignments) {
        if (!assignment.input.isConnected || (assignment.input.files && assignment.input.files.length)) {
          status('fieldChanged', 'error');
          return;
        }
        assignFileList(assignment.input, assignment.files);
        await wait(250);
      }
      await wait(350);
      const currentInputs = portalFileInputs();
      const currentKeys = currentInputs.map((input, index) => portalFieldKey(input, index));
      const allAttached = targets.every(target => {
        const index = currentKeys.indexOf(target.key);
        if (index < 0) return false;
        return target.files.every(file => currentInputs[index].files && [...currentInputs[index].files].some(actualFile => FILES.fileIdentity(actualFile) === FILES.fileIdentity(file)));
      });
      const attachedCount = currentInputs.reduce((count, input) => count + fileNames(input).length, 0);
      const mappedFileCount = plan.assignments.reduce((count, assignment) => count + assignment.files.length, 0);
      if (!allAttached || mappedFileCount !== selectedPdfs.length) {
        status('partialAttachment', 'error', { count: attachedCount });
        return;
      }
      status('attached', 'success', { count: selectedPdfs.length });
    } catch (_) {
      status('attachException', 'error');
    }
  }

  function makeWidget() {
    if ($('ivb-widget')) {
      $('ivb-widget').remove();
      return;
    }
    const panel = document.createElement('section');
    panel.id = 'ivb-widget';
    panel.setAttribute('aria-label', t('assistantLabel'));
    panel.innerHTML = `
      <header class="ivb-head"><div class="ivb-brand-mark" aria-hidden="true"><span></span></div><div class="ivb-brand"><strong>IndianVisaBuzz</strong><small data-i18n="subtitle"></small></div><div class="ivb-language" role="group" aria-label="${t('chooseLanguage')}"><button class="ivb-language-button" type="button" data-language="bn" aria-pressed="true">বাংলা</button><button class="ivb-language-button" type="button" data-language="en" aria-pressed="false">English</button></div><button class="ivb-close" id="ivb-close" data-i18n-aria="close" type="button">×</button></header>
      <div class="ivb-body">
        <p class="ivb-notice" data-i18n="notice"></p>
        <div class="ivb-fields">
          <label><span data-i18n="fullName"></span><input id="ivb-fullName" autocomplete="off" maxlength="120"></label>
          <label><span data-i18n="email"></span><input id="ivb-email" type="email" autocomplete="off" maxlength="160"></label>
          <label><span data-i18n="mobile"></span><input id="ivb-phone" type="tel" autocomplete="off" maxlength="32"></label>
          <label><span data-i18n="dob"></span><input id="ivb-dob" type="date" autocomplete="off"></label>
          <label><span data-i18n="passport"></span><input id="ivb-passport" autocomplete="off" maxlength="32"></label>
          <label><span data-i18n="nid"></span><input id="ivb-nid" autocomplete="off" maxlength="32"></label>
          <label><span data-i18n="visaType"></span><select id="ivb-visaType"><option value="" data-i18n="selectOption"></option><option value="Tourist" data-i18n="tourist">Tourist</option><option value="Medical" data-i18n="medical">Medical</option><option value="Business" data-i18n="business">Business</option><option value="Student" data-i18n="student">Student</option><option value="Employment" data-i18n="employment">Employment</option><option value="Other" data-i18n="other">Other</option></select></label>
          <label><span data-i18n="center"></span><select id="ivb-center"><option value="" data-i18n="selectOption"></option><option value="Dhaka" data-i18n="dhaka">Dhaka</option><option value="Chattogram" data-i18n="chattogram">Chattogram</option><option value="Rajshahi" data-i18n="rajshahi">Rajshahi</option><option value="Sylhet" data-i18n="sylhet">Sylhet</option><option value="Khulna" data-i18n="khulna">Khulna</option></select></label>
        </div>
        <label class="ivb-remember"><input type="checkbox" id="ivb-remember"><span data-i18n="remember"></span></label>
        <button class="ivb-button ivb-fill" id="ivb-fill" data-i18n="fillForm" type="button"></button>
        <div class="ivb-upload-head"><div><strong data-i18n="pdfDocs"></strong><small data-i18n="maxFiles"></small></div><span id="ivb-file-summary">0 / 4 PDFs</span></div>
        <label class="ivb-picker"><span data-i18n="pdfSelect"></span><input id="ivb-pdf-picker" type="file" accept="application/pdf,.pdf" multiple></label>
        <ul class="ivb-file-list" id="ivb-file-list"></ul>
        <button class="ivb-button ivb-upload" id="ivb-attach" data-i18n="attach" type="button"></button>
        <p class="ivb-safety" data-i18n="safety"></p>
        <div class="ivb-status" id="ivb-status" data-kind="info" role="status" aria-live="polite"></div>
      </div>`;
    document.body.append(panel);
    applyLocale();
    chrome.storage.local.get([PROFILE_KEY, LANGUAGE_KEY], result => {
      const saved = result && result[PROFILE_KEY];
      const storedLanguage = result && result[LANGUAGE_KEY];
      if (storedLanguage === 'bn' || storedLanguage === 'en') language = storedLanguage;
      if (saved && typeof saved === 'object') {
        fieldNames.forEach(key => { if (typeof saved[key] === 'string') $(`ivb-${key}`).value = saved[key]; });
        $('ivb-remember').checked = true;
      }
      applyLocale();
    });
    panel.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.language)));
    $('ivb-close').addEventListener('click', () => panel.remove());
    $('ivb-fill').addEventListener('click', fillForm);
    $('ivb-remember').addEventListener('change', persistProfile);
    $('ivb-pdf-picker').addEventListener('change', onFilesPicked);
    $('ivb-attach').addEventListener('click', attachFiles);
    panel.querySelectorAll('.ivb-fields input, .ivb-fields select').forEach(input => {
      input.addEventListener('input', () => { if ($('ivb-remember').checked) persistProfile(); });
      input.addEventListener('change', () => { if ($('ivb-remember').checked) persistProfile(); });
    });
    renderFiles();
  }

  chrome.runtime.onMessage.addListener(request => {
    if (request && request.action === 'toggle_widget') makeWidget();
  });
})();
