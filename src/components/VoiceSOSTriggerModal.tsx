import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  Phone, 
  MapPin, 
  Send, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  AlertTriangle,
  X,
  Radio,
  ExternalLink,
  MessageSquare,
  Share2,
  Copy,
  Users,
  Check,
  Sparkles
} from 'lucide-react';
import { VoiceSOSEvent } from '../services/voiceSOSService';
import { LocationInfo, UserProfile, EmergencyContact } from '../types';
import { audioService } from '../services/audioService';
import { smsDispatchService, DispatchResult } from '../services/smsDispatchService';

interface VoiceSOSTriggerModalProps {
  event: VoiceSOSEvent | null;
  user: UserProfile;
  location: LocationInfo | null;
  onRequestLocation: () => Promise<LocationInfo | null>;
  onClose: () => void;
}

export const VoiceSOSTriggerModal: React.FC<VoiceSOSTriggerModalProps> = ({
  event,
  user,
  location,
  onRequestLocation,
  onClose,
}) => {
  const [isSirenOn, setIsSirenOn] = useState<boolean>(true);
  const [locLoading, setLocLoading] = useState<boolean>(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (event) {
      // Auto-start emergency siren
      audioService.playSiren();
      setIsSirenOn(true);

      // Fetch fresh location if missing
      if (!location) {
        setLocLoading(true);
        onRequestLocation().finally(() => setLocLoading(false));
      }

      // Check if auto-dispatch SMS is enabled and user has pre-saved contacts
      if (smsDispatchService.isAutoDispatchEnabled() && user.contacts && user.contacts.length > 0) {
        // Auto-open SMS after 1.5 seconds if user doesn't immediately dismiss
        const timer = setTimeout(() => {
          handleDispatchSMS();
        }, 1600);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      audioService.stopSiren();
    };
  }, [event]);

  if (!event) return null;

  const toggleSiren = () => {
    if (isSirenOn) {
      audioService.stopSiren();
      setIsSirenOn(false);
    } else {
      audioService.playSiren();
      setIsSirenOn(true);
    }
  };

  const handleDismiss = () => {
    audioService.stopSiren();
    setIsSirenOn(false);
    onClose();
  };

  // Dispatch SOS alert via SMS to all pre-saved contacts
  const handleDispatchSMS = (targetContact?: EmergencyContact) => {
    const res = smsDispatchService.dispatchViaNativeSMS(
      user,
      location,
      `Voice SOS Command Detected: "${event.keyword}" (Transcript: "${event.transcript}")`,
      targetContact
    );
    if (res.success) {
      setDispatchStatus(
        targetContact 
          ? `SMS opened for ${targetContact.name}` 
          : `SMS opened for ${res.recipientCount} pre-saved contact(s)`
      );
      setTimeout(() => setDispatchStatus(null), 4000);
    }
  };

  // Dispatch via Web Share API
  const handleWebShare = async () => {
    const res = await smsDispatchService.dispatchViaWebShare(
      user,
      location,
      `Voice SOS Command Detected: "${event.keyword}" (Transcript: "${event.transcript}")`
    );
    if (res.success) {
      setDispatchStatus('Alert shared via native share sheet');
      setTimeout(() => setDispatchStatus(null), 4000);
    }
  };

  const handleCopyAlert = async () => {
    const success = await smsDispatchService.copyDistressText(
      user,
      location,
      `Voice SOS Command Detected: "${event.keyword}" (Transcript: "${event.transcript}")`
    );
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const emergencyText = smsDispatchService.generateDistressMessage(
    user,
    location,
    `Voice SOS: "${event.keyword}" heard by microphone`
  ).text;

  const whatsappUri = `https://wa.me/?text=${encodeURIComponent(emergencyText)}`;
  const canUseShare = smsDispatchService.canShare();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-200">
      
      {/* Background Beacon Pulses */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-red-600/20 blur-3xl animate-ping pointer-events-none" />
      </div>

      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border-2 border-red-500 shadow-2xl shadow-red-600/50 p-5 sm:p-7 space-y-4 text-white animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        
        {/* Top Emergency Beacon Header */}
        <div className="flex items-center justify-between pb-3 border-b border-red-500/30">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <span className="absolute -inset-1 rounded-full bg-red-500 animate-ping" />
              <div className="relative w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg">
                <ShieldAlert className="w-6 h-6 animate-bounce" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-600 text-white">
                  VOICE COMMAND DETECTED
                </span>
                <span className="text-xs font-mono text-red-400">AUTOMATIC SOS</span>
              </div>
              <h2 className="font-display font-black text-xl text-white mt-0.5">
                Microphone Trigger: &ldquo;{event.keyword}&rdquo;
              </h2>
            </div>
          </div>

          <button
            onClick={toggleSiren}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
              isSirenOn 
                ? 'bg-red-600 text-white border-red-400 animate-pulse' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title={isSirenOn ? 'Mute Siren' : 'Turn On Siren'}
          >
            {isSirenOn ? <Volume2 className="w-5 h-5 animate-spin" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        {/* Spoken Speech Transcript Details */}
        <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-red-300">
            <span className="flex items-center gap-1.5 font-bold">
              <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>VOICE TRANSCRIPT CAPTURED</span>
            </span>
            <span>Confidence: {Math.round(event.confidence * 100)}%</span>
          </div>

          <blockquote className="p-2.5 bg-black/40 rounded-xl border border-red-900/50 text-white text-sm font-semibold italic">
            &ldquo;{event.transcript}&rdquo;
          </blockquote>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            The emergency keyword <strong className="text-red-400">&ldquo;{event.keyword}&rdquo;</strong> was recognized via your microphone. Siren has been sounded and automated dispatch is prepared.
          </p>
        </div>

        {/* GPS Coordinates & Accuracy Box */}
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <MapPin className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
            <div className="min-w-0">
              <div className="font-bold text-white truncate">
                {location ? (location.address || 'GPS Coordinates Locked') : 'Locating satellite position...'}
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                {location 
                  ? `Lat: ${location.lat.toFixed(5)}°, Lng: ${location.lng.toFixed(5)}° (±${Math.round(location.accuracy)}m)`
                  : 'Acquiring high-precision lock...'}
              </div>
            </div>
          </div>

          {!location && (
            <button
              onClick={() => onRequestLocation()}
              disabled={locLoading}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 cursor-pointer"
            >
              {locLoading ? 'Locating...' : 'Retry GPS'}
            </button>
          )}
        </div>

        {/* Status Confirmation Toast if dispatched */}
        {dispatchStatus && (
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{dispatchStatus}</span>
          </div>
        )}

        {/* Automated SMS Dispatch Section to Pre-Saved Contacts */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-red-950/40 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-rose-400" />
              <h4 className="font-display font-bold text-sm text-white">
                Automated SMS &amp; Native Dispatch
              </h4>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {user.contacts?.length || 0} Saved Contacts
            </span>
          </div>

          {/* Primary Action: 1-Tap SMS Dispatch to All Saved Contacts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => handleDispatchSMS()}
              className="py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-display font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 cursor-pointer active:scale-95 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send SMS to All Contacts ({user.contacts?.length || 0})</span>
            </button>

            {canUseShare ? (
              <button
                onClick={handleWebShare}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-display font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 cursor-pointer active:scale-95 transition-all"
              >
                <Share2 className="w-4 h-4 text-sky-400" />
                <span>Web Share (WhatsApp / SMS)</span>
              </button>
            ) : (
              <button
                onClick={handleCopyAlert}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-display font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 cursor-pointer active:scale-95 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
                <span>{copied ? 'Distress Copied!' : 'Copy Distress Details'}</span>
              </button>
            )}
          </div>

          {/* Individual Quick Contact Chips */}
          {user.contacts && user.contacts.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Quick 1-Tap Individual SMS Dispatch:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {user.contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleDispatchSMS(contact)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500/50 text-slate-200 hover:text-rose-200 text-[11px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                    title={`Send emergency SMS to ${contact.name}`}
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

        {/* Immediate Rescue Dispatch Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <a
            href={whatsappUri}
            target="_blank"
            rel="noreferrer"
            className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-display font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 cursor-pointer transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Send SOS to WhatsApp</span>
          </a>

          <a
            href="tel:112"
            className="py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-display font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-600/40 cursor-pointer transition-all active:scale-95"
          >
            <Phone className="w-4 h-4" />
            <span>Call 112 (National Rescue)</span>
          </a>
        </div>

        {/* Safe Dismissal Control */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>If this was a test or drill, click dismiss below:</span>
          </span>

          <button
            onClick={handleDismiss}
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer transition-colors"
          >
            I am Safe · Dismiss SOS
          </button>
        </div>

      </div>
    </div>
  );
};
