import React, { useState, useEffect } from 'react';
import { getAvailableModels } from '../utils/ollamaApi';
import './TopBar.css';

const TopBar = ({ selectedModel, onModelChange, isAnalyzing, theme, onToggleTheme }) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const availableModels = await getAvailableModels();
        const names = availableModels.map((m) => m.name);
        setModels(names);

        if (names.length > 0 && !names.includes(selectedModel)) {
          onModelChange(names[0]);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
        setModels(['gemma4:4b', 'qwen3-vl', 'llama3', 'mistral']); // Fallback defaults
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <h1 className="app-title">InsightUI</h1>
        <span className="app-subtitle">AI-Powered UX Critique</span>
      </div>

      <div className="top-bar-center">
        <label htmlFor="model-select" className="model-label">
          Model:
        </label>
        <select
          id="model-select"
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={isAnalyzing || loading}
          className="model-select"
        >
          {loading ? (
            <option>Loading models...</option>
          ) : models.length > 0 ? (
            models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))
          ) : (
            <option>No models available</option>
          )}
        </select>
        {isAnalyzing && <span className="analyzing-indicator">🔄 Analyzing...</span>}
      </div>

      <div className="top-bar-right">
        <button
          className="theme-toggle"
          type="button"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <a
          href="https://ollama.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="info-link"
          title="Ollama documentation"
        >
          ?
        </a>
      </div>
    </div>
  );
};

export default TopBar;
