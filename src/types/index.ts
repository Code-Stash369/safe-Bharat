export type NavigationTab = 
  | 'daily'
  | 'sos'
  | 'women'
  | 'report'
  | 'disaster'
  | 'green'
  | 'radar'
  | 'iks'
  | 'contacts'
  | 'safe_ai';

export type SafeAIActionType = 
  | 'SHARE_LOCATION'
  | 'WHATSAPP_SOS'
  | 'CALL_CONTACT'
  | 'CALL_112'
  | 'CALL_181'
  | 'CALL_108'
  | 'CALL_101'
  | 'CALL_DISASTER'
  | 'TRIGGER_SOS'
  | 'STOP_SIREN'
  | 'OPEN_CAMERA'
  | 'FAKE_CALL'
  | 'FIND_SAFE_PLACES'
  | 'START_ESCORT'
  | 'STROBE_FLASHLIGHT'
  | 'RECORD_AUDIO'
  | 'NEARBY_POLICE'
  | 'NEARBY_HOSPITALS'
  | 'FIRST_AID'
  | 'DISASTER_CENTER'
  | 'REPORT_INCIDENT'
  | 'GREEN_BHARAT'
  | 'IKS_ARCHIVE'
  | 'DAILY_MISSIONS'
  | 'EDIT_PROFILE'
  | 'SPEAK_ADVICE'
  | 'COPY_COORDINATES';

export interface SafeAIMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  isEmergency?: boolean;
  situationCategory?: string;
  suggestedActions?: SafeAIActionType[];
  actionExecuted?: string;
  groundingPlaces?: Array<{ title: string; uri: string }>;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  city: string;
  state: string;
  bloodGroup: string;
  emergencyNote: string;
  points: number;
  streak: number;
  lastActiveDate: string;
  contacts: EmergencyContact[];
}

export interface LocationInfo {
  lat: number;
  lng: number;
  accuracy: number;
  altitude?: number | null;
  speed?: number | null;
  timestamp: number;
  address?: string;
}

export interface DailyMission {
  id: string;
  title: string;
  category: 'water' | 'energy' | 'waste' | 'trees' | 'civic';
  description: string;
  points: number;
  impactMetrics: string;
  completed: boolean;
}

export interface HazardAlert {
  id: string;
  title: string;
  region: string;
  severity: 'warning' | 'severe' | 'critical' | 'advisory';
  source: string;
  date: string;
  details: string;
  actionGuidance: string;
}

export interface CityEnvironmentData {
  city: string;
  state: string;
  temp: number;
  condition: string;
  aqi: number;
  aqiStatus: 'Good' | 'Moderate' | 'Poor' | 'Unhealthy' | 'Severe';
  pm25: number;
  humidity: number;
  uvIndex: number;
  advisory: string;
}

export interface IncidentReport {
  id: string;
  type: 'crime' | 'flood' | 'garbage' | 'environment';
  title: string;
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'critical';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  photoUrl?: string;
  timestamp: number;
  status: 'Logged' | 'Under Review' | 'Dispatched to Authority' | 'Resolved';
  upvotes: number;
}

export interface GreenActivity {
  id: string;
  name: string;
  icon: string;
  category: string;
  points: number;
  co2SavedKg: number;
  waterSavedLiters: number;
  plasticSavedKg: number;
  description: string;
}

export interface ActivityLog {
  id: string;
  activityId: string;
  activityName: string;
  pointsEarned: number;
  note: string;
  photoUrl?: string;
  timestamp: number;
  location?: { lat: number; lng: number };
}

export interface NearbyEmergencyService {
  id: string;
  name: string;
  type: 'police' | 'hospital' | 'fire' | 'shelter';
  distanceKm: number;
  phone: string;
  address: string;
  is24x7: boolean;
  lat?: number;
  lng?: number;
  capacity?: number;
  facilities?: string[];
}

export interface IKSExemplar {
  id: string;
  title: string;
  hindiTitle: string;
  region: string;
  ancientAge: string;
  category: string;
  summary: string;
  principles: string[];
  modernRelevance: string;
  quote: string;
}
