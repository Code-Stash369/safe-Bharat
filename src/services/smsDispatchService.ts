/**
 * Automated SMS & Native Web Share Dispatch Service for Safe Bharat
 * 
 * Provides automated emergency messaging to pre-saved emergency contacts:
 * 1. Web Share API: Invokes native OS share sheet (SMS, WhatsApp, Signal, Contacts)
 * 2. Universal SMS Protocol: Formats platform-specific sms: URIs for iOS & Android
 * 3. Pre-Saved Contact Dispatch: Automatically builds multi-recipient emergency alerts
 *    with live GPS coordinates, Google Maps pins, medical data, and distress timestamps.
 */

import { LocationInfo, UserProfile, EmergencyContact } from '../types';

export interface DispatchResult {
  success: boolean;
  method: 'web_share' | 'native_sms' | 'clipboard_fallback';
  recipientCount: number;
  error?: string;
  cancelled?: boolean;
}

export interface DispatchOptions {
  user: UserProfile;
  location: LocationInfo | null;
  reason?: string;
  targetContact?: EmergencyContact;
  preferredMethod?: 'auto' | 'share' | 'sms';
  customNote?: string;
}

class SMSDispatchService {
  private readonly AUTO_DISPATCH_KEY = 'sb_auto_dispatch_sms_enabled';

