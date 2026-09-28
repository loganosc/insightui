# InsightUI - AI-Powered UX Critique Tool

A designer-first web interface where designers upload UI screenshots and receive **structured, categorized critiques** mapped visually to the image using local Ollama LLM.

## Features

✨ **Designer-First Interface**
- Clean, professional split-screen layout (55% Canvas / 45% Inspector)
- Intuitive drag-and-drop screenshot upload
- Zoomable and pannable screenshot viewer

🤖 **AI-Powered Critique**
- Local LLM integration with Ollama (Llama 3, Mistral)
- Structured feedback across 5 core UX categories:
  - **Usability** - User interaction patterns
  - **Accessibility** - WCAG compliance and inclusive design
  - **Visual Hierarchy** - Information structure and emphasis
  - **Interaction Design** - UI responsiveness and feedback
  - **Consistency** - Design system adherence

🎯 **Interactive Feedback**
- Click critique items to highlight corresponding areas on screenshot
- Expandable cards with severity badges (Low, Medium, High)
- Inline follow-up questions for each issue
- Concrete, actionable fix suggestions

📊 **Export & Reporting**
- Export comprehensive PDF reports
- Model selection (Llama 3, Mistral)
- Real-time analysis status

## Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** CSS3 (no dependencies)
- **PDF Export:** jsPDF + html2canvas
- **LLM:** Local Ollama API
- **HTTP Client:** Axios

## Prerequisites

1. **Node.js** (v16+)
2. **Ollama** - Download and install from [ollama.ai](https://ollama.ai)
3. **Ollama Models** - Pull at least one model:
   ```bash
   ollama pull gemma4:4b    # Recommended - latest Google model
   ollama pull qwen3-vl    # Vision model
   ollama pull llama3
   ollama pull mistral
   ```

## Setup & Installation

### 1. Install Ollama

Download from [https://ollama.ai](https://ollama.ai) and follow the installation instructions for your OS (macOS, Linux, or Windows).

### 2. Start Ollama Server

```bash
ollama serve
```

The Ollama API will be available at `http://localhost:11434`

### 3. Pull Models

In a new terminal:

```bash
# For Gemma 4:4B (recommended, latest Google model, ~4GB)
ollama pull gemma4:4b

# For Qwen3-VL (vision-optimized, ~8GB)
ollama pull qwen3-vl

# For Llama 3 (~7GB)
ollama pull llama3

# For Mistral (faster, ~6GB)
ollama pull mistral
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Usage Guide

### Uploading a Screenshot

1. Click the upload zone or drag-and-drop a UI screenshot (PNG, JPG, etc.)
2. The app automatically sends it to the Ollama model for analysis
3. Wait for analysis to complete (typically 30-60 seconds depending on model)

### Reviewing Feedback

- **Inspector Panel** (right): Shows all issues organized by category
- **Canvas Panel** (left): Shows your screenshot with highlights
- Click any critique item to highlight the corresponding area
- Expand items to see fix suggestions and ask follow-up questions

### Model Selection

Use the dropdown in the top bar to switch between models:
- **Gemma 4:4B**: Latest Google model, excellent for UI analysis (recommended)
- **Qwen3-VL**: Vision-language model, good for visual UI analysis
- **Llama 3**: Detailed analysis, good context understanding
- **Mistral**: Faster responses, lighter on system resources

### Exporting

Click "📥 Export as PDF" in the bottom bar to generate a professional critique report.

## API Integration Details

### Ollama Connection

The app communicates with Ollama's `/api/generate` endpoint:

```javascript
POST http://localhost:11434/api/generate
{
  "model": "llama3",
  "prompt": "...",
  "system": "You are a UX Design Expert...",
  "stream": false,
  "format": "json"
}
```

### Critique Data Structure

The LLM returns a JSON object:

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

Each category contains an array of issues with:
- `issue`: One-sentence description
- `element`: UI element affected
- `fix`: Actionable suggestion
- `severity`: Low, Medium, or High

## Architecture

```
insightui/
├── src/
│   ├── components/
│   │   ├── Canvas.jsx          # Left panel: screenshot viewer
│   │   ├── Inspector.jsx       # Right panel: critique list
│   │   ├── CritiqueCard.jsx    # Individual feedback item
│   │   ├── TopBar.jsx          # Model selection header
│   │   ├── BottomBar.jsx       # Export controls
│   │   └── *.css               # Component styles
│   ├── utils/
│   │   ├── ollamaApi.js        # Ollama integration
│   │   ├── pdfExport.js        # PDF generation
│   │   └── coordinates.js      # Element mapping
│   ├── App.jsx                 # Main component
│   ├── main.jsx                # Entry point
│   └── App.css
├── index.html
├── vite.config.js
└── package.json
```

## Keyboard Shortcuts

- **Ctrl/Cmd + Scroll**: Zoom in/out on screenshot
- **Right-click + drag**: Pan around zoomed image
- **Escape**: Reset zoom and pan

## Troubleshooting

### "Failed to connect to Ollama"
- Ensure Ollama is running: `ollama serve`
- Check if port 11434 is accessible
- Verify firewall settings

### "Model not found"
- Ensure you've pulled the model: `ollama pull llama3`
- Check available models: `ollama list`

### "Analysis is very slow"
- You may need more RAM (Llama 3 requires ~8GB)
- Try Mistral for faster results
- Close other applications

### "Screenshot not highlighted correctly"
- The element detection uses pattern matching
- In production, integrate ML-based element detection (e.g., OpenCV.js)

## Future Enhancements

🔮 **Planned Features**
- ML-based element detection for precise highlighting
- Multi-screenshot comparison
- Design system integration
- Team collaboration features
- Custom prompt templates
- Offline mode with local model caching
- Real-time PDF preview
- Advanced filtering and sorting

## Development

### Build for Production

```bash
npm run build
```

Output goes to `dist/` directory.

### Environment Variables (Optional)

Create `.env.local`:

```
VITE_OLLAMA_API_URL=http://localhost:11434
VITE_DEFAULT_MODEL=llama3
```

## License

MIT - Built for designers by designers

## Support & Feedback

For issues or feature requests, please open an issue or contact the development team.

---

**Made with ❤️ for UX designers who care about inclusive, usable interfaces.**
