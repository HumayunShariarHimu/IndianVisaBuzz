importScripts('origins.js');

chrome.action.onClicked.addListener(async tab => {
  if (!tab.id || !tab.url || !globalThis.IVBOriginPolicy.isAllowedPortalUrl(tab.url)) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'toggle_widget' });
  } catch (_) {
    // The content script may not be available until the page is refreshed.
  }
});
