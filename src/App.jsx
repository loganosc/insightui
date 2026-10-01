import React, { useState, useCallback, useEffect } from 'react';
import TopBar from './components/TopBar';
import Canvas from './components/Canvas';
import Inspector from './components/Inspector';
import BottomBar from './components/BottomBar';
import { analyzeInterface, askFollowUpQuestion, DEFAULT_MODEL } from './utils/ollamaApi';
import { estimateElementCoordinates } from './utils/coordinates';
import './App.css';

const EXTENSION_HANDOFF_KEY = 'insightui_extension_payload_v1';
const EXTENSION_READY_EVENT = 'insightui-extension-payload-ready';
const MAX_HTML_CHARS = 30000;
const MAX_CSS_CHARS = 20000;
const MAX_DOM_CHARS = 30000;
const MAX_DOM_NODES = 220;

const truncateText = (value, maxChars) => {
  if (!value) return '';
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}\n\n/* Truncated for analysis size limits */`;
};

const buildCssFromStylesheets = (stylesheets = []) => {
  const cssChunks = [];
  let totalChars = 0;
  const maxRules = 260;
  let rulesUsed = 0;

  for (const sheet of stylesheets) {
    if (!sheet?.accessible || !Array.isArray(sheet.rules) || rulesUsed >= maxRules) {
      continue;
    }

    const remaining = maxRules - rulesUsed;
    const selectedRules = sheet.rules.slice(0, remaining);
    const sheetChunk = `/* ${sheet.href || 'inline stylesheet'} */\n${selectedRules.join('\n')}`;
    cssChunks.push(sheetChunk);
    rulesUsed += selectedRules.length;
    totalChars += sheetChunk.length;

    if (totalChars >= MAX_CSS_CHARS) {
      break;
    }
  }

  const cssText = cssChunks.join('\n\n');
  return truncateText(cssText, MAX_CSS_CHARS);
};

const buildDomSummary = (nodes = []) => {
  const meaningfulTags = new Set([
    'header', 'main', 'nav', 'footer', 'section', 'article', 'aside',
    'h1', 'h2', 'h3', 'h4', 'button', 'a', 'input', 'select', 'textarea',
    'label', 'form', 'img', 'video', 'table'
  ]);

  const filtered = nodes.filter((node) => {
    if (!node) return false;
    const hasRole = Boolean(node.attrs?.role || node.attrs?.['aria-label']);
    const hasText = Boolean(node.text && node.text.length > 8);
    const interactive = ['button', 'a', 'input', 'select', 'textarea'].includes(node.tag);
    return interactive || meaningfulTags.has(node.tag) || hasRole || hasText;
  });

  const simplifiedNodes = filtered.slice(0, MAX_DOM_NODES).map((node) => ({
    tag: node.tag,
    selector: node.selector,
    id: node.id,
    classes: node.classes,
    role: node.attrs?.role || null,
    name: node.attrs?.name || null,
    ariaLabel: node.attrs?.['aria-label'] || null,
    text: node.text,
    rect: node.rect
  }));
  return truncateText(JSON.stringify(simplifiedNodes, null, 2), MAX_DOM_CHARS);
};

const cleanHtmlForAnalysis = (html = '') => {
  if (!html) return '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    doc.querySelectorAll('script, style, noscript, svg, canvas, iframe').forEach((el) => el.remove());
    doc.querySelectorAll('*').forEach((el) => {
      if (el.hasAttribute('style') && (el.getAttribute('style') || '').length > 500) {
        el.removeAttribute('style');
      }
      if (el.hasAttribute('class')) {
        const cls = (el.getAttribute('class') || '').split(/\s+/).slice(0, 6).join(' ');
        el.setAttribute('class', cls);
      }
    });

    const core = doc.querySelector('main') || doc.body || doc.documentElement;
    const compact = (core?.outerHTML || html).replace(/\s+/g, ' ').trim();
    return truncateText(compact, MAX_HTML_CHARS);
  } catch (_error) {
    return truncateText(html.replace(/\s+/g, ' ').trim(), MAX_HTML_CHARS);
  }
};

function App() {
  const [screenshot, setScreenshot] = useState(null);
  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode, setCssCode] = useState('');
  const [domContent, setDomContent] = useState('');
  const [description, setDescription] = useState('');
  const [critiqueData, setCritiqueData] = useState({});
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [theme, setTheme] = useState(() => {
    try {
      const saved = window.localStorage.getItem('insightui_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (_error) {
      // Storage unavailable; fall back to the default theme
    }
    return 'light';
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [highlightBox, setHighlightBox] = useState(null);
  const [selectedCritique, setSelectedCritique] = useState(null);

  const runAnalysis = useCallback(async (inputs) => {
    const { screenshot: inputScreenshot, html, css, dom, description: inputDescription } = inputs;
    if (!inputScreenshot && !html && !css && !dom && !inputDescription) {
      alert('Please provide a screenshot, code, or description before analyzing.');
      return;
    }

    setCritiqueData({});
    setHighlightBox(null);
    setSelectedCritique(null);
    setIsAnalyzing(true);

    try {
      const result = await analyzeInterface(
        {
          screenshot: inputScreenshot,
          html,
          css,
          dom,
          description: inputDescription
        },
        selectedModel
      );
      setCritiqueData(result);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed: ' + error.message);
      setCritiqueData({});
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedModel]);

  const applySnapshotToInputs = useCallback(async (snapshot, autoAnalyze = false) => {
    const nextHtml = cleanHtmlForAnalysis(snapshot?.html || '');
    const nextCss = buildCssFromStylesheets(snapshot?.stylesheets || []);
    const nextDom = buildDomSummary(snapshot?.nodes || []);
    const snapshotImage = snapshot?.screenshot || snapshot?.image || null;
    const nextDescription = [
      `Captured page: ${snapshot?.url || 'Unknown URL'}`,
      `Title: ${snapshot?.title || 'Untitled'}`,
      `Captured at: ${snapshot?.capturedAt || new Date().toISOString()}`,
      `Captured nodes: ${snapshot?.stats?.capturedDomNodes ?? 0}`
    ].join('\n');

    if (snapshotImage) {
      setScreenshot(snapshotImage);
    }
    setHtmlCode(nextHtml);
    setCssCode(nextCss);
    setDomContent(nextDom);
    setDescription(nextDescription);
    setZoom(1);
    setHighlightBox(null);
    setSelectedCritique(null);

    if (autoAnalyze) {
      await runAnalysis({
        screenshot: snapshotImage || screenshot,
        html: nextHtml,
        css: nextCss,
        dom: nextDom,
        description: nextDescription
      });
    }
  }, [runAnalysis, screenshot]);

  const handleAnalyze = useCallback(async (overrideScreenshot = null) => {
    const activeScreenshot = overrideScreenshot || screenshot;
    await runAnalysis({
      screenshot: activeScreenshot,
      html: htmlCode,
      css: cssCode,
      dom: domContent,
      description
    });
    if (overrideScreenshot) {
      setScreenshot(overrideScreenshot);
    }
  }, [screenshot, htmlCode, cssCode, domContent, description, runAnalysis]);

  const handleScreenshotUpload = useCallback(async (imageData) => {
    setScreenshot(imageData);
  }, []);

  const handleSelectCritique = useCallback((critiqueInfo) => {
    setSelectedCritique(critiqueInfo);

    if (screenshot) {
      const img = new Image();
      img.onload = () => {
        const coords = estimateElementCoordinates(
          critiqueInfo.item.element,
          img.naturalWidth,
          img.naturalHeight
        );
        setHighlightBox(coords);
      };
      img.src = screenshot;
    }
  }, [screenshot]);

  const handleChat = async (chatData) => {
    const response = await askFollowUpQuestion(
      {
        screenshot,
        html: htmlCode,
        css: cssCode,
        dom: domContent,
        description
      },
      chatData,
      selectedModel
    );
    return response;
  };

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === 'light' ? 'dark' : 'light';
      try {
        window.localStorage.setItem('insightui_theme', next);
      } catch (_error) {
        // Ignore storage failures; theme still applies for this session
      }
      return next;
    });
  };

  const handleModelChange = (model) => {
    setSelectedModel(model);
  };

  const handleSnapshotImport = useCallback(async (snapshot) => {
    await applySnapshotToInputs(snapshot, false);
  }, [applySnapshotToInputs]);

  const loadExtensionPayload = useCallback(async () => {
    const rawPayload = window.localStorage.getItem(EXTENSION_HANDOFF_KEY);
    if (!rawPayload) {
      return;
    }

    try {
      const payload = JSON.parse(rawPayload);
      const snapshot = payload?.pageSnapshot;
      if (!snapshot) {
        return;
      }

      window.localStorage.removeItem(EXTENSION_HANDOFF_KEY);
      await applySnapshotToInputs(snapshot, false);
    } catch (error) {
      console.error('Failed to load extension payload:', error);
    }
  }, [applySnapshotToInputs]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('theme-dark', theme === 'dark');
    root.classList.toggle('theme-light', theme === 'light');
  }, [theme]);

  useEffect(() => {
    const handleReadyEvent = () => {
      loadExtensionPayload();
    };

    loadExtensionPayload();
    window.addEventListener(EXTENSION_READY_EVENT, handleReadyEvent);

    return () => {
      window.removeEventListener(EXTENSION_READY_EVENT, handleReadyEvent);
    };
  }, [loadExtensionPayload]);

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <TopBar
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
        isAnalyzing={isAnalyzing}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main id="main-content" className="main-layout" tabIndex={-1}>
        <Canvas
          screenshot={screenshot}
          onScreenshotUpload={handleScreenshotUpload}
          highlightBox={highlightBox}
          zoom={zoom}
          onZoomChange={setZoom}
          isAnalyzing={isAnalyzing}
          htmlCode={htmlCode}
          cssCode={cssCode}
          domContent={domContent}
          description={description}
          onHtmlChange={setHtmlCode}
          onCssChange={setCssCode}
          onDomChange={setDomContent}
          onDescriptionChange={setDescription}
          onSnapshotImport={handleSnapshotImport}
          onAnalyze={() => handleAnalyze()}
        />

        <Inspector
          critiqueData={critiqueData}
          onSelectCritique={handleSelectCritique}
          selectedCritique={selectedCritique}
          onChat={handleChat}
          isLoading={isAnalyzing}
        />
      </main>

      <BottomBar
        critiqueData={critiqueData}
        screenshot={screenshot}
        isLoading={isAnalyzing}
      />
    </div>
  );
}

export default App;
