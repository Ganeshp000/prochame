const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('prochame', {
  getSettings: () => ipcRenderer.invoke('prochame:settings:get'),
  setSettings: (patch) => ipcRenderer.invoke('prochame:settings:set', patch),
  runMode: (payload) => ipcRenderer.send('prochame:run-mode', payload),
  toggleListening: () => ipcRenderer.invoke('prochame:toggle-listening'),
  sendAudioChunk: (source, arrayBuffer) => ipcRenderer.send('prochame:audio-chunk', { source, arrayBuffer }),
  setMouseIgnore: (ignore) => ipcRenderer.send('prochame:mouse-ignore', ignore),
  openUrl: (url) => ipcRenderer.send('prochame:open-url', url),
  log: (msg) => ipcRenderer.send('prochame:log', msg),
  on: (channel, callback) => {
    const allowed = ['llm:start', 'llm:token', 'llm:done', 'llm:error', 'status', 'transcript', 'capture:state'];
    if (allowed.includes(channel)) {
      ipcRenderer.on(channel, (_event, data) => callback(data));
    }
  }
});
