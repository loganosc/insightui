# InsightUI - Development Guide

This guide helps developers extend and maintain InsightUI.

## Project Structure

```
insightui/
├── src/
│   ├── components/          # React components
│   │   ├── TopBar.jsx      # Header with model selection
│   │   ├── Canvas.jsx      # Left panel: screenshot viewer
│   │   ├── Inspector.jsx   # Right panel: critique list
│   │   ├── CritiqueCard.jsx # Individual critique item
│   │   ├── BottomBar.jsx   # Footer with export
│   │   └── *.css           # Component styles
│   ├── utils/
│   │   ├── ollamaApi.js    # Ollama integration
│   │   ├── pdfExport.js    # PDF generation
│   │   ├── coordinates.js  # Element mapping logic
│   │   └── sampleData.js   # Demo data
│   ├── App.jsx             # Main component
│   ├── App.css
│   └── main.jsx            # Entry point
├── public/
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

## Key Components

### 1. **TopBar.jsx**
Header component with:
- App branding
- Model selection dropdown
- Analysis status indicator
- Help link

**Props:**
- `selectedModel`: Current LLM model
- `onModelChange`: Callback when model is switched
- `isAnalyzing`: Boolean for loading state

### 2. **Canvas.jsx** (55% width)
Screenshot viewer with:
- Drag-and-drop upload
- File picker input
- Zoom controls (0.25x - 4x)
- Pan support (right-click + drag)
- Highlight overlay

**Props:**
- `screenshot`: Base64 image data
- `onScreenshotUpload`: Upload callback
- `highlightBox`: Bounding box to highlight {x, y, width, height}
- `zoom`: Current zoom level
- `onZoomChange`: Zoom callback
- `isAnalyzing`: Loading state

### 3. **Inspector.jsx** (45% width)
Categorized critique list with:
- Category sections (usability, accessibility, etc.)
- Expandable/collapsible categories
- Critique cards
- Issue count badge

**Props:**
- `critiqueData`: Structured feedback object
- `onSelectCritique`: Callback when item selected
- `selectedCritique`: Current selection
- `onChat`: Callback for follow-up questions
- `isLoading`: Analysis state

### 4. **CritiqueCard.jsx**
Individual feedback item with:
- Severity badge
- Expandable details
- Fix suggestion
- Inline chat input

**Props:**
- `issue`: Problem description
- `element`: Affected UI element
- `fix`: Suggested solution
- `severity`: Low|Medium|High
- `onSelect`: Selection callback
- `isSelected`: Visual selection state
- `onChat`: Chat callback
- `categoryIcon`: Emoji for category

### 5. **BottomBar.jsx**
Footer with:
- Status information
- PDF export button

**Props:**
- `critiqueData`: Feedback object
- `screenshot`: Base64 image
- `isLoading`: Export state

## Utilities

### ollamaApi.js
```javascript
// Main analysis function
analyzeScreenshot(imageBase64, model)
  → Promise<{usability: [...], accessibility: [...], ...}>

// Connection check
checkOllamaHealth() → Promise<{models: [...]}>

// List available models
getAvailableModels() → Promise<[{name: "llama3", ...}]>
```

### pdfExport.js
```javascript
// Export selected content to PDF
exportToPDF(filename) → Promise<void>

// Generate full report with data
generatePDFReport(critiqueData, screenshotUrl, filename) → Promise<void>
```

### coordinates.js
```javascript
// Estimate bounding box for UI element
estimateElementCoordinates(element, imageWidth, imageHeight)
  → {x, y, width, height}

// Generate random boxes for demo
generateRandomCoordinates(imageWidth, imageHeight, count)
  → [{x, y, width, height}, ...]
```

## Data Flow

```
User uploads screenshot
        ↓
Canvas.jsx reads file as Base64
        ↓
App.jsx calls ollamaApi.analyzeScreenshot()
        ↓
Ollama LLM processes image, returns JSON
        ↓
App.jsx stores in critiqueData state
        ↓
Inspector.jsx displays categorized feedback
        ↓
User clicks critique item
        ↓
App.jsx calculates highlight box
        ↓
