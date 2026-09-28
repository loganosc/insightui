(() => {
  const EXT_SOURCE = 'insightui-scraper';
  const MAX_NODES = 1500;
  const MAX_TEXT_LENGTH = 180;
  const CSS_PROPS = [
    'display',
    'position',
    'width',
    'height',
    'margin',
    'padding',
    'font-family',
    'font-size',
    'font-weight',
    'line-height',
    'color',
    'background-color',
    'border',
    'border-radius',
    'box-shadow',
    'opacity',
    'z-index',
    'flex',
    'grid-template-columns',
    'grid-template-rows',
    'align-items',
    'justify-content'
  ];

  function toCssPath(element) {
    const parts = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE && parts.length < 8) {
      const tag = current.tagName.toLowerCase();
      if (current.id) {
        parts.unshift(`${tag}#${current.id}`);
        break;
      }

      let segment = tag;
      const classList = Array.from(current.classList || []).slice(0, 2);
      if (classList.length > 0) {
        segment += `.${classList.join('.')}`;
      } else if (current.parentElement) {
        const siblings = Array.from(current.parentElement.children).filter(
          (child) => child.tagName === current.tagName
        );
        if (siblings.length > 1) {
          segment += `:nth-of-type(${siblings.indexOf(current) + 1})`;
        }
      }

      parts.unshift(segment);
      current = current.parentElement;
    }

    return parts.join(' > ');
  }

  function getComputedStyleSubset(element) {
    const computed = window.getComputedStyle(element);
    const subset = {};

    for (const prop of CSS_PROPS) {
      subset[prop] = computed.getPropertyValue(prop);
    }

    return subset;
  }

  function serializeElement(element) {
    const rect = element.getBoundingClientRect();
    const text = (element.textContent || '').replace(/\s+/g, ' ').trim();

    return {
      tag: element.tagName.toLowerCase(),
      id: element.id || null,
      classes: Array.from(element.classList || []),
      attrs: {
        role: element.getAttribute('role'),
        name: element.getAttribute('name'),
        type: element.getAttribute('type'),
        href: element.getAttribute('href'),
        src: element.getAttribute('src'),
        'aria-label': element.getAttribute('aria-label')
      },
      text: text.slice(0, MAX_TEXT_LENGTH),
      selector: toCssPath(element),
      rect: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      },
      style: getComputedStyleSubset(element)
    };
  }

  function serializeStylesheets() {
    return Array.from(document.styleSheets).map((sheet) => {
      const href = sheet.href || null;

      try {
        const rules = Array.from(sheet.cssRules || []).map((rule) => rule.cssText);
        return {
          href,
          accessible: true,
          ruleCount: rules.length,
          rules
        };
      } catch (error) {
        return {
          href,
          accessible: false,
          ruleCount: null,
          reason: error?.message || 'Stylesheet is not accessible due to CORS or browser restrictions.'
        };
      }
    });
  }

  function buildSnapshot(trigger) {
    const elements = Array.from(document.querySelectorAll('*')).slice(0, MAX_NODES);
    const nodes = elements.map(serializeElement);

    return {
      source: EXT_SOURCE,
      trigger,
      capturedAt: new Date().toISOString(),
      url: window.location.href,
      title: document.title,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY
      },
      stats: {
        totalDomNodes: document.querySelectorAll('*').length,
        capturedDomNodes: nodes.length,
        maxNodes: MAX_NODES
      },
      html: document.documentElement.outerHTML,
      stylesheets: serializeStylesheets(),
      nodes
    };
  }

  async function capture(trigger) {
    const snapshot = buildSnapshot(trigger);
    await chrome.runtime.sendMessage({ type: 'INSIGHTUI_CAPTURE_RESULT', payload: snapshot });
    return snapshot;
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'INSIGHTUI_CAPTURE_REQUEST') {
      capture('manual')
        .then((snapshot) => sendResponse({ ok: true, snapshot }))
        .catch((error) => sendResponse({ ok: false, error: error?.message || 'Capture failed' }));
      return true;
    }

    if (message?.type === 'INSIGHTUI_PING') {
      sendResponse({ ok: true });
      return false;
    }

    return false;
  });

  chrome.storage.local.get({ autoCapture: true }, ({ autoCapture }) => {
    if (!autoCapture) {
      return;
    }

    setTimeout(() => {
      capture('auto').catch(() => {
        // Keep extension non-blocking when capture fails on restricted pages.
      });
    }, 200);
  });
})();
