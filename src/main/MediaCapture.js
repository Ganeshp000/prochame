const { desktopCapturer } = require('electron');

class MediaCapture {
  constructor() {
    this.audioBuffers = {
      user: [],
      system: []
    };
    this.isListening = false;
  }

  async takeScreenshot() {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 }
      });

      if (!sources || sources.length === 0) {
        throw new Error('No display capture source found.');
      }

      // Return the image data URL of the first screen
      return sources[0].thumbnail.toDataURL();
    } catch (e) {
      console.error('[MediaCapture] Failed to capture screen:', e);
      throw e;
    }
  }

  toggleListening(state) {
    this.isListening = state;
    if (!state) {
      this.clearBuffers();
    }
    return this.isListening;
  }

  appendAudioChunk(source, arrayBuffer) {
    if (!this.isListening) return;
    const buffer = Buffer.from(arrayBuffer);
    if (source === 'user') {
      this.audioBuffers.user.push(buffer);
    } else if (source === 'system') {
      this.audioBuffers.system.push(buffer);
    }
  }

  getAndFlushAudio(source) {
    const chunks = this.audioBuffers[source];
    if (!chunks || chunks.length === 0) return null;
    
    this.audioBuffers[source] = [];
    return Buffer.concat(chunks);
  }

  clearBuffers() {
    this.audioBuffers.user = [];
    this.audioBuffers.system = [];
  }
}

module.exports = new MediaCapture();
