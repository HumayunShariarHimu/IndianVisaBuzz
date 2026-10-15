(() => {
  'use strict';

  const PROFILE_KEY = 'ivb.profile.v2';
  const LANGUAGE_KEY = 'ivb.language.v1';
  const catalog = window.IVB_I18N;
  if (!catalog) throw new Error('IndianVisaBuzz language catalog did not load.');

  const navButtons = [...document.querySelectorAll('[data-view]')];
  const pages = [...document.querySelectorAll('[data-page]')];
  const pageLabel = document.getElementById('page-label');
  const languageButtons = [...document.querySelectorAll('[data-language]')];
  const labels = {
    overview: 'pageOverview',
    profile: 'pageProfile',
    documents: 'pageDocuments',
    'slot-buddy': 'pageSlot',
    extension: 'pageExtension'
  };
  let language = getLanguage();
  let activePage = 'overview';
  let selectedFiles = [];
  let toastTimer;
  const liveMessages = new Map();
  const textSnapshots = captureTextNodes();
  const attributeSnapshots = captureAttributes();

  function getLanguage() {
    try {
      const saved = localStorage.getItem(LANGUAGE_KEY);
      return saved === 'en' || saved === 'bn' ? saved : catalog.defaultLanguage;
    } catch (_) {
      return catalog.defaultLanguage;
    }
  }

  function normalize(value) {
    return String(value).replace(/\s+/g, ' ').trim();
  }

  function captureTextNodes() {
    const snapshots = [];
    const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement || node.parentElement.closest('script,style')) continue;
      const source = node.nodeValue;
      if (normalize(source)) snapshots.push({ node, source });
    }
    return snapshots;
  }

  function captureAttributes() {
    const snapshots = [];
    const attributes = ['aria-label', 'aria-description', 'placeholder', 'title', 'alt'];
    document.querySelectorAll('*').forEach(element => {
      attributes.forEach(attribute => {
        if (element.hasAttribute(attribute)) {
          snapshots.push({ element, attribute, source: element.getAttribute(attribute) });
        }
      });
    });
    return snapshots;
  }

  function translateStatic(languageCode) {
    textSnapshots.forEach(({ node, source }) => {
      if (!node.isConnected) return;
      const phrase = normalize(source);
      const translated = catalog.copy[phrase]?.[languageCode] || phrase;
      const leading = source.match(/^\s*/)?.[0] || '';
      const trailing = source.match(/\s*$/)?.[0] || '';
      node.nodeValue = `${leading}${translated}${trailing}`;
    });
    attributeSnapshots.forEach(({ element, attribute, source }) => {
      if (!element.isConnected) return;
      const phrase = normalize(source);
      const translated = catalog.attributes[phrase]?.[languageCode]
        || catalog.copy[phrase]?.[languageCode]
        || phrase;
      element.setAttribute(attribute, translated);
    });
  }

  function format(message, params = {}) {
    if (typeof message === 'function') return message(params);
    return String(message || '').replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ''));
  }

  function t(key, params = {}, languageCode = language) {
    const messages = catalog.messages[languageCode];
    if (key === 'pdfErrors') {
      const errors = params.errors || [];
      const first = errors[0];
      if (!first) return '';
      const firstText = format(messages[first.key], first.params);
      if (errors.length === 1) return firstText;
      const more = format(messages.extraIssues, { count: errors.length - 1 });
      return `${firstText} (${more})`;
    }
    return format(messages[key], params);
  }

  function setMessage(element, key, params = {}) {
    if (!element) return;
    liveMessages.set(element, { key, params });
    element.textContent = t(key, params);
  }

  function refreshLiveMessages() {
    for (const [element, message] of liveMessages) {
      if (!element.isConnected) {
        liveMessages.delete(element);
        continue;
      }
      element.textContent = t(message.key, message.params);
    }
  }

  function applyLanguage() {
    document.documentElement.lang = language;
    translateStatic(language);
    refreshLiveMessages();
    languageButtons.forEach(button => {
      const active = button.dataset.language === language;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const languageGroup = document.querySelector('.language-toggle');
    if (languageGroup) languageGroup.setAttribute('aria-label', language === 'bn' ? 'ভাষা নির্বাচন' : 'Choose language');
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = language === 'bn'
        ? 'IndianVisaBuzz — ভারতীয় ভিসা আবেদন প্রস্তুতি, নথির তালিকা এবং সরকারি সূত্র এক জায়গায়।'
        : 'IndianVisaBuzz — prepare an Indian visa application with a document checklist and official sources.';
    }
    if (pageLabel) pageLabel.textContent = t(labels[activePage]);
    document.title = `${t(labels[activePage])} · IndianVisaBuzz`;
  }

  function setLanguage(nextLanguage) {
    if (nextLanguage !== 'bn' && nextLanguage !== 'en') return;
    if (language === nextLanguage) return;
    language = nextLanguage;
    try { localStorage.setItem(LANGUAGE_KEY, language); } catch (_) { /* Language still changes for this session. */ }
    applyLanguage();
    updateOverview();
    renderFiles();
  }

  function navigate(name) {
    if (!labels[name]) return;
    activePage = name;
    pages.forEach(page => {
      const active = page.dataset.page === name;
      page.classList.toggle('active', active);
      page.hidden = !active;
    });
    navButtons.forEach(button => {
      const active = button.dataset.view === name;
      button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    pageLabel.textContent = t(labels[name]);
    document.title = `${t(labels[name])} · IndianVisaBuzz`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navButtons.forEach(button => button.addEventListener('click', () => navigate(button.dataset.view)));
  document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.go)));
  languageButtons.forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.language)));

  const form = document.getElementById('profile-form');
  const remember = document.getElementById('remember-profile');
  const profileStatus = document.getElementById('profile-status');
  const fieldNames = ['fullName', 'email', 'phone', 'dob', 'passport', 'nid', 'visaType', 'center'];

  function getFormData() {
    return Object.fromEntries(fieldNames.map(name => [name, String(form.elements[name].value || '').trim()]));
  }

  function countProfile(data) {
    const required = ['fullName', 'phone', 'dob', 'passport'];
    const completed = required.filter(key => Boolean(data[key])).length;
    const optional = ['email', 'nid', 'visaType', 'center'];
    const extra = optional.filter(key => Boolean(data[key])).length;
    return { completed: completed + extra, total: required.length + optional.length, required: completed };
  }

  function updateOverview() {
    const progress = countProfile(getFormData());
    const profilePercent = Math.round((progress.completed / progress.total) * 100);
    document.getElementById('profile-progress').textContent = `${profilePercent}%`;
    document.getElementById('profile-progress-bar').style.width = `${profilePercent}%`;
    setMessage(document.getElementById('profile-summary'), progress.required === 4 ? 'profileReady' : 'profileMissing', { count: progress.required });

    const docCount = selectedFiles.length;
    document.getElementById('document-progress').textContent = `${docCount} / 4`;
    document.getElementById('document-progress-bar').style.width = `${docCount * 25}%`;
    setMessage(document.getElementById('document-summary'), docCount ? 'documentsSelected' : 'noPdfSelected', { count: docCount });
  }

  function loadRememberedProfile() {
    try {
      const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
      if (!saved || typeof saved !== 'object') return;
      fieldNames.forEach(name => {
        if (typeof saved[name] === 'string' && form.elements[name]) form.elements[name].value = saved[name];
      });
      remember.checked = true;
      setMessage(profileStatus, 'profileLoaded');
    } catch (error) {
      try { localStorage.removeItem(PROFILE_KEY); } catch (_) { /* Storage may be disabled. */ }
    }
  }

  function persistProfile() {
    try {
      if (!remember.checked) {
        localStorage.removeItem(PROFILE_KEY);
        setMessage(profileStatus, 'profileSessionOnly');
        return;
      }
      localStorage.setItem(PROFILE_KEY, JSON.stringify(getFormData()));
      setMessage(profileStatus, 'profileSaved');
    } catch (_) {
      setMessage(profileStatus, 'storageUnavailable');
    }
  }

  function showToast(key, params = {}) {
    const toast = document.getElementById('toast');
    setMessage(toast, key, params);
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (remember.checked) persistProfile();
    else setMessage(profileStatus, 'profilePrepared');
    updateOverview();
    showToast(remember.checked ? 'profileSavedToast' : 'profilePreparedToast');
  });
  form.addEventListener('input', () => {
    if (remember.checked) persistProfile();
    updateOverview();
  });
  form.addEventListener('change', () => {
    if (remember.checked) persistProfile();
    updateOverview();
  });
  remember.addEventListener('change', () => {
    if (remember.checked) persistProfile();
    else {
      try { localStorage.removeItem(PROFILE_KEY); } catch (_) { /* Storage may be disabled. */ }
      setMessage(profileStatus, 'profileRemoved');
    }
  });

  const picker = document.getElementById('document-picker');
  const list = document.getElementById('selected-files');
  const clearButton = document.getElementById('clear-files');
  const documentStatus = document.getElementById('document-status');
  const MAX_FILES = 4;
  const MAX_BYTES = 500 * 1024;

  async function isPdf(file) {
    if (!(file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))) return false;
    try {
      const bytes = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
      const marker = [0x25, 0x50, 0x44, 0x46, 0x2d];
      outer: for (let start = 0; start <= bytes.length - marker.length; start += 1) {
        for (let offset = 0; offset < marker.length; offset += 1) {
          if (bytes[start + offset] !== marker[offset]) continue outer;
        }
        return true;
      }
    } catch (_) { /* Invalid or unreadable file. */ }
    return false;
  }

  function formatBytes(bytes) {
    return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  }

  function renderFiles() {
    list.replaceChildren();
    if (!selectedFiles.length) {
      const empty = document.createElement('li');
      empty.className = 'empty-files';
      empty.textContent = t('emptyFiles');
      list.append(empty);
    } else {
      selectedFiles.forEach((file, index) => {
        const row = document.createElement('li');
        row.className = 'file-row';
        const type = document.createElement('span');
        type.className = 'file-type';
        type.textContent = 'PDF';
        const meta = document.createElement('span');
        meta.className = 'file-meta';
        const name = document.createElement('strong');
        name.textContent = file.name;
        const size = document.createElement('small');
        size.textContent = `${formatBytes(file.size)} · ${index === 0 ? t('primaryFile') : t('extraFile', { index })}`;
        meta.append(name, size);
        const remove = document.createElement('button');
        remove.className = 'remove-file';
        remove.type = 'button';
        remove.textContent = '×';
        remove.setAttribute('aria-label', t('removeFile', { file: file.name }));
        remove.addEventListener('click', () => {
          selectedFiles.splice(index, 1);
          renderFiles();
        });
        row.append(type, meta, remove);
        list.append(row);
      });
    }
    document.getElementById('doc-count').textContent = selectedFiles.length;
    clearButton.disabled = !selectedFiles.length;
    updateOverview();
  }

  picker.addEventListener('change', async event => {
    const control = event.target;
    const incoming = [...(control.files || [])];
    control.value = '';
    control.disabled = true;
    setMessage(documentStatus, 'checkingPdf');
    const errors = [];
    try {
      for (const file of incoming) {
        if (!await isPdf(file)) {
          errors.push({ key: 'invalidPdf', params: { file: file.name } });
          continue;
        }
        if (file.size > MAX_BYTES) {
          errors.push({ key: 'tooLarge', params: { file: file.name } });
          continue;
        }
        if (selectedFiles.some(current => current.name.toLowerCase() === file.name.toLowerCase())) continue;
        if (selectedFiles.length >= MAX_FILES) {
          errors.push({ key: 'maxFiles', params: {} });
          continue;
        }
        selectedFiles.push(file);
      }
      if (errors.length) setMessage(documentStatus, 'pdfErrors', { errors });
      else setMessage(documentStatus, 'pdfReady');
      renderFiles();
    } finally {
      control.disabled = false;
    }
  });

  clearButton.addEventListener('click', () => {
    selectedFiles = [];
    setMessage(documentStatus, 'filesCleared');
    renderFiles();
  });

  applyLanguage();
  loadRememberedProfile();
  renderFiles();
})();
