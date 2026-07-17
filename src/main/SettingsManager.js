const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class SettingsManager {
  constructor() {
    this.filePath = path.join(app.getPath('userData'), 'prochame-data.json');
    this.defaults = {
      currentProvider: 'openai',
      smartModeEnabled: false,
      onboardingComplete: false,
      apiKeys: {
        openai: '',
        anthropic: '',
        gemini: ''
      },
      modelPreferences: {
        openai: { standard: 'gpt-4o-mini', advanced: 'gpt-4o' },
        anthropic: { standard: 'claude-3-5-haiku-latest', advanced: 'claude-3-5-sonnet-latest' },
        gemini: { standard: 'gemini-1.5-flash', advanced: 'gemini-1.5-pro' }
      }
    };
    this.settings = null;
  }

  load() {
    if (this.settings) return this.settings;
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        this.settings = this.mergeDeep(this.defaults, parsed);
      } else {
        this.settings = { ...this.defaults };
      }
    } catch (e) {
      console.error('[SettingsManager] Failed to load settings:', e);
      this.settings = { ...this.defaults };
    }
    return this.settings;
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.settings, null, 2), 'utf8');
    } catch (e) {
      console.error('[SettingsManager] Failed to save settings:', e);
    }
  }

  get() {
    return this.load();
  }

  set(patch) {
    this.load();
    this.settings = this.mergeDeep(this.settings, patch);
    this.save();
    return this.settings;
  }

  mergeDeep(target, source) {
    const output = Object.assign({}, target);
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.mergeDeep(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }
}

module.exports = new SettingsManager();
