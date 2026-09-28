# InsightUI - AI-Powered UX Critique Tool

A designer-first web interface for getting **structured, categorized UX critiques** of an interface from a local Ollama LLM. Give it a screenshot, the page's HTML/CSS/DOM, a short product description, or any combination. It returns feedback grouped into five UX categories.

## Features

✨ **Designer-First Interface**
- Split-screen layout (55% Canvas / 45% Inspector); stacks vertically on narrow windows
- Drag-and-drop or file-picker screenshot upload
- Zoomable and pannable screenshot viewer
- Light and dark themes

🧩 **Multiple Input Types**
- Screenshot (sent to the model as an image, so a vision-capable model works best)
- HTML and CSS (paste, or upload `.html` / `.css` files)
- DOM / rendered markup
- Product or page description
- Snapshot JSON import from the bundled [Chrome extension](chrome-extension/README.md)

🤖 **AI-Powered Critique**
- Runs entirely against your local Ollama server
- Structured feedback across 5 core UX categories:
  - **Usability** - User interaction patterns
  - **Accessibility** - WCAG compliance and inclusive design
  - **Visual Hierarchy** - Information structure and emphasis
  - **Interaction Design** - UI responsiveness and feedback
  - **Consistency** - Design system adherence

🎯 **Interactive Feedback**
- Click a critique item to highlight an approximate area on the screenshot
- Expandable cards with severity badges (Low, Medium, High)
- Ask the model a follow-up question about any issue
- Concrete, actionable fix suggestions

📊 **Export & Reporting**
- Export a PDF report with the screenshot and all issues
- Model picker populated from the models installed in your Ollama

## Tech Stack

- **Frontend:** React 18 + Vite 4
- **Styling:** Plain CSS (no UI framework)
- **PDF Export:** jsPDF + html2canvas
- **LLM:** Local Ollama API
- **HTTP Client:** Axios
- **Browser extension:** Chrome Manifest V3

## Prerequisites

