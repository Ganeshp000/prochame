import React from 'react';

export default function Header({ isListening, onToggleListening, isCollapsed, onToggleCollapse, onOpenOnboarding, statusMessage }) {
  
  const logoSvg = (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M7 12h10" strokeLinecap="round" />
    </svg>
  );

  return (
    <div className="header-toolbar-wrapper">
      <div id="toolbar" className="toolbar-container">
        <button 
          className="tb-logo-btn" 
          title="Open Quick Guide"
          onClick={onOpenOnboarding}
        >
          {logoSvg}
        </button>
        <div className="tb-divider"></div>
        <button 
          className={`tb-collapse-btn ${isCollapsed ? 'collapsed' : ''}`}
          onClick={onToggleCollapse}
        >
          <span className="arrow-icon"></span>
          <span>{isCollapsed ? 'Show' : 'Hide'}</span>
        </button>
        <div className="tb-divider"></div>
        <button 
          className={`tb-listen-btn ${isListening ? 'active' : ''}`}
          title={isListening ? 'Stop capture' : 'Start capture'}
          onClick={onToggleListening}
        >
          <span className="status-dot"></span>
        </button>
      </div>
      
      {statusMessage && (
        <div id="prochame-status" className="status-message-bar show animate-fade">
          {statusMessage}
        </div>
      )}
    </div>
  );
}
