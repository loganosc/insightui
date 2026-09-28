import React, { useState } from 'react';
import { generatePDFReport } from '../utils/pdfExport';
import './BottomBar.css';

const BottomBar = ({ critiqueData, screenshot, isLoading }) => {
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!critiqueData || Object.values(critiqueData).flat().length === 0) {
      alert('No critique data to export. Please analyze a screenshot first.');
      return;
    }

    setExporting(true);
    try {
      await generatePDFReport(critiqueData, screenshot, `insightui-critique-${Date.now()}.pdf`);
    } catch (error) {
      alert('Error exporting PDF: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const totalIssues = Object.values(critiqueData || {}).flat().length;

  return (
    <div className="bottom-bar">
      <div className="bottom-bar-left">
        <span className="status-info">
          {totalIssues > 0
            ? `${totalIssues} issues identified`
            : 'Ready to analyze'}
        </span>
      </div>

      <div className="bottom-bar-right">
        <button
          className="export-button"
          onClick={handleExportPDF}
          disabled={isLoading || exporting || totalIssues === 0}
          title="Export critique report as PDF"
        >
          {exporting ? '⏳ Exporting...' : '📥 Export as PDF'}
        </button>
      </div>
    </div>
  );
};

export default BottomBar;
