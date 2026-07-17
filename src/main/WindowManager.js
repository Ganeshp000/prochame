const { BrowserWindow, screen } = require('electron');
const path = require('path');

class WindowManager {
  constructor() {
    this.window = null;
  }

  createWindow() {
    const { workArea } = screen.getPrimaryDisplay();
    const width = 720;
    const height = 650;

    this.window = new BrowserWindow({
      width: width,
      height: height,
      x: Math.round(workArea.x + (workArea.width - width) / 2),
      y: workArea.y + 10,
      frame: false,
      transparent: true,
      hasShadow: false,
      resizable: true,
      skipTaskbar: true,
      alwaysOnTop: true,
      fullscreenable: false,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    });

    // Best-effort content protection/invisibility from capture APIs
    const noProtect = !!process.env.PROCHAME_NO_PROTECT;
    this.window.setContentProtection(!noProtect);
    this.window.setAlwaysOnTop(true, 'screen-saver', 1);
    this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    
    if (typeof this.window.setHiddenInMissionControl === 'function') {
      this.window.setHiddenInMissionControl(true);
    }

    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      this.window.loadURL('http://localhost:5173');
    } else {
      this.window.loadFile(path.join(__dirname, '../../out/index.html'));
    }

    this.window.webContents.on('did-finish-load', () => {
      this.window.showInactive();
    });

    this.window.webContents.on('render-process-gone', (event, details) => {
      console.error('[WindowManager] Renderer process crashed:', JSON.stringify(details));
    });

    return this.window;
  }

  setIgnoreMouseEvents(ignore) {
    if (this.window && !this.window.isDestroyed()) {
      this.window.setIgnoreMouseEvents(ignore, { forward: true });
    }
  }

  send(channel, data) {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(channel, data);
    }
  }

  getWindow() {
    return this.window;
  }
}

module.exports = new WindowManager();
