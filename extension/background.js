chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: 'toggle_widget' }, () => {
    if (chrome.runtime.lastError) { /* ignore */ }
  });
});
