import { hapticService } from './hapticService';

/**
 * Web Audio API Engine for Safe Bharat
 * Pure client-side synthetic audio: No external mp3 files needed.
 * Works offline and across all modern browsers.
 */

class AudioService {
  private ctx: AudioContext | null = null;
  private isSirenActive = false;
  private sirenInterval: any = null;
  private ringtoneInterval: any = null;
  private isRinging = false;
  private isThreeBlastRunning = false;
  private threeBlastTimer: any = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public playSiren(onTick?: (frequency: number) => void) {
    if (this.isSirenActive) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.isSirenActive = true;
    let high = true;

    const sweep = () => {
      if (!this.isSirenActive || !this.ctx) return;
      const t0 = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const targetFreq = high ? 920 : 540;
      const startFreq = high ? 540 : 920;
      high = !high;

      if (onTick) onTick(targetFreq);

      osc.frequency.setValueAtTime(startFreq, t0);
      osc.frequency.exponentialRampToValueAtTime(targetFreq, t0 + 0.65);

      gain.gain.setValueAtTime(0.01, t0);
      gain.gain.linearRampToValueAtTime(0.28, t0 + 0.08);
      gain.gain.setValueAtTime(0.28, t0 + 0.58);
      gain.gain.linearRampToValueAtTime(0.01, t0 + 0.68);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1100;
      filter.Q.value = 1.0;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t0);
      osc.stop(t0 + 0.7);

      // Trigger synchronized tactile haptic pulses
      hapticService.triggerSirenTick();
    };

    sweep();
    this.sirenInterval = setInterval(sweep, 700);
  }

  public stopSiren() {
    this.isSirenActive = false;
    hapticService.cancel();
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
  }

  public isSirenRunning(): boolean {
    return this.isSirenActive;
  }

  /**
   * International Maritime & Alpine 3-Blast Search and Rescue Acoustic Signal
   * 3 loud whistle / horn bursts (each 3.0s), 1.0s gap, then repeated.
   * Universally recognized by search dogs, helicopters, and rescue patrols.
   */
  public playThreeBlastDistress(onBlastChange?: (blastNum: number, isActive: boolean) => void) {
    if (this.isThreeBlastRunning) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.isThreeBlastRunning = true;
    let blastCount = 0;

    const runSequence = () => {
      if (!this.isThreeBlastRunning || !this.ctx) return;

      const currentBlast = (blastCount % 3) + 1;
      blastCount++;

      if (onBlastChange) onBlastChange(currentBlast, true);

      // Play 3000ms piercing tone (880 Hz whistle pitch)
      const t0 = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, t0);
      osc.frequency.linearRampToValueAtTime(895, t0 + 1.5);
      osc.frequency.linearRampToValueAtTime(880, t0 + 3.0);

      gain.gain.setValueAtTime(0.01, t0);
      gain.gain.linearRampToValueAtTime(0.35, t0 + 0.1);
      gain.gain.setValueAtTime(0.35, t0 + 2.85);
      gain.gain.linearRampToValueAtTime(0.01, t0 + 2.98);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 900;
      filter.Q.value = 3.0;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t0);
      osc.stop(t0 + 3.0);

      hapticService.vibrate([1000, 200, 1000, 200, 1000]);

      // 3.0s blast + 1.0s gap = 4000ms per blast. After 3 blasts, wait 3.0s silence before repeating
      const nextDelay = currentBlast === 3 ? 6000 : 4000;
      this.threeBlastTimer = setTimeout(() => {
        if (onBlastChange) onBlastChange(currentBlast, false);
        if (this.isThreeBlastRunning) {
          runSequence();
        }
      }, nextDelay);
    };

    runSequence();
  }

  public stopThreeBlastDistress() {
    this.isThreeBlastRunning = false;
    hapticService.cancel();
    if (this.threeBlastTimer) {
      clearTimeout(this.threeBlastTimer);
      this.threeBlastTimer = null;
    }
  }

  public isThreeBlastActive(): boolean {
    return this.isThreeBlastRunning;
  }

  public playIncomingRingtone() {
    if (this.isRinging) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.isRinging = true;

    const ringBurst = () => {
      if (!this.isRinging || !this.ctx) return;
      const t = this.ctx.currentTime;

      // Realistic dual-frequency telephone ring (440Hz + 480Hz)
      const playTone = (freq1: number, freq2: number, offset: number) => {
        if (!this.ctx) return;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.frequency.value = freq1;
        osc2.frequency.value = freq2;

        gain.gain.setValueAtTime(0.001, t + offset);
        gain.gain.linearRampToValueAtTime(0.2, t + offset + 0.05);
        gain.gain.setValueAtTime(0.2, t + offset + 0.85);
        gain.gain.linearRampToValueAtTime(0.001, t + offset + 0.9);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(t + offset);
        osc2.start(t + offset);
        osc1.stop(t + offset + 0.95);
        osc2.stop(t + offset + 0.95);
      };

      playTone(440, 480, 0);
      playTone(440, 480, 1.2);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([500, 200, 500, 1000]);
        } catch {}
      }
    };

    ringBurst();
    this.ringtoneInterval = setInterval(ringBurst, 3200);
  }

  public stopIncomingRingtone() {
    this.isRinging = false;
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
    hapticService.cancel();
  }

  public playSuccessChime() {
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const startTime = t + idx * 0.08;
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.45);
    });
  }

  public playBeep(freq = 880, duration = 0.15) {
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + duration);
  }
}

export const audioService = new AudioService();
