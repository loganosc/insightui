const HANDOFF_KEY = 'insightui_extension_payload_v1';
const DEFAULT_INSIGHTUI_URL = 'http://localhost:3000';

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendRuntimeMessage(message) {
  return chrome.runtime.sendMessage(message);
}

async function sendTabMessage(tabId, message) {
  return chrome.tabs.sendMessage(tabId, message);
}

async function ensureContentScript(tabId) {
  try {
    const ping = await sendTabMessage(tabId, { type: 'INSIGHTUI_PING' });
    if (ping?.ok) {
      return true;
    }
  } catch (_error) {
    // Continue to scripting fallback.
  }

  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content.js']
  });

  const pingAfterInject = await sendTabMessage(tabId, { type: 'INSIGHTUI_PING' });
  return Boolean(pingAfterInject?.ok);
}

function setStatus(text, isError = false) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = text;
  statusEl.style.color = isError ? '#b91c1c' : '#065f46';
}

function setMeta(text) {
  document.getElementById('meta').textContent = text;
}

function isRestrictedUrl(url) {
  if (!url) {
    return true;
  }
  return /^(chrome|edge|about|moz-extension|chrome-extension):/i.test(url);
}

function normalizeInsightUiUrl(rawUrl) {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return DEFAULT_INSIGHTUI_URL;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `http://${trimmed}`;
}

async function getScrapeSnapshot(tab) {
  if (!tab?.id) {
    throw new Error('No active tab found.');
  }
  if (isRestrictedUrl(tab.url)) {
    throw new Error('This browser page cannot be scraped.');
  }

  const isReady = await ensureContentScript(tab.id);
  if (!isReady) {
    throw new Error('Could not connect to page scraper script.');
  }

  const result = await sendTabMessage(tab.id, { type: 'INSIGHTUI_CAPTURE_REQUEST' });
  if (!result?.ok) {
    throw new Error(result?.error || 'Capture failed.');
  }

  return result.snapshot;
}

async function waitForTabComplete(tabId, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error('InsightUI tab did not finish loading in time.'));
    }, timeoutMs);

    function listener(updatedTabId, info) {
      if (updatedTabId !== tabId) {
        return;
      }
      if (info.status === 'complete') {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }

    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function injectInsightUiPayload(tabId, payload) {
  await chrome.scripting.executeScript({
    target: { tabId },
    args: [payload, HANDOFF_KEY],
    func: (handoffPayload, key) => {
      localStorage.setItem(key, JSON.stringify(handoffPayload));
      window.dispatchEvent(new CustomEvent('insightui-extension-payload-ready'));
    }
  });
}

async function refreshStatus() {
  const res = await sendRuntimeMessage({ type: 'INSIGHTUI_GET_STATUS' });
  if (!res?.ok) {
    setStatus(res?.error || 'Unable to load status', true);
    return;
  }

  const autoCaptureEl = document.getElementById('autoCapture');
  autoCaptureEl.checked = Boolean(res.data.autoCapture);

  const insightUiUrlInput = document.getElementById('insightUiUrl');
  insightUiUrlInput.value = res.data.insightUiUrl || DEFAULT_INSIGHTUI_URL;

  if (res.data.lastCapture) {
    setStatus('Ready');
    setMeta(`Last capture: ${new Date(res.data.lastCapture).toLocaleString()}`);
  } else {
    setStatus('Ready');
    setMeta('No captures yet for this browser session.');
  }
}

async function handleScrapeNow() {
  try {
    const tab = await getActiveTab();
    setStatus('Capturing current page...');

    const snapshot = await getScrapeSnapshot(tab);
    setStatus('Capture complete.');
    setMeta(`Captured ${snapshot.stats.capturedDomNodes} nodes from ${new URL(tab.url).host}`);
    await refreshStatus();
  } catch (error) {
    setStatus(error?.message || 'Capture failed.', true);
  }
}

async function handleDownload() {
  try {
    const tab = await getActiveTab();
    if (!tab?.id) {
      setStatus('No active tab found.', true);
      return;
    }

    setStatus('Preparing download...');
    const result = await sendRuntimeMessage({ type: 'INSIGHTUI_DOWNLOAD', tabId: tab.id });
    if (!result?.ok) {
      setStatus(result?.error || 'Download failed.', true);
      return;
    }

    setStatus('Download started.');
    setMeta(`Saved as ${result.filename}`);
  } catch (error) {
    setStatus(error?.message || 'Download failed.', true);
  }
}

async function handleAutoCaptureChange(event) {
  try {
    const enabled = event.target.checked;
    const result = await sendRuntimeMessage({ type: 'INSIGHTUI_SET_AUTO_CAPTURE', value: enabled });
    if (!result?.ok) {
      setStatus(result?.error || 'Failed to update auto-capture.', true);
      return;
    }

    setStatus(enabled ? 'Auto-capture enabled.' : 'Auto-capture disabled.');
  } catch (error) {
    setStatus(error?.message || 'Failed to update auto-capture.', true);
  }
}

async function handleInsightUiUrlBlur(event) {
  const insightUiUrl = normalizeInsightUiUrl(event.target.value);
  event.target.value = insightUiUrl;

  await chrome.storage.local.set({ insightUiUrl });
}

async function handleOpenInsightUi() {
  try {
    const tab = await getActiveTab();
    setStatus('Capturing and opening InsightUI...');
    const snapshot = await getScrapeSnapshot(tab);

    const urlInput = document.getElementById('insightUiUrl');
    const insightUiUrl = normalizeInsightUiUrl(urlInput.value);
    await chrome.storage.local.set({ insightUiUrl });

    const openedTab = await chrome.tabs.create({ url: insightUiUrl });
    if (!openedTab?.id) {
      throw new Error('Could not open InsightUI tab.');
    }

    await waitForTabComplete(openedTab.id);

    const handoffPayload = {
      source: 'insightui-chrome-extension',
      handedOffAt: new Date().toISOString(),
      pageSnapshot: snapshot
    };

    await injectInsightUiPayload(openedTab.id, handoffPayload);

    setStatus('InsightUI opened and prefilled.');
    setMeta(`Handed off ${snapshot.stats.capturedDomNodes} nodes from ${new URL(tab.url).host}`);
  } catch (error) {
    setStatus(error?.message || 'Failed to open InsightUI.', true);
  }
}

function wireUi() {
  document.getElementById('scrapeNow').addEventListener('click', () => {
    handleScrapeNow();
  });

  document.getElementById('downloadJson').addEventListener('click', () => {
    handleDownload();
  });

  document.getElementById('autoCapture').addEventListener('change', (event) => {
    handleAutoCaptureChange(event);
  });

  document.getElementById('insightUiUrl').addEventListener('blur', (event) => {
    handleInsightUiUrlBlur(event);
  });

  document.getElementById('openInsightUi').addEventListener('click', () => {
    handleOpenInsightUi();
  });
}

wireUi();
refreshStatus();
