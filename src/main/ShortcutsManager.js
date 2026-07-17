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

    if (handlers.onQuickAssist) {
      // Primary quick assist shortcut
      globalShortcut.register('CommandOrControl+G', () => {
        handlers.onQuickAssist();
      });
      // Closest reliable alternative to double-Cmd tap (no native deps required)
      globalShortcut.register('CommandOrControl+Shift+Space', () => {
        handlers.onQuickAssist();
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
