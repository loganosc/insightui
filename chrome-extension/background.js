const latestByTab = new Map();

function getTimestampLabel() {
  return new Date().toISOString().replace(/[.:]/g, '-');
}

async function saveSnapshot(tabId, payload) {
  latestByTab.set(tabId, payload);

  const key = `snapshot_${tabId}`;
  await chrome.storage.local.set({ [key]: payload, lastCapture: payload.capturedAt });
}

async function getSnapshot(tabId) {
  const inMemory = latestByTab.get(tabId);
  if (inMemory) {
    return inMemory;
  }

  const key = `snapshot_${tabId}`;
  const stored = await chrome.storage.local.get([key]);
  return stored[key] || null;
}

async function downloadSnapshot(tabId) {
  const snapshot = await getSnapshot(tabId);
  if (!snapshot) {
    throw new Error('No snapshot available yet for this tab. Run capture first.');
  }

  const filename = `insightui-snapshot-${tabId}-${getTimestampLabel()}.json`;
  const json = JSON.stringify(snapshot, null, 2);
  const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;

  await chrome.downloads.download({
    url: dataUrl,
    filename,
    saveAs: true
  });

  return filename;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'INSIGHTUI_CAPTURE_RESULT') {
    const tabId = sender.tab?.id;
    if (typeof tabId !== 'number') {
      sendResponse({ ok: false, error: 'Missing sender tab id.' });
      return false;
    }

    saveSnapshot(tabId, message.payload)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error?.message || 'Failed to save snapshot.' }));
    return true;
  }

  if (message?.type === 'INSIGHTUI_GET_STATUS') {
    chrome.storage.local
      .get({ autoCapture: true, lastCapture: null, insightUiUrl: 'http://localhost:3000' })
      .then((data) => sendResponse({ ok: true, data }))
      .catch((error) => sendResponse({ ok: false, error: error?.message || 'Failed to fetch status.' }));
    return true;
  }

  if (message?.type === 'INSIGHTUI_SET_AUTO_CAPTURE') {
    chrome.storage.local
      .set({ autoCapture: Boolean(message.value) })
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error?.message || 'Failed to update setting.' }));
    return true;
  }

  if (message?.type === 'INSIGHTUI_DOWNLOAD') {
    const tabId = message?.tabId;
    if (typeof tabId !== 'number') {
      sendResponse({ ok: false, error: 'Invalid tab id.' });
      return false;
    }

    downloadSnapshot(tabId)
      .then((filename) => sendResponse({ ok: true, filename }))
      .catch((error) => sendResponse({ ok: false, error: error?.message || 'Download failed.' }));
    return true;
  }

  return false;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  latestByTab.delete(tabId);
  chrome.storage.local.remove(`snapshot_${tabId}`);
});
