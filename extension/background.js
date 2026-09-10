// ⚠️ CHANGE THIS to your deployed Vercel URL before packaging.
const LICENSE_SERVER = 'https://indianvisabuzz.vercel.app/api/verify';

chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: 'toggle_widget' }, () => {
    if (chrome.runtime.lastError) { /* ignore */ }
  });
});

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === 'verify_license') {
    fetch(LICENSE_SERVER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: req.key, deviceId: req.deviceId })
    })
      .then(r => r.json())
      .then(d => sendResponse(d))
      .catch(e => sendResponse({ valid: false, reason: 'network_error', detail: String(e) }));
    return true; // keep channel open for async response
  }
});