1. **Node.js** (v16+)
2. **Ollama**: download and install from [ollama.com](https://ollama.com)
3. **At least one Ollama model.** The app defaults to `gemma4:4b`. For screenshot analysis, use a vision-capable model.

## Setup & Installation

### 1. Start Ollama

```bash
ollama serve
```

The Ollama API will be available at `http://localhost:11434`.

### 2. Pull a model

In a new terminal:

```bash
ollama pull gemma4:4b    # the app's default
```

Any other model you've pulled (e.g. `qwen3-vl`, `llama3`, `mistral`) will also appear in the model picker.

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

Open `http://localhost:3000`. If port 3000 is taken, Vite picks the next free port and prints it in the terminal.

## Usage Guide

### Providing Inputs

1. **Screenshot:** drag and drop an image onto the canvas, or click **Choose File**.
2. **Code / context (optional):** in the **Interface Inputs** panel below the canvas, paste or upload HTML and CSS, paste DOM markup, and add a short description of the page's goal.
3. **Snapshot JSON (optional):** click **Upload Snapshot JSON** to load a capture from the Chrome extension. This fills in the HTML, CSS, DOM and description fields.
4. Click **Analyze Interface**. Analysis does not start automatically. Time depends on your model and hardware.

You can analyze with a screenshot alone, code alone, or both.

### Reviewing Feedback

- **Inspector Panel** (right): all issues, grouped by category with counts
- **Canvas Panel** (left): your screenshot plus the input fields
- Click a critique card to highlight its area on the screenshot and expand it
- Expanded cards show the suggested fix and a **💬 Follow-up Question** box

> **Note:** highlighting is approximate. It guesses a region from keywords in the element name (e.g. "header", "button", "footer"). It doesn't detect the real element.

### Model Selection

The **Model** dropdown in the top bar lists the models installed in your local Ollama (from `/api/tags`). If the selected model isn't installed, the app switches to the first available one.

### Exporting

After an analysis, click **📥 Export as PDF** in the bottom bar to download a report.

### Chrome Extension

`chrome-extension/` contains a DOM scraper that captures a page's HTML, stylesheets and DOM nodes. It can download the capture as JSON, or open InsightUI with the data pre-filled. See [chrome-extension/README.md](chrome-extension/README.md) for install and usage.

## API Integration Details

### Ollama Connection

The app calls Ollama's `/api/generate` endpoint at `http://localhost:11434` (hardcoded in [src/utils/ollamaApi.js](src/utils/ollamaApi.js)):

```javascript
POST http://localhost:11434/api/generate
{
  "model": "gemma4:4b",
  "prompt": "...",          // instructions + any HTML/CSS/DOM/description
  "system": "You are an expert UX Design Critic...",
  "stream": false,
  "format": "json",
  "images": ["<base64>"]    // only when a screenshot is provided
}
```

Each HTML, CSS, DOM and description section is truncated to 20,000 characters before sending. Follow-up questions use the same endpoint without `format: "json"`.

### Critique Data Structure

The model is asked to return a JSON object like:

```json
{
  "usability": [
    {
      "issue": "Primary button is too small and hard to click",
      "element": "Primary CTA button",
      "fix": "Increase button size to at least 44x44px (touch target)",
      "severity": "High"
    }
  ],
  "accessibility": [...],
  "visual_hierarchy": [...],
  "interaction_design": [...],
  "consistency": [...]
}
```

Each issue has:
- `issue`: One-sentence description
- `element`: UI element affected
- `fix`: Actionable suggestion
- `severity`: Low, Medium, or High

Model output is normalized: alternate key names (e.g. `a11y`, `recommendation`, `priority`) are mapped onto this shape. Plain-text responses are split into issues and sorted into categories.

## Architecture

```
insightui/
├── src/
│   ├── components/
│   │   ├── Canvas.jsx          # Left panel: screenshot viewer + inputs
│   │   ├── InterfaceInput.jsx  # HTML/CSS/DOM/description fields, JSON import
│   │   ├── Inspector.jsx       # Right panel: critique list by category
│   │   ├── CritiqueCard.jsx    # Individual feedback item + follow-up
│   │   ├── TopBar.jsx          # Model picker, theme toggle
│   │   ├── BottomBar.jsx       # Issue count, PDF export
│   │   └── *.css               # Component styles
│   ├── utils/
│   │   ├── ollamaApi.js        # Ollama integration + response normalization
│   │   ├── pdfExport.js        # PDF generation
│   │   ├── coordinates.js      # Keyword-based highlight regions
│   │   └── sampleData.js       # Sample critique data (not currently used)
│   ├── App.jsx                 # Main component, extension handoff
│   ├── main.jsx                # Entry point
│   └── App.css
├── chrome-extension/           # DOM scraper extension (Manifest V3)
├── index.html
├── vite.config.js
└── package.json
```

## Canvas Controls

- **Ctrl/Cmd + Scroll**: zoom in/out (25%–400%)
- **Right-click + drag** or **Ctrl/Cmd + drag**: pan the image
- **− / + buttons**: zoom in 25% steps
- **⟲ button**: reset zoom and pan

## Troubleshooting

### "Analysis failed: ... Network Error"
- Make sure Ollama is running: `ollama serve`
- Check that `http://localhost:11434` is reachable

### Model dropdown says "No models available"
- Pull a model: `ollama pull gemma4:4b`
- Check installed models: `ollama list`
- Reload the page after Ollama is running

### Analysis is very slow
- Larger models need more RAM/VRAM; try a smaller model
- Large HTML/CSS/DOM inputs make prompts longer. Try trimming them.

### Highlight is in the wrong place
- Expected: highlights are keyword-based estimates, not real element detection (see [src/utils/coordinates.js](src/utils/coordinates.js))

## Future Enhancements

🔮 **Ideas**
- ML-based element detection for precise highlighting
- Configurable Ollama URL / default model via environment variables
- Multi-screenshot comparison
- Design system integration
- Custom prompt templates
- Advanced filtering and sorting

## Development

### Build for Production

```bash
npm run build     # outputs to dist/
npm run preview   # serve the production build locally
```

## License

MIT

---

**Made by [@loganosc](https://github.com/loganosc).**
