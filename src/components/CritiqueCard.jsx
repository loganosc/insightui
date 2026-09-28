import React, { useState } from 'react';
import Icon from './Icon';
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

  const severityClass = `sev-${String(severity || 'Medium').toLowerCase()}`;

  return (
    <div
      className={`critique-card ${severityClass} ${isSelected ? 'selected' : ''}`}
      onClick={() => {
        onSelect();
        setIsExpanded(true);
      }}
    >
      <div className="critique-header">
        <div className="critique-meta">
          <span className="category-icon-small">{categoryIcon}</span>
          <span className="element-name" title={element}>{element}</span>
        </div>
        <span className={`severity-badge ${severityClass}`}>
          <span className="severity-dot" />
          {severity}
        </span>
      </div>

      <p className="issue-text">{issue}</p>

      <button
        className={`expand-button ${isExpanded ? 'expanded' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        aria-expanded={isExpanded}
      >
        <Icon name="chevron" size={12} strokeWidth={2.2} />
        {isExpanded ? 'Hide details' : 'Show fix'}
      </button>

      {isExpanded && (
        <div className="critique-details">
          <div className="fix-section">
            <h4>
              <Icon name="bulb" size={13} />
              Suggested fix
            </h4>
            <p>{fix}</p>
          </div>

          {!showChat ? (
            <button
              className="chat-toggle"
              onClick={(e) => {
                e.stopPropagation();
                setShowChat(true);
              }}
            >
              <Icon name="chat" size={13} />
              Ask a follow-up question
            </button>
          ) : (
            <form className="chat-form" onSubmit={handleChatSubmit} onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                className="chat-input"
                placeholder="e.g. What contrast ratio should I aim for?"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isChatLoading}
                autoFocus
              />
              <button
                type="submit"
                className="chat-submit"
                disabled={isChatLoading || !chatInput.trim()}
                aria-label="Send question"
              >
                {isChatLoading ? <span className="mini-spinner" /> : <Icon name="send" size={14} />}
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
              <h4>
                <Icon name="sparkles" size={13} />
                Answer
              </h4>
              <p>{chatReply}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CritiqueCard;
