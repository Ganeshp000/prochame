import React, { useState } from 'react';

const ONBOARD_STEPS = [
  {
    icon: '🚀',
    title: 'Welcome to Prochame',
    body: 'Prochame is a private overlay copilot that floats on your screen. It can review your screen, listen to calls, and assist with real-time advice or coding suggestions while staying hidden from screen shares.'
  },
  {
    icon: '🛡️',
    title: 'Configure Permissions',
    body: 'To enable capture features, Prochame requires standard macOS permissions. If prompted, please click Allow, or toggle them manually in System Settings.',
    buttons: [
      { label: 'Microphone Privacy Settings', action: 'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone' },
      { label: 'Screen Recording Privacy Settings', action: 'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture' }
    ]
  },
  {
    icon: '🔑',
    title: 'Add API Credentials',
    body: 'Prochame connects directly to your own OpenAI, Anthropic, or Google Gemini keys so you only pay for what you use. Enter your credentials in preferences to start.'
  },
  {
    icon: '🫥',
    title: 'Zoom Invisibility',
    body: 'Prochame is automatically hidden in Google Meet and Microsoft Teams. For Zoom, go to Zoom Settings → Share Screen → Advanced and choose "Advanced capture with window filtering" to protect overlay privacy.'
  },
  {
    icon: '⌨️',
    title: 'Shortcut Reference',
    body: 'Trigger Prochame from anywhere using your keyboard: \n• ⌘ + Enter — Trigger Assist\n• ⌘ + H — Solve screen contents\n• ⌘ + Shift + X — Quit application'
  }
];

export default function OnboardingGuide({ isOpen, onClose, prochame }) {
  const [stepIndex, setStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = ONBOARD_STEPS[stepIndex];

  const handleNext = () => {
    if (stepIndex === ONBOARD_STEPS.length - 1) {
      onClose();
    } else {
      setStepIndex(stepIndex + 1);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const handleOpenSettingsPane = (paneUrl) => {
    prochame.openUrl(paneUrl);
  };

  return (
    <div className="modal-scrim">
      <div className="onboard-modal modal-glass animate-pop">
        <div className="onboard-dots">
          {ONBOARD_STEPS.map((_, idx) => (
            <span key={idx} className={`dot ${idx === stepIndex ? 'active' : ''}`}></span>
          ))}
        </div>
        
        <div className="onboard-content">
          <div className="onboard-icon">{currentStep.icon}</div>
          <h2 className="onboard-title">{currentStep.title}</h2>
          <p className="onboard-body">{currentStep.body}</p>

          {currentStep.buttons && (
            <div className="onboard-actions-list">
              {currentStep.buttons.map((btn, idx) => (
                <button 
                  key={idx} 
                  className="onboard-btn-secondary"
                  onClick={() => handleOpenSettingsPane(btn.action)}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="onboard-footer">
          <button className="btn-skip" onClick={onClose}>Skip</button>
          <div className="spacer"></div>
          {stepIndex > 0 && <button className="btn-back" onClick={handleBack}>Back</button>}
          <button className="btn-next" onClick={handleNext}>
            {stepIndex === ONBOARD_STEPS.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
