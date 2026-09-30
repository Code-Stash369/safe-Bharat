import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Mic, 
  MicOff, 
  Sparkles, 
  ShieldAlert, 
  Phone, 
  MapPin, 
  Camera, 
  Share2, 
  Volume2, 
  VolumeX,
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Heart, 
  Compass, 
  RefreshCw, 
  X, 
  HelpCircle,
  Clock,
  PhoneCall,
  Loader2,
  ChevronRight,
  Radio,
  ExternalLink,
  ShieldCheck,
  Disc,
  Square,
  Play,
  Download,
  Building2,
  Stethoscope,
  Siren,
  Users,
  Copy,
  MessageSquare,
  MessageCircle,
  BookOpen,
  Leaf,
  FileText,
  UserCheck,
  Zap,
  Activity,
  Gauge,
  Car,
  Footprints,
  Moon,
  ChevronDown,
  ChevronUp,
  Sliders
} from 'lucide-react';
import { 
  LocationInfo, 
  UserProfile, 
  SafeAIMessage, 
  SafeAIActionType, 
  EmergencyContact,
  NavigationTab 
} from '../types';
import { smsDispatchService } from '../services/smsDispatchService';
import { audioService } from '../services/audioService';
import { hapticService } from '../services/hapticService';
import { flashlightMorseService } from '../services/flashlightMorseService';
import { processSafeAIPrompt } from '../services/safeAINLPService';
import { contextualSafetyEngine, ContextualSuggestion } from '../services/contextualSafetyEngine';
import { CameraCaptureModal } from './CameraCaptureModal';
import { FirstAidModal } from './FirstAidModal';

interface SafeAIChatbotProps {
  user: UserProfile;
  location: LocationInfo | null;
  onRequestLocation: () => Promise<LocationInfo | null>;
  isSirenActive: boolean;
  onToggleSiren: () => void;
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenFakeCall?: () => void;
  onOpenProfile?: () => void;
  isFloatingModal?: boolean;
  onCloseModal?: () => void;
}

const INITIAL_MESSAGES: SafeAIMessage[] = [
  {
    id: 'welcome',
    sender: 'assistant',
    text: "Namaste! I am Safe AI, your 24x7 intelligent safety and emergency companion for SAFE BHARAT.\n\nI can execute every feature in this app for you—from launching SOS sirens and dialing 112/181, to WhatsApp location dispatch, fake calls, evidence camera, first aid guides, and geo-radar safe havens.\n\nTell me what's happening in English, Hindi, or Hinglish (even with typos or panic typing!).",
    timestamp: Date.now(),
    isEmergency: false,
    situationCategory: 'general_safety',
    suggestedActions: ['SHARE_LOCATION', 'WHATSAPP_SOS', 'CALL_CONTACT', 'CALL_112', 'FIND_SAFE_PLACES'],
  },
];

const QUICK_PROMPTS = [
  { label: "I'M IN DANGER", text: "im in dngr help me now!", emergency: true, icon: "🚨" },
  { label: "SOMEONE FOLLOWING ME", text: "smone is folwing me, i feel unsafe", emergency: true, icon: "👀" },
  { label: "TRIGGER FAKE CALL", text: "fak cal trigger kr do", emergency: false, icon: "📱" },
  { label: "MEDICAL HELP / 108", text: "need urgent ambulance medical help", emergency: true, icon: "🏥" },
  { label: "FIRST AID / CPR", text: "cpr first aid guidance", emergency: false, icon: "🩹" },
  { label: "WHATSAPP SOS", text: "send whatsapp sos with my gps coordinates", emergency: false, icon: "💬" },
  { label: "SHARE LIVE GPS", text: "share my location with dad and mom", emergency: false, icon: "📍" },
  { label: "I'M BEING HARASSED", text: "i am being harassed what to do sakhi 181", emergency: true, icon: "🛡️" },
  { label: "UNSAFE CAB / AUTO", text: "cab driver taking wrong route feeling scared", emergency: true, icon: "🚖" },
  { label: "FIND SAFE HAVEN", text: "find nearest safe shelter and police station", emergency: false, icon: "🗺️" },
  { label: "EVIDENCE CAMERA", text: "open camera to take proof photo", emergency: false, icon: "📷" },
  { label: "STOP SIREN", text: "stop siren alarm", emergency: false, icon: "🔇" },
];

