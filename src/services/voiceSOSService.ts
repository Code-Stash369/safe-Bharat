/**
 * Voice SOS Recognition Service for Safe Bharat
 * Listens via the browser microphone for emergency trigger keywords:
 * 'Help', 'Emergency', 'Bachao', 'Madad', 'Police', etc.
 * 
 * Built with dual-engine reliability:
 * 1. Web Speech API (SpeechRecognition / webkitSpeechRecognition) for real-time speech-to-text
 * 2. Web Audio API Analyser for real-time decibel level metering and audio presence
 */

export interface VoiceSOSEvent {
  keyword: string;
  transcript: string;
  confidence: number;
  timestamp: number;
  source?: 'speech_recognition' | 'simulation' | 'audio_guardian';
}

export type VoiceListenerState = 
  | 'idle' 
  | 'requesting_permission' 
  | 'listening' 
  | 'triggered' 
  | 'unsupported' 
  | 'permission_denied' 
  | 'error';

import { hapticService } from './hapticService';

class VoiceSOSService {
  private recognition: any = null;
  private isEnabled: boolean = false;
  private isListening: boolean = false;
  private state: VoiceListenerState = 'idle';
  private errorMessage: string = '';
  private currentTranscript: string = '';
  private lastTriggerTime: number = 0;
  private audioStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioLevel: number = 0;
  private animFrameId: number | null = null;
  private restartTimer: any = null;
  private speechSupported: boolean = false;

  // Active trigger keywords categorized
  public readonly primaryKeywords = ['help', 'emergency', 'bachao', 'madad'];
  
  public readonly allKeywords = [
    // English
    'help',
    'emergency',
    'help me',
    'please help',
    'save me',
    'police',
    'danger',
    'khatra',
    'fire',
    'ambulance',
    'accident',
    'sos',
    'trapped',
    // Hindi (Transliterated)
    'bachao',
    'madad',
    'bachao bachao',
    'madad karo',
    'police bulao',
    // Hindi (Devanagari)
    'बचाओ',
    'मदद',
    'पुलिस',
    'खतरा',
    'आग',
    'दुर्घटना',
    'सहायता'
  ];

