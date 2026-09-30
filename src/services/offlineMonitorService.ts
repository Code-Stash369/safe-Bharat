import { LocationInfo, NearbyEmergencyService } from '../types';
import { NEARBY_SERVICES_SAMPLE } from '../data/initialData';

export interface CachedLocationRecord {
  location: LocationInfo;
  cachedAt: number;
  formattedAddress: string;
}

export interface OfflineConnectivityState {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  signalQuality: 'optimal' | 'poor' | 'none';
  lastConnectedAt: number;
  lastDisconnectedAt: number | null;
  cachedLocation: CachedLocationRecord | null;
  nearestShelters: Array<{
    service: NearbyEmergencyService;
    distanceKm: number;
    bearingDeg: number;
    compassHeading: string;
  }>;
}

const STORAGE_KEY_CACHED_LOCATION = 'sb_offline_cached_location_v2';
const STORAGE_KEY_OFFLINE_LOG = 'sb_offline_connectivity_log_v2';

// Haversine distance formula in kilometers
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Bearing angle in degrees (0 = North, 90 = East, 180 = South, 270 = West)
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);
  return (theta * 180 / Math.PI + 360) % 360;
}

function bearingToCompass(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

class OfflineMonitorService {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSimulatedOffline: boolean = false;
  private lastConnectedAt: number = Date.now();
  private lastDisconnectedAt: number | null = null;
  private listeners: Set<(state: OfflineConnectivityState) => void> = new Set();
  private pingInterval: any = null;
  private cachedLocation: CachedLocationRecord | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Load cached location from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CACHED_LOCATION);
      if (saved) {
        this.cachedLocation = JSON.parse(saved);
      }
    } catch {
      // ignore parse error
    }

    // Default fallback cached location if none exists yet
    if (!this.cachedLocation) {
      this.cachedLocation = {
        location: {
          lat: 28.6139,
          lng: 77.2090,
          accuracy: 25,
          timestamp: Date.now(),
          address: 'Central Civic Command, Connaught Place, New Delhi',
        },
        cachedAt: Date.now(),
        formattedAddress: 'Central Civic Command, Connaught Place, New Delhi',
      };
    }

    // Attach native window online/offline listeners
    window.addEventListener('online', () => {
      this.handleConnectionChange(true);
    });

    window.addEventListener('offline', () => {
      this.handleConnectionChange(false);
    });

    // Start background ping verification (every 18 seconds)
    this.startActiveConnectivityVerification();
  }

  private handleConnectionChange(online: boolean) {
    if (this.isSimulatedOffline) return; // in simulated mode, ignore physical events

    const previous = this.isOnline;
    this.isOnline = online;

    if (online) {
      this.lastConnectedAt = Date.now();
    } else {
      this.lastDisconnectedAt = Date.now();
      this.logOfflineEvent('PHYSICAL_NETWORK_DROP');
    }

    if (previous !== online) {
      this.notifyListeners();
    }
  }

  private logOfflineEvent(reason: string) {
    try {
      const logs = JSON.parse(localStorage.getItem(STORAGE_KEY_OFFLINE_LOG) || '[]');
      logs.unshift({
        timestamp: Date.now(),
        reason,
        location: this.cachedLocation?.location || null,
      });
      localStorage.setItem(STORAGE_KEY_OFFLINE_LOG, JSON.stringify(logs.slice(0, 20)));
    } catch {
      // ignore
    }
  }

  private async startActiveConnectivityVerification() {
    if (typeof window === 'undefined') return;

    const check = async () => {
      if (this.isSimulatedOffline) return;

      if (!navigator.onLine) {
        if (this.isOnline) {
          this.handleConnectionChange(false);
        }
        return;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch('/api/health?t=' + Date.now(), {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          if (!this.isOnline) {
            this.handleConnectionChange(true);
          }
        } else {
          // Bad response from server, could be dead connection
          if (this.isOnline) {
            this.handleConnectionChange(false);
          }
        }
      } catch {
        // Fetch failed or timed out — area with dead data signal
        if (this.isOnline) {
          this.handleConnectionChange(false);
        }
      }
    };

    this.pingInterval = setInterval(check, 18000);
  }

  public updateLastKnownLocation(location: LocationInfo) {
    const record: CachedLocationRecord = {
      location,
      cachedAt: Date.now(),
      formattedAddress: location.address || `Lat ${location.lat.toFixed(4)}, Lng ${location.lng.toFixed(4)}`,
    };

    this.cachedLocation = record;
    try {
      localStorage.setItem(STORAGE_KEY_CACHED_LOCATION, JSON.stringify(record));
    } catch {
      // ignore
    }

    this.notifyListeners();
  }

  public getCachedLocation(): CachedLocationRecord | null {
    return this.cachedLocation;
  }

  public toggleSimulatedOffline(): boolean {
    this.isSimulatedOffline = !this.isSimulatedOffline;
    if (this.isSimulatedOffline) {
      this.isOnline = false;
      this.lastDisconnectedAt = Date.now();
      this.logOfflineEvent('SIMULATED_OFFLINE_TEST');
    } else {
      this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      this.lastConnectedAt = Date.now();
    }
    this.notifyListeners();
    return this.isSimulatedOffline;
  }

  public getState(): OfflineConnectivityState {
    const effectiveOnline = !this.isSimulatedOffline && this.isOnline;
    const baseLat = this.cachedLocation?.location?.lat || 28.6139;
    const baseLng = this.cachedLocation?.location?.lng || 77.2090;

    // Calculate nearest pre-cached shelters sorted by distance
    const nearestShelters = NEARBY_SERVICES_SAMPLE.map((service) => {
      const sLat = service.lat || 28.6139;
      const sLng = service.lng || 77.2090;
      const distanceKm = calculateHaversineDistance(baseLat, baseLng, sLat, sLng);
      const bearingDeg = calculateBearing(baseLat, baseLng, sLat, sLng);
      const compassHeading = bearingToCompass(bearingDeg);

      return {
        service,
        distanceKm,
        bearingDeg,
        compassHeading,
      };
    }).sort((a, b) => a.distanceKm - b.distanceKm);

    return {
      isOnline: effectiveOnline,
      isSimulatedOffline: this.isSimulatedOffline,
      signalQuality: effectiveOnline ? 'optimal' : 'none',
      lastConnectedAt: this.lastConnectedAt,
      lastDisconnectedAt: this.lastDisconnectedAt,
      cachedLocation: this.cachedLocation,
      nearestShelters,
    };
  }

  public subscribe(callback: (state: OfflineConnectivityState) => void): () => void {
    this.listeners.add(callback);
    callback(this.getState());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach((cb) => {
      try {
        cb(state);
      } catch (err) {
        console.error('Offline monitor listener error:', err);
      }
    });
  }

  public getOfflineDurationFormatted(): string {
    if (!this.lastDisconnectedAt) return '0 seconds';
    const elapsedSec = Math.floor((Date.now() - this.lastDisconnectedAt) / 1000);
    if (elapsedSec < 60) return `${elapsedSec}s`;
    const mins = Math.floor(elapsedSec / 60);
    if (mins < 60) return `${mins}m ${elapsedSec % 60}s`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  }
}

export const offlineMonitorService = new OfflineMonitorService();
