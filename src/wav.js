// Wrap raw Int16LE mono PCM in a WAV container so STT APIs accept it as a file.
function pcmToWav(pcm, sampleRate = 16000, channels = 1) {
  const dataSize = pcm.length;
  const byteRate = sampleRate * channels * 2;
  const blockAlign = channels * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);          // PCM
  buf.writeUInt16LE(channels, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(byteRate, 28);
  buf.writeUInt16LE(blockAlign, 32);
  buf.writeUInt16LE(16, 34);         // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  pcm.copy(buf, 44);
  return buf;
}

// Rough loudness gate so we don't ship silence to the STT API.
function rms16(pcm) {
  if (pcm.length < 2) return 0;
  let sum = 0;
  const n = pcm.length / 2;
  for (let i = 0; i < pcm.length; i += 2) { const s = pcm.readInt16LE(i); sum += s * s; }
  return Math.sqrt(sum / n);
}

module.exports = { pcmToWav, rms16 };
