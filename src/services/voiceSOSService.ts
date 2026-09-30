/**
 * Voice SOS Recognition Service for Safe Bharat
 * Listens via the browser microphone for emergency trigger keywords:
 * 'Help', 'Emergency', 'Bachao', 'Madad', 'Police', etc.
 * Uses the Web Speech API (SpeechRecognition / webkitSpeechRecognition)
 * with continuous background restart and Web Audio API level metering.
 */

export interface VoiceSOSEvent {
  keyword: string;
  transcript: string;
  confidence: number;
  timestamp: number;
}

export type VoiceListenerState = 'idle' | 'listening' | 'triggered' | 'unsupported' | 'permission_denied' | 'error';

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

  // Active trigger keywords
  public readonly primaryKeywords = ['help', 'emergency'];
  public readonly allKeywords = [
    'help',
    'emergency',
    'help me',
    'please help',
    'bachao',
    'madad',
    'police',
    'save me',
    'danger',
    'khatra'
  ];

  // Event callbacks
  private onTriggerCallbacks: ((event: VoiceSOSEvent) => void)[] = [];
  private onStateChangeCallbacks: ((state: VoiceListenerState, message?: string) => void)[] = [];
  private onTranscriptCallbacks: ((transcript: string, isFinal: boolean) => void)[] = [];
  private onAudioLevelCallbacks: ((level: number) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('safe_bharat_voice_sos_enabled');
      // Default to enabled so users immediately have the safety feature available
      this.isEnabled = saved === null ? true : saved === 'true';
    }
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
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

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('safe_bharat_voice_sos_enabled', String(enabled));
    }

    if (enabled) {
      this.startListening();
    } else {
      this.stopListening();
    }
  }

  public async startListening() {
    if (!this.isEnabled) return;
    if (typeof window === 'undefined') return;

    if (!this.isSupported()) {
      this.setState('unsupported', 'Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (this.isListening) return;

    try {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 3;
      this.recognition.lang = 'en-IN'; // Excellent support for Indian accents and mixed terms

      this.recognition.onstart = () => {
        this.isListening = true;
        this.setState('listening');
        this.startAudioVisualizer();
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

          // Check both primary alternative and secondary alternatives
          for (let j = 0; j < res.length; j++) {
            this.evaluateSpeechForKeywords(res[j].transcript, res[j].confidence || 0.85);
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
          // Normal silence, will auto-resume in onend
          return;
        }

        if (event.error === 'not-allowed') {
          this.setState('permission_denied', 'Microphone access was denied. Please allow microphone permissions in browser settings.');
          this.isListening = false;
          this.stopAudioVisualizer();
          return;
        }

        if (event.error === 'aborted') {
          return;
        }

        this.errorMessage = `Voice recognition error: ${event.error}`;
      };

      this.recognition.onend = () => {
        this.isListening = false;
        // Auto-restart continuous listening if enabled and not intentionally stopped
        if (this.isEnabled && this.state !== 'permission_denied' && this.state !== 'unsupported') {
          setTimeout(() => {
            if (this.isEnabled && !this.isListening) {
              try {
                this.recognition?.start();
              } catch {
                // ignore re-start race condition
              }
            }
          }, 300);
        } else {
          this.setState('idle');
          this.stopAudioVisualizer();
        }
      };

      this.recognition.start();
    } catch (err: any) {
      this.setState('error', err?.message || 'Failed to start microphone speech listener');
    }
  }

  public stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.recognition = null;
    }
    this.stopAudioVisualizer();
    this.setState('idle');
  }

  /**
   * Evaluates spoken transcript against emergency keywords
   */
  private evaluateSpeechForKeywords(text: string, confidence: number) {
    if (!text) return;
    const normalized = text.toLowerCase().trim();

    // Prevent trigger spamming within cooldown period (6 seconds)
    const now = Date.now();
    if (now - this.lastTriggerTime < 6000) return;

    // Check every keyword with word boundary or exact phrase check
    for (const kw of this.allKeywords) {
      // Regex word boundary matching or direct phrase containment
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(normalized) || normalized.includes(kw)) {
        this.lastTriggerTime = now;
        this.triggerSOS(kw, normalized, confidence);
        break;
      }
    }
  }

  /**
   * Fires the Voice SOS event across all registered subscribers
   */
  public triggerSOS(keyword: string, transcript: string, confidence: number = 0.95) {
    this.setState('triggered', `Voice keyword detected: "${keyword}"`);
    const event: VoiceSOSEvent = {
      keyword: keyword.toUpperCase(),
      transcript,
      confidence,
      timestamp: Date.now(),
    };

    this.onTriggerCallbacks.forEach(cb => cb(event));

    // Revert state to listening after brief alert notice
    setTimeout(() => {
      if (this.isEnabled && this.isListening) {
        this.setState('listening');
      }
    }, 4000);
  }

  /**
   * Manual test simulation for testing without speaking aloud
   */
  public simulateKeyword(keyword: string = 'HELP') {
    this.triggerSOS(keyword, `Simulated Voice Command: "${keyword}"`, 0.99);
  }

  /**
   * Web Audio API Level Meter: visualizes real-time mic sensitivity
   */
  private async startAudioVisualizer() {
    if (this.analyser) return;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        this.audioCtx = new AudioCtx();
        const source = this.audioCtx.createMediaStreamSource(this.audioStream);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64;
        source.connect(this.analyser);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        const updateLevel = () => {
          if (!this.analyser) return;
          this.analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Normalize to 0 - 100 range with curve
          this.audioLevel = Math.min(100, Math.round((avg / 128) * 100));
          this.onAudioLevelCallbacks.forEach(cb => cb(this.audioLevel));
          this.animFrameId = requestAnimationFrame(updateLevel);
        };

        updateLevel();
      }
    } catch {
      // Audio level visualizer is optional enhancement; speech recognition continues regardless
    }
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
