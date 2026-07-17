# Prochame

An independently designed, clean-room desktop overlay copilot that floats on top of your windows. It captures screen details, transcribes mic/system dialogue, and streams real-time AI suggestions while staying hidden from screen captures.

Built from scratch using a modular Node.js/Electron main architecture and a modern React + Vite frontend.

---

## Features

- **Draggable Overlay**: A frameless, transparent glass panel that floats over your apps, with click-through support to prevent blocking mouse interactions in empty space.
- **Privacy Protection**: Integrates macOS Content Protection APIs to shield itself from being visible on screen recordings, Zoom calls, or Microsoft Teams shares (best-effort).
- **Separated Audio Channels**: Buffers your microphone output and system speaker loopbacks separately, transcribing both so the assistant knows who said what.
- **API Flexibility**: Direct swappable support for OpenAI, Anthropic, and Google Gemini.
- **On-Demand Capture**: Captures screenshots and transcript details only when you trigger a mode.
- **Local Credentials**: Saves settings exclusively on your computer in `prochame-data.json`. No servers, no tracking, and no external requests.

---

## App Modes

- **General Assist** (`⌘` `Enter`): Grabs your screenshot + recent dialogue transcript to suggest the best immediate action or contextual advice.
- **Draft Reply**: Uses speaker output and mic input transcripts to suggest a natural, concise spoken reply in the first person.
- **Summarize**: Summarizes the conversation turns into key talking points and next steps.
- **Questions**: Formulates context-aware follow-up questions to help you maintain call engagement.
- **Solve Code** (`⌘` `H`): Screenshots a programming problem on screen, analyzes the strategy, writes the clean code block, and presents time/space complexities.
- **Ask Anything**: Enter a typed query into the composer box to query the screen or transcription log.

---

## Setup & Installation

### Option A — Build the App Bundle
To compile a native macOS app bundle from source:
1. Double-check that [Node.js](https://nodejs.org) 18+ is installed.
2. In the terminal, run:
   ```bash
   npm install
   npm run pack
   ```
3. Locate `Prochame.app` inside the generated `dist/mac-arm64/` directory.
4. Drag it to your `Applications/` folder.
5. On first launch, if macOS alerts you that the app is unsigned or damaged (due to local ad-hoc signatures), run this in Terminal:
   ```bash
   xattr -cr /Applications/Prochame.app
   ```
6. Double-click to open.

### Option B — Run in Development
To run in hot-reloading development mode:
1. Clone this repository:
   ```bash
   git clone https://github.com/Ganeshp000/prochame.git
   cd prochame
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
4. In a separate terminal tab, launch the Electron wrapper:
   ```bash
   NODE_ENV=development npm start
   ```

---

## First Launch Instructions

1. **System Permissions**: Go to `System Settings → Privacy & Security`. Grant **Microphone** (for user speech) and **Screen Recording** (for screenshot capture and speaker loopback) access to **Prochame**.
2. **Setup Credentials**: Click the gear icon on the overlay input box to open Preferences. Select your provider, paste your API key, and customize your standard/advanced models if needed.
3. **Zoom Configuration**: To hide Prochame in Zoom, open Zoom Settings, navigate to `Share Screen → Advanced`, and set **Screen capture mode** to `"Advanced capture with window filtering."`

---

## Keyboard Hotkeys

- **`CmdOrCtrl + Return`**: Trigger general Assist.
- **`CmdOrCtrl + H`**: Screenshot and Solve coding problem.
- **`CmdOrCtrl + Shift + X`**: Force exit and unregister global hotkeys.

---

## System Architecture

```
Main Process (Node.js/Electron)
├── index.js (App lifecycle manager)
├── WindowManager.js (Transparent overlay, content protection)
├── SettingsManager.js (Reads/writes prochame-data.json)
├── MediaCapture.js (Orchestrates screenshots and audio buffers)
├── TranscriptionService.js (Adapts OpenAI/Gemini audio transcripts)
├── LlmService.js (Handles OpenAI, Anthropic, and Gemini text streams)
├── ShortcutsManager.js (Registers global shortcut listeners)
└── IpcRouter.js (IPC routing and background STT loop)

Preload Script (Bridge)
└── index.js (Exposes contextBridge API: window.prochame)

Renderer Process (React + Vite)
├── App.jsx (State coordinator)
├── index.css (Custom CSS design system)
└── components/ (React views: Header, Composer, Panels, Preferences)
```

---

## License

Distributed under the **MIT License**. See `LICENSE` for details.
