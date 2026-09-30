import { LocationInfo, SafeAIActionType, UserProfile } from '../types';

export type UserActivityType = 
  | 'high_speed_transit'
  | 'city_vehicle_transit'
  | 'running'
  | 'walking'
  | 'stationary_late_night'
  | 'stationary_day';

export interface ContextualSuggestion {
  activityType: UserActivityType;
  activityLabel: string;
  activityIcon: string;
  speedKmh: number;
  urgencyLevel: 'info' | 'advisory' | 'warning' | 'alert';
  proactiveGreeting: string;
  safetyTip: string;
  suggestedShortcuts: {
    action: SafeAIActionType;
    label: string;
    icon: string;
    description: string;
    highlight?: boolean;
  }[];
}

class ContextualSafetyEngine {
  private simulatedSpeedMps: number | null = null;
  private simulatedTimeHour: number | null = null;

  public setSimulation(speedKmh: number | null, hour: number | null = null) {
    this.simulatedSpeedMps = speedKmh !== null ? speedKmh / 3.6 : null;
    this.simulatedTimeHour = hour;
  }

  public clearSimulation() {
    this.simulatedSpeedMps = null;
    this.simulatedTimeHour = null;
  }

  public isSimulating(): boolean {
    return this.simulatedSpeedMps !== null;
  }

