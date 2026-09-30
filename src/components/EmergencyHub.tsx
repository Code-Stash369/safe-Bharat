import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldAlert, 
  Phone, 
  MapPin, 
  Share2, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  ExternalLink,
  Flame,
  Siren,
  Hospital,
  AlertTriangle,
  Send,
  Navigation,
  Mic,
  MicOff,
  Radio,
  Sparkles,
  MessageSquare,
  Users
} from 'lucide-react';
import { LocationInfo, NearbyEmergencyService, UserProfile, EmergencyContact } from '../types';
import { NATIONAL_HELPLINES, NEARBY_SERVICES_SAMPLE } from '../data/initialData';
import { audioService } from '../services/audioService';
import { openExternalLink } from '../services/linkService';
import { voiceSOSService, VoiceListenerState, VoiceSOSEvent } from '../services/voiceSOSService';
import { smsDispatchService } from '../services/smsDispatchService';
import { hapticService } from '../services/hapticService';

interface EmergencyHubProps {
  user: UserProfile;
  location: LocationInfo | null;
  onRequestLocation: () => Promise<LocationInfo | null>;
  isSirenActive: boolean;
  onToggleSiren: () => void;
}

export const EmergencyHub: React.FC<EmergencyHubProps> = ({
  user,
  location,
  onRequestLocation,
  isSirenActive,
  onToggleSiren,
}) => {
  const [holding, setHolding] = useState<boolean>(false);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [sosTriggered, setSosTriggered] = useState<boolean>(false);
  const [triggeredByVoice, setTriggeredByVoice] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [locLoading, setLocLoading] = useState<boolean>(false);
  const [searchCategory, setSearchCategory] = useState<string>('all');
  const timerRef = useRef<any>(null);

  // Voice SOS Listener state inside EmergencyHub
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(voiceSOSService.getIsEnabled());
  const [voiceState, setVoiceState] = useState<VoiceListenerState>(voiceSOSService.getState());
  const [voiceLevel, setVoiceLevel] = useState<number>(0);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');

  useEffect(() => {
    const unsubState = voiceSOSService.onStateChange((st) => setVoiceState(st));
    const unsubLevel = voiceSOSService.onAudioLevel((lvl) => setVoiceLevel(lvl));
    const unsubTrans = voiceSOSService.onTranscript((txt) => setVoiceTranscript(txt));
    const unsubTrigger = voiceSOSService.onTrigger((evt) => {
      setTriggeredByVoice(evt.keyword);
      triggerEmergencySOS(evt.keyword);
    });

    return () => {
      unsubState();
      unsubLevel();
      unsubTrans();
      unsubTrigger();
    };
  }, []);

  const handleToggleVoiceSOS = async () => {
    if (voiceState === 'listening') {
      voiceSOSService.stopListening();
      setVoiceEnabled(false);
    } else {
      const success = await voiceSOSService.startListening();
      setVoiceEnabled(success);
    }
  };

  const handleSimulateVoice = (kw: string) => {
    voiceSOSService.simulateKeyword(kw);
  };

  const lastVibratedMilestoneRef = useRef<number>(0);

  const startHold = () => {
    setHolding(true);
    lastVibratedMilestoneRef.current = 0;
    hapticService.triggerTap();
    const start = Date.now();
    const duration = 2500; // 2.5 seconds hold

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setHoldProgress(progress);

      // Tactile confirmation milestones as user holds the SOS button
      if (progress >= 75 && lastVibratedMilestoneRef.current < 75) {
        lastVibratedMilestoneRef.current = 75;
        hapticService.vibrate([70, 40, 70]);
      } else if (progress >= 50 && lastVibratedMilestoneRef.current < 50) {
        lastVibratedMilestoneRef.current = 50;
        hapticService.vibrate(60);
      } else if (progress >= 25 && lastVibratedMilestoneRef.current < 25) {
        lastVibratedMilestoneRef.current = 25;
        hapticService.vibrate(40);
      }

      if (progress >= 100) {
        clearInterval(timerRef.current);
        triggerEmergencySOS();
      }
    }, 40);
  };

  const cancelHold = () => {
    setHolding(false);
    setHoldProgress(0);
    hapticService.cancel();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const triggerEmergencySOS = async (voiceKeyword?: string) => {
    setHolding(false);
    setHoldProgress(0);
    setSosTriggered(true);
    if (voiceKeyword) {
      setTriggeredByVoice(voiceKeyword);
    }
    audioService.playSiren();
    hapticService.triggerSOS();

    if (!location) {
      setLocLoading(true);
      await onRequestLocation();
      setLocLoading(false);
    }
  };

  const stopEmergencySOS = () => {
    setSosTriggered(false);
    setTriggeredByVoice(null);
    audioService.stopSiren();
    hapticService.cancel();
  };

  const handleFetchLocation = async () => {
    setLocLoading(true);
    await onRequestLocation();
    setLocLoading(false);
  };

  const generateEmergencyText = (targetContact?: EmergencyContact) => {
    return smsDispatchService.generateDistressMessage(
      user,
      location,
      triggeredByVoice ? `Voice SOS Keyword: "${triggeredByVoice}"` : 'Manual Emergency SOS Beacon Triggered',
      targetContact
    ).text;
  };

  const handleCopyText = async (targetContact?: EmergencyContact) => {
    const success = await smsDispatchService.copyDistressText(
      user,
      location,
      triggeredByVoice ? `Voice SOS Keyword: "${triggeredByVoice}"` : 'Manual Emergency SOS Beacon Triggered',
      targetContact
    );
    if (success) {
      hapticService.triggerActionConfirmed();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsAppBroadcast = () => {
    hapticService.triggerActionConfirmed();
    const text = encodeURIComponent(generateEmergencyText());
    openExternalLink(`https://wa.me/?text=${text}`);
  };

  const handleSMSBroadcast = (targetContact?: EmergencyContact) => {
    hapticService.triggerActionConfirmed();
    smsDispatchService.dispatchViaNativeSMS(
      user,
      location,
      triggeredByVoice ? `Voice SOS Keyword: "${triggeredByVoice}"` : 'Manual Emergency SOS Beacon Triggered',
      targetContact
    );
  };

  const handleWebShareBroadcast = async () => {
    hapticService.triggerActionConfirmed();
    await smsDispatchService.dispatchViaWebShare(
      user,
      location,
      triggeredByVoice ? `Voice SOS Keyword: "${triggeredByVoice}"` : 'Manual Emergency SOS Beacon Triggered'
    );
  };

  const filteredHelplines = searchCategory === 'all'
    ? NATIONAL_HELPLINES
    : NATIONAL_HELPLINES.filter(h => h.category.toLowerCase().includes(searchCategory.toLowerCase()));

  const getCalculatedDistance = (service: NearbyEmergencyService) => {
    if (!location || !service.lat || !service.lng) {
      return service.distanceKm;
    }
    const R = 6371; // Earth radius in km
    const dLat = ((service.lat - location.lat) * Math.PI) / 180;
    const dLon = ((service.lng - location.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((location.lat * Math.PI) / 180) *
        Math.cos((service.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return Math.max(0.2, Math.round(dist * 10) / 10);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Fullscreen SOS Alert Overlay when triggered */}
      {sosTriggered && (
        <div className="fixed inset-0 z-50 bg-red-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-200">
          <div className="absolute inset-0 bg-red-600/20 animate-pulse pointer-events-none" />
          <div className="relative z-10 max-w-lg w-full space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-red-600 flex items-center justify-center text-white shadow-2xl shadow-red-500/50 animate-bounce">
              <ShieldAlert className="w-14 h-14" />
            </div>

            <div>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
                EMERGENCY SOS BROADCAST
              </h2>
              {triggeredByVoice ? (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/80 border border-red-400 text-white font-mono text-xs font-bold animate-pulse">
                  <Mic className="w-3.5 h-3.5" />
                  <span>VOICE TRIGGER DETECTED: &ldquo;{triggeredByVoice}&rdquo;</span>
                </div>
              ) : (
                <p className="text-red-200 text-sm mt-1">
                  Audio alarm active. Broadcast your exact location to 112 &amp; emergency contacts immediately.
                </p>
              )}
            </div>

            {/* Live Location Stamp in Overlay */}
            <div className="p-4 rounded-2xl bg-black/40 border border-red-500/40 text-left text-xs text-red-100 font-mono space-y-1">
              <div>STATUS: <span className="font-bold text-red-400">ALARM TRANSDUCER ACTIVE</span></div>
              {location ? (
                <>
                  <div>LAT/LNG: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</div>
                  <div>ACCURACY: ±{Math.round(location.accuracy)} meters</div>
                  <a 
                    href={`https://www.google.com/maps?q=${location.lat},${location.lng}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-amber-300 underline font-semibold flex items-center gap-1 mt-1"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              ) : (
                <div className="text-amber-300">Acquiring high-precision GPS lock...</div>
              )}
            </div>

            {/* Quick Emergency Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="tel:112"
                className="py-3 px-4 rounded-2xl bg-white text-red-700 hover:bg-slate-100 font-display font-black text-base sm:text-lg flex items-center justify-center gap-2 shadow-xl cursor-pointer"
              >
                <Phone className="w-5 h-5 text-red-600 fill-current" />
                <span>DIAL 112 NOW</span>
              </a>

              <button
                onClick={() => handleSMSBroadcast()}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-display font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-red-600/40 cursor-pointer"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Send SMS to Contacts ({user.contacts?.length || 0})</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleWhatsAppBroadcast}
                className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>WhatsApp SOS Broadcast</span>
              </button>

              {smsDispatchService.canShare() ? (
                <button
                  onClick={handleWebShareBroadcast}
                  className="py-3 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Native Web Share</span>
                </button>
              ) : (
                <button
                  onClick={() => handleCopyText()}
                  className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
                  <span>{copied ? 'Distress Copied!' : 'Copy Distress Details'}</span>
                </button>
              )}
            </div>

            {/* Pre-saved individual contact quick buttons */}
            {user.contacts && user.contacts.length > 0 && (
              <div className="p-3 rounded-2xl bg-black/40 border border-red-500/30 text-left space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-red-300 font-bold block">
                  1-Tap Instant SMS to Individual Saved Contact:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {user.contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleSMSBroadcast(contact)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-red-950 border border-slate-700 hover:border-red-400 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
                      <span>{contact.name}</span>
                      <span className="text-[10px] text-slate-400">({contact.phone})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={stopEmergencySOS}
              className="w-full py-3 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm cursor-pointer"
            >
              Cancel / Stop Emergency Alarm
            </button>
          </div>
        </div>
      )}

      {/* Main SOS Tactical Center */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 border border-red-900/40 rounded-3xl p-4 sm:p-8 shadow-2xl text-center space-y-5 sm:space-y-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold tracking-wider uppercase bg-red-950/80 text-red-300 border border-red-800/60">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            National Emergency Dispatch System
          </span>
          <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-white mt-2">
            One-Touch Emergency SOS
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto mt-1 leading-relaxed px-2">
            Press and hold the button for 2.5 seconds to trigger an instant siren, acquire your live GPS coordinate, and broadcast help alerts.
          </p>
        </div>

        {/* Big Giant Red SOS Button */}
        <div className="relative flex flex-col items-center justify-center py-2 sm:py-4">
          <div className="relative">
            {/* SVG Progress Ring */}
            <svg className="w-56 h-56 xs:w-64 xs:h-64 sm:w-72 sm:h-72 -rotate-90">
              <circle
                cx="50%"
                cy="50%"
                r="44%"
                className="stroke-red-950/40"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="50%"
                cy="50%"
                r="44%"
                className="stroke-red-500 transition-all duration-75"
                strokeWidth="12"
                strokeDasharray="1000"
                strokeDashoffset={1000 - (1000 * holdProgress) / 100}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            {/* Tactile Button */}
            <button
              onMouseDown={startHold}
              onMouseUp={cancelHold}
              onMouseLeave={cancelHold}
              onTouchStart={startHold}
              onTouchEnd={cancelHold}
              onClick={() => {
                // If clicked without long hold, trigger instant demo
                if (!holding && holdProgress === 0) triggerEmergencySOS();
              }}
              className="absolute inset-3 sm:inset-5 rounded-full bg-gradient-to-tr from-red-700 via-red-600 to-red-500 text-white flex flex-col items-center justify-center shadow-2xl emergency-pulse-btn cursor-pointer active:scale-95 transition-transform select-none"
              aria-label="Emergency SOS Trigger"
            >
              <ShieldAlert className="w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 text-white mb-0.5 sm:mb-1 drop-shadow-md" />
              <span className="font-display font-black text-2xl xs:text-3xl sm:text-4xl tracking-tight text-white drop-shadow-md">
                SOS
              </span>
              <span className="text-[10px] xs:text-[11px] sm:text-xs font-black tracking-widest text-red-100 uppercase opacity-90 mt-0.5">
                {holding ? 'HOLD TO FIRE...' : 'PRESS OR HOLD'}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-400 mt-4 font-medium">
            {holding ? (
              <span className="text-red-400 font-bold animate-pulse">
                Holding... {Math.round(holdProgress)}%
              </span>
            ) : (
              <span>Touch and hold for 2.5s, or tap to trigger immediately</span>
            )}
          </div>
        </div>

        {/* Live Location & Direct Broadcast Card */}
        <div className="max-w-2xl mx-auto rounded-2xl bg-slate-950/80 border border-slate-800 p-4 sm:p-5 text-left space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-white block">Current GPS Coordinates</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {location 
                    ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)} (Accuracy: ±${Math.round(location.accuracy)}m)`
                    : 'No coordinate locked yet'}
                </span>
              </div>
            </div>

            <button
              onClick={handleFetchLocation}
              disabled={locLoading}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
            >
              <Navigation className={`w-3.5 h-3.5 ${locLoading ? 'animate-spin' : ''}`} />
              <span>{locLoading ? 'Acquiring...' : 'Refresh GPS'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
            <button
              onClick={() => handleSMSBroadcast()}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-900/40 cursor-pointer transition-all active:scale-95"
              title="Open native SMS pre-populated with all saved emergency contacts"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>SMS All ({user.contacts?.length || 0})</span>
            </button>

            {smsDispatchService.canShare() && (
              <button
                onClick={handleWebShareBroadcast}
                className="py-2.5 px-3 rounded-xl bg-sky-950/70 hover:bg-sky-900/70 border border-sky-700/50 text-sky-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-95"
                title="Share alert via native OS Share Sheet"
              >
                <Share2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Web Share</span>
              </button>
            )}

            <button
              onClick={handleWhatsAppBroadcast}
              className="py-2.5 px-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/50 text-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-95"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={() => handleCopyText()}
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied!' : 'Copy SOS Text'}</span>
            </button>
          </div>

          {/* Quick Individual Contact SMS Chips */}
          {user.contacts && user.contacts.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                1-Tap SMS Alert to Saved Emergency Contact:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {user.contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleSMSBroadcast(contact)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/50 text-slate-200 hover:text-rose-200 text-[11px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                    title={`Send direct emergency SMS alert to ${contact.name}`}
                  >
                    <MessageSquare className="w-3 h-3 text-rose-400" />
                    <span>{contact.name}</span>
                    <span className="text-[9px] font-mono text-slate-400">({contact.phone})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Voice-Activated 'Help' Command Center Card */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl flex items-center justify-center shrink-0 ${
              voiceEnabled && voiceState === 'listening'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {voiceEnabled ? <Mic className="w-5 h-5 animate-pulse" /> : <MicOff className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-lg text-white">
                  Voice-Activated SOS Command Listener
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  voiceEnabled && voiceState === 'listening'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {voiceEnabled && voiceState === 'listening' ? 'Listening Live' : 'Muted'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automatic SOS triggers when browser microphone hears keywords like &ldquo;Help&rdquo;, &ldquo;Emergency&rdquo;, or &ldquo;Bachao&rdquo;.
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleVoiceSOS}
            className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer self-start sm:self-auto flex items-center gap-2 ${
              voiceEnabled && voiceState === 'listening'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-md'
                : voiceState === 'permission_denied'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {voiceEnabled && voiceState === 'listening' ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            <span>
              {voiceEnabled && voiceState === 'listening' 
                ? 'Listener Active (Listening)' 
                : voiceState === 'permission_denied'
                  ? 'Fix Microphone Permission'
                  : 'Activate Voice SOS'}
            </span>
          </button>
        </div>

        {voiceState === 'permission_denied' && (
          <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-500/50 text-xs text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Microphone permission is blocked by your browser. Please allow microphone access in your browser address bar to use voice recognition.</span>
          </div>
        )}

        {/* Audio Sensitivity Meter & Live Speech Transcript */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Left: Live Audio Feed & Sensitivity */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Radio className={`w-3.5 h-3.5 ${voiceEnabled ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                <span>Microphone Audio Feed</span>
              </span>
              <span className="text-emerald-400 font-bold">Input Level: {voiceLevel}%</span>
            </div>

            {/* Visualizer Level Bar */}
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 transition-all duration-75"
                style={{ width: `${voiceLevel}%` }}
              />
            </div>

            {/* Live Transcript Stream */}
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs font-mono">
              <span className="text-[10px] text-slate-500 block">Live Speech Transcript:</span>
              <p className="text-slate-200 italic mt-0.5 truncate">
                {voiceTranscript ? `"${voiceTranscript}"` : 'Awaiting voice command (say "Help" or "Emergency")...'}
              </p>
            </div>
          </div>

          {/* Right: Recognized Emergency Keywords & Test Simulator */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-300 block mb-2">
                Active Trigger Keywords:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { kw: 'Help', pri: true },
                  { kw: 'Emergency', pri: true },
                  { kw: 'Help Me', pri: true },
                  { kw: 'Bachao (बचाओ)', pri: false },
                  { kw: 'Madad (मदद)', pri: false },
                  { kw: 'Police', pri: false }
                ].map(({ kw, pri }) => (
                  <span
                    key={kw}
                    className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border ${
                      pri 
                        ? 'bg-red-950/60 border-red-500/50 text-red-300' 
                        : 'bg-amber-950/40 border-amber-600/40 text-amber-300'
                    }`}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Test Voice Trigger:</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => handleSimulateVoice('HELP')}
                  className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-black cursor-pointer shadow-md transition-colors"
                >
                  Test &ldquo;Help&rdquo;
                </button>
                <button
                  onClick={() => handleSimulateVoice('BACHAO')}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-black cursor-pointer shadow-md transition-colors"
                >
                  Test &ldquo;Bachao&rdquo;
                </button>
                <button
                  onClick={() => handleSimulateVoice('EMERGENCY')}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs font-black cursor-pointer shadow-md transition-colors"
                >
                  Test &ldquo;Emergency&rdquo;
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Nearby Emergency Services Radar */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Siren className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="font-display font-bold text-lg text-white">
                Nearby Emergency Services Radar
              </h2>
              <p className="text-xs text-slate-400">
                Direct contacts and distances to verified police, medical, and fire rescue nodes.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {NEARBY_SERVICES_SAMPLE.map((service) => (
            <div 
              key={service.id}
              className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {service.type}
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-semibold">
                    ~{getCalculatedDistance(service)} km away
                  </span>
                </div>
                <h3 className="font-bold text-sm text-white">{service.name}</h3>
                <p className="text-xs text-slate-400">{service.address}</p>
              </div>

              <a
                href={`tel:${service.phone}`}
                className="py-2.5 px-3.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-200 font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer self-stretch sm:self-auto"
              >
                <Phone className="w-3.5 h-3.5 text-red-400" />
                <span>Call {service.phone}</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Verified National Emergency Helplines Directory */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-display font-bold text-lg text-white">
                Official Indian Emergency Helplines (24x7)
              </h2>
              <p className="text-xs text-slate-400">
                Direct toll-free telecommunication channels across all States and Union Territories.
              </p>
            </div>
          </div>

          {/* Filter Categories */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto scrollbar-none">
            {['all', 'Universal', 'Police', 'Medical', 'Women Safety', 'Cyber Crime'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSearchCategory(cat)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  searchCategory === cat
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredHelplines.map((item) => (
            <div
              key={item.num}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                item.isPrimary
                  ? 'bg-red-950/20 border-red-800/60 shadow-lg shadow-red-950/20'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xl font-black text-white">
                    {item.num}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-800 text-slate-300">
                    {item.category}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-white mt-1">{item.name}</h3>
                <div className="text-[11px] text-slate-400 font-medium">{item.hindiName}</div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{item.desc}</p>
              </div>

              <a
                href={`tel:${item.num}`}
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  item.isPrimary
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call {item.num}</span>
              </a>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
