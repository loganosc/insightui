# InsightUI - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install & Run Ollama

```bash
# 1. Download Ollama from https://ollama.ai
# 2. Open your terminal and run:
ollama serve

# In another terminal, pull the model:
ollama pull gemma4:4b
```

### Step 2: Install & Run InsightUI

```bash
cd insightui
npm install
npm run dev
```

App opens at `http://localhost:3000`

### Step 3: Upload & Analyze

1. Drag a screenshot into the left panel
2. Wait for AI analysis (30-60 seconds)
3. Review feedback in the right panel
4. Click items to highlight them on the screenshot
5. Expand items to see fix suggestions

---

## 📊 What You Get

### Five Categories of Feedback

| Category | Focus | Example |
|----------|-------|---------|
| 👤 **Usability** | User actions | "Button text too vague" |
| ♿ **Accessibility** | Inclusive design | "Poor color contrast ratio" |
| 📐 **Visual Hierarchy** | Information structure | "CTA not prominent enough" |
| 🎯 **Interaction Design** | Feedback & response | "No loading state indication" |
| ✓ **Consistency** | Design system | "Button style inconsistent" |

### Severity Levels

🟢 **Low** - Nice to have improvements  
🟡 **Medium** - Should address before launch  
🔴 **High** - Critical accessibility or usability issues  

---

## 🎮 Interactive Features

### Visual Mapping
Click any critique item → highlights the corresponding area on your screenshot

### Inline Feedback
Expand any item to:
- See the concrete fix suggestion
- Ask a follow-up question scoped to that specific issue

### Export
Click "📥 Export as PDF" to share a professional report

---

## ⚙️ Model Selection

**Top Bar** → Select between:
- `gemma4:4b` - Latest Google model, excellent for UI analysis (recommended)
- `qwen3-vl` - Vision model, optimized for UI analysis
- `llama3` - More detailed, better context
- `mistral` - Faster, uses less memory

Change models anytime. The app will re-analyze your screenshot.

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to Ollama"
**Solution:** 
- Check that `ollama serve` is running in a terminal
- Verify port 11434 is not blocked

### Issue: "Model not found"
**Solution:**
```bash
ollama pull llama3
ollama list  # verify it's installed
```

### Issue: "Analysis is very slow" 
**Solution:**
- Close other apps to free up RAM
- Try `mistral` instead for faster responses (at cost of detail)
- `gemma4:4b` requires ~4GB RAM
- Ensure your system has at least 8-16GB RAM for best results

---

## 📝 Example Workflow

1. **Designer uploads a login screen**
2. **System analyzes** → finds 12 issues
3. **Issues grouped** into 5 categories:
   - 2 accessibility problems (contrast, focus states)
   - 3 usability problems (button labels, error messages)
   - 2 visual hierarchy issues
   - 3 interaction design issues
   - 2 consistency issues
4. **Designer clicks** accessibility issue → screenshot highlights the contrast problem
5. **Designer expands** → sees fix: "Use #000000 text on #FFFFFF background (21:1 ratio)"
6. **Designer asks** "What about dark mode?" → inline chat for that specific issue
7. **Designer exports** → PDF report for developer handoff

---

## 🎨 Key Design Decisions

✅ **Designer-First**
- Zero learning curve for designers
- Visual workspace, not chat interface
- Copy-paste friendly fix suggestions

✅ **Private & Local**
- Uses local Ollama (no cloud needed)
- Unreleased designs stay on your computer
- Works offline once models are cached

✅ **Professional Tool**
- Looks like design tools, not chatbots
- Structured feedback, not prose
- Export-ready reports

---

## 📚 Learn More

- [Full Documentation](./README.md)
- [Ollama Documentation](https://ollama.ai)
- [UX Critique Best Practices](https://www.nngroup.com/articles/)

---

**Questions?** Check the troubleshooting section in README.md or review the console for error details.

Happy critiquing! 🎉
