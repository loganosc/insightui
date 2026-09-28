import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToPDF = async (filename = 'insightui-critique.pdf') => {
  try {
    const element = document.getElementById('export-container');
    if (!element) {
      throw new Error('Export container not found');
    }

    // Capture the HTML as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'l' : 'p',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw error;
  }
};

export const generatePDFReport = async (critiqueData, screenshotUrl, filename = 'insightui-report.pdf') => {
  try {
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yOffset = 20;

    // Title
    pdf.setFontSize(24);
    pdf.text('UX Critique Report', 20, yOffset);
    yOffset += 15;

    // Screenshot
    if (screenshotUrl) {
      pdf.setFontSize(12);
      pdf.text('Screenshot:', 20, yOffset);
      yOffset += 10;
      
      try {
        pdf.addImage(screenshotUrl, 'PNG', 20, yOffset, 170, 100);
        yOffset += 110;
      } catch (e) {
        console.warn('Could not add screenshot to PDF');
        yOffset += 10;
      }
    }

    // Critique sections
    const categories = Object.keys(critiqueData);
    
    for (const category of categories) {
      if (yOffset > pageHeight - 40) {
        pdf.addPage();
        yOffset = 20;
      }

      pdf.setFontSize(14);
      pdf.setTextColor(40, 40, 200);
      pdf.text(category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' '), 20, yOffset);
      yOffset += 10;

      const items = critiqueData[category];
      if (Array.isArray(items)) {
        for (const item of items) {
          if (yOffset > pageHeight - 30) {
            pdf.addPage();
            yOffset = 20;
          }

          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(10);
          
          // Issue
          const issueLines = pdf.splitTextToSize(`Issue: ${item.issue}`, pageWidth - 40);
          pdf.text(issueLines, 25, yOffset);
          yOffset += issueLines.length * 5;

          // Element
          pdf.text(`Element: ${item.element}`, 25, yOffset);
          yOffset += 5;

          // Fix
          const fixLines = pdf.splitTextToSize(`Fix: ${item.fix}`, pageWidth - 40);
          pdf.text(fixLines, 25, yOffset);
          yOffset += fixLines.length * 5;

          // Severity
          pdf.text(`Severity: ${item.severity}`, 25, yOffset);
          yOffset += 8;
        }
      }
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
};
