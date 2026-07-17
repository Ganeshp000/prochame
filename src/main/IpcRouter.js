const { ipcMain, shell } = require('electron');
const SettingsManager = require('./SettingsManager');
const WindowManager = require('./WindowManager');
const MediaCapture = require('./MediaCapture');
const TranscriptionService = require('./TranscriptionService');
const LlmService = require('./LlmService');

class IpcRouter {
  constructor() {
    this.transcript = [];
    this.transcriptionTimer = null;
    this.transcriptionBusy = { user: false, system: false };
    this.isLlmBusy = false;
    this.sttDisabledErrorShown = false;
  }

  initialize() {
    // 1. Settings handlers
    ipcMain.handle('prochame:settings:get', () => SettingsManager.get());
    ipcMain.handle('prochame:settings:set', (_event, patch) => {
      this.sttDisabledErrorShown = false; // Reset warning on key change
      return SettingsManager.set(patch);
    });

    // 2. Listening / Capture Toggle
    ipcMain.handle('prochame:toggle-listening', () => {
      const state = !MediaCapture.isListening;
      const active = MediaCapture.toggleListening(state);
      
      if (active) {
        this.startTranscriptionLoop();
      } else {
        this.stopTranscriptionLoop();
      }
      
      WindowManager.send('capture:state', { active });
      return active;
    });

    // 3. Receive Audio Chunk
    ipcMain.on('prochame:audio-chunk', (_event, { source, arrayBuffer }) => {
      MediaCapture.appendAudioChunk(source, arrayBuffer);
    });

    // 4. Run Mode (trigger LLM task)
    ipcMain.on('prochame:run-mode', (_event, payload) => {
      this.executeMode(payload.mode, payload.text);
    });

    // 5. Mouse click-through
    ipcMain.on('prochame:mouse-ignore', (_event, ignore) => {
      WindowManager.setIgnoreMouseEvents(ignore);
    });

    // 6. External URL
    ipcMain.on('prochame:open-url', (_event, url) => {
      shell.openExternal(url).catch(err => console.error('[IpcRouter] Open URL failed:', err));
    });

    // 7. Renderer logging
    ipcMain.on('prochame:log', (_event, msg) => {
      console.log('[Renderer]', msg);
    });
  }

  startTranscriptionLoop() {
    if (this.transcriptionTimer) return;
    this.transcriptionTimer = setInterval(() => {
      this.processTranscription('user');
      this.processTranscription('system');
    }, 3500);
  }

  stopTranscriptionLoop() {
    if (this.transcriptionTimer) {
      clearInterval(this.transcriptionTimer);
      this.transcriptionTimer = null;
    }
  }

  async processTranscription(source) {
    if (this.transcriptionBusy[source]) return;
    const pcm = MediaCapture.getAndFlushAudio(source);
    if (!pcm || pcm.length === 0) return;

    this.transcriptionBusy[source] = true;
    try {
      const settings = SettingsManager.get();
      const apiKey = settings.apiKeys[settings.currentProvider];
      
      if (!apiKey) {
        if (!this.sttDisabledErrorShown) {
          this.sttDisabledErrorShown = true;
          WindowManager.send('status', { message: 'Missing API key. Listening features require a valid key in Settings.' });
        }
        return;
      }

      // Default to OpenAI Whisper for speech-to-text, or Gemini if selected provider is Gemini
      const sttProvider = settings.currentProvider === 'gemini' ? 'gemini' : 'openai';
      const sttApiKey = settings.apiKeys[sttProvider];

      if (!sttApiKey) {
        if (!this.sttDisabledErrorShown) {
          this.sttDisabledErrorShown = true;
          WindowManager.send('status', { message: `Audio transcription requires a key for ${sttProvider === 'gemini' ? 'Gemini' : 'OpenAI'}.` });
        }
        return;
      }

      const text = await TranscriptionService.transcribe(pcm, sttProvider, sttApiKey);
      if (text && text.trim()) {
        const turn = {
          sender: source === 'user' ? 'user' : 'system',
          text: text.trim(),
          timestamp: Date.now()
        };
        this.transcript.push(turn);
        WindowManager.send('transcript', turn);
      }
    } catch (e) {
      console.error(`[IpcRouter] STT ${source} error:`, e.message);
    } finally {
      this.transcriptionBusy[source] = false;
    }
  }

  async executeMode(mode, userText) {
    if (this.isLlmBusy) return;
    const modeConfig = LlmService.modes[mode];
    if (!modeConfig) return;

    this.isLlmBusy = true;
    
    // Notify frontend streaming starts
    const userBubble = modeConfig.requiresScreen || mode === 'ask' 
      ? (userText || (mode === 'code' ? 'Analyze screen contents' : 'Assist')) 
      : null;
      
    WindowManager.send('llm:start', { userBubble, small: mode === 'questions' || mode === 'summarize' });

    try {
      const settings = SettingsManager.get();
      const provider = settings.currentProvider;
      const apiKey = settings.apiKeys[provider];

      if (!apiKey) {
        WindowManager.send('llm:error', { message: `Please provide your ${provider.toUpperCase()} API key in Settings.` });
        return;
      }

      const model = settings.smartModeEnabled 
        ? settings.modelPreferences[provider].advanced 
        : settings.modelPreferences[provider].standard;

      let imageDataUrl = null;
      if (modeConfig.requiresScreen) {
        try {
          imageDataUrl = await MediaCapture.takeScreenshot();
        } catch (e) {
          WindowManager.send('status', { message: 'Screen Recording permission is required for screenshot features.' });
        }
      }

      await LlmService.streamCompletion({
        provider,
        apiKey,
        model,
        mode,
        transcript: this.transcript,
        userText,
        imageDataUrl
      }, (token) => {
        WindowManager.send('llm:token', { text: token });
      });

      WindowManager.send('llm:done', {});
    } catch (err) {
      WindowManager.send('llm:error', { message: `LLM Error: ${err.message}` });
    } finally {
      this.isLlmBusy = false;
    }
  }

  ensureListeningAndAssist() {
    if (!MediaCapture.isListening) {
      const active = MediaCapture.toggleListening(true);
      if (active) {
        this.startTranscriptionLoop();
      }
      WindowManager.send('capture:state', { active });
    }
    this.executeMode('assist', '');
  }
}

module.exports = new IpcRouter();
