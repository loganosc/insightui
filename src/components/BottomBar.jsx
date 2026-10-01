import React, { useState } from 'react';
import { generatePDFReport } from '../utils/pdfExport';
import Icon from './Icon';
import './BottomBar.css';

const BottomBar = ({ critiqueData, screenshot, isLoading }) => {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const handleExportPDF = async () => {
    if (!critiqueData || Object.values(critiqueData).flat().length === 0) {
      alert('No critique data to export. Please analyze a screenshot first.');
      return;
    }

    setExporting(true);
    setExportError('');
    try {
      await generatePDFReport(critiqueData, screenshot, `insightui-critique-${Date.now()}.pdf`);
    } catch (error) {
      setExportError(`PDF export failed: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const totalIssues = Object.values(critiqueData || {}).flat().length;

  return (
    <footer className="bottom-bar">
      <div className="bottom-bar-left">
        <span
          className={`status-info ${isLoading ? 'busy' : totalIssues > 0 ? 'done' : ''}`}
          role="status"
        >
          <span className="status-indicator" aria-hidden="true" />
          {isLoading
            ? 'Analyzing…'
            : totalIssues > 0
              ? `Analysis complete: ${totalIssues} ${totalIssues === 1 ? 'issue' : 'issues'} identified`
              : 'Ready to analyze'}
        </span>
        {exportError && (
          <span className="export-error" role="alert">
            <Icon name="alert" size={16} />
            {exportError}
          </span>
        )}
      </div>

      <div className="bottom-bar-right">
        <button
          type="button"
          className="export-button"
          onClick={handleExportPDF}
          disabled={isLoading || exporting || totalIssues === 0}
          title="Export critique report as PDF"
        >
          {exporting ? <span className="mini-spinner" aria-hidden="true" /> : <Icon name="download" size={16} />}
          {exporting ? 'Exporting…' : 'Export PDF'}
        </button>
      </div>
    </footer>
  );
};

export default BottomBar;
