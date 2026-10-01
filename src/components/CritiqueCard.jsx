import React, { useId, useState } from 'react';
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
  const uid = useId();
  const detailsId = `${uid}-details`;
  const chatInputId = `${uid}-chat`;

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
    <article className={`critique-card ${severityClass} ${isSelected ? 'selected' : ''}`}>
      <button
        type="button"
        className="critique-select"
        aria-pressed={isSelected}
        onClick={() => {
          onSelect();
          setIsExpanded(true);
        }}
      >
        <span className="critique-header">
          <span className="critique-meta">
            <span className="category-icon-small" aria-hidden="true">{categoryIcon}</span>
            <span className="element-name" title={element}>{element}</span>
          </span>
          <span className={`severity-badge ${severityClass}`}>
            <span className="severity-dot" aria-hidden="true" />
            {severity}
            <span className="visually-hidden"> severity</span>
          </span>
        </span>
        <span className="issue-text">{issue}</span>
        <span className="visually-hidden">. Highlight on screenshot.</span>
      </button>

      <button
        type="button"
        className={`expand-button ${isExpanded ? 'expanded' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={detailsId}
      >
        <Icon name="chevron" size={14} strokeWidth={2.2} />
        {isExpanded ? 'Hide details' : 'Show fix'}
      </button>

      {isExpanded && (
        <div className="critique-details" id={detailsId}>
          <section className="fix-section">
            <h4>
              <Icon name="bulb" size={16} />
              Suggested fix
            </h4>
            <p>{fix}</p>
          </section>

          {!showChat ? (
            <button
              type="button"
              className="chat-toggle"
              onClick={() => setShowChat(true)}
            >
              <Icon name="chat" size={16} />
              Ask a follow-up question
            </button>
          ) : (
            <form className="chat-form" onSubmit={handleChatSubmit}>
              <label htmlFor={chatInputId} className="visually-hidden">
                Follow-up question about this issue
              </label>
              <input
                id={chatInputId}
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
                aria-label={isChatLoading ? 'Sending question' : 'Send question'}
              >
                {isChatLoading ? <span className="mini-spinner" aria-hidden="true" /> : <Icon name="send" size={16} />}
              </button>
            </form>
          )}

          {chatError && (
            <p className="inline-error" role="alert">
              <Icon name="alert" size={16} />
              <span>{chatError}</span>
            </p>
          )}

          <div aria-live="polite">
            {chatReply && (
              <section className="chat-reply">
                <h4>
                  <Icon name="sparkles" size={16} />
                  Answer
                </h4>
                <p>{chatReply}</p>
              </section>
            )}
          </div>
        </div>
      )}
    </article>
  );
};

export default CritiqueCard;
