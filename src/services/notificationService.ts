/**
 * Browser Notification API Service for Safe Bharat
 * Dispatches real-time desktop / mobile push alerts for disaster advisories and incident reports.
 */

import { HazardAlert, IncidentReport } from '../types';
import { audioService } from './audioService';

class NotificationService {
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.error('Error requesting notification permission:', e);
      return 'denied';
    }
  }

  public sendNotification(title: string, options?: NotificationOptions): boolean {
    if (!this.isSupported()) return false;

    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🚨</text></svg>',
          badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🛡️</text></svg>',
          tag: 'safe-bharat-alert',
          ...options,
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
        };

        // Play alert audio beep and haptic feedback
        audioService.playBeep(940, 0.15);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate([200, 100, 200]);
          } catch {}
        }
        return true;
      } catch (err) {
        console.error('Failed to trigger notification instance:', err);
        return false;
      }
    }
    return false;
  }

  public notifyIncidentReport(report: IncidentReport): void {
    const isCritical = report.severity === 'critical';
    const title = isCritical 
      ? `🚨 CRITICAL HAZARD REPORT: ${report.title}`
      : `⚠️ New Incident Logged: ${report.title}`;

    const body = `${report.category} · ${report.location.address}\nStatus: ${report.status} · Details: ${report.description.slice(0, 100)}...`;

    this.sendNotification(title, {
      body,
      tag: `report-${report.id}`,
      requireInteraction: isCritical,
    });
  }

  public notifyDisasterAlert(alert: HazardAlert): void {
    const title = `🚨 DISASTER ADVISORY: ${alert.title}`;
    const body = `${alert.region} · Severity: ${alert.severity.toUpperCase()}\nGuidance: ${alert.actionGuidance}`;

    this.sendNotification(title, {
      body,
      tag: `hazard-${alert.id}`,
      requireInteraction: true,
    });
  }

  public notifyWeatherDisaster(city: string, warning: string, guidance: string): void {
    const title = `⛈️ WEATHER ALERT FOR ${city.toUpperCase()}`;
    const body = `${warning}\nAction: ${guidance}`;

    this.sendNotification(title, {
      body,
      tag: `weather-${city}`,
      requireInteraction: true,
    });
  }
}

export const notificationService = new NotificationService();
