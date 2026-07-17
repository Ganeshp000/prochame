import React from 'react';
import MessageBubble from './MessageBubble';

export default function PanelBody({ messages, activeMode, onSelectMode, isListening }) {
  const modesList = [
    { id: 'assist', label: 'Assist', description: 'Contextual screen & conversation assist' },
    { id: 'reply', label: 'Draft Reply', description: 'Suggest spoken reply based on dialogue' },
    { id: 'summarize', label: 'Summarize', description: 'Recap discussions' },
    { id: 'questions', label: 'Questions', description: 'Propose follow-up questions' }
  ];

  return (
    <div className="panel-body-container no-drag">
      <div className="messages-viewport">
        {messages.length === 0 ? (
          <div className="empty-viewport-state">
            <p className="primary-empty-text">Prochame Assistant Active</p>
            <p className="secondary-empty-text">
              {isListening 
                ? 'Listening to system audio and microphone stream...' 
                : 'Toggle the status dot above to begin transcription capture.'}
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))
        )}
      </div>

      <div className="quick-actions-row">
        {modesList.map((mode) => (
          <button
            key={mode.id}
            className={`action-pill-btn ${activeMode === mode.id ? 'active' : ''}`}
            onClick={() => onSelectMode(mode.id)}
            title={mode.description}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}
