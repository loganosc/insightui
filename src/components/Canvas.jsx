import React, { useRef, useState, useEffect } from 'react';
import InterfaceInput from './InterfaceInput';
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
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

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
      alert('Please upload an image file');
      return;
    }

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
    <div className="canvas-panel">
      <div
        ref={containerRef}
        className="canvas-container"
        onDragOver={handleDrag}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseDown={handleMouseDown}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        {!screenshot ? (
          <div className={`upload-zone ${dragActive ? 'active' : ''}`}>
            <div className="upload-content">
              <div className="upload-icon">📤</div>
              <h2>Upload UI Screenshot</h2>
              <p>Drag and drop your screenshot here or click to browse</p>
              <label htmlFor="file-input" className="file-button">
                Choose File
              </label>
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        ) : (
          <div className="screenshot-wrapper" style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}>
            <div className="screenshot-container" style={{ transform: `scale(${zoom})` }}>
              <img
                ref={canvasRef}
                src={screenshot}
                alt="Screenshot"
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
          <div className="canvas-controls">
            <button
              className="zoom-button"
              onClick={() => onZoomChange(Math.max(0.25, zoom - 0.25))}
              title="Zoom out (Ctrl + Scroll)"
            >
              −
            </button>
            <span className="zoom-indicator">{Math.round(zoom * 100)}%</span>
            <button
              className="zoom-button"
              onClick={() => onZoomChange(Math.min(4, zoom + 0.25))}
              title="Zoom in (Ctrl + Scroll)"
            >
              +
            </button>
            <button
              className="reset-button"
              onClick={() => {
                setPanOffset({ x: 0, y: 0 });
                onZoomChange(1);
              }}
              title="Reset view"
            >
              ⟲
            </button>
          </div>
        )}

        {isAnalyzing && (
          <div className="analyzing-overlay">
            <div className="analyzing-spinner"></div>
            <p>Analyzing interface...</p>
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
    </div>
  );
};

export default Canvas;
