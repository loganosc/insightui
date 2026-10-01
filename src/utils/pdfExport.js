import jsPDF from 'jspdf';

// Mirrors the light-theme tokens in App.css so the report matches the app
const COLORS = {
  surface: '#ffffff',
  surfaceSoft: '#f8f8fa',
  surfaceStrong: '#eeeef2',
  border: '#e4e4e9',
  text: '#17171c',
  muted: '#55555f',
  primary: '#4b4bc6',
  primarySolid: '#4f4fcf',
  logoEnd: '#a855f7',
  sev: {
    High: '#c42a30',
    Medium: '#995700',
    Low: '#18794a'
  },
  cat: {
    usability: '#5b5bd6',
    accessibility: '#0d8fa5',
    visual_hierarchy: '#c2410c',
    interaction_design: '#be3e8c',
    consistency: '#3a8f3a'
  }
};

const CATEGORIES = ['usability', 'accessibility', 'visual_hierarchy', 'interaction_design', 'consistency'];
const CATEGORY_LABELS = {
  usability: 'Usability',
  accessibility: 'Accessibility',
  visual_hierarchy: 'Visual Hierarchy',
  interaction_design: 'Interaction Design',
  consistency: 'Consistency'
};
const SEVERITIES = ['High', 'Medium', 'Low'];

const PAGE_MARGIN = 44;
const FOOTER_SPACE = 40;
const SANS = 'PlusJakartaSans';
const SANS_SEMIBOLD = 'PlusJakartaSans-SemiBold';

// ---------- helpers ----------

const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

// Equivalent of color-mix(in srgb, color X%, white)
const tint = (hex, amount) => hexToRgb(hex).map((c) => Math.round(c * amount + 255 * (1 - amount)));

const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
};

// Embeds Plus Jakarta Sans. Returns false (and the report falls back to Helvetica) if the
// font files can't be fetched.
const registerFonts = async (pdf) => {
  const files = [
    ['PlusJakartaSans-Regular.ttf', SANS, 'normal'],
    ['PlusJakartaSans-Bold.ttf', SANS, 'bold'],
    ['PlusJakartaSans-SemiBold.ttf', SANS_SEMIBOLD, 'normal']
  ];

  try {
    const loaded = await Promise.all(
      files.map(async ([file]) => {
        const response = await fetch(`${import.meta.env.BASE_URL}fonts/${file}`);
        if (!response.ok) throw new Error(`Font ${file} not found`);
        return arrayBufferToBase64(await response.arrayBuffer());
      })
    );
    files.forEach(([file, family, style], i) => {
      pdf.addFileToVFS(file, loaded[i]);
      pdf.addFont(file, family, style);
    });
    return true;
  } catch (error) {
    console.warn('Falling back to Helvetica in PDF export:', error);
    return false;
  }
};

// Re-encodes the screenshot as a size-capped JPEG and returns its dimensions
const prepareScreenshot = (dataUrl) =>
  new Promise((resolve) => {
    if (!dataUrl) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1800 / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve({ data: canvas.toDataURL('image/jpeg', 0.9), width: canvas.width, height: canvas.height });
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });

// ---------- report ----------