Canvas.jsx displays overlay
```

## State Management (App.jsx)

```javascript
const [screenshot, setScreenshot]           // Base64 image
const [critiqueData, setCritiqueData]       // Structured feedback
const [selectedModel, setSelectedModel]     // Current LLM
const [isAnalyzing, setIsAnalyzing]       // Loading state
const [zoom, setZoom]                       // Camera zoom level
const [highlightBox, setHighlightBox]       // Current highlight
const [selectedCritique, setSelectedCritique] // Current selection
```

## Adding New Features

### 1. Add a New Category

1. Update system prompt in `ollamaApi.js`:
```javascript
const systemPrompt = `...
{
  "usability": [...],
  "new_category": [...],  // Add here
  ...
}
`;
```

2. Update category icons in `Inspector.jsx`:
```javascript
const categoryIcons = {
  ...
  new_category: '🆕'
};
```

3. Update labels:
```javascript
const categoryLabels = {
  ...
  new_category: 'New Category'
};
```

### 2. Implement Element Detection

Replace `coordinates.js` logic:

```javascript
// Option 1: Use ml5.js for object detection
import ml5 from 'ml5';

export const detectElements = async (image) => {
  const classifier = await ml5.customHandPose();
  const results = await classifier.estimatePose(image);
  return results;
};

// Option 2: Use TensorFlow.js
import * as tf from '@tensorflow/tfjs';

export const detectUI = async (imageTensor) => {
  const model = await tf.loadLayersModel('model.json');
  const predictions = model.predict(imageTensor);
  return predictions;
};
```

### 3. Add Real-time Chat

Replace mock chat in `App.jsx`:

```javascript
const handleChat = async (chatData) => {
  const response = await axios.post('/api/chat', {
    context: chatData,
    critiqueData: critiqueData,
    screenshot: screenshot,
    model: selectedModel
  });
  
  // Display response (could add chat panel)
  console.log(response.data.answer);
};
```

### 4. Custom Styling

CSS variables are already set up. Override in `App.css`:

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #4ade80;
  --warning-color: #fbbf24;
  --error-color: #f87171;
}
```

## Performance Optimization

### Image Optimization
```javascript
// In Canvas.jsx - compress before sending
const compressImage = (dataUrl) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  
  img.onload = () => {
    canvas.width = img.width / 2;
    canvas.height = img.height / 2;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
  };
  
  img.src = dataUrl;
};
```

### Lazy Loading Critique Cards
```javascript
// In Inspector.jsx
import { useEffect, useRef } from 'react';

const CritiqueList = ({ items }) => {
  const observerRef = useRef();
  
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Load content
        }
      });
    });
    
    return () => observer.disconnect();
  }, []);
};
```

## Testing

### Unit Tests (with Vitest)

```bash
npm install -D vitest @testing-library/react
```

Example `components/CritiqueCard.test.jsx`:
```javascript
import { render, screen } from '@testing-library/react';
import CritiqueCard from './CritiqueCard';

describe('CritiqueCard', () => {
  it('displays issue text', () => {
    render(<CritiqueCard issue="Test issue" {...otherProps} />);
    expect(screen.getByText('Test issue')).toBeInTheDocument();
  });
});
```

### Integration Tests

```javascript
// Test full flow
test('upload and analyze', async () => {
  // 1. Upload screenshot
  // 2. Wait for analysis
  // 3. Verify critique appears
  // 4. Click item
  // 5. Verify highlight shows
});
```

## Browser Support

- Chrome/Edge: 90+
- Firefox: 88+
- Safari: 14+
- Mobile: Responsive design works on tablets

## Environment Variables

Create `.env.local`:
```env
VITE_OLLAMA_API_URL=http://localhost:11434
VITE_DEFAULT_MODEL=llama3
VITE_API_TIMEOUT=300000
```

Access in code:
```javascript
const API_URL = import.meta.env.VITE_OLLAMA_API_URL;
```

## Debugging

### React DevTools
Install Chrome/Firefox extension for component inspection

### Network Debugging
```javascript
// In ollamaApi.js
const response = await axios.post(url, data);
console.log('Request:', data);
console.log('Response:', response.data);
```

### Performance Profiling
```javascript
// Profile component render time
import { Profiler } from 'react';

<Profiler id="Canvas" onRender={(id, phase, actualDuration) => {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}}>
  <Canvas />
</Profiler>
```

## Deployment

### Vercel
```bash
vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 3000
CMD ["npm", "preview"]
```

### Environment Setup for Production
- Ensure Ollama is running securely
- Use authentication/rate limiting for shared instances
- Cache models locally
- Consider edge deployment for latency

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test locally
3. Run build: `npm run build`
4. Create PR with description
5. Code review and merge

## Roadmap

- [ ] ML-based element detection
- [ ] Multi-screenshot comparison
- [ ] Team collaboration (comments, reviews)
- [ ] Design system integration
- [ ] Custom prompt templates
- [ ] Offline model caching
- [ ] Advanced filtering and sorting
- [ ] Integration with Figma/Adobe XD

---

**Questions?** Review code comments in each component or check the main README.