export const SafeAIChatbot: React.FC<SafeAIChatbotProps> = ({
  user,
  location,
  onRequestLocation,
  isSirenActive,
  onToggleSiren,
  onNavigateTab,
  onOpenFakeCall,
  onOpenProfile,
  isFloatingModal = false,
  onCloseModal,
}) => {
  const [messages, setMessages] = useState<SafeAIMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEmergencyMode, setIsEmergencyMode] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isFirstAidOpen, setIsFirstAidOpen] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);

  // Contextual Suggestion Engine state
  const [contextualSuggestion, setContextualSuggestion] = useState<ContextualSuggestion>(() =>
    contextualSafetyEngine.analyzeContext(location, user)
  );
  const [isContextCardExpanded, setIsContextCardExpanded] = useState<boolean>(true);
  const [simulationMode, setSimulationMode] = useState<'live' | 'cab' | 'highway' | 'night_walk' | 'sprint' | 'night_stationary'>('live');
  const [isSimulationMenuOpen, setIsSimulationMenuOpen] = useState<boolean>(false);

  // Re-run contextual analysis whenever location or simulation mode updates
  useEffect(() => {
    if (simulationMode === 'live') {
      contextualSafetyEngine.clearSimulation();
    } else if (simulationMode === 'cab') {
      contextualSafetyEngine.setSimulation(35, 23); // 35 km/h, 11 PM
    } else if (simulationMode === 'highway') {
      contextualSafetyEngine.setSimulation(72, 23); // 72 km/h, 11 PM
    } else if (simulationMode === 'night_walk') {
      contextualSafetyEngine.setSimulation(4, 23); // 4 km/h, 11 PM
    } else if (simulationMode === 'sprint') {
      contextualSafetyEngine.setSimulation(12, 22); // 12 km/h, 10 PM
    } else if (simulationMode === 'night_stationary') {
      contextualSafetyEngine.setSimulation(0, 1); // 0 km/h, 1 AM
    }

    const suggestion = contextualSafetyEngine.analyzeContext(location, user);
    setContextualSuggestion(suggestion);

    // If urgent movement (e.g. cab or high speed transit) detected, alert with haptic flutter
    if (suggestion.urgencyLevel === 'alert') {
      hapticService.triggerSpeedAlert();
    }
  }, [location, simulationMode, user]);

  // Audio Recording states for emergency ambient voice memos
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition for hands-free voice input
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechClass) {
        setSpeechSupported(true);
        const recog = new SpeechClass();
        recog.continuous = false;
        recog.interimResults = false;
        recog.lang = 'en-IN';

        recog.onresult = (event: any) => {
          const transcript = event.results[0]?.[0]?.transcript || '';
          if (transcript) {
            setInputText(transcript);
            handleSendMessage(transcript);
          }
          setIsListeningMic(false);
        };

        recog.onerror = () => {
          setIsListeningMic(false);
        };

        recog.onend = () => {
          setIsListeningMic(false);
        };

        recognitionRef.current = recog;
      }
    }
  }, []);

  // Auto-scroll chat to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Audio Recording Timer cleanup
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleMicListening = () => {
    if (!speechSupported || !recognitionRef.current) return;
    if (isListeningMic) {
      recognitionRef.current.stop();
      setIsListeningMic(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListeningMic(true);
      } catch {
        setIsListeningMic(false);
      }
    }
  };

  const showActionNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => {
      setActionNotice(null);
    }, 4500);
  };

  // Text-To-Speech (TTS) readout for accessibility and hands-free emergency listening
  const handleSpeakText = (text: string, msgId: string) => {
    if (!window.speechSynthesis) {
      showActionNotice('⚠️ Speech synthesis not supported on this browser.');
      return;
    }

    if (currentlySpeakingId === msgId) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.lang = 'en-IN';

    utterance.onend = () => {
      setCurrentlySpeakingId(null);
    };
    utterance.onerror = () => {
      setCurrentlySpeakingId(null);
    };

    setCurrentlySpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Start / Stop Emergency Audio Recording
  const handleStartAudioRecording = async () => {
    if (isRecordingAudio) {
      handleStopAudioRecording();
      return;
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        showActionNotice('⚠️ Microphone not supported on this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
        showActionNotice('🎙️ Emergency audio clip recorded & ready to preserve as evidence.');
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecordingAudio(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 29) {
            handleStopAudioRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);

      showActionNotice('🎙️ Recording emergency audio memo (30s max)...');
    } catch {
      showActionNotice('⚠️ Microphone access blocked. Please allow mic permission.');
    }
  };

  const handleStopAudioRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingAudio(false);
  };

  // WhatsApp SOS Message Dispatch
  const handleWhatsAppSOS = () => {
    const lat = location?.lat || 28.6139;
    const lng = location?.lng || 77.2090;
    const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
    const text = encodeURIComponent(
      `🚨 SAFE BHARAT EMERGENCY SOS ALERT!\nI need urgent assistance!\nMy Live GPS Location: ${mapsLink}\nCoordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}\nSent via SAFE BHARAT Emergency Command.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
    showActionNotice('💬 WhatsApp SOS Dispatch opened with live GPS link.');
  };

  // Copy GPS Coordinates
  const handleCopyCoordinates = () => {
    const coords = location 
      ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
      : '28.6139, 77.2090';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(coords);
      showActionNotice(`📋 Coordinates copied: ${coords}`);
    } else {
      showActionNotice(`📍 Coordinates: ${coords}`);
    }
  };

  // Execute Safe Bharat features triggered by user or AI
  const handleExecuteAction = async (action: SafeAIActionType, contact?: EmergencyContact) => {
    // Tactile haptic feedback for user action confirmation
    if (action === 'TRIGGER_SOS') {
      hapticService.triggerSOS();
    } else if (action === 'STOP_SIREN') {
      hapticService.cancel();
    } else {
      hapticService.triggerActionConfirmed();
    }

    switch (action) {
      case 'SHARE_LOCATION': {
        const res = await smsDispatchService.dispatchSOS({
          user,
          location,
          reason: 'Safe AI Alert: Live GPS Share',
          targetContact: contact,
          preferredMethod: 'auto',
        });
        showActionNotice(
          res.success
            ? `📍 Location dispatched to ${res.recipientCount} contact(s) via ${res.method === 'web_share' ? 'Native Share' : 'SMS'}`
            : '📍 Dispatched location link via SMS'
        );
        break;
      }

      case 'WHATSAPP_SOS': {
        handleWhatsAppSOS();
        break;
      }

      case 'CALL_CONTACT': {
        const target = contact || user.contacts[0];
        if (target && target.phone) {
          window.location.href = `tel:${target.phone}`;
          showActionNotice(`📞 Calling trusted contact: ${target.name} (${target.phone})`);
        } else {
          showActionNotice('⚠️ No pre-saved emergency contacts configured. Calling 112...');
          window.location.href = 'tel:112';
        }
        break;
      }

      case 'CALL_112': {
        window.location.href = 'tel:112';
        showActionNotice('🚨 Dialing 112 (Universal National Emergency Rescue)...');
        break;
      }

      case 'CALL_181': {
        window.location.href = 'tel:181';
        showActionNotice('🛡️ Dialing 181 (Women Distress & Sakhi OSC Helpline)...');
        break;
      }

      case 'CALL_108': {
        window.location.href = 'tel:108';
        showActionNotice('🏥 Dialing 108 (Emergency Trauma Ambulance)...');
        break;
      }

      case 'CALL_101': {
        window.location.href = 'tel:101';
        showActionNotice('🚒 Dialing 101 (Fire & Disaster Rescue Service)...');
        break;
      }

      case 'CALL_DISASTER': {
        window.location.href = 'tel:1070';
        showActionNotice('🌊 Dialing 1070 (Disaster Relief & Control Room)...');
        break;
      }

      case 'TRIGGER_SOS': {
        if (!isSirenActive) {
          audioService.playSiren();
          onToggleSiren();
        }
        setIsEmergencyMode(true);
        smsDispatchService.dispatchViaNativeSMS(user, location, 'Safe AI: Emergency SOS Triggered');
        showActionNotice('🚨 SOS ALARM ACTIVE! Loud siren sounded and emergency SMS prepared.');
        break;
      }

      case 'STOP_SIREN': {
        if (isSirenActive) {
          audioService.stopSiren();
          onToggleSiren();
        }
        showActionNotice('🔇 Siren alarm drill deactivated.');
        break;
      }

      case 'OPEN_CAMERA': {
        setIsCameraOpen(true);
        showActionNotice('📷 Opening Emergency Evidence Camera with GPS watermark...');
        break;
      }

      case 'RECORD_AUDIO': {
        handleStartAudioRecording();
        break;
      }

      case 'FAKE_CALL': {
        if (onOpenFakeCall) {
          onOpenFakeCall();
        } else {
          audioService.playIncomingRingtone();
          setTimeout(() => {
            audioService.stopIncomingRingtone();
          }, 8000);
        }
        showActionNotice("📱 Fake Incoming Call triggered from 'Papa (Home)'.");
        break;
      }

      case 'FIND_SAFE_PLACES': {
        if (isFloatingModal && onCloseModal) {
          onCloseModal();
        }
        onNavigateTab('radar');
        showActionNotice('🗺️ Opening Geo-Radar Map with nearest Safe Havens & Shelters.');
        break;
      }

      case 'NEARBY_POLICE': {
        if (isFloatingModal && onCloseModal) {
          onCloseModal();
        }
        onNavigateTab('radar');
        showActionNotice('👮 Opening Geo-Radar Map centered on nearest Police Stations.');
        break;
      }

      case 'NEARBY_HOSPITALS': {
        if (isFloatingModal && onCloseModal) {
          onCloseModal();
        }
        onNavigateTab('radar');
        showActionNotice('🏥 Opening Geo-Radar Map centered on nearest Trauma Hospitals.');
        break;
      }

      case 'FIRST_AID': {
        setIsFirstAidOpen(true);
        showActionNotice('🩹 Opening Rapid First Aid & Life Support Guide.');
        break;
      }

      case 'START_ESCORT': {
        if (isFloatingModal && onCloseModal) {
          onCloseModal();
        }
        onNavigateTab('women');
        showActionNotice('🚶‍♀️ Opening "Walk With Me" Virtual Journey Escort.');
        break;
      }

      case 'STROBE_FLASHLIGHT': {
        flashlightMorseService.startMorseSOS();
        showActionNotice('🔦 Flashlight Morse SOS Strobe activated.');
        break;
      }

      case 'DISASTER_CENTER': {
        if (isFloatingModal && onCloseModal) {
          onCloseModal();
        }
        onNavigateTab('disaster');
        showActionNotice('🌊 Opening Flood & Climate Disaster Command Center.');
        break;
      }

      case 'REPORT_INCIDENT': {
        if (isFloatingModal && onCloseModal) {
          onCloseModal();
        }
        onNavigateTab('report');
        showActionNotice('📝 Opening Incident Reporting Studio.');
        break;
      }

      case 'GREEN_BHARAT': {
        if (isFloatingModal && onCloseModal) {
          onCloseModal();
        }
        onNavigateTab('green');
        showActionNotice('🌿 Opening Green Bharat Sustainability Hub.');
        break;
      }

      case 'IKS_ARCHIVE': {
        if (isFloatingModal && onCloseModal) {
          onCloseModal();
        }
        onNavigateTab('iks');
        showActionNotice('📜 Opening Indian Knowledge Systems (IKS Archive).');
        break;
      }

      case 'DAILY_MISSIONS': {
        if (isFloatingModal && onCloseModal) {
          onCloseModal();
        }
        onNavigateTab('daily');
        showActionNotice('📋 Opening Daily Civic Missions.');
        break;
      }

      case 'EDIT_PROFILE': {
        if (onOpenProfile) {
          onOpenProfile();
          showActionNotice('👤 Opening Profile and Emergency Contacts settings.');
        } else {
          showActionNotice('👤 Profile settings accessible via top bar.');
        }
        break;
      }

      case 'COPY_COORDINATES': {
        handleCopyCoordinates();
        break;
      }

      case 'SPEAK_ADVICE': {
        const lastMsg = [...messages].reverse().find(m => m.sender === 'assistant');
        if (lastMsg) {
          handleSpeakText(lastMsg.text, lastMsg.id);
        }
        break;
      }

      default:
        break;
    }
  };

  const handleSendMessage = async (userTextToSend?: string) => {
    const text = (userTextToSend || inputText).trim();
    if (!text || isLoading) return;

    setInputText('');

    // Pre-calculate local resilient NLP analysis with typo tolerance
    const localResult = processSafeAIPrompt(text, {
      user,
      location,
      isSirenActive,
    });

    // Append user message immediately
    const userMsg: SafeAIMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: Date.now(),
    };

    const newThread = [...messages, userMsg];
    setMessages(newThread);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: newThread.slice(-6).map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
          location,
          user,
          appState: {
            isSirenActive,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('AI response error');
      }

      const data = await response.json();

      if (data.isEmergency) {
        setIsEmergencyMode(true);
      }

      const aiMsg: SafeAIMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || localResult.reply,
        timestamp: Date.now(),
        isEmergency: data.isEmergency ?? localResult.isEmergency,
        situationCategory: data.situationCategory || localResult.situationCategory,
        suggestedActions: data.suggestedActions?.length ? data.suggestedActions : localResult.suggestedActions,
      };

      setMessages((prev) => [...prev, aiMsg]);

      const commandToExecute = data.actionCommand || localResult.actionCommand;
      if (commandToExecute) {
        handleExecuteAction(commandToExecute as SafeAIActionType);
      }
    } catch {
      // Local safety intelligence fallback with typo tolerance
      if (localResult.isEmergency) {
        setIsEmergencyMode(true);
      }

      const fallbackAiMsg: SafeAIMessage = {
        id: `ai-local-${Date.now()}`,
        sender: 'assistant',
        text: localResult.reply,
        timestamp: Date.now(),
        isEmergency: localResult.isEmergency,
        situationCategory: localResult.situationCategory,
        suggestedActions: localResult.suggestedActions,
      };
      setMessages((prev) => [...prev, fallbackAiMsg]);

      if (localResult.actionCommand) {
        handleExecuteAction(localResult.actionCommand as SafeAIActionType);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getActionLabel = (action: SafeAIActionType): { label: string; icon: React.ReactNode; color: string } => {
    switch (action) {
      case 'SHARE_LOCATION':
        return { label: '📍 Share Live Location', icon: <MapPin className="w-3.5 h-3.5" />, color: 'bg-emerald-600 hover:bg-emerald-500 text-white' };
      case 'WHATSAPP_SOS':
        return { label: '💬 WhatsApp SOS', icon: <MessageCircle className="w-3.5 h-3.5" />, color: 'bg-emerald-700 hover:bg-emerald-600 text-white' };
      case 'CALL_CONTACT':
        return { label: `📞 Call ${user.contacts[0]?.name || 'Family Contact'}`, icon: <Phone className="w-3.5 h-3.5" />, color: 'bg-blue-600 hover:bg-blue-500 text-white' };
      case 'CALL_112':
        return { label: '🚨 Call 112 Police/Rescue', icon: <ShieldAlert className="w-3.5 h-3.5" />, color: 'bg-red-600 hover:bg-red-500 text-white' };
      case 'CALL_181':
        return { label: '🛡️ Call 181 Women Helpline', icon: <Flame className="w-3.5 h-3.5" />, color: 'bg-pink-600 hover:bg-pink-500 text-white' };
      case 'CALL_108':
        return { label: '🏥 Call 108 Ambulance', icon: <Heart className="w-3.5 h-3.5" />, color: 'bg-rose-600 hover:bg-rose-500 text-white' };
      case 'CALL_101':
        return { label: '🚒 Call 101 Fire Brigade', icon: <Flame className="w-3.5 h-3.5" />, color: 'bg-amber-600 hover:bg-amber-500 text-white' };
      case 'CALL_DISASTER':
        return { label: '🌊 Call 1070 Disaster Control', icon: <PhoneCall className="w-3.5 h-3.5" />, color: 'bg-blue-700 hover:bg-blue-600 text-white' };
      case 'TRIGGER_SOS':
        return { label: '🚨 Start SOS Alarm Beacon', icon: <Volume2 className="w-3.5 h-3.5" />, color: 'bg-red-600 hover:bg-red-500 text-white font-black' };
      case 'STOP_SIREN':
        return { label: '🔇 Stop Siren Drill', icon: <VolumeX className="w-3.5 h-3.5" />, color: 'bg-slate-800 hover:bg-slate-700 text-slate-200' };
      case 'OPEN_CAMERA':
        return { label: '📷 Open Evidence Camera', icon: <Camera className="w-3.5 h-3.5" />, color: 'bg-purple-600 hover:bg-purple-500 text-white' };
      case 'RECORD_AUDIO':
        return { label: '🎙️ Record Audio Evidence', icon: <Disc className="w-3.5 h-3.5" />, color: 'bg-rose-700 hover:bg-rose-600 text-white' };
      case 'FAKE_CALL':
        return { label: '📱 Trigger Fake Call', icon: <PhoneCall className="w-3.5 h-3.5" />, color: 'bg-cyan-600 hover:bg-cyan-500 text-white' };
      case 'FIND_SAFE_PLACES':
        return { label: '🗺️ Find Safe Places', icon: <Compass className="w-3.5 h-3.5" />, color: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700' };
      case 'NEARBY_POLICE':
        return { label: '👮 Nearby Police Stations', icon: <Siren className="w-3.5 h-3.5" />, color: 'bg-indigo-600 hover:bg-indigo-500 text-white' };
      case 'NEARBY_HOSPITALS':
        return { label: '🏥 Nearby Hospitals', icon: <Stethoscope className="w-3.5 h-3.5" />, color: 'bg-teal-600 hover:bg-teal-500 text-white' };
      case 'FIRST_AID':
        return { label: '🩹 First Aid & CPR Guide', icon: <Heart className="w-3.5 h-3.5" />, color: 'bg-rose-700 hover:bg-rose-600 text-white' };
      case 'START_ESCORT':
        return { label: '🚶‍♀️ Start Walk-With-Me', icon: <Clock className="w-3.5 h-3.5" />, color: 'bg-pink-700 hover:bg-pink-600 text-white' };
      case 'STROBE_FLASHLIGHT':
        return { label: '🔦 Flashlight SOS Strobe', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'bg-amber-600 hover:bg-amber-500 text-white' };
      case 'DISASTER_CENTER':
        return { label: '🌊 Flood Disaster Center', icon: <ShieldAlert className="w-3.5 h-3.5" />, color: 'bg-blue-600 hover:bg-blue-500 text-white' };
      case 'REPORT_INCIDENT':
        return { label: '📝 Report Civic Hazard', icon: <FileText className="w-3.5 h-3.5" />, color: 'bg-orange-600 hover:bg-orange-500 text-white' };
      case 'GREEN_BHARAT':
        return { label: '🌿 Green Bharat Hub', icon: <Leaf className="w-3.5 h-3.5" />, color: 'bg-emerald-600 hover:bg-emerald-500 text-white' };
      case 'IKS_ARCHIVE':
        return { label: '📜 IKS Heritage Archive', icon: <BookOpen className="w-3.5 h-3.5" />, color: 'bg-amber-700 hover:bg-amber-600 text-white' };
      case 'DAILY_MISSIONS':
        return { label: '📋 Daily Missions', icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'bg-teal-700 hover:bg-teal-600 text-white' };
      case 'EDIT_PROFILE':
        return { label: '👤 Edit Contacts & Profile', icon: <UserCheck className="w-3.5 h-3.5" />, color: 'bg-slate-700 hover:bg-slate-600 text-white' };
      case 'COPY_COORDINATES':
        return { label: '📋 Copy GPS Coordinates', icon: <Copy className="w-3.5 h-3.5" />, color: 'bg-slate-800 text-slate-200 border border-slate-700' };
      case 'SPEAK_ADVICE':
        return { label: '🔊 Read Aloud', icon: <Volume2 className="w-3.5 h-3.5" />, color: 'bg-slate-800 text-slate-200 border border-slate-700' };
      default:
        return { label: 'Take Action', icon: <ShieldCheck className="w-3.5 h-3.5" />, color: 'bg-slate-800 text-white' };
    }
  };

  return (
    <div className={`flex flex-col bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden ${
      isFloatingModal 
        ? 'w-full max-w-2xl h-[90dvh] max-h-[720px]' 
        : 'w-full h-[calc(100dvh-130px)] sm:h-[700px] max-w-4xl mx-auto my-2 sm:my-4'
    }`}>
      
      {/* Top Banner / Header */}
      <div className={`p-3.5 sm:p-4 border-b flex items-center justify-between transition-colors shrink-0 ${
        isEmergencyMode 
          ? 'bg-red-950/90 border-red-500/60 text-white shadow-lg shadow-red-900/40' 
          : 'bg-slate-900/90 border-slate-800 text-white'
      }`}>
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform shrink-0 ${
            isEmergencyMode ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            <Bot className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="font-display font-black text-sm sm:text-base text-white tracking-tight truncate">
                Safe AI
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider border shrink-0 ${
                isEmergencyMode 
                  ? 'bg-red-600 text-white border-red-400 animate-pulse' 
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                {isEmergencyMode ? 'EMERGENCY MODE' : 'All-App Safety Command'}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
              Understands mis-printed words &amp; controls all SAFE BHARAT features
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* First Aid Button */}
          <button
            onClick={() => setIsFirstAidOpen(true)}
            className="hidden sm:flex py-1.5 px-2.5 rounded-xl text-xs font-bold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 cursor-pointer items-center gap-1"
            title="Open Emergency First Aid Guide"
          >
            <span>🩹</span>
            <span>First Aid</span>
          </button>

          {/* Toggle Emergency Mode Button */}
          <button
            onClick={() => {
              const nextMode = !isEmergencyMode;
              setIsEmergencyMode(nextMode);
              if (nextMode) {
                hapticService.triggerWarning();
              } else {
                hapticService.cancel();
              }
            }}
            className={`py-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
              isEmergencyMode
                ? 'bg-slate-900 text-red-300 border-red-500 hover:bg-slate-800'
                : 'bg-red-950/80 hover:bg-red-900/80 text-red-200 border-red-600/50'
            }`}
            title="Toggle High-Priority Emergency Interface"
          >
            {isEmergencyMode ? 'Exit Emergency' : '🚨 Emergency Mode'}
          </button>

          {isFloatingModal && onCloseModal && (
            <button
              onClick={onCloseModal}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Toast Banner */}
      {actionNotice && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/50 px-3 sm:px-4 py-2 text-xs text-emerald-200 flex items-center justify-between gap-2 animate-in fade-in duration-150 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold truncate">{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-emerald-400 hover:text-white shrink-0 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Audio Recording Banner if active or recorded */}
      {(isRecordingAudio || audioUrl) && (
        <div className="bg-slate-900 border-b border-slate-800 p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {isRecordingAudio ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="font-mono text-xs font-bold text-red-400">
                  RECORDING AUDIO EVIDENCE: 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 00:30
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-300 font-semibold">Evidence Audio Recorded</span>
                {audioUrl && (
                  <audio src={audioUrl} controls className="h-7 w-44 sm:w-56" />
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {isRecordingAudio ? (
              <button
                onClick={handleStopAudioRecording}
                className="py-1 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            ) : audioUrl ? (
              <>
                <a
                  href={audioUrl}
                  download="safe-bharat-evidence-audio.webm"
                  className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Save Audio</span>
                </a>
                <button
                  onClick={() => setAudioUrl(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Emergency Mode Complete Tactical Controls */}
      {isEmergencyMode && (
        <div className="p-3 sm:p-3.5 bg-gradient-to-r from-red-950/95 via-slate-950 to-red-950/95 border-b border-red-500/40 space-y-2.5 animate-in slide-in-from-top-3 duration-200 shrink-0 max-h-[38vh] overflow-y-auto">
          <div className="flex items-center justify-between text-[11px] font-mono text-red-300 px-1 font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>EMERGENCY TACTICAL CONTROLS (DIRECT EXECUTION)</span>
            </span>
            <span className="hidden sm:inline text-[10px] text-red-400 font-normal">All SAFE BHARAT Modules</span>
          </div>

          {/* Grid of Emergency Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* SOS Siren */}
            <button
              onClick={() => handleExecuteAction(isSirenActive ? 'STOP_SIREN' : 'TRIGGER_SOS')}
              className={`py-2 px-2 rounded-2xl font-display font-black text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer active:scale-95 ${
                isSirenActive ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/40'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{isSirenActive ? 'STOP SIREN' : 'START SOS SIREN'}</span>
            </button>

            {/* Dial 112 */}
            <button
              onClick={() => handleExecuteAction('CALL_112')}
              className="py-2 px-2 rounded-2xl bg-white text-red-700 hover:bg-slate-100 font-display font-black text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95"
            >
              <Phone className="w-3.5 h-3.5 text-red-600 fill-current shrink-0" />
              <span className="truncate">DIAL 112 RESCUE</span>
            </button>

            {/* Dial 181 Women */}
            <button
              onClick={() => handleExecuteAction('CALL_181')}
              className="py-2 px-2 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95"
            >
              <Flame className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">181 SAKHI HELPLINE</span>
            </button>

            {/* Dial 108 Ambulance */}
            <button
              onClick={() => handleExecuteAction('CALL_108')}
              className="py-2 px-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95"
            >
              <Heart className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">108 AMBULANCE</span>
            </button>

            {/* WhatsApp SOS */}
            <button
              onClick={() => handleExecuteAction('WHATSAPP_SOS')}
              className="py-2 px-2 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">WHATSAPP SOS</span>
            </button>

            {/* Share Live GPS */}
            <button
              onClick={() => handleExecuteAction('SHARE_LOCATION')}
              className="py-2 px-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">SHARE LIVE GPS</span>
            </button>

            {/* Fake Call */}
            <button
              onClick={() => handleExecuteAction('FAKE_CALL')}
              className="py-2 px-2 rounded-2xl bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95"
            >
              <PhoneCall className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">FAKE CALL</span>
            </button>

            {/* Evidence Camera */}
            <button
              onClick={() => handleExecuteAction('OPEN_CAMERA')}
              className="py-2 px-2 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95"
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">EVIDENCE CAMERA</span>
            </button>

            {/* Audio Recording */}
            <button
              onClick={handleStartAudioRecording}
              className={`py-2 px-2 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95 ${
                isRecordingAudio ? 'bg-rose-500 text-white animate-pulse' : 'bg-rose-700 hover:bg-rose-600 text-white'
              }`}
            >
              <Disc className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{isRecordingAudio ? 'STOP AUDIO' : 'AUDIO MEMO'}</span>
            </button>

            {/* Safe Places */}
            <button
              onClick={() => handleExecuteAction('FIND_SAFE_PLACES')}
              className="py-2 px-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">SAFE HAVENS</span>
            </button>

            {/* Nearby Police */}
            <button
              onClick={() => handleExecuteAction('NEARBY_POLICE')}
              className="py-2 px-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95"
            >
              <Siren className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
              <span className="truncate">POLICE RADAR</span>
            </button>

            {/* First Aid */}
            <button
              onClick={() => handleExecuteAction('FIRST_AID')}
              className="py-2 px-2 rounded-2xl bg-rose-800 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95"
            >
              <Heart className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">FIRST AID CPR</span>
            </button>
          </div>

          {/* Trusted Contacts Quick Call Ribbon */}
          {user.contacts && user.contacts.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 no-scrollbar">
              <span className="text-[10px] text-red-300 font-bold shrink-0 flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>Call Saved:</span>
              </span>
              {user.contacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleExecuteAction('CALL_CONTACT', c)}
                  className="px-2.5 py-1.5 rounded-xl bg-red-900/60 hover:bg-red-800/80 border border-red-500/40 text-white text-[11px] font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors active:scale-95"
                >
                  <Phone className="w-3 h-3 text-red-300" />
                  <span>{c.name} ({c.phone})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Emergency Suggestions Chips */}
      <div className="p-2 sm:p-2.5 bg-slate-900/70 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto touch-pan-x no-scrollbar shrink-0">
        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase shrink-0 pl-1">
          Quick Help:
        </span>
        {QUICK_PROMPTS.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip.text)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold shrink-0 transition-all cursor-pointer whitespace-nowrap border flex items-center gap-1 ${
              chip.emergency
                ? 'bg-red-950/60 hover:bg-red-900/60 text-red-300 border-red-500/40 hover:border-red-400 active:scale-95'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:text-white active:scale-95'
            }`}
          >
            <span>{chip.icon}</span>
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {/* Contextual Activity & Safety Suggestion Engine Card */}
      <div className={`border-b transition-all shrink-0 ${
        contextualSuggestion.urgencyLevel === 'alert'
          ? 'bg-gradient-to-r from-red-950/90 via-slate-900 to-amber-950/80 border-red-500/50'
          : contextualSuggestion.urgencyLevel === 'warning'
            ? 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-950 border-amber-500/40'
            : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="p-2.5 sm:p-3 flex flex-col gap-2">
          {/* Card Top Row: Activity & Simulator pill */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base sm:text-lg shrink-0">
                {contextualSuggestion.activityIcon}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-display font-black text-xs sm:text-sm text-white tracking-tight truncate">
                    {contextualSuggestion.activityLabel}
                  </span>
                  <span className={`px-2 py-0.2 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border shrink-0 ${
                    contextualSuggestion.urgencyLevel === 'alert'
                      ? 'bg-red-600/30 text-red-300 border-red-500/50 animate-pulse'
                      : contextualSuggestion.urgencyLevel === 'warning'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {contextualSuggestion.speedKmh > 0 ? `${contextualSuggestion.speedKmh} km/h` : 'Stationary'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Activity Simulator Quick Menu Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSimulationMenuOpen(!isSimulationMenuOpen)}
                  className={`py-1 px-2 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                    simulationMode !== 'live'
                      ? 'bg-amber-600 text-white border-amber-400 shadow'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                  title="Test contextual safety suggestions by simulating vehicle speeds or pedestrian night movement"
                >
                  <Gauge className="w-3 h-3 text-amber-300" />
                  <span className="hidden sm:inline">Activity:</span>
                  <span className="capitalize">{simulationMode === 'live' ? 'Live GPS' : simulationMode}</span>
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>

                {isSimulationMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-30 p-1.5 space-y-1 text-[11px] animate-in fade-in duration-100">
                    <div className="px-2 py-1 text-[9px] font-mono text-slate-400 uppercase font-bold border-b border-slate-800">
                      Simulate Activity Telemetry:
                    </div>
                    <button
                      onClick={() => {
                        setSimulationMode('live');
                        setIsSimulationMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                        simulationMode === 'live' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>📡 Live GPS Speed</span>
                      {simulationMode === 'live' && <span>✓</span>}
                    </button>
                    <button
                      onClick={() => {
                        setSimulationMode('cab');
                        setIsSimulationMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                        simulationMode === 'cab' ? 'bg-amber-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>🚖 Cab Transit (35 km/h)</span>
                      {simulationMode === 'cab' && <span>✓</span>}
                    </button>
                    <button
                      onClick={() => {
                        setSimulationMode('highway');
                        setIsSimulationMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                        simulationMode === 'highway' ? 'bg-red-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>🚄 High-Speed (72 km/h)</span>
                      {simulationMode === 'highway' && <span>✓</span>}
                    </button>
                    <button
                      onClick={() => {
                        setSimulationMode('night_walk');
                        setIsSimulationMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                        simulationMode === 'night_walk' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>🚶 Night Walk (4 km/h)</span>
                      {simulationMode === 'night_walk' && <span>✓</span>}
                    </button>
                    <button
                      onClick={() => {
                        setSimulationMode('sprint');
                        setIsSimulationMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                        simulationMode === 'sprint' ? 'bg-orange-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>🏃 Running / Sprint (12 km/h)</span>
                      {simulationMode === 'sprint' && <span>✓</span>}
                    </button>
                    <button
                      onClick={() => {
                        setSimulationMode('night_stationary');
                        setIsSimulationMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                        simulationMode === 'night_stationary' ? 'bg-purple-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>🌙 Night Stationary (1 AM)</span>
                      {simulationMode === 'night_stationary' && <span>✓</span>}
                    </button>
                  </div>
                )}
              </div>

              {/* Collapse / Expand Toggle */}
              <button
                type="button"
                onClick={() => setIsContextCardExpanded(!isContextCardExpanded)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                title={isContextCardExpanded ? 'Collapse contextual suggestions' : 'Expand contextual suggestions'}
              >
                {isContextCardExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Expanded Proactive Body */}
          {isContextCardExpanded && (
            <div className="space-y-2 pt-0.5 animate-in fade-in duration-150">
              {/* Proactive Tip Banner */}
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-200 leading-relaxed flex items-start gap-2 shadow-inner">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-white block">
                    {contextualSuggestion.proactiveGreeting}
                  </span>
                  <span className="text-slate-300 text-[11px] block">
                    {contextualSuggestion.safetyTip}
                  </span>
                </div>
              </div>

              {/* 1-Tap Proactive Emergency Shortcuts */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold shrink-0 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Proactive Shortcuts:</span>
                </span>
                {contextualSuggestion.suggestedShortcuts.map((shortcut, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleExecuteAction(shortcut.action)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer shadow active:scale-95 ${
                      shortcut.highlight
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                    title={shortcut.description}
                  >
                    <span>{shortcut.icon}</span>
                    <span>{shortcut.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages Thread */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
            >
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 px-1">
                <span>{isUser ? user.name || 'You' : 'Safe AI'}</span>
                <span>•</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {msg.isEmergency && (
                  <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-500/40 font-bold uppercase text-[9px]">
                    EMERGENCY
                  </span>
                )}
                {!isUser && (
                  <button
                    onClick={() => handleSpeakText(msg.text, msg.id)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 cursor-pointer ml-1"
                    title={currentlySpeakingId === msg.id ? 'Stop reading' : 'Read aloud with audio speech'}
                  >
                    <Volume2 className={`w-3 h-3 ${currentlySpeakingId === msg.id ? 'text-emerald-400 animate-pulse' : ''}`} />
                  </button>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[88%] sm:max-w-[78%] rounded-3xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-lg ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-br-sm'
                    : msg.isEmergency
                      ? 'bg-gradient-to-br from-slate-900 to-red-950/80 border border-red-500/50 text-slate-100 rounded-bl-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>

              {/* Action Buttons attached to assistant message */}
              {!isUser && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-w-[88%] sm:max-w-[78%] pt-1">
                  {msg.suggestedActions.map((action, idx) => {
                    const actionInfo = getActionLabel(action);
                    return (
                      <button
                        key={idx}
                        onClick={() => handleExecuteAction(action)}
                        className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer active:scale-95 ${actionInfo.color}`}
                      >
                        {actionInfo.icon}
                        <span>{actionInfo.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 p-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Safe AI analyzing situation &amp; preparing response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-2.5 sm:p-4 bg-slate-900/90 border-t border-slate-800 space-y-1.5 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-1.5 sm:gap-2"
        >
          {speechSupported && (
            <button
              type="button"
              onClick={toggleMicListening}
              className={`p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer shrink-0 ${
                isListeningMic 
                  ? 'bg-red-600 text-white border-red-400 animate-pulse shadow-lg' 
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title={isListeningMic ? 'Listening... click to stop' : 'Speak your distress command'}
            >
              {isListeningMic ? <Mic className="w-5 h-5 animate-bounce" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isListeningMic 
                ? 'Listening to your voice...' 
                : 'Ask anything (e.g. "im in dngr", "smone folwing me", "plice bulao", "cpr", "start sos")...'
            }
            className="flex-1 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 sm:p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold cursor-pointer transition-all shadow-lg active:scale-95 shrink-0"
            aria-label="Send Message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500 px-1 font-mono">
          <span>Safe AI understands mis-printed words and triggers all SAFE BHARAT features.</span>
          <span>For physical police response, dial 112 directly.</span>
        </div>
      </div>

      {/* Evidence Camera Capture Modal */}
      {isCameraOpen && (
        <CameraCaptureModal
          location={location}
          onClose={() => setIsCameraOpen(false)}
          onPhotoCaptured={() => {
            showActionNotice('📷 Evidence photo captured with GPS watermark.');
          }}
        />
      )}

      {/* First Aid Guide Modal */}
      {isFirstAidOpen && (
        <FirstAidModal
          onClose={() => setIsFirstAidOpen(false)}
          onCallAmbulance={() => {
            setIsFirstAidOpen(false);
            handleExecuteAction('CALL_108');
          }}
        />
      )}

    </div>
  );
};
