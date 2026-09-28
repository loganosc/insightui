import React, { useRef } from 'react';
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
    <div className="interface-input-panel">
      <div className="interface-input-header">
        <div>
          <h3>Interface Inputs</h3>
          <p>Paste HTML/CSS/DOM or add a short product description. Use a screenshot, code, or both.</p>
        </div>
        <label className="file-upload-label">
          Upload Snapshot JSON
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
            <span>HTML</span>
            <label className="file-upload-label">
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
            value={htmlCode}
            onChange={(e) => onHtmlChange(e.target.value)}
            placeholder="Paste HTML markup here..."
          />
        </div>

        <div className="field-card">
          <div className="field-card-header">
            <span>CSS</span>
            <label className="file-upload-label">
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
            value={cssCode}
            onChange={(e) => onCssChange(e.target.value)}
            placeholder="Paste CSS rules here..."
          />
        </div>
      </div>

      <div className="field-card">
        <div className="field-card-header">
          <span>DOM / rendered markup</span>
        </div>
        <textarea
          value={domContent}
          onChange={(e) => onDomChange(e.target.value)}
          placeholder="Paste DOM content or rendered markup here..."
          rows={4}
        />
      </div>

      <div className="field-card">
        <div className="field-card-header">
          <span>Product / page description</span>
        </div>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Briefly describe the page goal, product, or target user..."
          rows={3}
        />
      </div>

      <div className="analyze-action-row">
        <button
          className="analyze-button"
          onClick={onAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Interface'}
        </button>
      </div>
    </div>
  );
};

export default InterfaceInput;
