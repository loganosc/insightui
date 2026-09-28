import React, { useRef } from 'react';
import Icon from './Icon';
import './InterfaceInput.css';

const InterfaceInput = ({
  htmlCode,
  cssCode,
  domContent,
  description,
  onHtmlChange,
  onCssChange,
  onDomChange,
  onDescriptionChange,
  onSnapshotImport,
  onAnalyze,
  isAnalyzing
}) => {
  const htmlFileRef = useRef(null);
  const cssFileRef = useRef(null);
  const jsonFileRef = useRef(null);

  const handleFileUpload = (event, onChange) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.readAsText(file);
  };

  const handleJsonUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        const snapshot = parsed?.pageSnapshot || parsed;

        if (!snapshot || (!snapshot.html && !snapshot.nodes && !snapshot.stylesheets)) {
          throw new Error('Not a valid InsightUI scraper JSON payload.');
        }

        onSnapshotImport?.(snapshot);
      } catch (error) {
        alert(`Failed to import JSON: ${error.message}`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <section className="interface-input-panel">
      <div className="interface-input-header">
        <div>
          <h3>Interface inputs</h3>
          <p>Add code or context alongside the screenshot. Any combination works.</p>
        </div>
        <label className="ghost-button">
          <Icon name="file" size={14} />
          Import snapshot JSON
          <input
            type="file"
            accept="application/json,.json"
            ref={jsonFileRef}
            onChange={handleJsonUpload}
          />
        </label>
      </div>

      <div className="field-grid">
        <div className="field-card">
          <div className="field-card-header">
            <span className="field-label">
              <span className="field-tag">HTML</span>
              Markup
            </span>
            <label className="file-upload-label">
              <Icon name="upload" size={12} />
              Upload
              <input
                type="file"
                accept="text/html,.html"
                ref={htmlFileRef}
                onChange={(e) => handleFileUpload(e, onHtmlChange)}
              />
            </label>
          </div>
          <textarea
            className="code-input"
            value={htmlCode}
            onChange={(e) => onHtmlChange(e.target.value)}
            placeholder="<main>…</main>"
            spellCheck={false}
          />
        </div>

        <div className="field-card">
          <div className="field-card-header">
            <span className="field-label">
              <span className="field-tag">CSS</span>
              Styles
            </span>
            <label className="file-upload-label">
              <Icon name="upload" size={12} />
              Upload
              <input
                type="file"
                accept="text/css,.css"
                ref={cssFileRef}
                onChange={(e) => handleFileUpload(e, onCssChange)}
              />
            </label>
          </div>
          <textarea
            className="code-input"
            value={cssCode}
            onChange={(e) => onCssChange(e.target.value)}
            placeholder=".button { … }"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="field-card">
        <div className="field-card-header">
          <span className="field-label">
            <span className="field-tag">DOM</span>
            Rendered markup
          </span>
        </div>
        <textarea
          className="code-input"
          value={domContent}
          onChange={(e) => onDomChange(e.target.value)}
          placeholder="Paste DOM content or rendered markup…"
          rows={4}
          spellCheck={false}
        />
      </div>

      <div className="field-card">
        <div className="field-card-header">
          <span className="field-label">Product / page description</span>
        </div>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="What is this page for, and who uses it?"
          rows={3}
        />
      </div>

      <div className="analyze-action-row">
        <button
          className="analyze-button"
          onClick={onAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <span className="mini-spinner" />
              Analyzing…
            </>
          ) : (
            <>
              <Icon name="sparkles" size={15} />
              Analyze interface
            </>
          )}
        </button>
      </div>
    </section>
  );
};

export default InterfaceInput;
