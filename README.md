# Prochame

### A minimal, dark glassmorphic desktop overlay copilot that floats on top of your windows. It captures screen details, transcribes mic/system dialogue, and streams real-time AI suggestions while staying hidden from screen captures.

![Prochame Overlay](docs/overlay.png)

---

## ⚠️ Disclaimer — Please Read Before Use

**Prochame's screen-invisibility is best-effort, not guaranteed.** It relies on macOS Content Protection APIs (`setContentProtection`) and window-level flags that work with most built-in screen sharing and recording tools (Zoom, Google Meet, Microsoft Teams, QuickTime, OBS window-capture). However, some capture methods — including phone cameras pointed at your screen, certain third-party proctoring software, HDMI capture cards, and full-display OBS captures — **can still see the overlay.** Do not rely on invisibility as a certainty.

**This tool is intended exclusively for legitimate, ethical purposes:**
- Personal study and self-practice (e.g., reviewing flashcards, drilling problems solo)
- Accessibility assistance (e.g., real-time captioning, cognitive aids)
- Professional productivity during your own solo work
- Learning and experimentation with AI-assisted workflows

**You must NOT use Prochame to:**
- Cheat on proctored exams, certifications, or academic assessments
- Gain an unfair advantage during job interviews or hiring screens
- Violate any platform's Terms of Service or community guidelines
- Record, transcribe, or surveil others without their knowledge and consent, in violation of applicable privacy or wiretapping laws

**You are solely responsible for how you use this software.** The developer(s) provide it as-is and accept no liability for misuse. By using Prochame, you agree to comply with all applicable laws, institutional policies, and platform rules in your jurisdiction.

---

## What It Does

| Feature / Shortcut | Description |
|---|---|
| **General Assist** (`⌘` `Enter` / `⌘` `G` / `⌘` `Shift` `Space`) | Captures screen image + recent conversation transcript, sending them to the LLM for immediate direct assistance. |
| **Solve Code** (`⌘` `H`) | Captures screen code, drafts solution strategy, prints clean solution block, and lists space/time complexities. |
| **Quit App** (`⌘` `Shift` `X`) | Instantly terminates the app, closes overlays, and unregisters all global keyboard hooks. |
| **Draft Reply** | Uses recent dialog turns to draft a natural first-person conversational response. |
| **Summarize** | Compiles ongoing meeting/dialog notes into action items and summaries. |
| **Follow-up Questions** | Formulates 3 momentum-driving questions to keep conversation active. |
| **Ask Anything** | Allows typing custom prompts into the composer to query context. |

---

## Setup & Installation

### 1. Clone & Install
```bash
git clone https://github.com/Ganeshp000/prochame.git
cd prochame
npm install
```

### 2. Run in Development
To start the React + Vite renderer dev server:
```bash
npm run dev
```
In a separate terminal shell, launch the Electron wrapper:
```bash
NODE_ENV=development npm start
```

### 3. Build & Package
To build and pack the native macOS `.app` bundle:
```bash
npm run pack
```
Locate the compiled bundle inside `dist/mac-arm64/Prochame.app`. If macOS complains about ad-hoc local code signatures on first start, run:
```bash
xattr -cr /Applications/Prochame.app
```

---

## First Launch & Onboarding

Upon opening the application, you will be greeted by the onboarding guide containing active keyboard hotkeys.

![Prochame Onboarding](docs/tutorial.png)

1. **System Permissions**: Go to `System Settings → Privacy & Security`. Grant **Microphone** and **Screen Recording** access to Prochame.
2. **Zoom Configuration**: To hide Prochame in Zoom, open Zoom Settings, navigate to `Share Screen → Advanced`, and set **Screen capture mode** to `"Advanced capture with window filtering."`

---

## Settings & API Keys Setup

Click the gear icon in the composer overlay to configure your settings and model credentials.

![Prochame Settings](docs/zoom-setting.png)

- Supports **OpenAI** (defaults: `gpt-4o-mini` / `gpt-4o`), **Anthropic** (`claude-3-5-haiku-latest` / `claude-3-5-sonnet-latest`), and **Google Gemini** (`gemini-2.5-flash-lite` / `gemini-2.5-flash`).
- Supports the **Google Gemini free-tier** and stable `v1beta` endpoint versions.

---

## How It Works (System Architecture)

Prochame uses a decoupled architecture with a secure main-renderer IPC channel bridge:

```
Main Process (Node.js/Electron)
├── index.js (App lifecycle manager)
├── WindowManager.js (Transparent overlay, content protection)
├── SettingsManager.js (Reads/writes prochame-data.json)
├── MediaCapture.js (Orchestrates screenshots and audio buffers)
├── TranscriptionService.js (Adapts OpenAI/Gemini audio transcripts)
├── LlmService.js (Handles OpenAI, Anthropic, and Gemini text streams)
├── ShortcutsManager.js (Registers global shortcut listeners)
└── IpcRouter.js (IPC routing, background STT loop & model check)

Preload Script (Bridge)
└── index.js (Exposes contextBridge API: window.prochame)

Renderer Process (React + Vite)
├── App.jsx (State coordinator)
├── index.css (Custom CSS design system)
└── components/ (React views: Header, Composer, Panels, Preferences)
```

1. **Loopback Audio Engine**: Buffers output audio (system speaker channel) and input audio (microphone channel) separately to run independent Whisper or Gemini STT APIs, keeping dialogue turns tagged correctly.
2. **Visual Content Protection**: The window manager flags the transparent overlay with macOS content filters to mask the copilot panel from OBS, Zoom screen shares, or screenshots.

---

## Troubleshooting & Tips

### Google Gemini API 404 Errors
If you configure a Gemini API key and receive `404 NOT_FOUND` errors, check that you are using active model versions.
* **Auto-Fallback Check**: Prochame runs a lightweight, non-blocking check on startup that queries `GET /v1beta/models`. If your configured model is deprecated or retired, it automatically upgrades to the first active Flash model and displays:
  > `"Gemini model updated automatically — old model was retired."`
* **API Version**: The app targets the `v1beta` endpoint version (`generativelanguage.googleapis.com/v1beta`) which supports newer Gemini 2.5 models.

---

## License

Distributed under the **MIT License**. See `LICENSE` for details.
