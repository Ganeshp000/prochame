const { app, session, desktopCapturer } = require('electron');
const WindowManager = require('./WindowManager');
const ShortcutsManager = require('./ShortcutsManager');
const IpcRouter = require('./IpcRouter');

// Hide dock icon on macOS to keep it as a floating utility
// app.dock is only available on macOS; skip on Windows/Linux
if (process.platform === 'darwin' && app.dock) {
  app.dock.hide();
}

console.log(`[App] Prochame starting on platform: ${process.platform} (${process.arch})`);

app.whenReady().then(() => {
  // 1. Initialize IPC routes
  IpcRouter.initialize();

  // 2. Setup audio/video capture permissions
  const mediaPermissions = ['media', 'microphone', 'audioCapture', 'display-capture'];
  const allowMedia = (permission) => mediaPermissions.includes(permission);
  
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => cb(allowMedia(permission)));
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => allowMedia(permission));

  // 3. System audio loopback display handler
  // The 'loopback' audio option works cross-platform:
  //   - macOS: captures via CoreAudio / ScreenCaptureKit (macOS 13+)
  //   - Windows: captures via WASAPI loopback (Windows 10+, Electron 33+)
  // No platform-specific branching is needed for audio capture.
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
      if (sources.length > 0) {
        console.log(`[App] Display media source selected: "${sources[0].name}" — audio: loopback`);
        callback({ video: sources[0], audio: 'loopback' });
      } else {
        console.warn('[App] No display capture sources found.');
        callback();
      }
    }).catch((err) => {
      console.error('[App] Display media request failed:', err);
      callback();
    });
  }, { useSystemPicker: false });

  // 4. Create app window
  WindowManager.createWindow();

  // 5. Register global shortcut hotkeys
  ShortcutsManager.registerAll({
    onAssist: () => IpcRouter.executeMode('assist', ''),
    onCodeSolve: () => IpcRouter.executeMode('code', ''),
    onQuickAssist: () => IpcRouter.ensureListeningAndAssist()
  });

  app.on('activate', () => {
    if (!WindowManager.getWindow()) {
      WindowManager.createWindow();
    }
  });
});

app.on('will-quit', () => {
  ShortcutsManager.unregisterAll();
  IpcRouter.stopTranscriptionLoop();
});

app.on('window-all-closed', () => {
  app.quit();
});
