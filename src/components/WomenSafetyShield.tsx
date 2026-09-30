import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  Phone, 
  ShieldAlert, 
  Clock, 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  Volume2, 
  CheckCircle2, 
  AlertOctagon, 
  Sparkles,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Send,
  UserCheck,
  MessageSquare,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { LocationInfo, UserProfile, EmergencyContact } from '../types';
import { audioService } from '../services/audioService';
import { openExternalLink } from '../services/linkService';
import { smsDispatchService } from '../services/smsDispatchService';
import { hapticService } from '../services/hapticService';

interface WomenSafetyShieldProps {
  user: UserProfile;
  location: LocationInfo | null;
  onRequestLocation: () => Promise<LocationInfo | null>;
}

export const WomenSafetyShield: React.FC<WomenSafetyShieldProps> = ({
  user,
  location,
  onRequestLocation,
}) => {
  // Escort Timer state
  const [escortActive, setEscortActive] = useState<boolean>(false);
  const [escortDestination, setEscortDestination] = useState<string>('Home / Metro Station');
  const [escortDurationMins, setEscortDurationMins] = useState<number>(15);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15 * 60);
  const [escortExpired, setEscortExpired] = useState<boolean>(false);

  // Fake Call state
  const [fakeCallTriggered, setFakeCallTriggered] = useState<boolean>(false);
  const [fakeCallActive, setFakeCallActive] = useState<boolean>(false);
  const [fakeCallerName, setFakeCallerName] = useState<string>('Papa (Home)');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [delaySeconds, setDelaySeconds] = useState<number>(0);

  const escortInterval = useRef<any>(null);
  const callDurationInterval = useRef<any>(null);

  // Escort countdown timer
  useEffect(() => {
    if (escortActive && secondsRemaining > 0) {
      escortInterval.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(escortInterval.current);
            setEscortExpired(true);
            audioService.playSiren();
            hapticService.triggerSOS();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(escortInterval.current);
    }
    return () => clearInterval(escortInterval.current);
  }, [escortActive, secondsRemaining]);

  // Call duration counter
  useEffect(() => {
    if (fakeCallActive) {
      callDurationInterval.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(callDurationInterval.current);
      setCallDuration(0);
    }
    return () => clearInterval(callDurationInterval.current);
  }, [fakeCallActive]);

  const handleStartEscort = async () => {
    if (!location) {
      await onRequestLocation();
    }
    hapticService.triggerActionConfirmed();
    setSecondsRemaining(escortDurationMins * 60);
    setEscortExpired(false);
    setEscortActive(true);
  };

  const handleStopEscort = () => {
    setEscortActive(false);
    setEscortExpired(false);
    audioService.stopSiren();
    hapticService.cancel();
    audioService.playSuccessChime();
  };

  const handleTriggerFakeCallWithDelay = (delay: number, caller: string) => {
    setFakeCallerName(caller);
    setDelaySeconds(delay);

    if (delay === 0) {
      audioService.playIncomingRingtone();
      setFakeCallTriggered(true);
    } else {
      setTimeout(() => {
        audioService.playIncomingRingtone();
        setFakeCallTriggered(true);
      }, delay * 1000);
    }
  };

  const handleAnswerFakeCall = () => {
    audioService.stopIncomingRingtone();
    hapticService.triggerTap();
    setFakeCallTriggered(false);
    setFakeCallActive(true);

    // Speak synthetic voice message using Web Speech API if supported
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(
          "Beta, where have you reached? I'm waiting in the car right outside at the main corner. The police patrol car is also standing right here. Call out if you see me."
        );
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch {}
    }
  };

  const handleEndFakeCall = () => {
    audioService.stopIncomingRingtone();
    hapticService.cancel();
    setFakeCallTriggered(false);
    setFakeCallActive(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const [copiedDistress, setCopiedDistress] = useState<boolean>(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const handleDispatchSMS = (targetContact?: EmergencyContact) => {
    hapticService.triggerActionConfirmed();
    const res = smsDispatchService.dispatchViaNativeSMS(
      user,
      location,
      `Women Safety Shield Alert: Traveling toward "${escortDestination}"`,
      targetContact
    );
    if (res.success) {
      setDispatchStatus(
        targetContact
          ? `SMS opened for ${targetContact.name}`
          : `SMS opened for ${res.recipientCount} saved contacts`
      );
      setTimeout(() => setDispatchStatus(null), 3500);
    }
  };

  const handleWebShare = async () => {
    hapticService.triggerActionConfirmed();
    const res = await smsDispatchService.dispatchViaWebShare(
      user,
      location,
      `Women Safety Shield Alert: Traveling toward "${escortDestination}"`
    );
    if (res.success) {
      setDispatchStatus('Alert shared via native share sheet');
      setTimeout(() => setDispatchStatus(null), 3500);
    }
  };

  const handleCopyDistress = async () => {
    const success = await smsDispatchService.copyDistressText(
      user,
      location,
      `Women Safety Shield Alert: Traveling toward "${escortDestination}"`
    );
    if (success) {
      setCopiedDistress(true);
      setTimeout(() => setCopiedDistress(false), 2200);
    }
  };

  const handleQuickShare = () => {
    const coords = location 
      ? `\n📍 LIVE GPS: https://www.google.com/maps?q=${location.lat.toFixed(6)},${location.lng.toFixed(6)}`
      : '';
    const text = encodeURIComponent(
      `🛡️ Safe Bharat Women Shield Update: I am traveling toward ${escortDestination}.${coords}\nBattery charged. Tracking active.`
    );
    openExternalLink(`https://wa.me/?text=${text}`);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Fake Incoming Call Fullscreen Simulator */}
      {fakeCallTriggered && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between p-8 text-center animate-in fade-in duration-300">
          <div className="w-full flex justify-between items-center text-xs text-slate-400 font-mono pt-4">
            <span>SAFE BHARAT DEFENSE</span>
            <span>INCOMING CALL</span>
          </div>

          <div className="space-y-4 my-auto">
            <div className="w-28 h-28 mx-auto rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-white shadow-2xl animate-pulse">
              <UserCheck className="w-14 h-14 text-emerald-400" />
            </div>

            <div>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-white">
                {fakeCallerName}
              </h2>
              <p className="text-slate-400 text-sm mt-1">Mobile · Calling...</p>
            </div>
          </div>

          {/* Accept / Decline actions */}
          <div className="w-full max-w-sm flex items-center justify-around pb-12">
            <button
              onClick={handleEndFakeCall}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div className="w-18 h-18 rounded-full bg-red-600 group-hover:bg-red-500 text-white flex items-center justify-center shadow-xl shadow-red-600/30">
                <PhoneOff className="w-8 h-8" />
              </div>
              <span className="text-xs font-semibold text-slate-400">Decline</span>
            </button>

            <button
              onClick={handleAnswerFakeCall}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div className="w-18 h-18 rounded-full bg-emerald-600 group-hover:bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-600/30 animate-bounce">
                <PhoneCall className="w-8 h-8" />
              </div>
              <span className="text-xs font-semibold text-emerald-400">Answer</span>
            </button>
          </div>
        </div>
      )}

      {/* Fake Active In-Call Screen */}
      {fakeCallActive && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between p-8 text-center animate-in fade-in duration-200">
          <div className="pt-6 space-y-2">
            <h2 className="font-display font-black text-2xl text-white">
              {fakeCallerName}
            </h2>
            <div className="text-emerald-400 font-mono text-sm font-semibold">
              {formatTime(callDuration)}
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-[11px] text-emerald-300">
              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              <span>Voice Playback Active</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 max-w-xs mx-auto text-xs text-slate-300 leading-relaxed italic">
            "Papa is saying: Beta I'm right outside at the corner waiting in the car with the police patrol... reach fast."
          </div>

          <div className="pb-12">
            <button
              onClick={handleEndFakeCall}
              className="w-18 h-18 mx-auto rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-xl cursor-pointer"
            >
              <PhoneOff className="w-8 h-8" />
            </button>
            <span className="text-xs font-semibold text-slate-400 mt-2 block">End Call</span>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <section className="bg-gradient-to-br from-pink-950 via-slate-900 to-slate-950 border border-pink-900/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/40">
                24x7 Protective Shield
              </span>
              <span className="text-xs text-slate-400">Sakhi One-Stop &amp; Cyber Defense</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
              Women Safety &amp; Night Shield
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Virtual journey escort countdown, fake call deterrent against harassment, one-touch SOS dispatch, and direct Sakhi helplines.
            </p>
          </div>

          {/* Instant 181 / 112 Buttons */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <a
              href="tel:181"
              className="py-2.5 px-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-pink-600/30 transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>Call 181 Helpline</span>
            </a>
            <a
              href="tel:112"
              className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Call 112</span>
            </a>
          </div>
        </div>
      </section>

      {/* Automated Emergency SMS & Native Dispatch Card */}
      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-pink-950/30 border border-pink-900/50 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-white">
                Instant SOS Dispatch to Pre-Saved Contacts
              </h2>
              <p className="text-xs text-slate-400">
                1-tap native SMS &amp; Web Share broadcast with exact GPS link &amp; medical note.
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/40 self-start sm:self-auto">
            {user.contacts?.length || 0} Contacts Configured
          </span>
        </div>

        {dispatchStatus && (
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{dispatchStatus}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            onClick={() => handleDispatchSMS()}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-display font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-600/30 cursor-pointer active:scale-95 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Send SOS SMS to All Contacts ({user.contacts?.length || 0})</span>
          </button>

          {smsDispatchService.canShare() ? (
            <button
              onClick={handleWebShare}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-display font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 cursor-pointer active:scale-95 transition-all"
            >
              <Share2 className="w-4 h-4 text-sky-400" />
              <span>Native Web Share (WhatsApp / SMS)</span>
            </button>
          ) : (
            <button
              onClick={handleCopyDistress}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-display font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 cursor-pointer active:scale-95 transition-all"
            >
              {copiedDistress ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
              <span>{copiedDistress ? 'Distress Copied!' : 'Copy Distress Details'}</span>
            </button>
          )}

          <button
            onClick={handleQuickShare}
            className="py-3 px-4 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/50 text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-95"
          >
            <Send className="w-4 h-4 text-emerald-400" />
            <span>Quick WhatsApp Status</span>
          </button>
        </div>

        {/* Quick Individual Contact SMS Chips */}
        {user.contacts && user.contacts.length > 0 && (
          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
              1-Tap Alert to Specific Contact:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {user.contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleDispatchSMS(contact)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-pink-950/60 border border-slate-800 hover:border-pink-500/50 text-slate-200 hover:text-pink-200 text-[11px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                  title={`Send emergency alert to ${contact.name}`}
                >
                  <MessageSquare className="w-3 h-3 text-pink-400" />
                  <span>{contact.name}</span>
                  <span className="text-[9px] font-mono text-slate-400">({contact.phone})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Feature 1: Walk With Me (Virtual Journey Escort Timer) */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-pink-400" />
            <div>
              <h2 className="font-display font-bold text-lg text-white">
                "Walk With Me" Virtual Safety Escort
              </h2>
              <p className="text-xs text-slate-400">
                Set travel time for your auto, cab, or walk. If you don't check in before zero, emergency alarm triggers automatically.
              </p>
            </div>
          </div>
        </div>

        {escortActive ? (
          <div className="rounded-2xl bg-gradient-to-br from-slate-950 to-pink-950/20 border border-pink-700/50 p-6 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
              <span>Escort Mode Active · Heading to {escortDestination}</span>
            </div>

            <div className="font-mono text-5xl sm:text-6xl font-black text-white tracking-tight">
              {formatTime(secondsRemaining)}
            </div>

            {escortExpired && (
              <div className="p-3 bg-red-600 text-white font-bold text-sm rounded-xl animate-bounce">
                ⚠️ TIME EXPIRED! Check-in not received. Emergency alarm active!
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handleStopEscort}
                className="w-full sm:w-auto py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>I Have Arrived Safely (End Escort)</span>
              </button>

              <button
                onClick={() => handleDispatchSMS()}
                className="w-full sm:w-auto py-3 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Instant SMS Alert to Contacts</span>
              </button>

              <button
                onClick={handleQuickShare}
                className="w-full sm:w-auto py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4 text-emerald-400" />
                <span>Share WhatsApp Update</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-xs font-semibold text-slate-300">Destination</label>
              <input
                type="text"
                value={escortDestination}
                onChange={(e) => setEscortDestination(e.target.value)}
                placeholder="e.g. Indiranagar Metro Station"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="space-y-1.5 md:col-span-1">
              <label className="text-xs font-semibold text-slate-300">Estimated Travel Time</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[10, 15, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setEscortDurationMins(mins)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      escortDurationMins === mins
                        ? 'bg-pink-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {mins} Mins
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end md:col-span-1">
              <button
                onClick={handleStartEscort}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Flame className="w-4 h-4" />
                <span>Activate Escort Timer</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Feature 2: Fake Call Generator */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <PhoneCall className="w-6 h-6 text-emerald-400" />
          <div>
            <h2 className="font-display font-bold text-lg text-white">
              Fake Incoming Call Simulator
            </h2>
            <p className="text-xs text-slate-400">
              Simulate an urgent incoming call to deter suspicious cab drivers or individuals in deserted public spaces.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => handleTriggerFakeCallWithDelay(0, 'Papa (Home)')}
            className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-600/60 transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">Instant Trigger</span>
              <PhoneCall className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-base font-bold text-white mt-2">Call from Papa</div>
            <p className="text-[11px] text-slate-400 mt-1">Simulates urgent family arrival call immediately.</p>
          </button>

          <button
            onClick={() => handleTriggerFakeCallWithDelay(10, 'Inspector Sharma (DCP)')}
            className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-600/60 transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400">10 Sec Delay</span>
              <ShieldCheck className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-base font-bold text-white mt-2">Police Official Call</div>
            <p className="text-[11px] text-slate-400 mt-1">Rings after 10 seconds to look natural in a cab.</p>
          </button>

          <button
            onClick={() => handleTriggerFakeCallWithDelay(30, 'Brother (Rohan)')}
            className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-600/60 transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400">30 Sec Delay</span>
              <Clock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-base font-bold text-white mt-2">Scheduled Call</div>
            <p className="text-[11px] text-slate-400 mt-1">Put phone in pocket; rings automatically in 30s.</p>
          </button>
        </div>
      </section>

      {/* Feature 3: Women's Legal Rights & Safe Spaces in India */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h2 className="font-display font-bold text-lg text-white">
            Crucial Legal Rights &amp; Safe Spaces in India
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <h3 className="font-bold text-sm text-white">Right to Zero FIR</h3>
            <p>
              A woman can file an FIR at ANY police station across India, regardless of where the incident occurred. The station must accept the complaint and transfer it to the jurisdictional station.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <h3 className="font-bold text-sm text-white">Sakhi One Stop Centres (OSC)</h3>
            <p>
              Centrally sponsored shelter and crisis centers located in every district hospital providing integrated medical aid, legal counselling, police assistance, and psycho-social support under one roof.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <h3 className="font-bold text-sm text-white">No Arrest After Sunset</h3>
            <p>
              Under Section 46(4) CrPC, a woman cannot be arrested before sunrise and after sunset except under exceptional circumstances with the prior written permission of a Judicial Magistrate.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <h3 className="font-bold text-sm text-white">Cyber Crime Portal (1930)</h3>
            <p>
              Specialized cell for non-consensual image sharing, cyber harassment, extortion, and morphing. Reports on cybercrime.gov.in trigger urgent takedown notices to social platforms.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
