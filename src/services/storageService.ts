import {
  ActivityLog,
  DailyMission,
  IncidentReport,
  UserProfile
} from '../types';
import {
  DAILY_MISSIONS_CATALOG,
  INITIAL_COMMUNITY_REPORTS
} from '../data/initialData';

const STORAGE_KEYS = {
  USER: 'sb_user_profile_v2',
  REPORTS: 'sb_incident_reports_v2',
  ACTIVITIES: 'sb_activity_logs_v2',
  DAILY_MISSIONS: 'sb_daily_missions_v2',
  CHECKLIST: 'sb_disaster_checklist_v2',
};

const DEFAULT_USER: UserProfile = {
  name: 'Ashwin Kumar',
  phone: '9876543210',
  city: 'New Delhi',
  state: 'Delhi',
  bloodGroup: 'B+',
  emergencyNote: 'No severe drug allergies. Asthmatic inhaler in carry pouch.',
  points: 120,
  streak: 5,
  lastActiveDate: new Date().toISOString().slice(0, 10),
  contacts: [
    { id: 'c1', name: 'Mother (Maa)', phone: '9876500001', relation: 'Parent' },
    { id: 'c2', name: 'Brother (Rohan)', phone: '9876500002', relation: 'Sibling' },
    { id: 'c3', name: 'Roommate / Friend (Amit)', phone: '9876500003', relation: 'Friend' },
  ],
};

export const storageService = {
  getUserProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEFAULT_USER));
        return DEFAULT_USER;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_USER;
    }
  },

  saveUserProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save user profile', e);
    }
  },

  getReports(): IncidentReport[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_COMMUNITY_REPORTS));
        return INITIAL_COMMUNITY_REPORTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_COMMUNITY_REPORTS;
    }
  },

  saveReport(report: IncidentReport): void {
    const list = this.getReports();
    const updated = [report, ...list];
    try {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save report', e);
    }
  },

  deleteReport(id: string): void {
    const list = this.getReports().filter(r => r.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to delete report', e);
    }
  },

  upvoteReport(id: string): IncidentReport[] {
    const list = this.getReports().map(r => {
      if (r.id === id) {
        return { ...r, upvotes: (r.upvotes || 0) + 1 };
      }
      return r;
    });
    try {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to upvote report', e);
    }
    return list;
  },

  getActivityLogs(): ActivityLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveActivityLog(log: ActivityLog): void {
    const logs = this.getActivityLogs();
    const updated = [log, ...logs];
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(updated));
      
      // Increment user points
      const user = this.getUserProfile();
      user.points += log.pointsEarned;
      this.saveUserProfile(user);
    } catch (e) {
      console.error('Failed to save activity log', e);
    }
  },

  getDailyMissions(): DailyMission[] {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const stored = localStorage.getItem(STORAGE_KEYS.DAILY_MISSIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === todayStr && Array.isArray(parsed.missions)) {
          return parsed.missions;
        }
      }
      // Fresh missions for today
      const freshPayload = {
        date: todayStr,
        missions: DAILY_MISSIONS_CATALOG,
      };
      localStorage.setItem(STORAGE_KEYS.DAILY_MISSIONS, JSON.stringify(freshPayload));
      return DAILY_MISSIONS_CATALOG;
    } catch {
      return DAILY_MISSIONS_CATALOG;
    }
  },

  toggleDailyMission(id: string): DailyMission[] {
    const todayStr = new Date().toISOString().slice(0, 10);
    const missions = this.getDailyMissions();
    let pointsToAdd = 0;

    const updated = missions.map(m => {
      if (m.id === id) {
        const nextState = !m.completed;
        if (nextState) pointsToAdd += m.points;
        return { ...m, completed: nextState };
      }
      return m;
    });

    try {
      localStorage.setItem(STORAGE_KEYS.DAILY_MISSIONS, JSON.stringify({
        date: todayStr,
        missions: updated,
      }));

      if (pointsToAdd > 0) {
        const user = this.getUserProfile();
        user.points += pointsToAdd;
        this.saveUserProfile(user);
      }
    } catch (e) {
      console.error('Failed to update daily missions', e);
    }

    return updated;
  },

  getChecklistState(): Record<string, boolean> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHECKLIST);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  saveChecklistState(state: Record<string, boolean>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save checklist state', e);
    }
  },

  exportAllData(): string {
    const backup = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      user: this.getUserProfile(),
      reports: this.getReports(),
      activities: this.getActivityLogs(),
      checklist: this.getChecklistState(),
    };
    return JSON.stringify(backup, null, 2);
  },

  importData(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(parsed.user));
      if (parsed.reports) localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(parsed.reports));
      if (parsed.activities) localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(parsed.activities));
      if (parsed.checklist) localStorage.setItem(STORAGE_KEYS.CHECKLIST, JSON.stringify(parsed.checklist));
      return true;
    } catch {
      return false;
    }
  },

  resetAllData(): void {
    localStorage.clear();
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEFAULT_USER));
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(INITIAL_COMMUNITY_REPORTS));
  },
};
