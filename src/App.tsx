import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Radio, 
  Flame, 
  Compass, 
  Waves, 
  Leaf, 
  BookOpen, 
  Phone, 
  Volume2, 
  VolumeX, 
  Info, 
  Heart, 
  CheckCircle2, 
  X,
  ExternalLink
} from 'lucide-react';
import { 
  ActivityLog, 
  DailyMission, 
  IncidentReport, 
  LocationInfo, 
  NavigationTab, 
  UserProfile 
} from './types';
import { storageService } from './services/storageService';
import { audioService } from './services/audioService';
import { notificationService } from './services/notificationService';
import { Navbar } from './components/Navbar';
import { DailyUpdateSystem } from './components/DailyUpdateSystem';
import { EmergencyHub } from './components/EmergencyHub';
import { WomenSafetyShield } from './components/WomenSafetyShield';
import { IncidentReportingStudio } from './components/IncidentReportingStudio';
import { FloodDisasterCenter } from './components/FloodDisasterCenter';
import { GreenBharatHub } from './components/GreenBharatHub';
import { IKSArchive } from './components/IKSArchive';
import { UserProfileModal } from './components/UserProfileModal';
import { OfflineLeafletMap } from './components/OfflineLeafletMap';
import { FloatingSOSActionPanel } from './components/FloatingSOSActionPanel';
import { AutomatedClimateAlertBanner } from './components/AutomatedClimateAlertBanner';
import { VoiceSOSBanner } from './components/VoiceSOSBanner';
import { VoiceSOSTriggerModal } from './components/VoiceSOSTriggerModal';
import { VoiceSOSEvent } from './services/voiceSOSService';
import { SafeBharatLogo } from './components/SafeBharatLogo';
import { NEARBY_SERVICES_SAMPLE } from './data/initialData';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('daily');
  const [user, setUser] = useState<UserProfile>(storageService.getUserProfile());
  const [reports, setReports] = useState<IncidentReport[]>(storageService.getReports());
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(storageService.getActivityLogs());
  const [dailyMissions, setDailyMissions] = useState<DailyMission[]>(storageService.getDailyMissions());
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [isSirenActive, setIsSirenActive] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeVoiceEvent, setActiveVoiceEvent] = useState<VoiceSOSEvent | null>(null);

  // Initialize or update streak check
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const currentUser = storageService.getUserProfile();
    if (currentUser.lastActiveDate !== today) {
      currentUser.streak += 1;
      currentUser.lastActiveDate = today;
      storageService.saveUserProfile(currentUser);
      setUser(currentUser);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Acquire high accuracy geolocation
  const handleRequestLocation = useCallback(async (): Promise<LocationInfo | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser.');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: LocationInfo = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            speed: pos.coords.speed,
            timestamp: pos.timestamp,
          };
          setLocation(loc);
          showToast(`GPS Position Locked (±${Math.round(loc.accuracy)}m)`);
          resolve(loc);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          showToast('GPS permission required to pin your exact location.');
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });
  }, []);

  const handleToggleSiren = () => {
    if (isSirenActive) {
      audioService.stopSiren();
      setIsSirenActive(false);
      showToast('Siren Drill Deactivated');
    } else {
      audioService.playSiren();
      setIsSirenActive(true);
      showToast('⚠️ Audible Siren Drill Active');
    }
  };

  const handleVoiceTrigger = useCallback((event?: VoiceSOSEvent) => {
    const evt = event || {
      keyword: 'HELP',
      transcript: 'Voice command detected',
      confidence: 0.99,
      timestamp: Date.now(),
    };
    setActiveVoiceEvent(evt);
    setIsSirenActive(true);
    setActiveTab('sos');
    showToast(`🚨 Voice SOS Triggered: "${evt.keyword}"`);
  }, []);

  const handleToggleMission = (id: string) => {
    const updated = storageService.toggleDailyMission(id);
    setDailyMissions(updated);
    setUser(storageService.getUserProfile());
  };

  const handleSaveReport = (report: IncidentReport) => {
    storageService.saveReport(report);
    setReports(storageService.getReports());
    showToast(`Incident #${report.id} Logged`);

    // Real-time Browser Notification Trigger
    notificationService.notifyIncidentReport(report);
  };

  const handleDeleteReport = (id: string) => {
    storageService.deleteReport(id);
    setReports(storageService.getReports());
    showToast('Report removed from device');
  };

  const handleLogActivity = (log: ActivityLog) => {
    storageService.saveActivityLog(log);
    setActivityLogs(storageService.getActivityLogs());
    setUser(storageService.getUserProfile());
    showToast(`🎉 +${log.pointsEarned} Green Karma Awarded!`);
  };

  const handleAwardBonusPoints = (pts: number) => {
    const updated = { ...user, points: user.points + pts };
    setUser(updated);
    storageService.saveUserProfile(updated);
    showToast(`🏆 Quiz Master: +${pts} Green Karma!`);
  };

  const handleUpvoteReport = (id: string) => {
    const updated = storageService.upvoteReport(id);
    setReports(updated);
    audioService.playBeep(920, 0.06);
    showToast('Report verified & upvoted!');

    const target = updated.find(r => r.id === id);
    if (target) {
      notificationService.sendNotification(`Civic Verification: ${target.title}`, {
        body: `Citizens verified this incident (${target.upvotes || 1} confirmations) near ${target.location.address}`,
        tag: `upvote-${id}`,
      });
    }
  };

  const handleTriggerTestNotification = () => {
    const success = notificationService.sendNotification('🚨 REAL-TIME DISASTER TEST: Urban Flash Flood Watch', {
      body: 'Live Meteorological Alert: Water column rising at subway underpass. Civil defense teams deployed. Avoid submerged crossings.',
      tag: 'test-drill',
      requireInteraction: true,
    });
    if (!success) {
      showToast('⚠️ Please enable notifications in the bell menu above.');
    } else {
      showToast('Disaster notification sent to your system!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-amber-950/80 border-b border-emerald-900/40 text-[10px] sm:text-[11px] font-semibold py-1 sm:py-1.5 px-2.5 sm:px-3 text-center text-slate-300 flex items-center justify-center gap-1.5 sm:gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <span className="truncate">
          <strong>SAFE BHARAT</strong> · National Civic Safety &amp; Environmental Resilience Command
        </span>
      </div>

      {/* Main Top Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        isSirenPlaying={isSirenActive}
        onToggleSiren={handleToggleSiren}
        onOpenProfile={() => setIsProfileOpen(true)}
        hasGPS={location !== null}
        onQuickGPS={handleRequestLocation}
        reports={reports}
        onTriggerTestNotification={handleTriggerTestNotification}
      />

      {/* Main Viewport Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-4 sm:pt-6 pb-28 sm:pb-24 lg:pb-12 space-y-5 sm:space-y-6">
        
        {/* Automated Climate Alert Banner: 60s Polling for High-Priority Warnings */}
        <AutomatedClimateAlertBanner
          location={location}
          onRequestLocation={handleRequestLocation}
          onTriggerSOS={() => setActiveTab('sos')}
        />

        {activeTab === 'daily' && (
          <DailyUpdateSystem
            user={user}
            missions={dailyMissions}
            onToggleMission={handleToggleMission}
            setActiveTab={setActiveTab}
            onTriggerSOS={() => setActiveTab('sos')}
            location={location}
            onRequestLocation={handleRequestLocation}
          />
        )}

        {activeTab === 'radar' && (
          <div className="space-y-6">
            <OfflineLeafletMap
              location={location}
              onRequestLocation={handleRequestLocation}
              reports={reports}
              shelters={NEARBY_SERVICES_SAMPLE}
            />
          </div>
        )}

        {activeTab === 'sos' && (
          <EmergencyHub
            user={user}
            location={location}
            onRequestLocation={handleRequestLocation}
            isSirenActive={isSirenActive}
            onToggleSiren={handleToggleSiren}
          />
        )}

        {activeTab === 'women' && (
          <WomenSafetyShield
            user={user}
            location={location}
            onRequestLocation={handleRequestLocation}
          />
        )}

        {activeTab === 'report' && (
          <IncidentReportingStudio
            user={user}
            reports={reports}
            onSaveReport={handleSaveReport}
            onDeleteReport={handleDeleteReport}
            onUpvoteReport={handleUpvoteReport}
            location={location}
            onRequestLocation={handleRequestLocation}
          />
        )}

        {activeTab === 'disaster' && (
          <FloodDisasterCenter
            location={location}
            onRequestLocation={handleRequestLocation}
            isSirenActive={isSirenActive}
            onToggleSiren={handleToggleSiren}
            onTriggerSOS={() => setActiveTab('sos')}
          />
        )}

        {activeTab === 'green' && (
          <GreenBharatHub
            user={user}
            activityLogs={activityLogs}
            onLogActivity={handleLogActivity}
          />
        )}

        {activeTab === 'iks' && (
          <IKSArchive
            onAwardBonusPoints={handleAwardBonusPoints}
          />
        )}
      </main>

      {/* Profile Modal */}
      {isProfileOpen && (
        <UserProfileModal
          user={user}
          onUpdateUser={setUser}
          onClose={() => setIsProfileOpen(false)}
        />
      )}

      {/* Floating High-Visibility 'SOS' Action Panel */}
      <FloatingSOSActionPanel
        user={user}
        location={location}
        onRequestLocation={handleRequestLocation}
        onTriggerSOSModal={() => setActiveTab('sos')}
      />

      {/* Voice-Activated 'Help' Command Listener Floating Capsule */}
      <VoiceSOSBanner onTriggerSOS={handleVoiceTrigger} />

      {/* Voice-Activated SOS Emergency Overlay Modal */}
      <VoiceSOSTriggerModal
        event={activeVoiceEvent}
        user={user}
        location={location}
        onRequestLocation={handleRequestLocation}
        onClose={() => setActiveVoiceEvent(null)}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 py-2.5 px-4 rounded-2xl bg-slate-900/95 border border-emerald-500/60 text-white text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md pt-10 pb-28 sm:pb-24 lg:pb-12 px-4 text-center">
        <div className="max-w-5xl mx-auto space-y-5">
          {/* Logo & Slogan */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <SafeBharatLogo size={28} showText={true} />
            <div className="hidden sm:block w-px h-6 bg-slate-800" />
            <span className="text-xs text-slate-400 font-medium">
              National Safety, Civil Defense &amp; Climate Resilience Network
            </span>
          </div>

          {/* Quick Helplines Row */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <a 
              href="tel:112"
              className="px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 font-mono font-bold flex items-center gap-1.5 transition-colors"
            >
              <Phone className="w-3 h-3 text-red-400" />
              <span>112 All-India Emergency</span>
            </a>
            <a 
              href="tel:108"
              className="px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 font-mono font-bold flex items-center gap-1.5 transition-colors"
            >
              <Phone className="w-3 h-3 text-emerald-400" />
              <span>108 Ambulance</span>
            </a>
            <a 
              href="tel:181"
              className="px-2.5 py-1 rounded-lg bg-pink-950/40 hover:bg-pink-900/50 border border-pink-500/30 text-pink-300 font-mono font-bold flex items-center gap-1.5 transition-colors"
            >
              <Phone className="w-3 h-3 text-pink-400" />
              <span>181 Women Helpline</span>
            </a>
            <a 
              href="tel:1070"
              className="px-2.5 py-1 rounded-lg bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/30 text-blue-300 font-mono font-bold flex items-center gap-1.5 transition-colors"
            >
              <Phone className="w-3 h-3 text-blue-400" />
              <span>1070 Disaster Control</span>
            </a>
          </div>

          {/* Made with love by Ashwin kumar manglam */}
          <div className="pt-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 shadow-inner text-xs text-slate-300 hover:border-red-500/40 transition-colors">
              <span>Made with</span>
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
              <span>by</span>
              <span className="font-semibold text-white tracking-wide">Ashwin kumar manglam</span>
            </div>
          </div>

          {/* Privacy & Sovereignty Disclaimer */}
          <div className="text-[11px] text-slate-500 space-y-1">
            <p>
              Safety Today, Sustainability Tomorrow · Civic Emergency &amp; Environmental Resilience
            </p>
            <p className="text-[10px] text-slate-600">
              Zero Server-Tracking Architecture · All Data Stored Locally on Device · Dial 112 for Real Physical Dispatch
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