  /**
   * Check if Web Share API is supported in the current environment
   */
  public canShare(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      typeof navigator.canShare === 'function'
    );
  }

  /**
   * Detect iOS/iPadOS platform for protocol variation
   */
  public isIOS(): boolean {
    if (typeof navigator === 'undefined') return false;
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  }

  /**
   * Check if Auto-Dispatch on SOS is enabled by user preference
   */
  public isAutoDispatchEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem(this.AUTO_DISPATCH_KEY);
    // Default to true for life safety
    return saved === null ? true : saved === 'true';
  }

  public setAutoDispatchEnabled(enabled: boolean): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.AUTO_DISPATCH_KEY, String(enabled));
    }
  }

  /**
   * Cleans phone number string to raw dialable digits
   */
  public cleanPhoneNumber(phone: string): string {
    if (!phone) return '';
    // Strip spaces, dashes, parentheses
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    // If 10 digits without country code, add +91 for India
    if (/^\d{10}$/.test(cleaned)) {
      return `+91${cleaned}`;
    }
    return cleaned;
  }

  /**
   * Generates a high-urgency formatted distress message with GPS coordinates
   */
  public generateDistressMessage(
    user: UserProfile,
    location: LocationInfo | null,
    reason: string = 'Emergency SOS Alert',
    targetContact?: EmergencyContact
  ): { text: string; mapsUrl: string; coordsText: string } {
    const timeStr = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const lat = location ? location.lat.toFixed(6) : '28.613900';
    const lng = location ? location.lng.toFixed(6) : '77.209000';
    const accuracy = location ? `±${Math.round(location.accuracy)}m` : 'approximate';
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    const coordsText = `Lat: ${lat}°, Lng: ${lng}° (${accuracy})`;

    const recipientMention = targetContact
      ? `Dear ${targetContact.name} (${targetContact.relation || 'Emergency Contact'}),\n`
      : '';

    const contactsList = (user.contacts || [])
      .map((c) => `• ${c.name}: ${c.phone}`)
      .join('\n');

    const medicalNote = user.emergencyNote ? `\nMedical Note: ${user.emergencyNote}` : '';

    const text = `🚨 EMERGENCY SOS ALERT! IMMEDIATE RESCUE NEEDED 🚨
${recipientMention}I am in immediate distress and require urgent assistance!

Citizen: ${user.name || 'Citizen in Distress'}
Phone: +91 ${user.phone || 'Unknown'}
Blood Group: ${user.bloodGroup || 'Not Specified'}
Reason: ${reason}
Time: ${timeStr}, ${dateStr}${medicalNote}

📍 Live GPS Location: ${mapsUrl}
Coordinates: ${coordsText}
${location?.address ? `Near: ${location.address}\n` : ''}
Pre-Saved Emergency Contacts:
${contactsList || 'None configured'}

Please call National Emergency Helpline 112 or Police 100 immediately if unreachable!
— Sent via Safe Bharat National Safety Command`;

    return { text, mapsUrl, coordsText };
  }

  /**
   * Builds an OS-compliant sms: URI targeting one or more phone numbers
   */
  public buildSMSUri(phoneNumbers: string[], bodyText: string): string {
    const encodedBody = encodeURIComponent(bodyText);
    const cleanedNumbers = phoneNumbers
      .map((p) => this.cleanPhoneNumber(p))
      .filter(Boolean);

    const isApple = this.isIOS();

    if (cleanedNumbers.length === 0) {
      return isApple ? `sms:&body=${encodedBody}` : `sms:?body=${encodedBody}`;
    }

    if (isApple) {
      // iOS: comma-separated with &body=
      const recipients = cleanedNumbers.join(',');
      return `sms:${recipients}&body=${encodedBody}`;
    } else {
      // Android / generic: comma or semicolon separated with ?body=
      const recipients = cleanedNumbers.join(',');
      return `sms:${recipients}?body=${encodedBody}`;
    }
  }

  /**
   * Safely opens an external URI (e.g. sms:) without popup blocker interference
   */
  public triggerURI(uri: string): void {
    if (typeof window === 'undefined') return;
    try {
      const a = document.createElement('a');
      a.href = uri;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 1000);
    } catch {
      window.location.href = uri;
    }
  }

  /**
   * Dispatches via Web Share API if supported
   */
  public async dispatchViaWebShare(
    user: UserProfile,
    location: LocationInfo | null,
    reason: string = 'Emergency SOS Alert',
    targetContact?: EmergencyContact
  ): Promise<DispatchResult> {
    const { text, mapsUrl } = this.generateDistressMessage(user, location, reason, targetContact);

    if (this.canShare()) {
      try {
        const shareData: ShareData = {
          title: '🚨 SAFE BHARAT EMERGENCY SOS',
          text,
          url: mapsUrl,
        };

        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return {
            success: true,
            method: 'web_share',
            recipientCount: targetContact ? 1 : user.contacts?.length || 1,
          };
        }
      } catch (err: any) {
        // If user cancelled the share dialog, treat as cancelled without error
        if (err?.name === 'AbortError') {
          return {
            success: false,
            cancelled: true,
            method: 'web_share',
            recipientCount: 0,
          };
        }
        console.warn('Web Share failed, falling back to native SMS:', err);
      }
    }

    // Fallback directly to native SMS dispatch
    return this.dispatchViaNativeSMS(user, location, reason, targetContact);
  }

  /**
   * Dispatches emergency alert directly to native SMS app
   */
  public dispatchViaNativeSMS(
    user: UserProfile,
    location: LocationInfo | null,
    reason: string = 'Emergency SOS Alert',
    targetContact?: EmergencyContact
  ): DispatchResult {
    const { text } = this.generateDistressMessage(user, location, reason, targetContact);

    let phoneNumbers: string[] = [];
    if (targetContact) {
      phoneNumbers = [targetContact.phone];
    } else if (user.contacts && user.contacts.length > 0) {
      phoneNumbers = user.contacts.map((c) => c.phone);
    }

    const uri = this.buildSMSUri(phoneNumbers, text);
    this.triggerURI(uri);

    return {
      success: true,
      method: 'native_sms',
      recipientCount: phoneNumbers.length,
    };
  }

  /**
   * Main dispatch method: Automatically chooses Web Share or Native SMS based on options & device
   */
  public async dispatchSOS(options: DispatchOptions): Promise<DispatchResult> {
    const { user, location, reason, targetContact, preferredMethod = 'auto' } = options;

    if (preferredMethod === 'share' || (preferredMethod === 'auto' && this.canShare())) {
      return await this.dispatchViaWebShare(user, location, reason, targetContact);
    }

    return this.dispatchViaNativeSMS(user, location, reason, targetContact);
  }

  /**
   * Copy distress text to clipboard with return confirmation
   */
  public async copyDistressText(
    user: UserProfile,
    location: LocationInfo | null,
    reason: string = 'Emergency SOS Alert',
    targetContact?: EmergencyContact
  ): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return false;
    const { text } = this.generateDistressMessage(user, location, reason, targetContact);
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}

export const smsDispatchService = new SMSDispatchService();
