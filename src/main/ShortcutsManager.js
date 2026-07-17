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

    // Tradeoff: Overrides the system default command (Cmd+V / paste) while Prochame is active.
    if (handlers.onQuickAssist) {
      globalShortcut.register('CommandOrControl+V', () => {
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
