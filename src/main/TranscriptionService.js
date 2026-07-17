const { OpenAI } = require('openai');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class TranscriptionService {
  async transcribe(pcmBuffer, provider, apiKey) {
    if (!pcmBuffer || pcmBuffer.length === 0) return '';
    
    // Silence gate: skip transcribing dead air
    if (this.calculateRms(pcmBuffer) < 250) {
      return '';
    }

    const wavData = this.pcmToWav(pcmBuffer, 16000);

    // Save temporary wav file for the provider APIs
    const tempFile = path.join(
      app.getPath('temp'), 
      `prochame_transcribe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.wav`
    );
    fs.writeFileSync(tempFile, wavData);

    try {
      if (provider === 'openai') {
        const openai = new OpenAI({ apiKey });
        const resp = await openai.audio.transcriptions.create({
          file: fs.createReadStream(tempFile),
          model: 'whisper-1',
          language: 'en'
        });
        return resp.text || '';
      } else if (provider === 'gemini') {
        let uploadResult;
        try {
          const ai = new GoogleGenAI({ apiKey });
          uploadResult = await ai.files.upload({
            file: tempFile,
            mimeType: 'audio/wav'
          });
          const resp = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [
              uploadResult,
              { text: 'Transcribe this audio. Return ONLY the transcribed text, nothing else. If there is no talking, return nothing.' }
            ]
          });
          try {
            await ai.files.delete({ name: uploadResult.name });
          } catch (delError) {
            console.warn('[TranscriptionService] Failed to delete remote Gemini file:', delError);
          }
          return resp.text ? resp.text.trim() : '';
        } catch (geminiError) {
          const errMsg = geminiError.message || String(geminiError);
          if (errMsg.includes('404') || errMsg.includes('NOT_FOUND') || errMsg.includes('exception parsing response')) {
            throw new Error('Gemini model not found (404) -- standard model may be deprecated, check Settings.');
          }
          throw geminiError;
        }
      } else {
        throw new Error(`Unsupported transcription provider: ${provider}`);
      }
    } catch (e) {
      console.error('[TranscriptionService] Transcription error:', e);
      throw e;
    } finally {
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      } catch (err) {
        console.warn('[TranscriptionService] Failed to clean up temp file:', err);
      }
    }
  }

  calculateRms(buf) {
    let sum = 0;
    const samples = buf.length / 2;
    for (let i = 0; i < buf.length; i += 2) {
      if (i + 1 < buf.length) {
        const val = buf.readInt16LE(i);
        sum += val * val;
      }
    }
    return Math.sqrt(sum / samples);
  }

  pcmToWav(pcmBuffer, sampleRate = 16000) {
    const wavHeader = Buffer.alloc(44);
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = pcmBuffer.length;
    const fileSize = 36 + dataSize;

    wavHeader.write('RIFF', 0);
    wavHeader.writeUInt32LE(fileSize, 4);
    wavHeader.write('WAVE', 8);
    wavHeader.write('fmt ', 12);
    wavHeader.writeUInt32LE(16, 16);
    wavHeader.writeUInt16LE(1, 20);
    wavHeader.writeUInt16LE(numChannels, 22);
    wavHeader.writeUInt32LE(sampleRate, 24);
    wavHeader.writeUInt32LE(byteRate, 28);
    wavHeader.writeUInt16LE(blockAlign, 32);
    wavHeader.writeUInt16LE(bitsPerSample, 34);
    wavHeader.write('data', 36);
    wavHeader.writeUInt32LE(dataSize, 40);

    return Buffer.concat([wavHeader, pcmBuffer]);
  }
}

module.exports = new TranscriptionService();
