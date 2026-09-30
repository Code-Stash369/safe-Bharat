import React, { useState, useEffect, useRef } from 'react';
import { 
  WifiOff, 
  Wifi, 
  MapPin, 
  Compass, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Copy, 
  Check, 
  AlertTriangle, 
  ShieldAlert, 
  Radio, 
  HelpCircle, 
  ExternalLink, 
  X, 
  ChevronRight, 
  Phone, 
  Flame, 
  Heart, 
  Building2, 
  Navigation,
  Eye,
  Sun,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { LocationInfo, NearbyEmergencyService } from '../types';
import { offlineMonitorService, OfflineConnectivityState } from '../services/offlineMonitorService';
import { audioService } from '../services/audioService';
import { flashlightMorseService } from '../services/flashlightMorseService';
import { hapticService } from '../services/hapticService';

interface OfflineConnectivityMonitorProps {
  location: LocationInfo | null;
  isOpenModal: boolean;
  onCloseModal: () => void;
  onOpenModal: () => void;
  isSirenActive: boolean;
  onToggleSiren: () => void;
}

export const OfflineConnectivityMonitor: React.FC<OfflineConnectivityMonitorProps> = ({
  location,
  isOpenModal,
  onCloseModal,
  onOpenModal,
  isSirenActive,
  onToggleSiren,
}) => {
  const [offlineState, setOfflineState] = useState<OfflineConnectivityState>(offlineMonitorService.getState());
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'acoustic' | 'optical' | 'ground' | 'rules'>('map');
  const [isThreeBlastActive, setIsThreeBlastActive] = useState(false);
  const [currentBlastNum, setCurrentBlastNum] = useState<number>(0);
  const [isMorseStrobeActive, setIsMorseStrobeActive] = useState(false);
  const [isFlashScreenOn, setIsFlashScreenOn] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Subscribe to connectivity state changes
  useEffect(() => {
    const unsubscribe = offlineMonitorService.subscribe((state) => {
      setOfflineState(state);
      if (!state.isOnline) {
        setBannerDismissed(false); // Re-show banner if connection drops
      }
    });
    return () => unsubscribe();
  }, []);

  // Update offlineMonitorService with new GPS coords when available
  useEffect(() => {
    if (location) {
      offlineMonitorService.updateLastKnownLocation(location);
    }
  }, [location]);

  // Handle Flashlight Morse sync
  useEffect(() => {
    flashlightMorseService.onStateChange((active, isFlashOn) => {
      setIsMorseStrobeActive(active);
      setIsFlashScreenOn(isFlashOn);
    });
  }, []);

  const handleCopyCoords = () => {
    const cached = offlineState.cachedLocation?.location || location;
    if (!cached) return;
    const text = `${cached.lat.toFixed(5)}, ${cached.lng.toFixed(5)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      hapticService.triggerActionConfirmed();
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 3000);
    }
  };

  const handleToggleThreeBlast = () => {
    if (isThreeBlastActive) {
      audioService.stopThreeBlastDistress();
      hapticService.cancel();
      setIsThreeBlastActive(false);
      setCurrentBlastNum(0);
    } else {
      hapticService.triggerActionConfirmed();
      audioService.playThreeBlastDistress((blastNum, isActive) => {
        setCurrentBlastNum(isActive ? blastNum : 0);
      });
      setIsThreeBlastActive(true);
    }
  };

  const handleToggleMorseStrobe = () => {
    if (isMorseStrobeActive) {
      flashlightMorseService.stopMorse();
      hapticService.cancel();
    } else {
      hapticService.triggerMorseSOS();
      flashlightMorseService.startMorseSOS();
    }
  };

  const handleSendOfflineSMS = () => {
    hapticService.triggerActionConfirmed();
    const cached = offlineState.cachedLocation?.location || location;
    const coords = cached ? `${cached.lat.toFixed(5)},${cached.lng.toFixed(5)}` : '28.6139,77.2090';
    const text = encodeURIComponent(
      `[EMERGENCY SOS - NO INTERNET SIGNAL] I am in a no-signal area and need help. My last known GPS coordinates: ${coords} (https://maps.google.com/?q=${coords}). Please dispatch assistance.`
    );
    window.location.href = `sms:?body=${text}`;
  };

  const cachedLoc = offlineState.cachedLocation?.location || location || {
    lat: 28.6139,
    lng: 77.2090,
    accuracy: 35,
    timestamp: Date.now(),
    address: 'Connaught Place, New Delhi',
  };

  const cachedTimeStr = offlineState.cachedLocation?.cachedAt
    ? new Date(offlineState.cachedLocation.cachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Recently';

  const isOffline = !offlineState.isOnline;

  return (
    <>
      {/* Fullscreen Tactical Strobe Overlay when optical strobe is active */}
      {isFlashScreenOn && (
        <div 
          onClick={handleToggleMorseStrobe}
          className="fixed inset-0 z-[100] bg-white transition-opacity duration-75 cursor-pointer flex flex-col items-center justify-center p-6 text-black select-none"
        >
          <div className="text-center font-display font-black text-2xl tracking-widest uppercase animate-pulse">
            🚨 MORSE SOS STROBE ACTIVE 🚨
          </div>
          <p className="text-sm font-mono mt-2 font-bold">Tap screen anywhere to stop optical flash</p>
        </div>
      )}

      {/* Top Persistent No-Signal Warning Banner (Appears when user enters a dead zone) */}
      {isOffline && !bannerDismissed && (
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-amber-950/90 border-b-2 border-red-500/80 px-3 sm:px-4 py-2 text-white shadow-xl animate-in slide-in-from-top duration-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center shrink-0 animate-pulse">
                <WifiOff className="w-4 h-4 text-red-400" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-display font-black text-red-300 tracking-tight flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    <span>NO CELLULAR / INTERNET SIGNAL DETECTED</span>
                  </span>
                  {offlineState.isSimulatedOffline && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      SIMULATION TEST
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-slate-300 truncate">
                  Offline Survival Mode active · Last Known GPS cached at {cachedTimeStr} ({cachedLoc.lat.toFixed(4)}, {cachedLoc.lng.toFixed(4)})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={onOpenModal}
                className="py-1 px-2.5 sm:px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-600/30 cursor-pointer active:scale-95"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Open Offline Hub &amp; Map</span>
              </button>

              <button
                onClick={() => setBannerDismissed(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                title="Dismiss Banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Offline Survival & Cached Map Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
            
            {/* Header */}
            <div className={`p-3.5 sm:p-4 border-b flex items-center justify-between transition-colors shrink-0 ${
              isOffline 
                ? 'bg-gradient-to-r from-red-950/95 via-slate-900 to-amber-950/90 border-red-500/50' 
                : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg shadow shrink-0 ${
                  isOffline 
                    ? 'bg-red-600 text-white animate-pulse' 
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  {isOffline ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-black text-sm sm:text-base text-white tracking-tight truncate">
                      Offline Connectivity Monitor
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border shrink-0 ${
                      isOffline 
                        ? 'bg-red-600/30 text-red-300 border-red-500/50' 
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {isOffline ? 'NO SIGNAL (OFFLINE)' : 'ONLINE (SIGNAL LOCKED)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {isOffline 
                      ? `Disconnected ${offlineMonitorService.getOfflineDurationFormatted()} ago · Manual signaling & cached map operational` 
                      : 'Live network active · Continuous background caching of GPS & emergency shelters'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Simulator Toggle */}
                <button
                  onClick={() => offlineMonitorService.toggleSimulatedOffline()}
                  className={`py-1.5 px-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    offlineState.isSimulatedOffline
                      ? 'bg-amber-600 text-white border-amber-400 shadow'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                  title="Test how Safe Bharat behaves in a zero-signal dead zone"
                >
                  {offlineState.isSimulatedOffline ? 'Exit Test' : '🧪 Test Offline Mode'}
                </button>

                <button
                  onClick={onCloseModal}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="p-2 bg-slate-950/80 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <button
                onClick={() => setActiveTab('map')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'map'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Last Known Location Map</span>
              </button>

              <button
                onClick={() => setActiveTab('acoustic')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'acoustic'
                    ? 'bg-red-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Acoustic Sirens (Sound)</span>
              </button>

              <button
                onClick={() => setActiveTab('optical')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'optical'
                    ? 'bg-amber-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Optical Flashes (Light)</span>
              </button>

              <button
                onClick={() => setActiveTab('ground')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'ground'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Ground-to-Air Markers</span>
              </button>

              <button
                onClick={() => setActiveTab('rules')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'rules'
                    ? 'bg-teal-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>Zero-Signal 112 Rules</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 space-y-4">
              
              {/* TAB 1: LAST KNOWN LOCATION CACHED MAP */}
              {activeTab === 'map' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  
                  {/* Coordinates & Status Ribbon */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono uppercase font-bold">Cached GPS Anchor:</span>
                        <span className="font-mono text-sm font-black text-white">
                          {cachedLoc.lat.toFixed(5)}°N, {cachedLoc.lng.toFixed(5)}°E
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                          ±{Math.round(cachedLoc.accuracy || 25)}m Accuracy
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        📍 {offlineState.cachedLocation?.formattedAddress || cachedLoc.address || 'Central Civic Zone, India'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopyCoords}
                        className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer active:scale-95"
                      >
                        {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCoords ? 'Copied!' : 'Copy Coords'}</span>
                      </button>

                      <button
                        onClick={handleSendOfflineSMS}
                        className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
                        title="SMS transmits via 2G network even when internet data fails"
                      >
                        <span>✉️ Draft Offline SMS</span>
                      </button>
                    </div>
                  </div>

                  {/* High-Contrast Tactical Offline SVG Radar Map */}
                  <div className="relative h-64 sm:h-72 w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner">
                    {/* Grid Overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-60 pointer-events-none" />

                    {/* Concentric Distance Rings */}
                    <div className="absolute w-24 h-24 rounded-full border border-emerald-500/20 pointer-events-none" />
                    <div className="absolute w-44 h-44 rounded-full border border-emerald-500/15 pointer-events-none" />
                    <div className="absolute w-64 h-64 rounded-full border border-emerald-500/10 pointer-events-none" />

                    {/* Compass Axis Lines */}
                    <div className="absolute w-full h-[1px] bg-slate-800/80 pointer-events-none" />
                    <div className="absolute h-full w-[1px] bg-slate-800/80 pointer-events-none" />

                    {/* Cardinal Direction Badges */}
                    <span className="absolute top-2 font-mono text-[10px] font-bold text-slate-500">NORTH (0°)</span>
                    <span className="absolute bottom-2 font-mono text-[10px] font-bold text-slate-500">SOUTH (180°)</span>
                    <span className="absolute left-2 font-mono text-[10px] font-bold text-slate-500">WEST (270°)</span>
                    <span className="absolute right-2 font-mono text-[10px] font-bold text-slate-500">EAST (90°)</span>

                    {/* Center Pinned User Position */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="relative">
                        <span className="w-10 h-10 rounded-full bg-emerald-500/20 animate-ping absolute -top-1 -left-1 pointer-events-none" />
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 border-2 border-white shadow-xl flex items-center justify-center text-white font-bold text-xs">
                          <MapPin className="w-4 h-4 fill-white" />
                        </div>
                      </div>
                      <div className="mt-1 px-2 py-0.5 rounded bg-slate-900/90 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 font-bold shadow">
                        YOU ARE HERE (CACHED)
                      </div>
                    </div>

                    {/* Pre-cached Nearby Shelters Plotted around User */}
                    {offlineState.nearestShelters.slice(0, 4).map((item, idx) => {
                      // Calculate polar coordinates for visual map positioning
                      const angleRad = ((item.bearingDeg - 90) * Math.PI) / 180;
                      const radiusPx = Math.min(110, Math.max(45, item.distanceKm * 28));
                      const x = Math.cos(angleRad) * radiusPx;
                      const y = Math.sin(angleRad) * radiusPx;

                      const isPolice = item.service.type === 'police';
                      const isHospital = item.service.type === 'hospital';
                      const isFire = item.service.type === 'fire';

                      return (
                        <div
                          key={idx}
                          style={{
                            transform: `translate(${x}px, ${y}px)`,
                          }}
                          className="absolute z-20 flex flex-col items-center group cursor-pointer"
                          title={`${item.service.name} (${item.distanceKm.toFixed(1)} km ${item.compassHeading})`}
                        >
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs shadow-lg border ${
                            isPolice 
                              ? 'bg-indigo-600 border-indigo-400' 
                              : isHospital 
                                ? 'bg-rose-600 border-rose-400' 
                                : isFire 
                                  ? 'bg-amber-600 border-amber-400' 
                                  : 'bg-emerald-600 border-emerald-400'
                          }`}>
                            {isPolice ? '👮' : isHospital ? '🏥' : isFire ? '🚒' : '🏛️'}
                          </div>
                          <span className="mt-0.5 px-1.5 py-0.2 rounded bg-slate-900/90 text-[9px] font-mono text-slate-300 font-bold border border-slate-700 whitespace-nowrap shadow">
                            {item.distanceKm.toFixed(1)}km {item.compassHeading}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cached Nearby Havens Table */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center justify-between">
                      <span>Pre-Cached Safe Havens within Walking Reach:</span>
                      <span className="text-[10px] text-slate-500 font-normal">Stored locally in device memory</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {offlineState.nearestShelters.slice(0, 4).map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-2.5 hover:border-slate-700 transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-white truncate">{item.service.name}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">{item.service.address}</p>
                            <div className="mt-1 flex items-center gap-2 text-[10px] font-mono">
                              <span className="text-emerald-400 font-bold">
                                ~{item.distanceKm.toFixed(2)} km
                              </span>
                              <span className="text-slate-500">•</span>
                              <span className="text-cyan-400 font-bold">
                                Bearing {item.bearingDeg.toFixed(0)}° ({item.compassHeading})
                              </span>
                            </div>
                          </div>

                          <a
                            href={`tel:${item.service.phone}`}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1 shrink-0 transition-colors"
                            title={`Call ${item.service.name}`}
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: ACOUSTIC MANUAL SIGNALING (SIREN & 3-BLAST DISTRESS) */}
              {activeTab === 'acoustic' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/30 text-xs text-red-200 space-y-1">
                    <strong className="text-white flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-red-400" />
                      <span>Why Sound Works When Signal Fails:</span>
                    </strong>
                    <p>
                      Human ears, trained search dogs, and audio detectors can hear acoustic distress beacons over 1.5 to 3 kilometers in still air, dense forests, or collapsed structures where cell phone radio signals are blocked.
                    </p>
                  </div>

                  {/* Controller 1: International 3-Blast Distress Signal */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-black text-sm text-white">
                            International 3-Blast Rescue Signal
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-red-600/30 text-red-300 border border-red-500/40">
                            ALPINE &amp; MARITIME STANDARD
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          Emits 3 loud piercing whistle blasts (3 seconds each) with 1s gap, repeated every minute. Internationally recognized by search and rescue patrols as a distress call.
                        </p>
                      </div>

                      <button
                        onClick={handleToggleThreeBlast}
                        className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer shrink-0 ${
                          isThreeBlastActive
                            ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                            : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                        }`}
                      >
                        {isThreeBlastActive ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        <span>{isThreeBlastActive ? 'Stop 3-Blast' : 'Start 3-Blast Drill'}</span>
                      </button>
                    </div>

                    {isThreeBlastActive && (
                      <div className="p-3 rounded-xl bg-slate-900 border border-red-500/40 flex items-center justify-between">
                        <span className="font-mono text-xs text-red-300 font-bold flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                          <span>
                            {currentBlastNum > 0 
                              ? `PLAYING BLAST ${currentBlastNum} OF 3 (880 Hz High-Pitch)` 
                              : 'PAUSE INTERVAL (LISTENING FOR ECHO)...'}
                          </span>
                        </span>
                        <div className="flex items-center gap-1 font-mono text-xs">
                          <span className={`px-2 py-0.5 rounded ${currentBlastNum === 1 ? 'bg-red-600 text-white font-bold' : 'bg-slate-800 text-slate-400'}`}>1</span>
                          <span className={`px-2 py-0.5 rounded ${currentBlastNum === 2 ? 'bg-red-600 text-white font-bold' : 'bg-slate-800 text-slate-400'}`}>2</span>
                          <span className={`px-2 py-0.5 rounded ${currentBlastNum === 3 ? 'bg-red-600 text-white font-bold' : 'bg-slate-800 text-slate-400'}`}>3</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Controller 2: Continuous Emergency Siren Sweep */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-display font-black text-sm text-white">
                          Continuous Acoustic Siren Alarm
                        </h4>
                        <p className="text-xs text-slate-300 mt-1">
                          Loud oscillating high-low siren (540Hz to 920Hz) running directly through the Web Audio synthesizer without internet access.
                        </p>
                      </div>

                      <button
                        onClick={onToggleSiren}
                        className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer shrink-0 ${
                          isSirenActive
                            ? 'bg-amber-600 hover:bg-amber-500 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                      >
                        {isSirenActive ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        <span>{isSirenActive ? 'Stop Siren' : 'Sound Continuous Siren'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Manual Whistle Instructions */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
                    <h5 className="font-bold text-white flex items-center gap-1.5">
                      <span>🪈 Physical Whistle Protocol (If Battery Runs Out):</span>
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      <li><strong>Three sharp blasts</strong> on any sports or survival whistle means "HELP / DISTRESS".</li>
                      <li>Pause for 10 seconds to listen for an answer.</li>
                      <li><strong>Two blasts</strong> is the international response meaning "We hear you, coming toward you".</li>
                    </ul>
                  </div>

                </div>
              )}

              {/* TAB 3: OPTICAL MANUAL SIGNALING (LIGHT FLASHES) */}
              {activeTab === 'optical' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200">
                    <strong>Optical Signaling Range:</strong> A focused flashlight beam or screen strobe is visible for up to 5 to 10 kilometers at night from search helicopters, highway patrols, or across valleys.
                  </div>

                  {/* Controller: Morse SOS Torch & Screen Strobe */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-black text-sm text-white">
                            SOS Optical Morse Strobe (· · · — — — · · ·)
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-600/30 text-amber-300 border border-amber-500/40">
                            TORCH + SCREEN
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          Triggers your phone's rear camera LED flashlight in the universal Morse SOS pattern (3 short flashes, 3 long flashes, 3 short flashes) synchronized with full-screen optical bursts.
                        </p>
                      </div>

                      <button
                        onClick={handleToggleMorseStrobe}
                        className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer shrink-0 ${
                          isMorseStrobeActive
                            ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                            : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>{isMorseStrobeActive ? 'Stop Optical Strobe' : 'Start Morse Strobe'}</span>
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono space-y-1">
                      <div className="text-slate-300 font-bold">Standard International Timing:</div>
                      <div>• S (Short): 3 bursts of 0.2s duration</div>
                      <div>• O (Long): 3 bursts of 0.6s duration</div>
                      <div>• S (Short): 3 bursts of 0.2s duration</div>
                      <div className="text-amber-400 text-[11px]">• Works even without internet or cellular connectivity!</div>
                    </div>
                  </div>

                  {/* Daylight Mirror & Sun Glint Guidance */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                    <h4 className="font-display font-black text-sm text-white flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Sun Glint / Mirror Signaling (Daytime Rescue)</span>
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      If you see a search plane or patrol during daylight, you can use your phone's glass screen, a watch crystal, or a compact mirror to aim sunlight flashes directly at the cockpit:
                    </p>
                    <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1.5 pl-1">
                      <li>Hold your index and middle finger in a <strong>"V" shape</strong> outstretched toward the aircraft.</li>
                      <li>Hold the phone or mirror near your eye with the other hand.</li>
                      <li>Tilt the reflective glass until the bright sunspot aligns right inside the "V" notch on the target.</li>
                      <li>Flash repeatedly across the target. Pilots can see sun flashes from over 30 kilometers away!</li>
                    </ol>
                  </div>

                </div>
              )}

              {/* TAB 4: GROUND-TO-AIR VISUAL MARKERS */}
              {activeTab === 'ground' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200">
                    <strong>ICAO Ground-to-Air Signals:</strong> Use rocks, branches, colored clothing, or trampled earth to lay out large letters on open ground. Make lines at least 3 meters long and 0.5 meters wide so aerial search crews spot them from altitude.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 font-display font-black text-2xl flex items-center justify-center">
                        V
                      </div>
                      <h5 className="font-bold text-white text-xs">REQUIRE ASSISTANCE</h5>
                      <p className="text-[11px] text-slate-400">General distress. Form a large V shape on ground pointing toward clear sky.</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-300 font-display font-black text-2xl flex items-center justify-center">
                        X
                      </div>
                      <h5 className="font-bold text-white text-xs">REQUIRE MEDICAL ASSISTANCE</h5>
                      <p className="text-[11px] text-slate-400">Severe injury, trauma, or medical emergency. Informs helicopter medics to prepare triage.</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-600/20 border border-amber-500/40 text-amber-300 font-display font-black text-2xl flex items-center justify-center">
                        →
                      </div>
                      <h5 className="font-bold text-white text-xs">PROCEEDING THIS WAY</h5>
                      <p className="text-[11px] text-slate-400">Arrow pointing in direction of your travel if evacuating an unsafe spot.</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
                    <h5 className="font-bold text-white">Three Fires in a Triangle (Night):</h5>
                    <p className="text-slate-400 leading-relaxed">
                      Lighting three small signal fires arranged in an equilateral triangle (about 25 meters apart) is the universal international signal of distress. At night, fire glow is unmistakable; during daytime, add damp leaves or green brush to generate thick white smoke.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 5: ZERO-SIGNAL EMERGENCY CALLING & SMS RULES */}
              {activeTab === 'rules' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs text-slate-300">
                    <h4 className="font-display font-black text-sm text-white flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-emerald-400" />
                      <span>112 Emergency Calls Work Even with Zero Network Bars</span>
                    </h4>
                    <p className="leading-relaxed text-slate-300">
                      Under Indian Telecom regulations (DOT / TRAI ERSS 112 mandate), emergency calls are granted <strong>Universal Roaming Priority</strong>:
                    </p>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-1">
                      <li>If your primary carrier (e.g. Jio / Airtel / Vi / BSNL) shows "No Service", your phone will automatically latch onto <em>any other network tower</em> in radio range to complete a 112 call.</li>
                      <li>You can dial 112 even with <strong>NO SIM CARD</strong> in the device.</li>
                      <li>Emergency calls bypass carrier account balances and locked phone keypads.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
                    <h4 className="font-display font-black text-sm text-white flex items-center gap-2">
                      <span>✉️ Offline SMS Micro-Packets:</span>
                    </h4>
                    <p className="leading-relaxed text-slate-400">
                      Cellular SMS data packets (160 characters) use bare-bones 2G control channels. Even when 4G/5G data is dead or showing zero speed, queued SMS messages frequently slip through during brief 1-second cellular handshakes as you walk or change altitude. Keep trying SMS dispatch!
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="truncate">SAFE BHARAT Offline Monitor · Fully functional without internet</span>
              <button
                onClick={onCloseModal}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer transition-colors"
              >
                Close Hub
              </button>
            </div>

          </div>
        </div>
      )}

    </>
  );
};
