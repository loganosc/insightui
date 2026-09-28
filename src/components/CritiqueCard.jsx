import React, { useState } from 'react';
import './CritiqueCard.css';

const CritiqueCard = ({
  issue,
  element,
  fix,
  severity,
  onSelect,
  isSelected,
  onChat,
  categoryIcon
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [chatReply, setChatReply] = useState('');
  const [chatError, setChatError] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) {
      return;
    }

    setChatError('');
    setIsChatLoading(true);
    try {
      const reply = await onChat({ issue, element, fix, severity, message: chatInput });
      setChatReply(String(reply || '').trim());
      setChatInput('');
    } catch (error) {
      setChatError(error?.message || 'Failed to get follow-up response.');
    } finally {
      setIsChatLoading(false);
    }
  };

  const severityColor = {
    Low: '#4ade80',
    Medium: '#fbbf24',
    High: '#f87171'
  };

  return (
    <div
      className={`critique-card ${isSelected ? 'selected' : ''}`}
      onClick={() => {
        onSelect();
        setIsExpanded(true);
      }}
    >
      <div className="critique-header">
        <div className="critique-meta">
          <span className="category-icon">{categoryIcon}</span>
          <span className="element-name">{element}</span>
        </div>
        <span className="severity-badge" style={{ borderColor: severityColor[severity] }}>
          <span className="severity-dot" style={{ backgroundColor: severityColor[severity] }}></span>
          {severity}
        </span>
      </div>

      <p className="issue-text">{issue}</p>

      <button
        className="expand-button"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
      >
        {isExpanded ? '▼' : '▶'} Details
      </button>

      {isExpanded && (
        <div className="critique-details">
          <div className="fix-section">
            <h4>💡 Suggested Fix</h4>
            <p>{fix}</p>
          </div>

          <button
            className="chat-toggle"
            onClick={(e) => {
              e.stopPropagation();
              setShowChat(!showChat);
            }}
          >
            💬 Follow-up Question
          </button>

          {showChat && (
            <form className="chat-form" onSubmit={handleChatSubmit} onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                className="chat-input"
                placeholder="Ask about this issue..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isChatLoading}
                autoFocus
              />
              <button type="submit" className="chat-submit" disabled={isChatLoading}>
                {isChatLoading ? 'Asking...' : 'Send'}
              </button>
            </form>
          )}

          {chatError && (
            <div className="chat-error" onClick={(e) => e.stopPropagation()}>
              {chatError}
            </div>
          )}

          {chatReply && (
            <div className="chat-reply" onClick={(e) => e.stopPropagation()}>
              <h4>Answer</h4>
              <p>{chatReply}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CritiqueCard;
