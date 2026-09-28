# Ollama Configuration Guide

This document explains how to configure Ollama for optimal performance with InsightUI.

## Default Configuration

InsightUI connects to Ollama at: `http://localhost:11434`

If you need to use a different host/port, you can:

### Option 1: Environment Variables (Recommended)

Create a `.env.local` file in the project root:

```env
VITE_OLLAMA_API_URL=http://your-server:11434
VITE_DEFAULT_MODEL=llama3
```

Then update `src/utils/ollamaApi.js`:

```javascript
const OLLAMA_API_BASE = import.meta.env.VITE_OLLAMA_API_URL || 'http://localhost:11434';
```

### Option 2: Docker Ollama

Run Ollama in Docker for isolated environments:

```bash
docker run -d \
  --name ollama \
  -p 11434:11434 \
  -v ollama:/root/.ollama \
  ollama/ollama
```

Then pull models:

```bash
docker exec ollama ollama pull llama3
docker exec ollama ollama pull mistral
```

## Performance Tuning

### Memory Management

Ollama automatically manages memory, but you can tune it:

```bash
# Reduce context window (faster, less memory):
OLLAMA_NUM_THREAD=4 ollama serve

# Increase GPU usage (if available):
OLLAMA_NUM_GPU=1 ollama serve
```

### Model Selection for Different Hardware

| Hardware | Recommended Model | Approximate Time |
|----------|-------------------|------------------|
| **16GB+ RAM, GPU** | llama3 | 30-45 sec |
| **8GB RAM, CPU** | mistral | 45-90 sec |
| **4GB RAM** | neural-chat (smaller) | 90-120 sec |

### Available Models

```bash
ollama pull llama3                # 7B, most detailed
ollama pull mistral               # 7B, fastest
ollama pull neural-chat           # Smaller, faster
ollama pull orca-mini             # 3B, very fast
ollama pull dolphin-mixtral       # More creative
```

List installed models:

```bash
ollama list
```

## Custom System Prompt

The UX critique system prompt is in `src/utils/ollamaApi.js`. You can customize it:

```javascript
const systemPrompt = `You are an expert UX Design Critic...`;
```

### Example customizations:

**For specific domains:**
```
You are a UX Design Expert specializing in e-commerce interfaces...
```

**For stricter formatting:**
```
You MUST return ONLY valid JSON, nothing else.
Return exactly 5 categories: usability, accessibility, visual_hierarchy, interaction_design, consistency.
```

**For different standards:**
```
Evaluate against WCAG 2.1 AAA, Material Design 3, and latest accessibility guidelines.
```

## Network Configuration

### Remote Ollama Server

To use a remote Ollama instance:

1. **Server setup** - Ensure Ollama listens on all interfaces:
   ```bash
   OLLAMA_HOST=0.0.0.0:11434 ollama serve
   ```

2. **Client setup** - Update `.env.local`:
   ```env
   VITE_OLLAMA_API_URL=http://your-ollama-server:11434
   ```

3. **Security** - In production, use:
   - Firewall rules to restrict access
   - Nginx reverse proxy with authentication
   - TLS/SSL for encrypted connections

## Debugging

Enable verbose logging:

```bash
# In src/utils/ollamaApi.js, add:
console.log('Request:', imageBase64.substring(0, 100));
console.log('Response:', response.data);
```

Monitor Ollama logs:

```bash
# Terminal running ollama serve shows real-time logs
# Look for: [main] loaded...</models>
```

## Advanced: Custom Prompt Engineering

Optimize prompts for specific use cases:

```javascript
// For stricter formatting:
const systemPrompt = `
You are an expert UX Designer. 
Analyze the UI screenshot and return ONLY a JSON object.
Do not include any text before or after the JSON.

Expected format: {
  "usability": [{"issue": "...", "element": "...", "fix": "...", "severity": "High|Medium|Low"}],
  ...
}

Be concise. Each issue should be 1 sentence.
Prioritize High severity issues - these block user goals.
`;

// For more creative analysis:
const systemPrompt = `
As a UX strategist with 15 years of experience, analyze this UI comprehensively.
Consider modern best practices from Nielsen Norman Group and Web.dev.
Provide both critical issues and opportunities for delight.
`;
```

## Monitoring & Health Checks

Check Ollama health:

```bash
curl http://localhost:11434/api/tags
```

Response shows available models and their sizes.

---

For more info: https://ollama.ai
