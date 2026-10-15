(() => {
  'use strict';
  if (window.__visaBuzzLoaded) return;
  window.__visaBuzzLoaded = true;

  const FILES = globalThis.VisaBuzzFiles;
  const PROFILE_KEY = 'ivbProfileV2';
  let selectedPdfs = [];
  let targetKeys = [];

  const $ = id => document.getElementById(id);
  const fieldNames = ['fullName', 'email', 'phone', 'dob', 'passport', 'nid', 'visaType', 'center'];
  const fieldLabels = {
    fullName: 'পূর্ণ নাম', email: 'ইমেইল', phone: 'মোবাইল', dob: 'জন্মতারিখ', passport: 'পাসপোর্ট', nid: 'NID', visaType: 'ভিসার ধরন', center: 'IVAC কেন্দ্র'
  };

  function status(message, kind = 'info') {
    const node = $('ivb-status');
    if (!node) return;
    node.textContent = message;
    node.dataset.kind = kind;
  }

  function getProfile() {
    return Object.fromEntries(fieldNames.map(name => [name, $(`ivb-${name}`).value.trim()]));
  }

  function persistProfile() {
    if ($('ivb-remember').checked) {
      chrome.storage.local.set({ [PROFILE_KEY]: getProfile() });
      status('প্রোফাইল এই browser-এ সংরক্ষিত হয়েছে।', 'success');
    } else {
      chrome.storage.local.remove(PROFILE_KEY);
      status('এই তথ্য শুধু এই tab-এ থাকবে।', 'info');
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
        unmatched.push(fieldLabels[key]);
        continue;
      }
      if (!safeFillValue(field, profile[key])) {
        unmatched.push(fieldLabels[key]);
        continue;
      }
      filled.push({ input: field, key });
    }
    if ($('ivb-remember').checked) persistProfile();
    if (!filled.length) {
      status('চেনা কোনো profile field পাওয়া যায়নি। portal-এর label দেখে নিজে পূরণ করুন।', 'error');
      return;
    }
    status(`${filled.length}টি field পূরণ হয়েছে। ${unmatched.length ? `${unmatched.join(', ')} নিজে দেখুন।` : 'প্রতিটি তথ্য portal-এ মিলিয়ে নিন।'}`, 'success');
  }

  function portalFieldLabel(input, index) {
    const labels = Array.from(input.labels || []).map(label => label.textContent.trim()).filter(Boolean);
    return labels[0] || input.getAttribute('aria-label') || input.name || input.id || `Document field ${index + 1}`;
  }

  function portalFieldKey(input, index) {
    const labels = Array.from(input.labels || []).map(label => label.textContent.trim()).join(' ');
    return `${index}|${input.id}|${input.name}|${labels}|${input.accept || ''}`;
  }

  function renderFiles() {
    const list = $('ivb-file-list');
    const targets = portalFileInputs();
    list.replaceChildren();
    if (!selectedPdfs.length) {
      const empty = document.createElement('li');
      empty.className = 'ivb-empty';
      empty.textContent = 'এখনও কোনো PDF নির্বাচন করা হয়নি।';
      list.append(empty);
      $('ivb-file-summary').textContent = '0 / 4 file';
      return;
    }
    $('ivb-file-summary').textContent = `${selectedPdfs.length} / 4 file`;
    selectedPdfs.forEach((file, index) => {
      const item = document.createElement('li');
      item.className = 'ivb-file';
      const label = document.createElement('span');
      label.className = 'ivb-file-index';
      label.textContent = index === 0 ? 'প্রধান' : `অতিরিক্ত ${index}`;
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
      remove.setAttribute('aria-label', `${file.name} সরান`);
      remove.addEventListener('click', () => {
        selectedPdfs.splice(index, 1);
        targetKeys.splice(index, 1);
        renderFiles();
      });
      const target = document.createElement('select');
      target.className = 'ivb-target';
      target.setAttribute('aria-label', `${file.name} এর portal upload field`);
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = targets.length ? 'Portal-এর document field বাছুন' : 'আগে portal-এর upload form খুলুন';
      target.append(placeholder);
      targets.forEach((input, targetIndex) => {
        const option = document.createElement('option');
        option.value = portalFieldKey(input, targetIndex);
        option.textContent = `${portalFieldLabel(input, targetIndex)}${input.files && input.files.length ? ' · file আছে' : ''}`;
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
    status('PDF file-এর content যাচাই করা হচ্ছে…', 'info');
    try {
      const previousTargets = new Map(selectedPdfs.map((file, index) => [file, targetKeys[index]]));
      const result = await FILES.validatePdfFiles([...selectedPdfs, ...incoming]);
      selectedPdfs = result.files;
      targetKeys = selectedPdfs.map(file => previousTargets.get(file) || '');
      renderFiles();
      if (result.errors.length) status(result.errors[0], 'error');
      else if (selectedPdfs.length) status(`${selectedPdfs.length}টি PDF যাচাই হয়েছে। Upload করলে portal-এও যাচাই করুন।`, 'success');
    } catch (_) {
      status('PDF file যাচাই করা যায়নি; portal-এ নিজে file বাছুন।', 'error');
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
      status('আগে সর্বোচ্চ চারটি PDF নির্বাচন করুন।', 'error');
      return;
    }
    const fields = portalFileInputs();
    const fieldKeys = fields.map((input, index) => portalFieldKey(input, index));
    const targetIndices = targetKeys.map(key => key ? fieldKeys.indexOf(key) : '');
    const plan = FILES.createMappedUploadPlan(selectedPdfs, fields, targetIndices);
    if (!plan.ok) {
      const messages = {
        'no-files': 'কোনো PDF নির্বাচন করা হয়নি।',
        'target-required': 'প্রতিটি PDF-এর জন্য portal-এর সঠিক document field নির্বাচন করুন।',
        'invalid-target': 'Portal-এর upload field বদলে গেছে। বর্তমান form দেখে field আবার নির্বাচন করুন।',
        'target-populated': 'নির্বাচিত portal field-এ আগে থেকেই file আছে। কোনো file overwrite করা হয়নি।',
        'single-field-reused': 'একটি single-file field একাধিক PDF-এর জন্য বেছে নেওয়া হয়েছে। আলাদা field বাছুন।'
      };
      status(messages[plan.reason] || 'Upload field নিরাপদভাবে নির্ধারণ করা যায়নি; portal-এ নিজে file attach করুন।', 'error');
      return;
    }

    status('নির্বাচিত document field-এ PDF attach করা হচ্ছে…', 'info');
    const targets = plan.assignments.map(assignment => ({
      key: portalFieldKey(assignment.input, fields.indexOf(assignment.input)),
      files: assignment.files
    }));
    try {
      for (const assignment of plan.assignments) {
        if (!assignment.input.isConnected || (assignment.input.files && assignment.input.files.length)) {
          status('Portal-এর নির্বাচিত field বদলে গেছে বা file আছে। কোনো file overwrite বা submit করা হয়নি।', 'error');
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
        const actual = fileNames(currentInputs[index]);
        return target.files.every(file => currentInputs[index].files && [...currentInputs[index].files].some(actualFile => FILES.fileIdentity(actualFile) === FILES.fileIdentity(file)));
      });
      const attachedCount = currentInputs.reduce((count, input) => count + fileNames(input).length, 0);
      const mappedFileCount = plan.assignments.reduce((count, assignment) => count + assignment.files.length, 0);
      if (!allAttached || mappedFileCount !== selectedPdfs.length) {
        status(`সব file নির্বাচিত field-এ নিশ্চিত করা যায়নি (${attachedCount}টি input file দেখা যাচ্ছে)। Portal নিজে দেখে নিন; extension submit করেনি।`, 'error');
        return;
      }
      status(`${selectedPdfs.length}/${selectedPdfs.length}টি PDF আপনার বেছে নেওয়া portal field-এ attach হয়েছে। ফাইল ও label দেখে upload/submit নিজে করুন।`, 'success');
    } catch (error) {
      status('Browser file attach গ্রহণ করেনি। আগের field-এ কিছু file attach হয়ে থাকতে পারে—portal নিজে যাচাই করুন; native file picker ব্যবহার করুন। কিছু submit হয়নি।', 'error');
    }
  }

  function makeWidget() {
    if ($('ivb-widget')) {
      $('ivb-widget').remove();
      return;
    }
    const panel = document.createElement('section');
    panel.id = 'ivb-widget';
    panel.setAttribute('aria-label', 'IndianVisaBuzz assistant');
    panel.innerHTML = `
      <header class="ivb-head"><div class="ivb-brand-mark" aria-hidden="true"><span></span></div><div class="ivb-brand"><strong>IndianVisaBuzz</strong><small>Visa preparation assistant</small></div><button class="ivb-close" id="ivb-close" type="button" aria-label="বন্ধ করুন">×</button></header>
      <div class="ivb-body">
        <p class="ivb-notice">Profile browser-এ থাকে। Attach করলে portal file নিজেই upload করতে পারে—portal field ও ফলাফল যাচাই করুন।</p>
        <div class="ivb-fields">
          <label>পূর্ণ নাম<input id="ivb-fullName" autocomplete="off" maxlength="120"></label>
          <label>ইমেইল<input id="ivb-email" type="email" autocomplete="off" maxlength="160"></label>
          <label>মোবাইল<input id="ivb-phone" type="tel" autocomplete="off" maxlength="32"></label>
          <label>জন্মতারিখ<input id="ivb-dob" type="date" autocomplete="off"></label>
          <label>Passport no.<input id="ivb-passport" autocomplete="off" maxlength="32"></label>
          <label>NID no.<input id="ivb-nid" autocomplete="off" maxlength="32"></label>
          <label>ভিসার ধরন<select id="ivb-visaType"><option value="">নির্বাচন করুন</option><option>Tourist</option><option>Medical</option><option>Business</option><option>Student</option><option>Employment</option></select></label>
          <label>IVAC কেন্দ্র<select id="ivb-center"><option value="">নির্বাচন করুন</option><option>Dhaka</option><option>Chattogram</option><option>Rajshahi</option><option>Sylhet</option><option>Khulna</option></select></label>
        </div>
        <label class="ivb-remember"><input type="checkbox" id="ivb-remember"><span>এই device-এ profile মনে রাখুন</span></label>
        <button class="ivb-button ivb-fill" id="ivb-fill" type="button">তথ্য দিয়ে form পূরণ</button>
        <div class="ivb-upload-head"><div><strong>PDF নথি</strong><small>সর্বোচ্চ ৪টি · 500 KB করে</small></div><span id="ivb-file-summary">0 / 4 file</span></div>
        <label class="ivb-picker" for="ivb-pdf-picker">PDF file নির্বাচন করুন<input id="ivb-pdf-picker" type="file" accept="application/pdf,.pdf" multiple></label>
        <ul class="ivb-file-list" id="ivb-file-list"></ul>
        <button class="ivb-button ivb-upload" id="ivb-attach" type="button">নির্বাচিত field-এ attach করুন</button>
        <p class="ivb-safety">Attach-এ portal file input বদলায়; portal সঙ্গে সঙ্গে upload করতে পারে। Extension password, OTP/CAPTCHA নেয় না এবং submit/booking করে না.</p>
        <div class="ivb-status" id="ivb-status" data-kind="info" role="status" aria-live="polite">প্রস্তুত।</div>
      </div>`;
    document.body.append(panel);
    chrome.storage.local.get(PROFILE_KEY, result => {
      const saved = result && result[PROFILE_KEY];
      if (!saved) return;
      fieldNames.forEach(key => { if (typeof saved[key] === 'string') $(`ivb-${key}`).value = saved[key]; });
      $('ivb-remember').checked = true;
    });
    $('ivb-close').addEventListener('click', () => panel.remove());
    $('ivb-fill').addEventListener('click', fillForm);
    $('ivb-remember').addEventListener('change', persistProfile);
    $('ivb-pdf-picker').addEventListener('change', onFilesPicked);
    $('ivb-attach').addEventListener('click', attachFiles);
    $('ivb-widget').querySelectorAll('.ivb-fields input, .ivb-fields select').forEach(input => {
      input.addEventListener('input', () => { if ($('ivb-remember').checked) persistProfile(); });
      input.addEventListener('change', () => { if ($('ivb-remember').checked) persistProfile(); });
    });
    renderFiles();
  }

  chrome.runtime.onMessage.addListener(request => {
    if (request && request.action === 'toggle_widget') makeWidget();
  });
})();
