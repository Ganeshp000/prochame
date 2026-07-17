import React, { useRef, useEffect } from 'react';

export default function Composer({ userText, setUserText, isSmart, onToggleSmart, onOpenSettings, onSubmit }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    adjustHeight();
  }, [userText]);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const gearIcon = (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );

  const sendIcon = (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="none">
      <path d="M8 5v14l11-7z" />
    </svg>
  );

  return (
    <div className="composer-container no-drag">
      <div className="input-textarea-wrapper">
        <textarea
          ref={textareaRef}
          rows="1"
          placeholder="Ask a question... (Cmd+Enter for Assist)"
          value={userText}
          onChange={(e) => setUserText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="composer-textarea"
        />
      </div>
      
      <div className="composer-toolbar-bottom">
        <button 
          className={`smart-toggle-pill ${isSmart ? 'active' : ''}`}
          onClick={onToggleSmart}
        >
          <span className="smart-indicator-glow"></span>
          <span>Smart Mode</span>
        </button>
        
        <button 
          className="composer-action-btn" 
          title="Open Settings"
          onClick={onOpenSettings}
        >
          {gearIcon}
        </button>
        
        <div className="spacer"></div>
        
        <button 
          className="composer-send-btn" 
          title="Submit Prompt"
          onClick={onSubmit}
        >
          {sendIcon}
        </button>
      </div>
    </div>
  );
}
