(() => {
  'use strict';

  const PROFILE_KEY = 'ivb.profile.v2';
  const navButtons = [...document.querySelectorAll('[data-view]')];
  const pages = [...document.querySelectorAll('[data-page]')];
  const pageLabel = document.getElementById('page-label');
  const labels = {
    overview: 'সংক্ষিপ্ত বিবরণ',
    profile: 'আবেদনকারীর তথ্য',
    documents: 'ডকুমেন্ট প্রস্তুতি',
    'slot-buddy': 'Slot Buddy',
    extension: 'ব্রাউজার সহায়ক'
  };
  let selectedFiles = [];
  let toastTimer;

  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  function navigate(name) {
    if (!labels[name]) return;
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
    pageLabel.textContent = labels[name];
    document.title = `${labels[name]} · IndianVisaBuzz`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navButtons.forEach(button => button.addEventListener('click', () => navigate(button.dataset.view)));
  document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => navigate(button.dataset.go)));

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
    const data = getFormData();
    const progress = countProfile(data);
    const profilePercent = Math.round((progress.completed / progress.total) * 100);
    document.getElementById('profile-progress').textContent = `${profilePercent}%`;
    document.getElementById('profile-progress-bar').style.width = `${profilePercent}%`;
    document.getElementById('profile-summary').textContent = progress.required === 4
      ? 'আবশ্যক তথ্য পূরণ হয়েছে — portal-এ মিলিয়ে নিন'
      : `${progress.required} / 4টি আবশ্যক তথ্য পূরণ হয়েছে`;

    const docCount = selectedFiles.length;
    document.getElementById('document-progress').textContent = `${docCount} / 4`;
    document.getElementById('document-progress-bar').style.width = `${docCount * 25}%`;
    document.getElementById('document-summary').textContent = docCount
      ? `${docCount}টি PDF এই tab-এ নির্বাচন করা হয়েছে`
      : 'PDF নির্বাচন করা হয়নি';
  }

  function loadRememberedProfile() {
    try {
      const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
      if (!saved || typeof saved !== 'object') return;
      fieldNames.forEach(name => {
        if (typeof saved[name] === 'string' && form.elements[name]) form.elements[name].value = saved[name];
      });
      remember.checked = true;
      profileStatus.textContent = 'এই browser-এ সংরক্ষিত profile লোড হয়েছে।';
    } catch (error) {
      try { localStorage.removeItem(PROFILE_KEY); } catch (_) { /* Storage may be disabled. */ }
    }
  }

  function persistProfile() {
    try {
      if (!remember.checked) {
        localStorage.removeItem(PROFILE_KEY);
        profileStatus.textContent = 'প্রোফাইল কেবল এই tab-এ আছে; browser বন্ধ হলে সংরক্ষিত থাকবে না।';
        return;
      }
      localStorage.setItem(PROFILE_KEY, JSON.stringify(getFormData()));
      profileStatus.textContent = 'প্রোফাইল এই browser-এর local storage-এ সংরক্ষিত হয়েছে; IndianVisaBuzz server-এ পাঠানো হয়নি।';
    } catch (_) {
      profileStatus.textContent = 'Browser storage বন্ধ থাকায় প্রোফাইল সংরক্ষণ করা যায়নি; তথ্য এই tab-এ আছে।';
    }
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (remember.checked) persistProfile();
    else profileStatus.textContent = 'তথ্য এই tab-এ প্রস্তুত আছে। স্থায়ীভাবে রাখতে checkbox নির্বাচন করুন।';
    updateOverview();
    showToast(remember.checked ? 'প্রোফাইল এই device-এ সংরক্ষিত হয়েছে।' : 'তথ্য এই tab-এ প্রস্তুত।');
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
      profileStatus.textContent = 'এই browser থেকে সংরক্ষিত profile মুছে ফেলা হয়েছে।';
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
      empty.textContent = 'এখনও কোনো ফাইল নির্বাচন করা হয়নি।';
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
        size.textContent = `${formatBytes(file.size)} · ${index === 0 ? 'প্রধান নথি' : `অতিরিক্ত ${index}`}`;
        meta.append(name, size);
        const remove = document.createElement('button');
        remove.className = 'remove-file';
        remove.type = 'button';
        remove.textContent = '×';
        remove.setAttribute('aria-label', `${file.name} সরান`);
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
    documentStatus.textContent = 'PDF file-এর content যাচাই করা হচ্ছে…';
    const errors = [];
    try {
    for (const file of incoming) {
      if (!await isPdf(file)) {
        errors.push(`${file.name}: বৈধ PDF content পাওয়া যায়নি`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        errors.push(`${file.name}: 500 KB-এর বেশি`);
        continue;
      }
      if (selectedFiles.some(current => current.name.toLowerCase() === file.name.toLowerCase())) continue;
      if (selectedFiles.length >= MAX_FILES) {
        errors.push('সর্বোচ্চ ৪টি ফাইল নির্বাচন করা যাবে');
        continue;
      }
      selectedFiles.push(file);
    }
    documentStatus.textContent = errors.length
      ? `${errors[0]}${errors.length > 1 ? ` (+${errors.length - 1}টি সমস্যা)` : ''}`
      : 'PDF content ঠিক আছে। নির্বাচিত PDF কেবল এই tab-এ থাকে; IndianVisaBuzz server-এ পাঠানো হয় না।';
    renderFiles();
    } finally {
      control.disabled = false;
    }
  });

  clearButton.addEventListener('click', () => {
    selectedFiles = [];
    documentStatus.textContent = 'নির্বাচিত file list মুছে ফেলা হয়েছে।';
    renderFiles();
  });

  loadRememberedProfile();
  renderFiles();
})();