  public analyzeContext(location: LocationInfo | null, user?: UserProfile): ContextualSuggestion {
    const now = new Date();
    const currentHour = this.simulatedTimeHour !== null ? this.simulatedTimeHour : now.getHours();
    const isLateNight = currentHour >= 22 || currentHour < 5;
    const isEvening = currentHour >= 18 && currentHour < 22;

    // Determine speed in meters/second
    let speedMps = 0;
    if (this.simulatedSpeedMps !== null) {
      speedMps = this.simulatedSpeedMps;
    } else if (location?.speed !== undefined && location?.speed !== null && !isNaN(location.speed) && location.speed > 0) {
      speedMps = location.speed;
    }

    const speedKmh = Math.round(speedMps * 3.6);

    // Classify user activity
    if (speedKmh >= 45) {
      return {
        activityType: 'high_speed_transit',
        activityLabel: `High-Speed Transit (~${speedKmh} km/h)`,
        activityIcon: '🚄',
        speedKmh,
        urgencyLevel: isLateNight ? 'alert' : 'warning',
        proactiveGreeting: `High-speed movement detected (~${speedKmh} km/h). Safe travels!`,
        safetyTip: isLateNight 
          ? `High-speed travel late at night (${currentHour % 12 || 12} ${currentHour >= 12 ? 'PM' : 'AM'}): Keep your live GPS tracking link shared with family. If in a cab, verify route consistency against navigation maps and keep Fake Call ready.`
          : `Travelling at highway speed (~${speedKmh} km/h). Keep emergency contacts informed and emergency SOS within one tap.`,
        suggestedShortcuts: [
          {
            action: 'SHARE_LOCATION',
            label: 'Share Live Route',
            icon: '📍',
            description: 'Send live GPS link to pre-saved family contacts',
            highlight: true,
          },
          {
            action: 'WHATSAPP_SOS',
            label: 'WhatsApp Trip Link',
            icon: '💬',
            description: 'Direct WhatsApp broadcast with coordinate tracking',
          },
          {
            action: 'FAKE_CALL',
            label: 'Fake Call (Papa)',
            icon: '📱',
            description: 'Simulate an incoming phone call to appear actively monitored',
          },
          {
            action: 'CALL_112',
            label: 'Dial 112 Dispatch',
            icon: '🚨',
            description: 'National emergency response in case vehicle diverts dangerously',
          },
        ],
      };
    }

    if (speedKmh >= 15) {
      return {
        activityType: 'city_vehicle_transit',
        activityLabel: `City Cab / Transit (~${speedKmh} km/h)`,
        activityIcon: '🚖',
        speedKmh,
        urgencyLevel: isLateNight ? 'alert' : 'advisory',
        proactiveGreeting: `Commercial cab or vehicle transit detected (~${speedKmh} km/h).`,
        safetyTip: isLateNight
          ? `Late night vehicle travel: Take a quick photo of the vehicle license plate or driver ID card via Evidence Camera. If driver deviates or acts suspiciously, trigger Fake Call or share live route immediately.`
          : `Moving in city traffic (~${speedKmh} km/h). Share your live location with family so they know your estimated arrival time.`,
        suggestedShortcuts: [
          {
            action: 'SHARE_LOCATION',
            label: 'Share Live Cab GPS',
            icon: '📍',
            description: 'Dispatch real-time tracking link with accuracy coordinates',
            highlight: true,
          },
          {
            action: 'FAKE_CALL',
            label: 'Trigger Fake Call',
            icon: '📱',
            description: 'Rings your phone immediately: "Papa (Home)" calling',
          },
          {
            action: 'OPEN_CAMERA',
            label: 'Evidence Camera',
            icon: '📷',
            description: 'Discreetly photograph cab registration plate with GPS watermark',
          },
          {
            action: 'CALL_112',
            label: '112 Police Dispatch',
            icon: '👮',
            description: 'Instant police vehicle dispatch if route is compromised',
          },
        ],
      };
    }

    if (speedKmh >= 7) {
      return {
        activityType: 'running',
        activityLabel: `Rapid Movement (~${speedKmh} km/h)`,
        activityIcon: '🏃',
        speedKmh,
        urgencyLevel: isLateNight ? 'alert' : 'advisory',
        proactiveGreeting: `Fast movement / running pace detected (~${speedKmh} km/h).`,
        safetyTip: isLateNight
          ? `Running or moving rapidly late at night: If you are fleeing a threat or being chased, head into the nearest open store, metro station, or security post and activate SOS Alarm immediately.`
          : `Running / rapid jogging pace (~${speedKmh} km/h). Geo-Radar safe havens and instant SOS sirens are primed.`,
        suggestedShortcuts: [
          {
            action: 'TRIGGER_SOS',
            label: 'Start SOS Alarm',
            icon: '🚨',
            description: 'Sound loud acoustic siren & dispatch emergency SMS',
            highlight: true,
          },
          {
            action: 'FIND_SAFE_PLACES',
            label: 'Nearest Safe Havens',
            icon: '🗺️',
            description: 'Locate 24x7 transit shelters & police posts on radar',
          },
          {
            action: 'SHARE_LOCATION',
            label: 'Share Coordinates',
            icon: '📍',
            description: 'Send live tracking link to family members',
          },
        ],
      };
    }

    if (speedKmh >= 1.5) {
      return {
        activityType: 'walking',
        activityLabel: `Walking on Foot (~${speedKmh} km/h)`,
        activityIcon: '🚶',
        speedKmh,
        urgencyLevel: isLateNight ? 'warning' : 'info',
        proactiveGreeting: isLateNight ? `Late night pedestrian walk detected (~${speedKmh} km/h).` : `Walking pace (~${speedKmh} km/h). Safe Bharat is guarding your steps.`,
        safetyTip: isLateNight
          ? `Walking late at night (${currentHour % 12 || 12} ${currentHour >= 12 ? 'PM' : 'AM'}): Keep your eyes up, avoid wearing noise-canceling headphones, and start "Walk With Me" virtual chaperone for timed safety check-in countdowns.`
          : `Walking on foot: Stay aware at crossings. Tap 'Walk With Me' if heading through unfamiliar or secluded areas.`,
        suggestedShortcuts: [
          {
            action: 'START_ESCORT',
            label: 'Start "Walk With Me"',
            icon: '🚶‍♀️',
            description: 'Virtual journey chaperone with automated timed check-ins',
            highlight: true,
          },
          {
            action: 'SHARE_LOCATION',
            label: 'Share Live Walk',
            icon: '📍',
            description: 'Dispatch real-time GPS coordinate link to contacts',
          },
          {
            action: 'FAKE_CALL',
            label: 'Trigger Fake Call',
            icon: '📱',
            description: 'Pretend you are actively talking to family waiting ahead',
          },
          {
            action: 'FIND_SAFE_PLACES',
            label: 'Safe Havens Radar',
            icon: '🧭',
            description: 'Find nearest police stations and illuminated havens',
          },
        ],
      };
    }

    if (isLateNight) {
      return {
        activityType: 'stationary_late_night',
        activityLabel: 'Stationary (Night Watch)',
        activityIcon: '🌙',
        speedKmh: 0,
        urgencyLevel: 'warning',
        proactiveGreeting: `Stationary after hours (${currentHour % 12 || 12} ${currentHour >= 12 ? 'PM' : 'AM'}).`,
        safetyTip: `You have been stationary during late hours. If stranded or waiting for transport, wait inside a 24x7 fuel station, metro concourse, or hotel lobby with active security guard coverage.`,
        suggestedShortcuts: [
          {
            action: 'FIND_SAFE_PLACES',
            label: 'Find 24x7 Shelters',
            icon: '🗺️',
            description: 'Navigate to nearest open civic haven or police post',
            highlight: true,
          },
          {
            action: 'CALL_CONTACT',
            label: `Call ${user?.contacts?.[0]?.name || 'Family Contact'}`,
            icon: '📞',
            description: 'Check in with trusted family member or request a ride',
          },
          {
            action: 'SHARE_LOCATION',
            label: 'Share GPS Anchor',
            icon: '📍',
            description: 'Send current stationary coordinates to emergency circle',
          },
          {
            action: 'NEARBY_POLICE',
            label: 'Police on Radar',
            icon: '👮',
            description: 'View closest police stations within 5km radius',
          },
        ],
      };
    }

    return {
      activityType: 'stationary_day',
      activityLabel: 'Stationary / Ready',
      activityIcon: '🛡️',
      speedKmh: 0,
      urgencyLevel: 'info',
      proactiveGreeting: 'Stationary area monitoring active.',
      safetyTip: 'All SAFE BHARAT emergency services (112, 181, 108, 101) and offline GPS anchor are active and monitoring your surroundings.',
      suggestedShortcuts: [
        {
          action: 'SHARE_LOCATION',
          label: 'Share Location',
          icon: '📍',
          description: 'Dispatch current GPS coordinates to trusted circle',
        },
        {
          action: 'FIND_SAFE_PLACES',
          label: 'Safe Havens Radar',
          icon: '🧭',
          description: 'Locate nearest hospitals and civil protection hubs',
        },
        {
          action: 'FIRST_AID',
          label: 'First Aid & CPR',
          icon: '🩹',
          description: 'Rapid life support & medical emergency reference',
        },
      ],
    };
  }
}

export const contextualSafetyEngine = new ContextualSafetyEngine();
