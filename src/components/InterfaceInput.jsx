import React, { useRef, useState } from 'react';
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
  const [importError, setImportError] = useState('');

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
        setImportError('');
        const parsed = JSON.parse(e.target.result);
        const snapshot = parsed?.pageSnapshot || parsed;

        if (!snapshot || (!snapshot.html && !snapshot.nodes && !snapshot.stylesheets)) {
          throw new Error('Not a valid InsightUI scraper JSON payload.');
        }

        onSnapshotImport?.(snapshot);
      } catch (error) {
        setImportError(`Couldn't import "${file.name}": ${error.message}`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <section className="interface-input-panel" aria-labelledby="inputs-heading">
      <div className="interface-input-header">
        <div>
          <h3 id="inputs-heading">Interface inputs</h3>
          <p>Add code or context alongside the screenshot. Any combination works.</p>
        </div>
        <label className="ghost-button">
          <Icon name="file" size={16} />
          Import snapshot JSON
          <input
            type="file"
            accept="application/json,.json"
            ref={jsonFileRef}
            onChange={handleJsonUpload}
          />
        </label>
      </div>

      {importError && (
        <p className="inline-error" role="alert">
          <Icon name="alert" size={16} />
          <span>{importError}</span>
        </p>
      )}

      <div className="field-grid">
        <div className="field-card">
          <div className="field-card-header">
            <label className="field-label" htmlFor="html-input">
              <span className="field-tag">HTML</span>
              Markup
            </label>
            <label className="file-upload-label">
              <Icon name="upload" size={14} />
              Upload<span className="visually-hidden"> HTML file</span>
              <input
                type="file"
                accept="text/html,.html"
                ref={htmlFileRef}
                onChange={(e) => handleFileUpload(e, onHtmlChange)}
              />
            </label>
          </div>
          <textarea
            id="html-input"
            className="code-input"
            value={htmlCode}
            onChange={(e) => onHtmlChange(e.target.value)}
            placeholder="<main>…</main>"
            spellCheck={false}
          />
        </div>

        <div className="field-card">
          <div className="field-card-header">
            <label className="field-label" htmlFor="css-input">
              <span className="field-tag">CSS</span>
              Styles
            </label>
            <label className="file-upload-label">
              <Icon name="upload" size={14} />
              Upload<span className="visually-hidden"> CSS file</span>
              <input
                type="file"
                accept="text/css,.css"
                ref={cssFileRef}
                onChange={(e) => handleFileUpload(e, onCssChange)}
              />
            </label>
          </div>
          <textarea
            id="css-input"
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
          <label className="field-label" htmlFor="dom-input">
            <span className="field-tag">DOM</span>
            Rendered markup
          </label>
        </div>
        <textarea
          id="dom-input"
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
          <label className="field-label" htmlFor="description-input">Product / page description</label>
        </div>
        <textarea
          id="description-input"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="What is this page for, and who uses it?"
          rows={3}
        />
      </div>

      <div className="analyze-action-row">
        <button
          type="button"
          className="analyze-button"
          onClick={onAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <span className="mini-spinner" aria-hidden="true" />
              Analyzing…
            </>
          ) : (
            <>
              <Icon name="sparkles" size={18} />
              Analyze interface
            </>
          )}
        </button>
      </div>
    </section>
  );
};

export default InterfaceInput;
