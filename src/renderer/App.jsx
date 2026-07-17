import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PanelBody from './components/PanelBody';
import Composer from './components/Composer';
import SettingsModal from './components/SettingsModal';
import OnboardingGuide from './components/OnboardingGuide';

// Audio Context instances stored outside state to prevent re-renders
let micStream = null;
let micNode = null;
let micProcessor = null;
let audioCtx = null;

let sysStream = null;
let sysNode = null;
let sysProcessor = null;
let sysCtx = null;

export default function App() {
  const prochame = window.prochame; // exposed in preload
  
  const [settings, setSettings] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  const [messages, setMessages] = useState([]);
  const [userText, setUserText] = useState('');
  const [activeMode, setActiveMode] = useState('assist');
  const [isSmart, setIsSmart] = useState(false);

  useEffect(() => {
    bootApp();
    setupListeners();
    setupClickThrough();

    return () => {
      stopAudioCapture();
    };
  }, []);

  const bootApp = async () => {
    try {
      const data = await prochame.getSettings();
      setSettings(data);
      setIsSmart(data.smartModeEnabled || false);
      if (!data.onboardingComplete) {
        setIsOnboardingOpen(true);
      }
    } catch (e) {
      console.error('Boot error:', e);
    }
  };

  const setupClickThrough = () => {
    const handleMouseMove = (e) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      // Only capture mouse events if hovering the toolbar, glass panels, or preferences modal
      const overUI = !!(el && el.closest('#toolbar, .panel-glass, .modal-glass'));
      prochame.setMouseIgnore(!overUI);
    };

    window.addEventListener('mousemove', handleMouseMove);
    prochame.setMouseIgnore(true);
  };

  const setupListeners = () => {
    // 1. Transcription state update
    prochame.on('capture:state', ({ active }) => {
      setIsListening(active);
      if (active) {
        startAudioCapture();
      } else {
        stopAudioCapture();
      }
    });

    // 2. Alert status message
    prochame.on('status', ({ message }) => {
      setStatusMessage(message);
      setTimeout(() => setStatusMessage(''), 10000);
    });

    // 3. New transcript chunk turn added
    prochame.on('transcript', (turn) => {
      prochame.log(`[Transcript received] ${turn.sender}: ${turn.text}`);
    });

    // 4. LLM Streaming started
    prochame.on('llm:start', ({ userBubble, small }) => {
      setMessages(prev => {
        const next = [...prev];
        if (userBubble) {
          next.push({ role: 'user', text: userBubble });
        }
        next.push({ role: 'assistant', text: '', isStreaming: true });
        return next;
      });
    });

    // 5. LLM Streaming chunk
    prochame.on('llm:token', ({ text }) => {
      setMessages(prev => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        const lastIdx = next.length - 1;
        if (next[lastIdx].role === 'assistant') {
          next[lastIdx].text += text;
        }
        return next;
      });
    });

    // 6. LLM Streaming complete
    prochame.on('llm:done', () => {
      setMessages(prev => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        const lastIdx = next.length - 1;
        if (next[lastIdx].role === 'assistant') {
          next[lastIdx].isStreaming = false;
        }
        return next;
      });
    });

    // 7. LLM Streaming failed
    prochame.on('llm:error', ({ message }) => {
      setMessages(prev => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        const lastIdx = next.length - 1;
        if (next[lastIdx].role === 'assistant') {
          next[lastIdx].text = message;
          next[lastIdx].isStreaming = false;
        }
        return next;
      });
    });
  };

  const startAudioCapture = async () => {
    try {
      // Setup microphone stream (mono, downsampled to 16 kHz)
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 }
      });
      audioCtx = new AudioContext({ sampleRate: 16000 });
      micNode = audioCtx.createMediaStreamSource(micStream);
      micProcessor = audioCtx.createScriptProcessor(4096, 1, 1);
      
      const micGain = audioCtx.createGain();
      micGain.gain.value = 0; // Run processor silently

      micNode.connect(micProcessor);
      micProcessor.connect(micGain);
      micGain.connect(audioCtx.destination);

      micProcessor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const output = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
          const s = Math.max(-1, Math.min(1, input[i]));
          output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        prochame.sendAudioChunk('user', output.buffer);
      };

      // Setup system output loopback capture
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      stream.getVideoTracks().forEach(track => track.stop()); // Stop video track
      const audioTracks = stream.getAudioTracks();
      
      if (audioTracks.length === 0) {
        prochame.log('System Audio Loopback: Unsupported in this capture context.');
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      sysStream = stream;
      sysCtx = new AudioContext({ sampleRate: 16000 });
      sysNode = sysCtx.createMediaStreamSource(new MediaStream(audioTracks));
      sysProcessor = sysCtx.createScriptProcessor(4096, 1, 1);

      const sysGain = sysCtx.createGain();
      sysGain.gain.value = 0; // Run processor silently

      sysNode.connect(sysProcessor);
      sysProcessor.connect(sysGain);
      sysGain.connect(sysCtx.destination);

      sysProcessor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        const output = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
          const s = Math.max(-1, Math.min(1, input[i]));
          output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        prochame.sendAudioChunk('system', output.buffer);
      };

      prochame.log('Audio capture initialized successfully.');
    } catch (err) {
      prochame.log(`Audio Capture Error: ${err.message}`);
      setIsListening(false);
      prochame.toggleListening();
    }
  };

  const stopAudioCapture = () => {
    // Shutdown Mic processing
    if (micProcessor) { micProcessor.disconnect(); micProcessor.onaudioprocess = null; micProcessor = null; }
    if (micNode) { micNode.disconnect(); micNode = null; }
    if (audioCtx) { audioCtx.close(); audioCtx = null; }
    if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; }

    // Shutdown System Audio processing
    if (sysProcessor) { sysProcessor.disconnect(); sysProcessor.onaudioprocess = null; sysProcessor = null; }
    if (sysNode) { sysNode.disconnect(); sysNode = null; }
    if (sysCtx) { sysCtx.close(); sysCtx = null; }
    if (sysStream) { sysStream.getTracks().forEach(t => t.stop()); sysStream = null; }
  };

  const handleToggleListening = async () => {
    try {
      await prochame.toggleListening();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSmart = async () => {
    try {
      const nextSmart = !isSmart;
      setIsSmart(nextSmart);
      await prochame.setSettings({ smartModeEnabled: nextSmart });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = () => {
    const text = userText.trim();
    if (!text) {
      // If prompt empty, trigger active quick mode
      prochame.runMode({ mode: activeMode, text: '' });
    } else {
      setUserText('');
      prochame.runMode({ mode: 'ask', text });
    }
  };

  const handleFinishOnboarding = async () => {
    setIsOnboardingOpen(false);
    try {
      await prochame.setSettings({ onboardingComplete: true });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div id="app-wrapper">
      <Header 
        isListening={isListening} 
        onToggleListening={handleToggleListening}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        statusMessage={statusMessage}
      />
      
      {!isCollapsed && (
        <div className="panel-glass">
          <PanelBody 
            messages={messages} 
            activeMode={activeMode}
            onSelectMode={(mode) => {
              setActiveMode(mode);
              prochame.runMode({ mode, text: '' });
            }}
            isListening={isListening}
          />
          <Composer 
            userText={userText}
            setUserText={setUserText}
            isSmart={isSmart}
            onToggleSmart={handleToggleSmart}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onSubmit={handleSubmit}
          />
        </div>
      )}

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        prochame={prochame}
      />

      <OnboardingGuide 
        isOpen={isOnboardingOpen} 
        onClose={handleFinishOnboarding}
        prochame={prochame}
      />
    </div>
  );
}