export const generatePDFReport = async (
  critiqueData,
  screenshotUrl,
  filename = 'insightui-report.pdf',
  { model } = {}
) => {
  const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
  const hasCustomFont = await registerFonts(pdf);
  const screenshot = await prepareScreenshot(screenshotUrl);

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  const left = PAGE_MARGIN;
  const bottomLimit = pageHeight - FOOTER_SPACE - 12;
  let y = PAGE_MARGIN;

  const font = (weight = 'regular', size = 10, color = COLORS.text) => {
    if (hasCustomFont) {
      if (weight === 'semibold') pdf.setFont(SANS_SEMIBOLD, 'normal');
      else pdf.setFont(SANS, weight === 'bold' ? 'bold' : 'normal');
    } else {
      pdf.setFont('helvetica', weight === 'regular' ? 'normal' : 'bold');
    }
    pdf.setFontSize(size);
    pdf.setTextColor(...(Array.isArray(color) ? color : hexToRgb(color)));
    pdf.setCharSpace(0);
  };

  const fill = (color) => pdf.setFillColor(...(Array.isArray(color) ? color : hexToRgb(color)));
  const stroke = (color, width = 0.75) => {
    pdf.setDrawColor(...(Array.isArray(color) ? color : hexToRgb(color)));
    pdf.setLineWidth(width);
  };

  const ensureSpace = (needed) => {
    if (y + needed > bottomLimit) {
      pdf.addPage();
      y = PAGE_MARGIN;
      return true;
    }
    return false;
  };

  const lineHeight = (size, factor = 1.45) => size * factor;

  const truncate = (text, maxWidth) => {
    if (pdf.getTextWidth(text) <= maxWidth) return text;
    let t = text;
    while (t.length > 1 && pdf.getTextWidth(`${t}…`) > maxWidth) t = t.slice(0, -1);
    return `${t}…`;
  };

  // Rounded "pill" with soft background and colored text, like .severity-badge
  const severityBadgeWidth = (label) => {
    font('bold', 8);
    return pdf.getTextWidth(label) + 26;
  };

  const drawSeverityBadge = (label, rightX, centerY) => {
    const color = COLORS.sev[label] || COLORS.sev.Medium;
    const width = severityBadgeWidth(label);
    const height = 16;
    const x = rightX - width;
    fill(tint(color, 0.1));
    pdf.roundedRect(x, centerY - height / 2, width, height, height / 2, height / 2, 'F');
    fill(color);
    pdf.circle(x + 10, centerY, 2.6, 'F');
    font('bold', 8, color);
    pdf.text(label, x + 17, centerY, { baseline: 'middle' });
  };

  // Four-point sparkle used in the app logo
  const drawSparkle = (cx, cy, r) => {
    const k = r * 0.28;
    pdf.lines(
      [[k, r - k], [r - k, k], [-(r - k), k], [-k, r - k], [-k, -(r - k)], [-(r - k), -k], [r - k, -k]],
      cx,
      cy - r,
      [1, 1],
      'F',
      true
    );
  };

  // ---------- header ----------
  const logoSize = 24;
  const logoSteps = 12;
  pdf.saveGraphicsState();
  pdf.roundedRect(left, y, logoSize, logoSize, 7, 7, null);
  pdf.clip();
  pdf.discardPath();
  for (let i = 0; i < logoSteps; i++) {
    // Approximate the logo's diagonal gradient with vertical bands
    const t = i / (logoSteps - 1);
    const start = hexToRgb(COLORS.primarySolid);
    const end = hexToRgb(COLORS.logoEnd);
    fill(start.map((c, j) => Math.round(c + (end[j] - c) * t)));
    pdf.rect(left + (logoSize / logoSteps) * i, y, logoSize / logoSteps + 0.5, logoSize, 'F');
  }
  pdf.restoreGraphicsState();
  fill(COLORS.surface);
  drawSparkle(left + logoSize / 2, y + logoSize / 2, 6.5);

  font('bold', 15, COLORS.text);
  pdf.text('InsightUI', left + logoSize + 10, y + logoSize / 2, { baseline: 'middle' });
  const brandWidth = pdf.getTextWidth('InsightUI');
  font('regular', 9.5, COLORS.muted);
  pdf.text('AI-Powered UX Critique', left + logoSize + 18 + brandWidth, y + logoSize / 2 + 0.5, {
    baseline: 'middle'
  });

  const generatedAt = new Date().toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
  pdf.text(generatedAt, pageWidth - PAGE_MARGIN, y + logoSize / 2 + 0.5, {
    align: 'right',
    baseline: 'middle'
  });

  y += logoSize + 16;
  stroke(COLORS.border);
  pdf.line(left, y, pageWidth - PAGE_MARGIN, y);
  y += 30;

  // ---------- title + summary ----------
  const allIssues = CATEGORIES.flatMap((c) => (Array.isArray(critiqueData?.[c]) ? critiqueData[c] : []));
  const total = allIssues.length;
  const counts = SEVERITIES.reduce((acc, level) => {
    acc[level] = allIssues.filter((item) => item?.severity === level).length;
    return acc;
  }, {});

  font('bold', 24, COLORS.text);
  pdf.text('UX Critique Report', left, y);
  y += 18;
  font('regular', 10.5, COLORS.muted);
  pdf.text(
    [`${total} ${total === 1 ? 'issue' : 'issues'} found`, model ? `Model: ${model}` : null]
      .filter(Boolean)
      .join('   ·   '),
    left,
    y
  );
  y += 22;

  // Summary card: severity bar + counts, like the inspector header
  const summaryHeight = 66;
  fill(COLORS.surfaceSoft);
  stroke(COLORS.border);
  pdf.roundedRect(left, y, contentWidth, summaryHeight, 10, 10, 'FD');

  const barX = left + 16;
  const barY = y + 18;
  const barWidth = contentWidth - 32;
  const barHeight = 7;
  fill(COLORS.surfaceStrong);
  pdf.roundedRect(barX, barY, barWidth, barHeight, 3.5, 3.5, 'F');
  if (total > 0) {
    const present = SEVERITIES.filter((level) => counts[level] > 0);
    const gap = 2;
    const usable = barWidth - gap * (present.length - 1);
    let segX = barX;
    present.forEach((level) => {
      const w = (counts[level] / total) * usable;
      fill(COLORS.sev[level]);
      pdf.roundedRect(segX, barY, w, barHeight, 3.5, 3.5, 'F');
      segX += w + gap;
    });
  }

  let legendX = barX;
  const legendY = barY + barHeight + 22;
  SEVERITIES.forEach((level) => {
    fill(COLORS.sev[level]);
    pdf.circle(legendX + 3, legendY, 3, 'F');
    font('semibold', 10, COLORS.text);
    const countText = String(counts[level]);
    pdf.text(countText, legendX + 11, legendY, { baseline: 'middle' });
    const countWidth = pdf.getTextWidth(countText);
    font('regular', 10, COLORS.muted);
    pdf.text(level, legendX + 14 + countWidth, legendY, { baseline: 'middle' });
    legendX += 22 + countWidth + pdf.getTextWidth(level) + 18;
  });

  y += summaryHeight + 30;

  // ---------- screenshot ----------
  if (screenshot) {
    const maxImageHeight = 330;
    let imgWidth = contentWidth;
    let imgHeight = (screenshot.height / screenshot.width) * imgWidth;
    if (imgHeight > maxImageHeight) {
      imgHeight = maxImageHeight;
      imgWidth = (screenshot.width / screenshot.height) * imgHeight;
    }

    ensureSpace(imgHeight + 70);
    font('bold', 14, COLORS.text);
    pdf.text('Screenshot', left, y);
    y += 14;

    // Dotted canvas backdrop, like the app's screenshot area
    const frameHeight = imgHeight + 32;
    fill(COLORS.surfaceStrong);
    pdf.roundedRect(left, y, contentWidth, frameHeight, 10, 10, 'F');
    fill('#d4d4dc');
    for (let dx = left + 9; dx < left + contentWidth - 4; dx += 12) {
      for (let dy = y + 9; dy < y + frameHeight - 4; dy += 12) {
        pdf.circle(dx, dy, 0.55, 'F');
      }
    }
    const imgX = left + (contentWidth - imgWidth) / 2;
    const imgY = y + 16;
    pdf.addImage(screenshot.data, 'JPEG', imgX, imgY, imgWidth, imgHeight, undefined, 'FAST');
    stroke(COLORS.border);
    pdf.rect(imgX, imgY, imgWidth, imgHeight, 'S');
    y += frameHeight + 30;
  }

  // ---------- categories ----------
  const cardPadding = 14;
  const stripe = 3.5;
  const textWidth = contentWidth - cardPadding * 2 - stripe;

  const measureCard = (item) => {
    font('semibold', 11);
    const issueLines = pdf.splitTextToSize(String(item.issue || ''), textWidth);
    font('regular', 10);
    const fixLines = item.fix ? pdf.splitTextToSize(String(item.fix), textWidth - 24) : [];
    const issueHeight = issueLines.length * lineHeight(11);
    const fixBoxHeight = fixLines.length ? 34 + fixLines.length * lineHeight(10, 1.5) : 0;
    const height = cardPadding + 18 + issueHeight + (fixBoxHeight ? 8 + fixBoxHeight : 0) + cardPadding - 2;
    return { issueLines, fixLines, fixBoxHeight, height };
  };

  const drawCard = (item, category) => {
    const severity = SEVERITIES.includes(item.severity) ? item.severity : 'Medium';
    const sevColor = COLORS.sev[severity];
    const { issueLines, fixLines, fixBoxHeight, height } = measureCard(item);
    const x = left;
    const radius = 9;

    // Severity stripe on the left edge, then the white card body over it
    fill(sevColor);
    pdf.roundedRect(x, y, contentWidth, height, radius, radius, 'F');
    fill(COLORS.surface);
    pdf.roundedRect(x + stripe, y, contentWidth - stripe, height, radius, radius, 'F');
    pdf.rect(x + stripe, y, radius, height, 'F');
    stroke(COLORS.border);
    pdf.roundedRect(x, y, contentWidth, height, radius, radius, 'S');

    const innerX = x + stripe + cardPadding;
    let cy = y + cardPadding + 5;

    // Header: category dot + element name, severity badge on the right
    fill(COLORS.cat[category]);
    pdf.circle(innerX + 3, cy, 3, 'F');
    const badgeWidth = severityBadgeWidth(severity);
    font('regular', 9, COLORS.muted);
    pdf.text(
      truncate(String(item.element || 'General'), textWidth - badgeWidth - 24),
      innerX + 12,
      cy,
      { baseline: 'middle' }
    );
    drawSeverityBadge(severity, x + contentWidth - cardPadding, cy);
    cy += 18;

    font('semibold', 11, COLORS.text);
    pdf.text(issueLines, innerX, cy, { baseline: 'top', lineHeightFactor: 1.45 });
    cy += issueLines.length * lineHeight(11);

    if (fixBoxHeight) {
      cy += 8;
      fill(COLORS.surfaceSoft);
      stroke(COLORS.border);
      pdf.roundedRect(innerX, cy, textWidth, fixBoxHeight, 7, 7, 'FD');
      font('bold', 7.5, COLORS.muted);
      pdf.setCharSpace(0.6);
      pdf.text('SUGGESTED FIX', innerX + 12, cy + 15, { baseline: 'middle' });
      pdf.setCharSpace(0);
      font('regular', 10, COLORS.text);
      pdf.text(fixLines, innerX + 12, cy + 28, { baseline: 'top', lineHeightFactor: 1.5 });
    }

    y += height;
  };

  const drawCategoryHeader = (category, count) => {
    const color = COLORS.cat[category];
    const tile = 22;
    fill(tint(color, 0.13));
    pdf.roundedRect(left, y, tile, tile, 6, 6, 'F');
    fill(color);
    pdf.circle(left + tile / 2, y + tile / 2, 4, 'F');

    font('bold', 13, COLORS.text);
    pdf.text(CATEGORY_LABELS[category], left + tile + 10, y + tile / 2, { baseline: 'middle' });
    const labelWidth = pdf.getTextWidth(CATEGORY_LABELS[category]);

    font('semibold', 9, COLORS.muted);
    const countText = String(count);
    const pillWidth = Math.max(20, pdf.getTextWidth(countText) + 12);
    const pillX = left + tile + 18 + labelWidth;
    fill(COLORS.surfaceStrong);
    pdf.roundedRect(pillX, y + tile / 2 - 8, pillWidth, 16, 8, 8, 'F');
    pdf.text(countText, pillX + pillWidth / 2, y + tile / 2, { align: 'center', baseline: 'middle' });
    y += tile + 12;
  };

  CATEGORIES.forEach((category) => {
    const items = Array.isArray(critiqueData?.[category]) ? critiqueData[category] : [];
    const firstCardHeight = items.length ? measureCard(items[0]).height : 20;

    // Keep each heading with its first card
    ensureSpace(34 + firstCardHeight);
    drawCategoryHeader(category, items.length);

    if (items.length === 0) {
      font('regular', 10, COLORS.muted);
      pdf.text('No issues returned in this category.', left, y + 4, { baseline: 'top' });
      y += 24;
    }

    items.forEach((item, index) => {
      if (index > 0) ensureSpace(measureCard(item).height);
      drawCard(item, category);
      y += 10;
    });

    y += 16;
  });

  // ---------- footer on every page ----------
  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    pdf.setPage(page);
    const footerY = pageHeight - FOOTER_SPACE + 10;
    stroke(COLORS.border);
    pdf.line(left, footerY - 12, pageWidth - PAGE_MARGIN, footerY - 12);
    font('regular', 8.5, COLORS.muted);
    pdf.text('InsightUI  ·  UX Critique Report', left, footerY, { baseline: 'middle' });
    pdf.text(`Page ${page} of ${pageCount}`, pageWidth - PAGE_MARGIN, footerY, {
      align: 'right',
      baseline: 'middle'
    });
  }

  pdf.setProperties({ title: 'UX Critique Report', subject: 'InsightUI critique', creator: 'InsightUI' });
  pdf.setLanguage('en-US');
  pdf.save(filename);
};
