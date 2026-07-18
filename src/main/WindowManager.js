const { BrowserWindow, screen } = require('electron');
const path = require('path');
const os = require('os');

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

    // Windows content-protection version check:
    // On Windows 10 v2004+ (build 19041+), Electron uses WDA_EXCLUDEFROMCAPTURE
    // which truly hides the window from capture. On older Windows, it falls back
    // to WDA_MONITOR which shows a black rectangle instead — weaker protection.
    if (process.platform === 'win32' && !noProtect) {
      this._checkWindowsContentProtection();
    }

    this.window.setAlwaysOnTop(true, 'screen-saver', 1);

    // macOS-specific workspace visibility features
    if (process.platform === 'darwin') {
      this.window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

      if (typeof this.window.setHiddenInMissionControl === 'function') {
        this.window.setHiddenInMissionControl(true);
      }
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

  /**
   * Check Windows version and warn if content protection may be limited.
   * Windows 10 v2004 = OS build 10.0.19041.
   * os.release() returns "10.0.19041" style strings on Windows.
   */
  _checkWindowsContentProtection() {
    try {
      const release = os.release(); // e.g. "10.0.19041"
      const parts = release.split('.');
      const buildNumber = parseInt(parts[2], 10) || 0;

      console.log(`[WindowManager] Windows detected — OS build: ${release} (build ${buildNumber})`);

      if (buildNumber < 19041) {
        const msg = 'Content protection is limited on this Windows version. '
          + 'For full screen-capture invisibility, Windows 10 version 2004 (build 19041) or later is required. '
          + 'On your current version, the overlay will appear as a black rectangle in screen captures rather than being fully hidden.';
        console.warn(`[WindowManager] ${msg}`);

        // Defer status message so the renderer has time to mount and listen
        setTimeout(() => {
          this.send('status', { message: msg });
        }, 3000);
      } else {
        console.log('[WindowManager] Windows build >= 19041 — full WDA_EXCLUDEFROMCAPTURE content protection active.');
      }
    } catch (e) {
      console.warn('[WindowManager] Could not determine Windows version for content-protection check:', e.message);
    }
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
