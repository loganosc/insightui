import React, { useState, useEffect } from 'react';
import { getAvailableModels } from '../utils/ollamaApi';
import Icon from './Icon';
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

  const connected = !loading && models.length > 0;
  const connectionState = loading ? 'pending' : connected ? 'online' : 'offline';
  const connectionLabel = {
    pending: 'Connecting',
    online: 'Ollama connected',
    offline: 'Ollama offline'
  }[connectionState];
  const nextTheme = theme === 'light' ? 'dark' : 'light';

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <div className="app-logo" aria-hidden="true">
          <Icon name="sparkles" size={16} strokeWidth={2} />
        </div>
        <div className="app-brand">
          <h1 className="app-title">InsightUI</h1>
          <span className="app-subtitle">AI-Powered UX Critique</span>
        </div>
      </div>

      <div className="top-bar-center">
        <span className={`connection-status ${connectionState}`} role="status">
          <span className="status-dot" aria-hidden="true" />
          {connectionLabel}
        </span>
        <div className={`model-picker ${isAnalyzing ? 'is-busy' : ''}`}>
          <label htmlFor="model-select" className="model-label">
            Model
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
        </div>
        {isAnalyzing && (
          <span className="analyzing-indicator">
            <span className="mini-spinner" aria-hidden="true" />
            Analyzing
          </span>
        )}
      </div>

      <div className="top-bar-right">
        <button
          className="theme-toggle"
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${nextTheme} mode`}
        >
          <Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} />
          <span className="theme-toggle-label">
            {nextTheme === 'dark' ? 'Dark mode' : 'Light mode'}
          </span>
        </button>
        <a
          href="https://ollama.com"
          target="_blank"
          rel="noopener noreferrer"
          className="icon-button"
          title="Ollama documentation (opens in a new tab)"
          aria-label="Ollama documentation (opens in a new tab)"
        >
          <Icon name="help" />
        </a>
      </div>
    </header>
  );
};

export default TopBar;
