/**
 * Haptic Feedback Service using the HTML5 Vibrate API
 * Provides tactile confirmation for critical safety actions, SOS activation,
 * siren drills, and speed/movement hazard alerts.
 */

const STORAGE_KEY_HAPTICS = 'sb_haptic_feedback_enabled';

class HapticService {
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_HAPTICS);
        if (saved !== null) {
          this.enabled = saved === 'true';
        }
      } catch {
        this.enabled = true;
      }
    }
  }

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  }

  public isEnabled(): boolean {
    return this.enabled && this.isSupported();
  }

  public setEnabled(enable: boolean): void {
    this.enabled = enable;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_HAPTICS, String(enable));
      } catch {
        // ignore
      }
    }
    if (!enable) {
      this.cancel();
    } else {
      this.triggerActionConfirmed();
    }
  }

  /**
   * Vibrate device with given pattern if supported and enabled
   */
  public vibrate(pattern: number | number[]): boolean {
    if (!this.isEnabled()) return false;
    try {
      return navigator.vibrate(pattern);
    } catch {
      return false;
    }
  }

  /**
   * Urgent pulsating tactile confirmation for Emergency SOS activation
   * Pattern: Long pulse, short gap, long pulse, short gap, long pulse, long sustain
   */
  public triggerSOS(): void {
    this.vibrate([600, 150, 600, 150, 600, 250, 1200]);
  }

  /**
   * Rhythmic alternating tactile beat matching the audible siren sweep
   */
  public triggerSirenTick(): void {
    this.vibrate([300, 100, 300]);
  }

  /**
   * Crisp double-pulse tactile confirmation when a critical action is executed
   * (e.g. Location Shared, 112 Dialed, Evidence Photo Saved, Fake Call Started)
   */
  public triggerActionConfirmed(): void {
    this.vibrate([100, 60, 120]);
  }

  /**
   * Warning alert pattern for environmental, route diversion or high speed hazards
   */
  public triggerWarning(): void {
    this.vibrate([200, 90, 200, 90, 200]);
  }

  /**
   * Rapid flutter vibration when rapid vehicle movement or cab route change is detected
   */
  public triggerSpeedAlert(): void {
    this.vibrate([70, 40, 70, 40, 70, 40, 250]);
  }

  /**
   * Tactical Morse Code SOS vibration (... --- ...)
   */
  public triggerMorseSOS(): void {
    // 3 dots (180ms), 3 dashes (540ms), 3 dots (180ms)
    this.vibrate([
      180, 120, 180, 120, 180, 350,
      540, 120, 540, 120, 540, 350,
      180, 120, 180, 120, 180
    ]);
  }

  /**
   * Subtle light tap for quick button responses
   */
  public triggerTap(): void {
    this.vibrate(40);
  }

  /**
   * Cancel any active vibration immediately
   */
  public cancel(): void {
    if (this.isSupported()) {
      try {
        navigator.vibrate(0);
      } catch {
        // ignore
      }
    }
  }
}

export const hapticService = new HapticService();
