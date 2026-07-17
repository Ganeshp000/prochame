import React, { useState, useEffect } from 'react';

export default function SettingsModal({ isOpen, onClose, prochame }) {
  const [settings, setSettings] = useState(null);
  const [provider, setProvider] = useState('openai');
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [smartMode, setSmartMode] = useState(false);
  const [modelStandard, setModelStandard] = useState('');
  const [modelAdvanced, setModelAdvanced] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const data = await prochame.getSettings();
      setSettings(data);
      setProvider(data.currentProvider);
      setOpenaiKey(data.apiKeys.openai || '');
      setAnthropicKey(data.apiKeys.anthropic || '');
      setGeminiKey(data.apiKeys.gemini || '');
      setSmartMode(data.smartModeEnabled || false);
      
      const currentModels = data.modelPreferences[data.currentProvider] || { standard: '', advanced: '' };
      setModelStandard(currentModels.standard);
      setModelAdvanced(currentModels.advanced);
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  };

  const handleProviderChange = (newProvider) => {
    setProvider(newProvider);
    if (settings) {
      const currentModels = settings.modelPreferences[newProvider] || { standard: '', advanced: '' };
      setModelStandard(currentModels.standard);
      setModelAdvanced(currentModels.advanced);
    }
  };

  const handleSave = async () => {
    setSaveStatus('Saving...');
    try {
      const patch = {
        currentProvider: provider,
        smartModeEnabled: smartMode,
        apiKeys: {
          openai: openaiKey.trim(),
          anthropic: anthropicKey.trim(),
          gemini: geminiKey.trim()
        },
        modelPreferences: {
          ...settings.modelPreferences,
          [provider]: {
            standard: modelStandard.trim(),
            advanced: modelAdvanced.trim()
          }
        }
      };
      const updated = await prochame.setSettings(patch);
      setSettings(updated);
      setSaveStatus('Settings saved successfully!');
      setTimeout(() => {
        setSaveStatus('');
        onClose();
      }, 1000);
    } catch (e) {
      setSaveStatus('Error saving settings.');
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-scrim" onClick={(e) => e.target.className === 'modal-scrim' && onClose()}>
      <div className="settings-modal modal-glass animate-pop">
        <div className="modal-header">
          <h2 className="modal-title">Preferences</h2>
          <button className="modal-close-btn" onClick={onClose}>Done</button>
        </div>
        
        <div className="modal-body">
          <div className="setting-group">
            <label className="setting-label">API Provider</label>
            <div className="provider-tabs">
              {['openai', 'anthropic', 'gemini'].map((p) => (
                <button 
                  key={p} 
                  className={`provider-tab-btn ${provider === p ? 'active' : ''}`}
                  onClick={() => handleProviderChange(p)}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-group">
            <label className="setting-label">API Keys</label>
            <div className="input-field">
              <span className="field-prefix">OpenAI</span>
              <input 
                type="password" 
                placeholder="sk-..." 
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
              />
            </div>
            <div className="input-field">
              <span className="field-prefix">Anthropic</span>
              <input 
                type="password" 
                placeholder="sk-ant-..." 
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
              />
            </div>
            <div className="input-field">
              <span className="field-prefix">Gemini</span>
              <input 
                type="password" 
                placeholder="AIza..." 
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
              />
            </div>
            <p className="setting-hint">Credentials are saved locally in your User profile folder (prochame-data.json).</p>
          </div>

          <div className="setting-group">
            <label className="setting-label">Custom Models ({provider.toUpperCase()})</label>
            <div className="input-field">
              <span className="field-prefix">Standard</span>
              <input 
                type="text" 
                value={modelStandard}
                onChange={(e) => setModelStandard(e.target.value)}
              />
            </div>
            <div className="input-field">
              <span className="field-prefix">Advanced</span>
              <input 
                type="text" 
                value={modelAdvanced}
                onChange={(e) => setModelAdvanced(e.target.value)}
              />
            </div>
          </div>

          {saveStatus && <div className="save-status-msg">{saveStatus}</div>}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}
