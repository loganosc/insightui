import React, { useRef, useState, useEffect } from 'react';
import InterfaceInput from './InterfaceInput';
import Icon from './Icon';
import './Canvas.css';

const Canvas = ({
  screenshot,
  onScreenshotUpload,
  highlightBox,
  zoom,
  onZoomChange,
  isAnalyzing,
  htmlCode,
  cssCode,
  domContent,
  description,
  onHtmlChange,
  onCssChange,
  onDomChange,
  onDescriptionChange,
  onSnapshotImport,
  onAnalyze
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [uploadError, setUploadError] = useState('');
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file) => {
    if (!file.type.startsWith('image/')) {
      setUploadError(`"${file.name}" isn't an image. Choose a PNG, JPG or WebP file.`);
      return;
    }

    setUploadError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      onScreenshotUpload(e.target.result);
      setPanOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleMouseDown = (e) => {
    if (e.button === 2 || e.ctrlKey || e.metaKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, panStart]);

  const PAN_STEP = 40;
  const handleViewerKeyDown = (e) => {
    const step = e.shiftKey ? PAN_STEP * 4 : PAN_STEP;
    const pan = {
      ArrowLeft: { x: step, y: 0 },
      ArrowRight: { x: -step, y: 0 },
      ArrowUp: { x: 0, y: step },
      ArrowDown: { x: 0, y: -step }
    }[e.key];

    if (pan) {
      e.preventDefault();
      setPanOffset((prev) => ({ x: prev.x + pan.x, y: prev.y + pan.y }));
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      onZoomChange(Math.min(4, zoom + 0.25));
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      onZoomChange(Math.max(0.25, zoom - 0.25));
    } else if (e.key === '0') {
      e.preventDefault();
      setPanOffset({ x: 0, y: 0 });
      onZoomChange(1);
    }
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.25, Math.min(4, zoom * delta));
      onZoomChange(newZoom);
    }
  };

  useEffect(() => {
    containerRef.current?.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      containerRef.current?.removeEventListener('wheel', handleWheel);
    };
  }, [zoom]);

  return (
    <section className="canvas-panel" aria-labelledby="canvas-heading">
      <h2 id="canvas-heading" className="visually-hidden">Interface to critique</h2>
      <div
        ref={containerRef}
        className="canvas-container"
        onDragOver={handleDrag}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseDown={handleMouseDown}
        onKeyDown={screenshot ? handleViewerKeyDown : undefined}
        tabIndex={screenshot ? 0 : undefined}
        role={screenshot ? 'region' : undefined}
        aria-label={screenshot ? 'Screenshot viewer' : undefined}
        aria-describedby={screenshot ? 'viewer-help' : undefined}
        style={{ cursor: screenshot ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
      >
        {!screenshot ? (
          <div
            className={`upload-zone ${dragActive ? 'active' : ''}`}
            onClick={(e) => {
              if (e.target === fileInputRef.current || e.target.closest('label')) return;
              fileInputRef.current?.click();
            }}
          >
            <div className="upload-content">
              <div className="upload-icon" aria-hidden="true">
                <Icon name="upload" size={24} />
              </div>
              <h3>Drop a UI screenshot</h3>
              <p id="upload-hint">PNG, JPG or WebP. Or skip it and paste code below.</p>
              <label htmlFor="file-input" className="file-button">
                Choose screenshot file
                <input
                  ref={fileInputRef}
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  aria-describedby={uploadError ? 'upload-hint upload-error' : 'upload-hint'}
                  className="visually-hidden"
                />
              </label>
              {uploadError && (
                <p id="upload-error" className="inline-error" role="alert">
                  <Icon name="alert" size={16} />
                  <span>{uploadError}</span>
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="screenshot-wrapper" style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}>
            <div className="screenshot-container" style={{ transform: `scale(${zoom})` }}>
              <img
                ref={canvasRef}
                src={screenshot}
                alt="Uploaded interface screenshot being critiqued"
                className="screenshot-image"
              />

              {highlightBox && (
                <div
                  className="highlight-overlay"
                  style={{
                    left: `${(highlightBox.x / (canvasRef.current?.naturalWidth || 1)) * 100}%`,
                    top: `${(highlightBox.y / (canvasRef.current?.naturalHeight || 1)) * 100}%`,
                    width: `${(highlightBox.width / (canvasRef.current?.naturalWidth || 1)) * 100}%`,
                    height: `${(highlightBox.height / (canvasRef.current?.naturalHeight || 1)) * 100}%`,
                  }}
                >
                  <div className="highlight-box"></div>
                </div>
              )}
            </div>
          </div>
        )}

        {screenshot && (
          <p id="viewer-help" className="visually-hidden">
            Use arrow keys to pan, plus and minus to zoom, and 0 to reset the view.
          </p>
        )}

        {screenshot && (
          <div className="canvas-controls" role="group" aria-label="Zoom controls">
            <button
              type="button"
              className="zoom-button"
              onClick={() => onZoomChange(Math.max(0.25, zoom - 0.25))}
              title="Zoom out (Ctrl + Scroll)"
              aria-label="Zoom out"
            >
              <Icon name="minus" />
            </button>
            <output className="zoom-indicator" aria-live="polite" aria-label={`Zoom ${Math.round(zoom * 100)} percent`}>
              {Math.round(zoom * 100)}%
            </output>
            <button
              type="button"
              className="zoom-button"
              onClick={() => onZoomChange(Math.min(4, zoom + 0.25))}
              title="Zoom in (Ctrl + Scroll)"
              aria-label="Zoom in"
            >
              <Icon name="plus" />
            </button>
            <button
              type="button"
              className="reset-button"
              onClick={() => {
                setPanOffset({ x: 0, y: 0 });
                onZoomChange(1);
              }}
              title="Reset view"
              aria-label="Reset view"
            >
              <Icon name="reset" size={15} />
            </button>
          </div>
        )}

        {isAnalyzing && (
          <div className="analyzing-overlay">
            <div className="analyzing-spinner" aria-hidden="true"></div>
            <p>Analyzing interface…</p>
            <span>This can take a minute on larger models</span>
          </div>
        )}
      </div>

      <InterfaceInput
        htmlCode={htmlCode}
        cssCode={cssCode}
        domContent={domContent}
        description={description}
        onHtmlChange={onHtmlChange}
        onCssChange={onCssChange}
        onDomChange={onDomChange}
        onDescriptionChange={onDescriptionChange}
        onSnapshotImport={onSnapshotImport}
        onAnalyze={onAnalyze}
        isAnalyzing={isAnalyzing}
      />
    </section>
  );
};

export default Canvas;
