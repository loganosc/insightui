# InsightUI - Complete File Structure

## Root Configuration Files
- **package.json** - Dependencies (React, Axios, jsPDF, html2canvas)
- **vite.config.js** - Vite build configuration
- **index.html** - HTML entry point
- **README.md** - Full documentation and feature overview
- **QUICKSTART.md** - 5-minute getting started guide
- **OLLAMA_CONFIG.md** - Ollama configuration and tuning
- **DEVELOPMENT.md** - Architecture, components, dev guidelines
- **.gitignore** - Git ignore patterns

## React Components (src/components/)

### TopBar.jsx & TopBar.css
Header bar with:
- App branding "InsightUI"
- Ollama model selection dropdown
- Analysis status indicator
- Help link

### Canvas.jsx & Canvas.css
Left panel (55% width) with:
- Drag-and-drop upload zone
- File picker input
- Zoomable screenshot viewer (0.25x - 4x)
- Pan support (right-click + drag)
- Semi-transparent highlight overlay
- Zoom controls and reset button
- Loading spinner during analysis

### Inspector.jsx & Inspector.css
Right panel (45% width) with:
- Categorized critique sections:
  - 👤 Usability
  - ♿ Accessibility
  - 📐 Visual Hierarchy
  - 🎯 Interaction Design
  - ✓ Consistency
- Expandable/collapsible categories
- Issue count badges
- CritiqueCard display

### CritiqueCard.jsx & CritiqueCard.css
Individual feedback cards with:
- Severity badges (Low/Medium/High)
- Issue description
- Expandable details section
- 💡 Suggested fix
- 💬 Inline follow-up chat input
- Selection highlighting

### BottomBar.jsx & BottomBar.css
Footer bar with:
- Status information
- 📥 Export as PDF button
- Issue count display

## Utility Files (src/utils/)

### ollamaApi.js
Ollama integration:
- `analyzeScreenshot(imageBase64, model)` - Main analysis function
- `checkOllamaHealth()` - Health check
- `getAvailableModels()` - List available LLM models
- Uses Ollama `/api/generate` endpoint
- Returns structured JSON: {usability[], accessibility[], visual_hierarchy[], interaction_design[], consistency[]}

### pdfExport.js
PDF generation:
- `exportToPDF(filename)` - Export current view
- `generatePDFReport(critiqueData, screenshotUrl, filename)` - Full report
- Uses jsPDF + html2canvas
- Professional formatting with sections

### coordinates.js
Element highlighting:
- `estimateElementCoordinates(element, imageWidth, imageHeight)` - Map element names to bounding boxes
- `generateRandomCoordinates(...)` - Demo boxes
- Returns {x, y, width, height} normalized to image dimensions

### sampleData.js
Demo data:
- `sampleCritiqueData` - Example feedback for login page
- `sampleScreenshotUrl` - Sample SVG screenshot
- For testing without Ollama

## Main Files (src/)

### App.jsx
Main component handling:
- State management (screenshot, critique, model, zoom, selection)
- Callback handlers
- Component composition
- Data flow orchestration

### App.css
Global app styles:
- Layout flexbox
- Main container styling

### main.jsx
React entry point:
- ReactDOM rendering
- App component bootstrap

## Component Hierarchy
```
App
├── TopBar
│   ├── Model selection dropdown
│   └── Analysis status
├── Main Layout (flex row)
│   ├── Canvas (55%)
│   │   ├── Upload zone
│   │   ├── Screenshot viewer
│   │   ├── Highlight overlay
│   │   └── Zoom controls
│   └── Inspector (45%)
│       ├── Category sections
│       └── CritiqueCard (multiple)
│           ├── Details (expandable)
│           └── Chat input
└── BottomBar
    └── Export button
```

## Styling Architecture

### Design System
- **Primary Color**: #667eea (purple)
- **Secondary Color**: #764ba2 (dark purple)
- **Success**: #4ade80 (green)
- **Warning**: #fbbf24 (yellow)
- **Error**: #f87171 (red)
- **Font**: System stack (-apple-system, BlinkMacSystemFont, etc.)

### Responsive Design
- Fluid layout with flexbox
- Mobile-first approach
- Canvas: 55% width, Inspector: 45% width
- Scroll behavior on inspector panel
- Smooth transitions (0.2-0.3s)

### Animation
- Fade-in on upload drag
- Slide-down for expandable sections
- Pulse indicator for analyzing state
- Bounce effect on upload icon
- Spin loader for processing

## Data Structures

### Critique Item
```javascript
{
  "issue": "One-sentence description",
  "element": "UI Element Name",
  "fix": "Concrete suggestion",
  "severity": "Low|Medium|High"
}
```

### Critique Data
```javascript
{
  "usability": [item, item, ...],
  "accessibility": [item, item, ...],
  "visual_hierarchy": [item, item, ...],
  "interaction_design": [item, item, ...],
  "consistency": [item, item, ...]
}
```

### Highlight Box
```javascript
{
  "x": number,      // pixels from left
  "y": number,      // pixels from top
  "width": number,  // pixels
  "height": number  // pixels
}
```

## File Count Summary
- **Configuration**: 8 files
- **Components (JSX)**: 5 files
- **Styles (CSS)**: 5 files
- **Utilities**: 4 files
- **Root (JS)**: 2 files
- **Total**: 24 files

## Setup Checklist
- [ ] Install Ollama from ollama.ai
- [ ] Run `ollama serve` in terminal
- [ ] Run `ollama pull llama3` (and/or mistral)
- [ ] `npm install` in project directory
- [ ] `npm run dev` to start dev server
- [ ] Open http://localhost:3000
- [ ] Upload a UI screenshot
- [ ] Wait for analysis (30-60 seconds)
- [ ] Click items to highlight, expand for fixes
- [ ] Export critique as PDF

## Technology Stack
| Layer | Tech |
|-------|------|
| Build | Vite 4.4.0 |
| Framework | React 18.2.0 |
| Styling | Pure CSS3 |
| API Client | Axios 1.6.0 |
| PDF Export | jsPDF 2.5.1 + html2canvas 1.4.1 |
| LLM | Ollama (local) |
| Runtime | Node.js 16+ |

---

✅ **Build Status**: Complete and ready to use
📦 **Next Step**: Install dependencies and run `npm run dev`
