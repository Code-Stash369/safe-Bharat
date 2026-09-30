import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  MessageSquare, 
  Flashlight, 
  Phone, 
  MapPin, 
  X, 
  Copy, 
  Check, 
  Send, 
  Share2,
  ExternalLink, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Compass, 
  ChevronUp, 
  ChevronDown,
  RefreshCw,
  AlertTriangle,
  Flame
} from 'lucide-react';
import { LocationInfo, UserProfile } from '../types';
import { flashlightMorseService } from '../services/flashlightMorseService';
import { audioService } from '../services/audioService';
import { openExternalLink } from '../services/linkService';
import { useLanguage } from '../context/LanguageContext';

interface FloatingSOSActionPanelProps {
  user: UserProfile;
  location: LocationInfo | null;
  onRequestLocation: () => Promise<LocationInfo | null>;
  onTriggerSOSModal?: () => void;
}

interface GroundingPlace {
  title: string;
  uri: string;
}

interface NearbyContact {
  name: string;
  phone: string;
  type: string;
  address: string;
  distance: string;
  mapsUri?: string;
}

export const FloatingSOSActionPanel: React.FC<FloatingSOSActionPanelProps> = ({
  user,
  location,
  onRequestLocation,
  onTriggerSOSModal,
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMorseActive, setIsMorseActive] = useState<boolean>(false);
  const [isFlashOn, setIsFlashOn] = useState<boolean>(false);
  const [copiedSMS, setCopiedSMS] = useState<boolean>(false);
  const [contactsLoading, setContactsLoading] = useState<boolean>(false);
  const [nearestContacts, setNearestContacts] = useState<NearbyContact[]>([]);
  const [groundingPlaces, setGroundingPlaces] = useState<GroundingPlace[]>([]);
  const [groundingSummary, setGroundingSummary] = useState<string>('');
  const [sourceType, setSourceType] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'sms' | 'flashlight' | 'contacts'>('all');

  // Register flashlight morse state listener
  useEffect(() => {
    flashlightMorseService.registerStateListener((active, flash) => {
      setIsMorseActive(active);
      setIsFlashOn(flash);
    });

    return () => {
      flashlightMorseService.stopMorseSOS();
    };
  }, []);

  // Fetch real-time nearest emergency contact numbers based on current location
  const fetchNearbyEmergencyContacts = async (lat?: number, lng?: number) => {
    setContactsLoading(true);
    const targetLat = lat ?? location?.lat ?? 28.6139;
    const targetLng = lng ?? location?.lng ?? 77.2090;

    try {
      const res = await fetch('/api/emergency/nearby-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: targetLat,
          lng: targetLng,
          city: user.city || 'Current GPS Location',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNearestContacts(data.contacts || []);
        setGroundingPlaces(data.groundingPlaces || []);
        setGroundingSummary(data.summary || '');
        setSourceType(data.source || '');
      }
    } catch (err) {
      console.error('Failed to fetch emergency contacts:', err);
    } finally {
      setContactsLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyEmergencyContacts(location?.lat, location?.lng);
  }, [location?.lat, location?.lng]);

  const toggleMorseSOS = async () => {
    if (isMorseActive) {
      await flashlightMorseService.stopMorseSOS();
    } else {
      await flashlightMorseService.startMorseSOS();
    }
  };

  const generateSMSTemplate = () => {
    const latStr = location ? location.lat.toFixed(6) : '28.613900';
    const lngStr = location ? location.lng.toFixed(6) : '77.209000';
    const accuracyStr = location ? `±${Math.round(location.accuracy)}m` : 'estimate';
    const mapsLink = `https://www.google.com/maps?q=${latStr},${lngStr}`;

    return `🚨 EMERGENCY SOS ALERT! 🚨\nI am in immediate distress and need urgent assistance.\nName: ${user.name}\nPhone: +91 ${user.phone}\nBlood Group: ${user.bloodGroup}\nLocation Coordinates: ${latStr}, ${lngStr} (${accuracyStr})\nLive Google Map: ${mapsLink}\nSent via Safe Bharat National Emergency Command.`;
  };

  const handleSendSMS = () => {
    const text = encodeURIComponent(generateSMSTemplate());
    // If user has saved emergency contacts, target them in the SMS recipient list
    const recipientNumbers = user.contacts.map(c => c.phone).join(',');
    const smsUri = recipientNumbers ? `sms:${recipientNumbers}?body=${text}` : `sms:?body=${text}`;
    window.location.href = smsUri;
  };

  const handleCopySMS = () => {
    const text = generateSMSTemplate();
    navigator.clipboard.writeText(text);
    setCopiedSMS(true);
    setTimeout(() => setCopiedSMS(false), 2200);
  };

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(generateSMSTemplate());
    openExternalLink(`https://wa.me/?text=${text}`);
  };

  return (
    <>
      {/* Fullscreen Tactical Strobe when Morse SOS is active */}
      {isMorseActive && isFlashOn && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-white/80 animate-in fade-in duration-75 mix-blend-screen" />
      )}

      {/* Floating High-Visibility Trigger Button (Bottom Right) */}
      <div className="fixed bottom-20 lg:bottom-6 right-3 sm:right-6 z-40 flex flex-col items-end">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center justify-center gap-2 sm:gap-2.5 p-3 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-display font-black text-xs sm:text-sm shadow-2xl shadow-red-600/60 border-2 border-red-400 hover:scale-105 active:scale-95 transition-all cursor-pointer select-none"
            aria-label="Open Floating SOS Action Panel"
          >
            {/* Beacon Pulse Ring */}
            <span className="absolute -inset-1 rounded-full bg-red-500/50 animate-ping pointer-events-none" />
            
            <ShieldAlert className="w-5 h-5 text-white animate-bounce drop-shadow shrink-0" />
            
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="tracking-wider uppercase text-[11px] sm:text-xs">{t('sos_panel')}</span>
              <span className="text-[9px] font-normal text-red-200">
                SMS · Torch · Helplines
              </span>
            </div>

            {/* Quick Morse active indicator */}
            {isMorseActive && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-300 animate-ping ml-0.5 sm:ml-1 shrink-0" />
            )}
          </button>
        )}

        {/* Expanded Floating High-Visibility Action Panel */}
        {isOpen && (
          <div className="w-[calc(100vw-24px)] sm:w-[440px] max-w-[440px] max-h-[80vh] sm:max-h-[85vh] rounded-3xl bg-slate-950/98 backdrop-blur-2xl border-2 border-red-500/60 shadow-2xl shadow-red-950/80 p-4 sm:p-5 flex flex-col space-y-4 animate-in slide-in-from-bottom-5 zoom-in-95 duration-200 overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/40">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-base text-white tracking-tight">
                    Emergency SOS Action Panel
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-red-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    <span>Real-time Tactical Command</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800"
                aria-label="Close SOS Panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feature 1: Flashlight SOS Morse Code Pulsing */}
            <div className={`p-4 rounded-2xl border transition-all ${
              isMorseActive 
                ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg shadow-amber-950/40' 
                : 'bg-slate-900/90 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flashlight className={`w-5 h-5 ${isMorseActive ? 'text-amber-400 animate-spin' : 'text-slate-400'}`} />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white">
                      Flashlight SOS Morse Code Pulsing
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Standard S.O.S (··· --- ···) Strobe &amp; Torch
                    </span>
                  </div>
                </div>

                <button
                  onClick={toggleMorseSOS}
                  className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                    isMorseActive
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <Flashlight className="w-3.5 h-3.5" />
                  <span>{isMorseActive ? 'STOP STROBE' : 'START STROBE'}</span>
                </button>
              </div>

              {/* Live Morse Visual Cadence Representation */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="font-mono text-[11px] tracking-widest flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded font-bold ${isMorseActive && isFlashOn ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    ··· (S)
                  </span>
                  <span className={`px-2 py-0.5 rounded font-bold ${isMorseActive && isFlashOn ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    --- (O)
                  </span>
                  <span className={`px-2 py-0.5 rounded font-bold ${isMorseActive && isFlashOn ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    ··· (S)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 italic">
                  {isMorseActive ? 'Optical & Audio active' : 'Rear LED + Screen'}
                </span>
              </div>
            </div>

            {/* Feature 2: Automated SMS Emergency Template */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white">
                      Automated SMS Emergency Dispatch
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Auto-stamped with exact GPS coordinates
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {location ? `GPS Locked` : `Locating...`}
                </span>
              </div>

              {/* Template Preview */}
              <div className="p-2.5 rounded-xl bg-black/60 border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed max-h-24 overflow-y-auto">
                {generateSMSTemplate()}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleSendSMS}
                  className="py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send SMS</span>
                </button>

                <button
                  onClick={handleSendWhatsApp}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  onClick={handleCopySMS}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors border border-slate-700"
                >
                  {copiedSMS ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{copiedSMS ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Feature 3: Real-Time Nearest Emergency Contacts Based on Current Location */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white">
                      Nearest Emergency Contacts
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Based on current location ({location ? `${location.lat.toFixed(3)}°N, ${location.lng.toFixed(3)}°E` : user.city})
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => fetchNearbyEmergencyContacts()}
                  disabled={contactsLoading}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                  title="Refresh Emergency Numbers"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${contactsLoading ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
              </div>

              {/* Google Maps Grounding Info Badge */}
              {sourceType === 'google_maps_grounding' && (
                <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-600/40 text-[11px] text-blue-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-400">
                    <MapPin className="w-3 h-3" />
                    <span>Google Maps Grounding Active (gemini-3.5-flash)</span>
                  </div>
                  <p className="line-clamp-2 text-slate-300">{groundingSummary}</p>
                  
                  {/* Always list extracted URLs from groundingChunks as mandated */}
                  {groundingPlaces.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {groundingPlaces.slice(0, 4).map((place, idx) => (
                        <a
                          key={idx}
                          href={place.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-900/50 hover:bg-blue-800/60 text-blue-200 border border-blue-500/30 text-[10px] font-semibold"
                        >
                          <span>{place.title}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Contact list */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {nearestContacts.map((contact, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white truncate">{contact.name}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-800 text-slate-300">
                          {contact.type}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{contact.address}</div>
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold">{contact.distance}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {contact.mapsUri && (
                        <a
                          href={contact.mapsUri}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400"
                          title="View on Google Maps"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </a>
                      )}
                      
                      <a
                        href={`tel:${contact.phone}`}
                        className="py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1 shadow-md cursor-pointer transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{contact.phone}</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick 112 Dial Trigger at bottom */}
            <a
              href="tel:112"
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-display font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-red-600/30 cursor-pointer transition-transform active:scale-95"
            >
              <Phone className="w-4 h-4 fill-current" />
              <span>DIRECT DIAL NATIONAL 112</span>
            </a>

          </div>
        )}
      </div>
    </>
  );
};
