(function () {
  'use strict';
  if (window.__visaBuzzLoaded) return;
  window.__visaBuzzLoaded = true;

  const LOG   = (...a) => console.log('%c[VisaBuzz]', 'color:#3b82f6;font-weight:bold', ...a);
  const ERR   = (...a) => console.error('[VisaBuzz]', ...a);

  const MAX_PDFS      = 4;
  const MAX_PDF_BYTES = 500 * 1024;
  const STORE_KEY     = 'visaBuzzCreds';
  const LIC_STORE     = 'visaBuzzLicense';
  const DEVICE_KEY    = 'visaBuzzDeviceId';
  const LIC_RECHECK   = 6 * 60 * 60 * 1000;

  let selectedPdfs = [];
  let isDragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;

  // ───────── helpers ─────────
  function getDeviceId() {
    try {
      let id = localStorage.getItem(DEVICE_KEY);
      if (!id) { id = 'dev-' + Math.random().toString(36).slice(2,10) + Date.now().toString(36); localStorage.setItem(DEVICE_KEY, id); }
      return id;
    } catch (_) { return 'dev-fallback-' + Date.now(); }
  }
  function $(id) { return document.getElementById(id); }
  function val(id) { return ($(id) || {}).value || ''; }
  function resolveEl(sel) { return typeof sel === 'function' ? sel() : document.querySelector(sel); }
  function waitForClickable(sel, cb, timeout = 20000, interval = 350) {
    const t0 = Date.now();
    (function check() {
      const el = resolveEl(sel);
      const visible = el && el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden';
      if (el && visible && !el.disabled && el.getAttribute('aria-disabled') !== 'true') return cb(el);
      if (Date.now() - t0 >= timeout) return cb(null);
      setTimeout(check, interval);
    })();
  }
  function waitForElement(sel, cb, timeout = 20000, interval = 350) {
    const t0 = Date.now();
    (function check() {
      const el = resolveEl(sel);
      if (el) return cb(el);
      if (Date.now() - t0 >= timeout) return cb(null);
      setTimeout(check, interval);
    })();
  }
  function findButtonByText(text) {
    const low = text.toLowerCase();
    for (const b of document.querySelectorAll('button, a, [role="button"]'))
      if ((b.textContent || '').trim().toLowerCase().includes(low)) return b;
    return null;
  }
  function setStatus(msg, type = 'info') {
    const el = $('visa-qa-status'); if (!el) return;
    el.textContent = msg;
    el.className = 'visa-qa-status show ' + type;
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.textContent = ''; el.className = 'visa-qa-status'; }, 5000);
  }

  // ───────── credentials ─────────
  function loadCreds(cb) { try { chrome.storage.local.get(STORE_KEY, r => cb((r && r[STORE_KEY]) || {})); } catch (_) { cb({}); } }
  function saveCreds() {
    const c = { phone: val('visa-in-phone'), password: val('visa-in-pass'), date: val('visa-in-date') };
    try { chrome.storage.local.set({ [STORE_KEY]: c }); } catch (_) {}
    return c;
  }
  function getCreds() { return { phone: val('visa-in-phone'), password: val('visa-in-pass'), date: val('visa-in-date') }; }

  // ───────── license ─────────
  function loadLicense(cb) { try { chrome.storage.local.get(LIC_STORE, r => cb((r && r[LIC_STORE]) || {})); } catch (_) { cb({}); } }
  function saveLicense(d)   { try { chrome.storage.local.set({ [LIC_STORE]: d }); } catch (_) {} }
  function verifyWithServer(key, cb) {
    try {
      chrome.runtime.sendMessage({ action: 'verify_license', key, deviceId: getDeviceId() }, res => {
        if (chrome.runtime.lastError || !res) return cb({ valid: false, reason: 'network_error' });
        cb(res);
      });
    } catch (_) { cb({ valid: false, reason: 'network_error' }); }
  }
  function humanReason(r) {
    return {
      missing_key: 'Enter your license key.',
      invalid_key: 'Invalid license key.',
      malformed:   'Malformed license key.',
      expired:     'License expired. Please renew.',
      network_error: 'No internet / server unreachable.',
    }[r] || 'License check failed.';
  }
  function ensureLicensed(cb) {
    const inputKey = ($('visa-in-license') || {}).value.trim();
    loadLicense(lic => {
      const now = Date.now();
      const key = inputKey || lic.key || '';
      if (lic.valid && lic.key === key && lic.checkedAt && (now - lic.checkedAt) < LIC_RECHECK) return cb();
      if (!key) return setStatus(humanReason('missing_key'), 'error');
      setStatus('Checking license…', 'info');
      verifyWithServer(key, res => {
        if (res && res.valid) {
          saveLicense({ key, valid: true, plan: res.plan, expiresAt: res.expiresAt, checkedAt: now });
          updateBadge(res);
          cb();
        } else {
          saveLicense({ key, valid: false, reason: res.reason, checkedAt: now });
          updateBadge(res || {});
          setStatus(humanReason(res && res.reason), 'error');
        }
      });
    });
  }
  function updateBadge(lic) {
    const el = $('visa-lic-badge'); if (!el) return;
    if (lic && lic.valid) {
      if (lic.expiresAt) {
        const d = Math.max(0, Math.round((lic.expiresAt - Date.now()) / 86400000));
        el.textContent = `(${lic.plan} — ${d}d left)`;
      } else el.textContent = `(${lic.plan} — lifetime)`;
    } else if (lic && lic.reason) {
      el.textContent = '(' + String(lic.reason).replace(/_/g, ' ') + ')';
    }
  }

  // ───────── widget UI ─────────
  function toggleWidget() {
    const existing = $('visa-qa-widget');
    if (existing) { existing.remove(); return; }
    const div = document.createElement('div');
    div.id = 'visa-qa-widget';
    div.innerHTML = `
      <div id="visa-qa-header">
        <span class="brand">
          <span class="logo">⚡</span>
          <span class="brand-text">
            <span class="brand-name">IndianVisaBuzz</span>
            <span class="brand-sub">Automation Suite</span>
          </span>
        </span>
        <span class="close-btn" id="visa-qa-close">&times;</span>
      </div>
      <div id="visa-qa-body">
        <div class="field">
          <label class="visa-qa-label">License Key <span class="req" id="visa-lic-badge"></span></label>
          <div class="pass-wrap">
            <input class="visa-qa-input" id="visa-in-license" type="text" placeholder="IVB-XXXXXXXXXXXX-XXXXXXXX" autocomplete="off" />
            <button class="eye" id="visa-lic-activate" type="button" title="Activate">✓</button>
          </div>
        </div>
        <div class="row">
          <div class="field">
            <label class="visa-qa-label">Phone</label>
            <input class="visa-qa-input" id="visa-in-phone" type="tel" inputmode="numeric" placeholder="01300000000" autocomplete="off" />
          </div>
          <div class="field">
            <label class="visa-qa-label">Password</label>
            <div class="pass-wrap">
              <input class="visa-qa-input" id="visa-in-pass" type="password" placeholder="••••••••" autocomplete="off" />
              <button class="eye" id="visa-toggle-pass" type="button">👁</button>
            </div>
          </div>
        </div>
        <div class="row">
          <div class="field">
            <label class="visa-qa-label">OTP</label>
            <input class="visa-qa-input" id="visa-in-otp" type="text" inputmode="numeric" maxlength="6" placeholder="6-digit" autocomplete="off" />
          </div>
          <div class="field">
            <label class="visa-qa-label">Appointment Date</label>
            <input class="visa-qa-input" id="visa-in-date" type="date" />
          </div>
        </div>
        <div class="field">
          <label class="visa-qa-label">Applicant PDFs <span class="req">(1 primary + up to 3 · 500 KB max)</span></label>
          <label class="dropzone" id="visa-drop" for="visa-in-pdf">
            <span class="dz-icon">⬆</span>
            <span class="dz-text" id="visa-pdf-name">Choose PDF file(s)</span>
          </label>
          <input id="visa-in-pdf" type="file" accept=".pdf,application/pdf" multiple hidden />
          <ul class="pdf-list" id="visa-pdf-list"></ul>
        </div>
        <div class="actions">
          <button class="visa-qa-btn step1" id="btn-step1"><span class="ic">🚀</span><span class="lbl"><b>1</b> Auto Login</span></button>
          <button class="visa-qa-btn step2" id="btn-step2"><span class="ic">📱</span><span class="lbl"><b>2</b> Verify OTP</span></button>
          <button class="visa-qa-btn step3" id="btn-step3"><span class="ic">📎</span><span class="lbl"><b>3</b> Upload File</span></button>
          <button class="visa-qa-btn step4" id="btn-step4"><span class="ic">📅</span><span class="lbl"><b>4</b> Slot Booking</span></button>
        </div>
        <div class="visa-qa-status" id="visa-qa-status"></div>
      </div>
    `;
    document.body.appendChild(div);

    loadCreds(c => {
      if (c.phone) $('visa-in-phone').value = c.phone;
      if (c.password) $('visa-in-pass').value = c.password;
      if (c.date) $('visa-in-date').value = c.date;
    });
    loadLicense(lic => {
      if (lic.key) $('visa-in-license').value = lic.key;
      if (lic.valid) updateBadge(lic);
    });

    renderPdfList();
    $('visa-in-pdf').addEventListener('change', onPdfPicked);

    const header = $('visa-qa-header');
    header.addEventListener('pointerdown', dragStart);
    header.addEventListener('pointerup', dragEnd);
    if (!window.__visaDragBound) {
      document.addEventListener('pointermove', drag);
      document.addEventListener('pointerup', dragEnd);
      window.__visaDragBound = true;
    }

    ['visa-in-phone','visa-in-pass','visa-in-date'].forEach(id => $(id).addEventListener('input', saveCreds));

    $('visa-toggle-pass').addEventListener('click', () => {
      const p = $('visa-in-pass'); p.type = p.type === 'password' ? 'text' : 'password';
    });
    $('visa-qa-close').addEventListener('click', toggleWidget);
    $('visa-lic-activate').addEventListener('click', () => ensureLicensed(() => setStatus('License active ✓', 'success')));

    $('btn-step1').addEventListener('click', () => ensureLicensed(runLogin));
    $('btn-step2').addEventListener('click', () => ensureLicensed(runOTP));
    $('btn-step3').addEventListener('click', () => ensureLicensed(runUploadConfirm));
    $('btn-step4').addEventListener('click', () => ensureLicensed(runSlotBooking));

    LOG('Widget ready.');
  }

  // ───────── drag ─────────
  function dragStart(e) {
    if (e.target.closest('.close-btn')) return;
    if (!e.target.closest('#visa-qa-header')) return;
    const w = $('visa-qa-widget'); if (!w) return;
    const r = w.getBoundingClientRect();
    w.style.left = r.left + 'px'; w.style.top = r.top + 'px';
    w.style.right = 'auto'; w.style.bottom = 'auto'; w.style.transform = 'none';
    w.style.transition = 'none'; w.classList.add('dragging');
    startX = e.clientX; startY = e.clientY; startLeft = r.left; startTop = r.top;
    isDragging = true;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  }
  function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    const w = $('visa-qa-widget'); if (!w) return;
    let l = startLeft + (e.clientX - startX);
    let t = startTop  + (e.clientY - startY);
    l = Math.min(Math.max(0, l), Math.max(0, window.innerWidth  - w.offsetWidth));
    t = Math.min(Math.max(0, t), Math.max(0, window.innerHeight - w.offsetHeight));
    w.style.left = l + 'px'; w.style.top = t + 'px';
  }
  function dragEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    const w = $('visa-qa-widget');
    if (w) { w.style.transition = 'opacity 0.2s ease, transform 0.2s ease'; w.classList.remove('dragging'); }
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
  }

  // ───────── PDFs ─────────
  function onPdfPicked(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    let errs = [];
    files.forEach(f => {
      if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) return errs.push(f.name + ': not a PDF');
      if (f.size > MAX_PDF_BYTES) return errs.push(f.name + ': >500 KB');
      if (selectedPdfs.length >= MAX_PDFS) return errs.push('Max ' + MAX_PDFS + ' files allowed');
      if (!selectedPdfs.some(p => p.name === f.name)) selectedPdfs.push(f);
    });
    if (errs.length) setStatus(errs[0], 'error');
    renderPdfList();
  }
  function renderPdfList() {
    const list = $('visa-pdf-list'), drop = $('visa-drop'), nameEl = $('visa-pdf-name');
    if (!list) return;
    list.innerHTML = '';
    if (!selectedPdfs.length) { drop.classList.remove('has-file'); nameEl.textContent = 'Choose PDF file(s)'; return; }
    drop.classList.add('has-file');
    nameEl.textContent = selectedPdfs.length === 1 ? selectedPdfs[0].name : selectedPdfs.length + ' files selected';
    selectedPdfs.forEach((f, i) => {
      const li = document.createElement('li');
      li.className = 'pdf-item';
      li.innerHTML = `<span class="pdf-badge">${i === 0 ? 'Primary' : 'Extra ' + i}</span>
        <span class="pdf-fname" title="${f.name}">${f.name}</span>
        <span class="pdf-size">${(f.size/1024).toFixed(0)} KB</span>
        <button class="pdf-remove" data-idx="${i}" title="Remove">×</button>`;
      list.appendChild(li);
    });
    list.querySelectorAll('.pdf-remove').forEach(b => b.addEventListener('click', e => {
      selectedPdfs.splice(parseInt(e.target.dataset.idx, 10), 1);
      renderPdfList();
    }));
  }

  // ───────── step 1: login ─────────
  function runLogin() {
    const { phone, password } = getCreds();
    saveCreds();
    if (!phone || !password) return setStatus('Enter phone and password first.', 'error');
    const p = document.querySelector('input[name="phone"]');
    if (p) { p.value = phone; p.dispatchEvent(new Event('input', { bubbles: true })); }
    const w = document.querySelector('input[name="password"]');
    if (w) { w.value = password; w.dispatchEvent(new Event('input', { bubbles: true })); }
    setStatus('Filled login. Waiting for Sign In…', 'info');
    waitForClickable('button[type="submit"]', btn => {
      if (btn) { btn.click(); setStatus('Sign In clicked ✓', 'success'); }
      else setStatus('Sign In stayed disabled — solve captcha.', 'error');
    }, 30000);
  }

  // ───────── step 2: OTP ─────────
  function runOTP() {
    const otp = val('visa-in-otp').replace(/\D/g, '');
    const first = document.querySelector('input[id^="otp-"], input[name="otp"]');
    if (!first) return setStatus('OTP field not found.', 'error');
    if (otp.length === 6) {
      fillPageOtp(otp);
      setStatus('OTP entered. Verifying…', 'info');
      waitForClickable('button[type="submit"]', btn => { if (btn) btn.click(); afterOtpVerify(); }, 15000);
      return;
    }
    try { first.focus(); } catch (_) {}
    setStatus('Type OTP above, or enter on the page.', 'info');
    if (!first._listenerAttached) {
      first.addEventListener('input', function () {
        if (this.value.length === 6) {
          const s = document.querySelector('button[type="submit"]');
          if (s) s.click();
          afterOtpVerify();
        }
      });
      first._listenerAttached = true;
    }
  }
  function fillPageOtp(otp) {
    const inputs = document.querySelectorAll('input[id^="otp-"]');
    if (inputs.length >= 2) {
      otp.split('').forEach((d, i) => {
        const el = $('otp-' + i);
        if (el) { el.value = d; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
      });
    } else {
      const el = document.querySelector('input[name="otp"]');
      if (el) { el.value = otp; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
    }
  }
  function afterOtpVerify() {
    setStatus('OTP verified. Waiting…', 'success');
    waitForClickable(() => document.querySelector('a[href="/appointment/notice"]') || findButtonByText('Confirm Mission'), btn => {
      if (btn) { btn.click(); setStatus('Appointment notice ✓', 'success'); }
    }, 25000);
  }

  // ───────── step 3: upload + confirm ─────────
  function runUploadConfirm() {
    if (!selectedPdfs.length) return setStatus('Choose at least one PDF first.', 'error');
    setStatus('Locating upload field…', 'info');
    waitForElement('input[type="file"]', inp => {
      if (!inp) return setStatus('Upload field not found.', 'error');
      uploadFilesSequentially(0, confirmAndSave);
    });
  }
  function uploadFilesSequentially(idx, done) {
    if (idx >= selectedPdfs.length) return done();
    const file = selectedPdfs[idx];
    const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
    const target = inputs.find(i => !i.files || i.files.length === 0) || inputs[inputs.length - 1];
    if (!target) return setStatus('No upload field for file ' + (idx + 1), 'error');
    try {
      const dt = new DataTransfer();
      dt.items.add(file);
      target.files = dt.files;
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
      setStatus(`${idx === 0 ? 'Primary' : 'Extra ' + idx} uploaded (${idx + 1}/${selectedPdfs.length}) ✓`, 'success');
    } catch (_) { return setStatus('Browser blocked file injection.', 'error'); }
    if (idx + 1 < selectedPdfs.length) {
      let attempts = 0;
      const wait = () => {
        const empty = Array.from(document.querySelectorAll('input[type="file"]')).some(i => !i.files || i.files.length === 0);
        if (empty || attempts >= 4000) uploadFilesSequentially(idx + 1, done);
        else { attempts += 400; setTimeout(wait, 400); }
      };
      setTimeout(wait, 600);
    } else done();
  }
  function confirmAndSave() {
    const s = document.querySelector('button[type="submit"]');
    if (s) s.click();
    setStatus('Waiting for confirm button…', 'info');
    waitForClickable(() => findButtonByText('Confirm All Information') || findButtonByText('Confirm All') || document.querySelector('button.bg-\\[\\#FF671F\\]'), btn => {
      if (!btn) return setStatus('Confirm button stayed disabled.', 'error');
      btn.click();
      setStatus('Confirmed ✓', 'success');
      waitForClickable(() => findButtonByText('Save & Continue') || findButtonByText('Save'), save => {
        if (save) { save.click(); setStatus('Save & Continue ✓', 'success'); }
      }, 30000);
    }, 40000);
  }

  // ───────── step 4: slot booking ─────────
  function runSlotBooking() {
    const { date } = getCreds();
    saveCreds();
    if (!date) return setStatus('Pick an appointment date first.', 'error');
    setStatus('Confirming mission…', 'info');
    waitForClickable(() => findButtonByText('Confirm Mission') || findButtonByText('Confirm Mission & IVAC') || document.querySelector('a[href="/appointment/notice"]'), btn => {
      if (btn) { btn.click(); setStatus('Mission confirmed ✓', 'success'); }
      waitForElement(() => document.querySelector('.grid.grid-cols-7'), () => selectCalendarDate(date));
    }, 30000);
  }
  function selectCalendarDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const targetMonth = new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long' });
    let attempts = 0;
    (function tryFind() {
      attempts++;
      const header = getCalendarHeaderText();
      if (header && header.toLowerCase().includes(targetMonth.toLowerCase()) && header.includes(String(y))) {
        const day = findEnabledDayButton(d);
        if (day) {
          day.click();
          setStatus('Date ' + dateStr + ' selected ✓', 'success');
          waitForClickable(() => findButtonByText('Continue Booking'), cont => {
            if (cont) { cont.click(); setStatus('Continue Booking ✓', 'success'); }
          }, 30000);
        } else setStatus('Day ' + d + ' not available.', 'error');
        return;
      }
      if (attempts > 24) return setStatus('Could not reach that month.', 'error');
      const next = document.querySelector('button[aria-label="Next month"]');
      if (next) { next.click(); setTimeout(tryFind, 300); }
    })();
  }
  function getCalendarHeaderText() {
    const g = document.querySelector('.grid.grid-cols-7');
    return g && g.parentElement ? (g.parentElement.textContent || '').trim() : '';
  }
  function findEnabledDayButton(day) {
    for (const b of document.querySelectorAll('.grid.grid-cols-7 button[type="button"]'))
      if ((b.textContent || '').trim() === String(day) && !b.disabled) return b;
    return null;
  }

  // ───────── messages from background ─────────
  chrome.runtime.onMessage.addListener(req => {
    if (req.action === 'toggle_widget') toggleWidget();
  });

  LOG('Ready. Click the extension icon to toggle.');
})();
