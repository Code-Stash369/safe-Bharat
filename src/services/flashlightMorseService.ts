/**
 * Flashlight & Morse Code SOS Engine for Safe Bharat
 * Supports:
 * 1. Physical Device Rear Torch LED via MediaStream Track ImageCapture Torch API
 * 2. Visual Fullscreen Tactical Strobe Fallback
 * 3. Acoustic 750Hz Pure Tone Synchronizer
 */

class FlashlightMorseService {
  private mediaStream: MediaStream | null = null;
  private videoTrack: MediaStreamTrack | null = null;
  private isMorseActive: boolean = false;
  private audioCtx: AudioContext | null = null;
  private morseTimeout: any = null;

  private onStateChangeCallback: ((active: boolean, isFlashOn: boolean) => void) | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  private playTone(durationMs: number) {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, t); // Standard 750 Hz maritime/emergency pitch

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.01);
    gain.gain.setValueAtTime(0.3, t + (durationMs / 1000) - 0.01);
    gain.gain.linearRampToValueAtTime(0.001, t + (durationMs / 1000));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + (durationMs / 1000));
  }

  public async acquireTorch(): Promise<boolean> {
    if (this.videoTrack) return true;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
        },
      });

      const track = stream.getVideoTracks()[0];
      if (track) {
        this.mediaStream = stream;
        this.videoTrack = track;
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Physical camera/torch not available or permitted; using visual/acoustic strobe fallback:', err);
      return false;
    }
  }

  private async setTorch(on: boolean) {
    if (this.videoTrack) {
      try {
        await (this.videoTrack as any).applyConstraints({
          advanced: [{ torch: on }],
        });
      } catch {
        // Torch constraint not supported on this specific hardware
      }
    }
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(this.isMorseActive, on);
    }
  }

  public registerStateListener(cb: (active: boolean, isFlashOn: boolean) => void) {
    this.onStateChangeCallback = cb;
  }

  public async startMorseSOS(): Promise<void> {
    if (this.isMorseActive) return;
    this.isMorseActive = true;

    // Try to acquire physical torch
    await this.acquireTorch();

    // Standard SOS: ... --- ...
    // Dot = 180ms, Dash = 540ms, element gap = 180ms, letter gap = 480ms, word gap = 1200ms
    const DOT = 180;
    const DASH = 540;
    const ELEMENT_GAP = 160;
    const LETTER_GAP = 420;
    const WORD_GAP = 1200;

    const sequence: { on: boolean; duration: number }[] = [
      // S: . . .
      { on: true, duration: DOT },
      { on: false, duration: ELEMENT_GAP },
      { on: true, duration: DOT },
      { on: false, duration: ELEMENT_GAP },
      { on: true, duration: DOT },
      { on: false, duration: LETTER_GAP },

      // O: - - -
      { on: true, duration: DASH },
      { on: false, duration: ELEMENT_GAP },
      { on: true, duration: DASH },
      { on: false, duration: ELEMENT_GAP },
      { on: true, duration: DASH },
      { on: false, duration: LETTER_GAP },

      // S: . . .
      { on: true, duration: DOT },
      { on: false, duration: ELEMENT_GAP },
      { on: true, duration: DOT },
      { on: false, duration: ELEMENT_GAP },
      { on: true, duration: DOT },
      { on: false, duration: WORD_GAP },
    ];

    let stepIdx = 0;

    const runStep = async () => {
      if (!this.isMorseActive) {
        await this.setTorch(false);
        return;
      }

      const current = sequence[stepIdx];
      await this.setTorch(current.on);

      if (current.on) {
        this.playTone(current.duration);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate(current.duration);
          } catch {}
        }
      }

      stepIdx = (stepIdx + 1) % sequence.length;
      this.morseTimeout = setTimeout(runStep, current.duration);
    };

    runStep();
  }

  public async stopMorseSOS(): Promise<void> {
    this.isMorseActive = false;
    if (this.morseTimeout) {
      clearTimeout(this.morseTimeout);
      this.morseTimeout = null;
    }
    await this.setTorch(false);

    if (this.videoTrack) {
      try {
        this.videoTrack.stop();
      } catch {}
      this.videoTrack = null;
    }
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach(t => t.stop());
      } catch {}
      this.mediaStream = null;
    }

    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(false, false);
    }
  }

  public isRunning(): boolean {
    return this.isMorseActive;
  }
}

export const flashlightMorseService = new FlashlightMorseService();
