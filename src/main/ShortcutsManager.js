const { globalShortcut, app } = require('electron');

class ShortcutsManager {
  registerAll(handlers) {
    // Unregister first to avoid duplicates
    globalShortcut.unregisterAll();

    if (handlers.onAssist) {
      globalShortcut.register('CommandOrControl+Return', () => {
        handlers.onAssist();
      });
    }

    if (handlers.onCodeSolve) {
      globalShortcut.register('CommandOrControl+H', () => {
        handlers.onCodeSolve();
      });
    }

    globalShortcut.register('CommandOrControl+Shift+X', () => {
      app.quit();
    });
  }

  unregisterAll() {
    globalShortcut.unregisterAll();
  }
}

module.exports = new ShortcutsManager();