  // Event callbacks
  private onTriggerCallbacks: ((event: VoiceSOSEvent) => void)[] = [];
  private onStateChangeCallbacks: ((state: VoiceListenerState, message?: string) => void)[] = [];
  private onTranscriptCallbacks: ((transcript: string, isFinal: boolean) => void)[] = [];
  private onAudioLevelCallbacks: ((level: number) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.speechSupported = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
      const saved = localStorage.getItem('safe_bharat_voice_sos_enabled');
      // Default to enabled so the user can easily activate or see it ready
      this.isEnabled = saved === null ? true : saved === 'true';
    }
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    // We consider supported if either Speech Recognition or getUserMedia audio is available
    const hasSpeech = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    return hasSpeech || hasMedia;
  }

  public isSpeechRecognitionSupported(): boolean {
    return this.speechSupported;
  }

  public getState(): VoiceListenerState {
    return this.state;
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public getCurrentTranscript(): string {
    return this.currentTranscript;
  }

  public getAudioLevel(): number {
    return this.audioLevel;
  }

  public onTrigger(callback: (event: VoiceSOSEvent) => void): () => void {
    this.onTriggerCallbacks.push(callback);
    return () => {
      this.onTriggerCallbacks = this.onTriggerCallbacks.filter(cb => cb !== callback);
    };
  }

  public onStateChange(callback: (state: VoiceListenerState, message?: string) => void): () => void {
    this.onStateChangeCallbacks.push(callback);
    callback(this.state, this.errorMessage);
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  public onTranscript(callback: (transcript: string, isFinal: boolean) => void): () => void {
    this.onTranscriptCallbacks.push(callback);
    return () => {
      this.onTranscriptCallbacks = this.onTranscriptCallbacks.filter(cb => cb !== callback);
    };
  }

  public onAudioLevel(callback: (level: number) => void): () => void {
    this.onAudioLevelCallbacks.push(callback);
    return () => {
      this.onAudioLevelCallbacks = this.onAudioLevelCallbacks.filter(cb => cb !== callback);
    };
  }

  private setState(state: VoiceListenerState, message: string = '') {
    this.state = state;
    this.errorMessage = message;
    this.onStateChangeCallbacks.forEach(cb => cb(state, message));
  }

  public async setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('safe_bharat_voice_sos_enabled', String(enabled));
    }

    if (enabled) {
      await this.startListening();
    } else {
      this.stopListening();
    }
  }

  /**
   * Primary entry point: Requests microphone access and initializes continuous listening
   */
  public async startListening(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    if (!this.isSupported()) {
      this.setState('unsupported', 'Audio or Speech APIs are not supported in this browser.');
      return false;
    }

    this.isEnabled = true;
    localStorage.setItem('safe_bharat_voice_sos_enabled', 'true');
    this.setState('requesting_permission', 'Requesting microphone access for Voice SOS...');

    try {
      // Step 1: Ensure active microphone stream via getUserMedia for visualizer & permission
      await this.startAudioStream();
    } catch (err: any) {
      console.warn('Microphone permission error:', err);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        this.setState('permission_denied', 'Microphone permission was blocked. Please allow microphone access in your browser address bar.');
      } else {
        this.setState('error', err?.message || 'Could not connect to microphone device.');
      }
      return false;
    }

    // Step 2: Initialize Speech Recognition engine
    this.startSpeechRecognition();
    return true;
  }

  /**
   * Starts or resumes the audio visualizer stream
   */
  private async startAudioStream(): Promise<void> {
    if (this.audioStream && this.audioStream.active && this.analyser) {
      return;
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!this.audioCtx || this.audioCtx.state === 'closed') {
          this.audioCtx = new AudioCtx();
        }
        if (this.audioCtx.state === 'suspended') {
          await this.audioCtx.resume();
        }

        const source = this.audioCtx.createMediaStreamSource(this.audioStream);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.5;
        source.connect(this.analyser);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        const updateLevel = () => {
          if (!this.analyser || !this.isListening) return;
          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Normalize to 0 - 100 percentage
          this.audioLevel = Math.min(100, Math.round((avg / 128) * 100));
          this.onAudioLevelCallbacks.forEach(cb => cb(this.audioLevel));

          this.animFrameId = requestAnimationFrame(updateLevel);
        };

        this.animFrameId = requestAnimationFrame(updateLevel);
      }
    }
  }

  /**
   * Initializes Speech Recognition instance and wires event handlers
   */
  private startSpeechRecognition() {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      // Speech recognition not available, but audio stream is active!
      this.isListening = true;
      this.setState('listening', 'Microphone active (Sound Guardian mode). Web Speech is limited in this browser.');
      return;
    }

    // Clean up any existing instance
    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.abort();
      } catch {
        // ignore abort error
      }
      this.recognition = null;
    }

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 3;
      // 'en-IN' provides outstanding multi-accent matching for Indian English and Hinglish terms
      this.recognition.lang = 'en-IN';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.setState('listening', 'Microphone is active and listening for emergency commands.');
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const text = res[0].transcript;
          if (res.isFinal) {
            finalTranscript += text + ' ';
          } else {
            interimTranscript += text;
          }

          // Evaluate all recognition alternatives
          for (let j = 0; j < res.length; j++) {
            this.evaluateSpeechForKeywords(res[j].transcript, res[j].confidence || 0.9);
          }
        }

        const displayTranscript = (finalTranscript || interimTranscript).trim();
        if (displayTranscript) {
          this.currentTranscript = displayTranscript;
          this.onTranscriptCallbacks.forEach(cb => cb(displayTranscript, !!finalTranscript));
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Normal background silence, onend will auto-restart
          return;
        }

        if (event.error === 'not-allowed') {
          this.setState('permission_denied', 'Microphone access denied. Please allow microphone permission.');
          this.isListening = false;
          return;
        }

        if (event.error === 'aborted') {
          return;
        }

        // On transient errors, we keep listening flag and let onend restart cleanly
        console.warn('Speech recognition warning:', event.error);
      };

      this.recognition.onend = () => {
        // Safe continuous restart
        if (this.isEnabled && this.state !== 'permission_denied' && this.state !== 'unsupported') {
          if (this.restartTimer) clearTimeout(this.restartTimer);
          this.restartTimer = setTimeout(() => {
            if (this.isEnabled && this.state !== 'permission_denied') {
              this.startSpeechRecognition();
            }
          }, 350);
        } else {
          this.isListening = false;
          if (this.state !== 'permission_denied') {
            this.setState('idle');
          }
        }
      };

      this.recognition.start();
      this.isListening = true;
      this.setState('listening', 'Microphone is active and listening for emergency commands.');
    } catch (err: any) {
      console.warn('Error starting speech recognition:', err);
      // Fallback: the audio visualizer stream is still running
      this.isListening = true;
      this.setState('listening', 'Microphone stream connected.');
    }
  }

  public stopListening() {
    this.isEnabled = false;
    this.isListening = false;
    localStorage.setItem('safe_bharat_voice_sos_enabled', 'false');

    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.recognition = null;
    }

    this.stopAudioVisualizer();
    this.setState('idle', 'Voice SOS is currently paused.');
  }

  /**
   * Evaluates spoken transcript against emergency keywords
   */
  private evaluateSpeechForKeywords(text: string, confidence: number) {
    if (!text) return;

    // Remove punctuation, collapse whitespace, lowercase
    const normalized = text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'–—]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!normalized) return;

    // Prevent trigger flood within cooldown period (5 seconds)
    const now = Date.now();
    if (now - this.lastTriggerTime < 5000) return;

    const words = normalized.split(' ');

    for (const kw of this.allKeywords) {
      const kwLower = kw.toLowerCase().trim();

      let matched = false;

      if (kwLower.includes(' ')) {
        // Multi-word phrase matching (e.g. 'help me', 'please help', 'save me', 'bachao bachao')
        matched = normalized.includes(kwLower);
      } else {
        // Single word matching: check word boundary or array containment
        // This avoids false positives (e.g., 'helpful' will not trigger 'help')
        matched = words.includes(kwLower) || normalized === kwLower;

        // For non-ASCII words (Devanagari like 'बचाओ', 'मदद', 'पुलिस'), substring match is safe
        if (!matched && /[^\u0000-\u007F]/.test(kwLower)) {
          matched = normalized.includes(kwLower);
        }
      }

      if (matched) {
        this.lastTriggerTime = now;
        this.triggerSOS(kw, text, confidence, 'speech_recognition');
        break;
      }
    }
  }

  /**
   * Fires the Voice SOS event across all registered subscribers
   */
  public triggerSOS(
    keyword: string, 
    transcript: string, 
    confidence: number = 0.95,
    source: 'speech_recognition' | 'simulation' | 'audio_guardian' = 'speech_recognition'
  ) {
    this.setState('triggered', `Voice keyword detected: "${keyword}"`);
    hapticService.triggerSOS();
    
    const event: VoiceSOSEvent = {
      keyword: keyword.toUpperCase(),
      transcript: transcript || `Trigger command: ${keyword}`,
      confidence,
      timestamp: Date.now(),
      source,
    };

    this.onTriggerCallbacks.forEach(cb => cb(event));

    // Revert state to listening after brief alert notice
    setTimeout(() => {
      if (this.isEnabled && (this.isListening || this.recognition)) {
        this.setState('listening', 'Microphone listening for emergency commands.');
      }
    }, 4500);
  }

  /**
   * Manual test simulation for testing without speaking aloud
   */
  public simulateKeyword(keyword: string = 'HELP') {
    this.triggerSOS(keyword, `Simulated Voice Command: "${keyword}"`, 0.99, 'simulation');
  }

  private stopAudioVisualizer() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.analyser = null;
    this.audioLevel = 0;
    this.onAudioLevelCallbacks.forEach(cb => cb(0));
  }
}

export const voiceSOSService = new VoiceSOSService();
