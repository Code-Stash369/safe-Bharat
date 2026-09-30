import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  ShieldAlert, 
  AlertTriangle, 
  ChevronUp, 
  ChevronDown, 
  Play, 
  Radio, 
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import { voiceSOSService, VoiceListenerState, VoiceSOSEvent } from '../services/voiceSOSService';

interface VoiceSOSBannerProps {
  onTriggerSOS: (event?: VoiceSOSEvent) => void;
}

export const VoiceSOSBanner: React.FC<VoiceSOSBannerProps> = ({ onTriggerSOS }) => {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [listenerState, setListenerState] = useState<VoiceListenerState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState<boolean>(true);
  const [lastDetectedKeyword, setLastDetectedKeyword] = useState<string | null>(null);

  useEffect(() => {
    setIsSupported(voiceSOSService.isSupported());
    setIsEnabled(voiceSOSService.getIsEnabled());

    const unsubscribeState = voiceSOSService.onStateChange((state, msg) => {
      setListenerState(state);
      setErrorMessage(msg || '');
    });

    const unsubscribeTranscript = voiceSOSService.onTranscript((text) => {
      setLiveTranscript(text);
    });

    const unsubscribeAudioLevel = voiceSOSService.onAudioLevel((lvl) => {
      setAudioLevel(lvl);
    });

    const unsubscribeTrigger = voiceSOSService.onTrigger((event) => {
      setLastDetectedKeyword(event.keyword);
      onTriggerSOS(event);
      setTimeout(() => {
        setLastDetectedKeyword(null);
      }, 5000);
    });

    // Auto-start if enabled
    if (voiceSOSService.getIsEnabled()) {
      voiceSOSService.startListening();
    }

    return () => {
      unsubscribeState();
      unsubscribeTranscript();
      unsubscribeAudioLevel();
      unsubscribeTrigger();
    };
  }, [onTriggerSOS]);

  const toggleVoiceSOS = () => {
    const next = !isEnabled;
    setIsEnabled(next);
    voiceSOSService.setEnabled(next);
  };

  const handleSimulateKeyword = (kw: string) => {
    voiceSOSService.simulateKeyword(kw);
  };

  // If browser doesn't support Web Speech API
  if (!isSupported) {
    return null;
  }

  return (
    <aside 
      aria-label="Voice SOS Listener Status"
      className="fixed bottom-20 lg:bottom-6 left-3 sm:left-6 z-40 max-w-sm transition-all duration-200"
    >
      {/* Minimized Compact Floating Capsule */}
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className={`flex items-center gap-2 px-3 py-2 rounded-2xl backdrop-blur-xl border shadow-2xl transition-all cursor-pointer select-none group ${
            listenerState === 'listening'
              ? 'bg-slate-950/90 border-emerald-500/50 text-white hover:border-emerald-400'
              : listenerState === 'triggered'
                ? 'bg-red-950/95 border-red-500 text-white animate-pulse'
                : 'bg-slate-950/90 border-slate-700 text-slate-400 hover:text-white'
          }`}
          title="Click to expand Voice-Activated 'Help' Command Listener"
        >
          {/* Animated Mic Ring */}
          <div className="relative flex items-center justify-center">
            {listenerState === 'listening' && (
              <span className="absolute -inset-1 rounded-full bg-emerald-500/30 animate-ping pointer-events-none" />
            )}
            {listenerState === 'triggered' && (
              <span className="absolute -inset-1.5 rounded-full bg-red-500/60 animate-ping pointer-events-none" />
            )}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              listenerState === 'listening' 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : listenerState === 'triggered'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-800 text-slate-400'
            }`}>
              {isEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* Label & Soundwave */}
          <div className="flex flex-col text-left leading-none">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-white tracking-wide">
                Voice SOS: {isEnabled ? 'Listening' : 'Paused'}
              </span>
              {listenerState === 'listening' && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </div>
            <span className="text-[9px] text-slate-400 mt-0.5">
              Say &ldquo;Help&rdquo; or &ldquo;Emergency&rdquo;
            </span>
          </div>

          {/* Mini Real-Time Audio Level Bars */}
          {listenerState === 'listening' && (
            <div className="flex items-end gap-0.5 h-3 px-1">
              <span 
                className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                style={{ height: `${Math.max(20, Math.min(100, audioLevel * 1.5))}%` }}
              />
              <span 
                className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                style={{ height: `${Math.max(30, Math.min(100, audioLevel * 2.2))}%` }}
              />
              <span 
                className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                style={{ height: `${Math.max(15, Math.min(100, audioLevel * 1.2))}%` }}
              />
            </div>
          )}

          <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform" />
        </button>
      ) : (
        /* Expanded Tactical Voice Guardian Control Card */
        <div className="w-[320px] sm:w-[360px] p-4 rounded-3xl bg-slate-950/98 backdrop-blur-2xl border border-slate-700/80 shadow-2xl space-y-3.5 text-white animate-in zoom-in-95 duration-150">
          
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl ${
                listenerState === 'listening' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}>
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-white">Voice &lsquo;Help&rsquo; Listener</h4>
                <p className="text-[10px] text-slate-400">Continuous Microphone Guardian</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={toggleVoiceSOS}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer ${
                  isEnabled
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                {isEnabled ? 'ACTIVE' : 'MUTED'}
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                title="Minimize voice listener card"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Trigger Alert Notification if keyword detected */}
          {lastDetectedKeyword && (
            <div className="p-2.5 rounded-2xl bg-red-950/80 border border-red-500 text-xs text-red-200 flex items-center gap-2 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <div>
                <strong className="block text-white font-bold">EMERGENCY KEYWORD HEARD!</strong>
                <span>Triggering SOS for &ldquo;{lastDetectedKeyword}&rdquo;</span>
              </div>
            </div>
          )}

          {/* State / Permission Alert */}
          {listenerState === 'permission_denied' && (
            <div className="p-2.5 rounded-xl bg-amber-950/70 border border-amber-600/50 text-[11px] text-amber-200">
              ⚠️ Microphone access is blocked. Please allow microphone permissions in your browser bar to enable voice-activated SOS.
            </div>
          )}

          {/* Real-time Decibel Audio Level Meter & Live Transcript Feed */}
          {isEnabled && (
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${listenerState === 'listening' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  {listenerState === 'listening' ? 'Microphone Live & Listening' : 'Standing By'}
                </span>
                <span className="text-emerald-400 font-bold">Sensitivity: {audioLevel}%</span>
              </div>

              {/* Decibel Level Bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all duration-75"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>

              {/* Live Heard Transcript Preview */}
              <div className="pt-1 text-[11px] font-mono">
                <span className="text-slate-500 text-[10px] block">Live Heard Stream:</span>
                <p className="text-slate-200 italic line-clamp-1 min-h-[16px]">
                  {liveTranscript ? `"${liveTranscript}"` : 'Listening for "Help" or "Emergency"...'}
                </p>
              </div>
            </div>
          )}

          {/* Trigger Keyword Chips */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Emergency Trigger Keywords:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['Help', 'Emergency', 'Help Me', 'Bachao (बचाओ)', 'Madad (मदद)', 'Police'].map((kw) => (
                <span
                  key={kw}
                  className="px-2 py-0.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 font-mono text-[10px] font-semibold"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Voice Simulation Buttons (for silent testing) */}
          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Test Voice Command:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSimulateKeyword('HELP')}
                className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-[10px] font-black cursor-pointer shadow-sm transition-colors"
                title="Test trigger with 'HELP'"
              >
                Say &ldquo;Help&rdquo;
              </button>
              <button
                onClick={() => handleSimulateKeyword('EMERGENCY')}
                className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-mono text-[10px] font-black cursor-pointer shadow-sm transition-colors"
                title="Test trigger with 'EMERGENCY'"
              >
                Say &ldquo;Emergency&rdquo;
              </button>
            </div>
          </div>

        </div>
      )}
    </aside>
  );
};
