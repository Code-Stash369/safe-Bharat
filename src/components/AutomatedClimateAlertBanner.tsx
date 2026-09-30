import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  CloudRain, 
  Sun, 
  Wind, 
  Droplets, 
  RefreshCw, 
  CheckCircle2, 
  Share2, 
  Phone, 
  X, 
  ExternalLink, 
  Zap, 
  Bell, 
  SlidersHorizontal,
  Flame,
  ThermometerSnowflake,
  ShieldCheck
} from 'lucide-react';
import { LocationInfo } from '../types';
import { LiveWeatherData, weatherService } from '../services/weatherService';
import { audioService } from '../services/audioService';
import { notificationService } from '../services/notificationService';
import { openExternalLink } from '../services/linkService';

interface AutomatedClimateAlertBannerProps {
  location: LocationInfo | null;
  onRequestLocation: () => Promise<LocationInfo | null>;
  onTriggerSOS?: () => void;
}

export const AutomatedClimateAlertBanner: React.FC<AutomatedClimateAlertBannerProps> = ({
  location,
  onRequestLocation,
  onTriggerSOS,
}) => {
  const [weatherData, setWeatherData] = useState<LiveWeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [secondsUntilNextPoll, setSecondsUntilNextPoll] = useState<number>(60);
  const [lastPolledAt, setLastPolledAt] = useState<Date>(new Date());
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [simulatedWarning, setSimulatedWarning] = useState<string | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  const prevWarningRef = useRef<string | null>(null);

  const pollWeatherData = async () => {
    setLoading(true);
    const targetLat = location?.lat ?? 28.6139;
    const targetLng = location?.lng ?? 77.2090;

    try {
      const data = await weatherService.fetchLiveWeather(targetLat, targetLng);
      setWeatherData(data);
      setLastPolledAt(new Date());
      setSecondsUntilNextPoll(60);

      // Check if severe warning triggered
      const activeWarning = simulatedWarning || data.disasterAssessment.primaryWarning;
      if (activeWarning && activeWarning !== prevWarningRef.current) {
        prevWarningRef.current = activeWarning;
        setIsDismissed(false); // Un-dismiss for newly arrived urgent warning

        if (!isAudioMuted) {
          audioService.playBeep(980, 0.25);
        }

        // Trigger native notification API
        notificationService.notifyWeatherDisaster(
          data.city,
          activeWarning,
          data.disasterAssessment.actionAdvice
        );
      }
    } catch (err) {
      console.warn('Weather polling failed, falling back:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and on location change
  useEffect(() => {
    pollWeatherData();
  }, [location?.lat, location?.lng]);

  // Automated 60-second polling interval
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilNextPoll((prev) => {
        if (prev <= 1) {
          pollWeatherData();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [location?.lat, location?.lng, simulatedWarning]);

  // Handle simulation triggers
  const handleSimulateWarning = (type: 'heatwave' | 'heavy_rain' | 'clear') => {
    if (type === 'clear') {
      setSimulatedWarning(null);
      prevWarningRef.current = null;
      return;
    }

    const warningText = type === 'heatwave'
      ? 'CRITICAL HEATWAVE (LOO) WARNING: Surface temperatures exceeding 43.5°C with severe desiccating winds. High UV Index 11+.'
      : 'RED ALERT: CLOUDBURST & UNDERPASS INUNDATION: Torrential rain 34 mm/h detected. Low-lying arterial subways submerged.';

    setSimulatedWarning(warningText);
    setIsDismissed(false);
    audioService.playBeep(1020, 0.3);

    notificationService.sendNotification(`🚨 CLIMATE RED ALERT: ${type.toUpperCase()}`, {
      body: warningText,
      requireInteraction: true,
      tag: `climate-${type}`,
    });
  };

  const handleShareAdvisory = () => {
    const activeWarning = simulatedWarning || weatherData?.disasterAssessment.primaryWarning || 'Normal weather conditions';
    const city = weatherData?.city || 'Local Region';
    const text = encodeURIComponent(
      `🚨 SAFE BHARAT CLIMATE ADVISORY (${city.toUpperCase()}):\n` +
      `${activeWarning}\n\n` +
      `Temperature: ${weatherData?.temperature}°C (Feels like: ${weatherData?.apparentTemperature}°C)\n` +
      `Rainfall: ${weatherData?.rain} mm/h | Wind Gusts: ${weatherData?.windSpeed} km/h\n` +
      `Guidance: ${weatherData?.disasterAssessment.actionAdvice}\n\n` +
      `Dial 1070 for State Disaster Control Room.`
    );
    openExternalLink(`https://wa.me/?text=${text}`);
  };

  const currentWarning = simulatedWarning || weatherData?.disasterAssessment.primaryWarning;
  const isHighPriority = !!currentWarning;

  if (isDismissed && isHighPriority) {
    return (
      <div className="bg-red-950/80 border border-red-500/40 rounded-2xl p-2.5 px-4 flex items-center justify-between text-xs text-red-200">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
          <span className="font-bold truncate max-w-sm sm:max-w-xl">
            {currentWarning}
          </span>
        </div>
        <button
          onClick={() => setIsDismissed(false)}
          className="text-xs text-white font-bold underline cursor-pointer ml-2 shrink-0"
        >
          View Alert Details
        </button>
      </div>
    );
  }

  return (
    <div className={`relative rounded-3xl border transition-all duration-300 overflow-hidden shadow-xl ${
      isHighPriority
        ? 'bg-gradient-to-r from-red-950 via-slate-950 to-rose-950/90 border-red-500/80 shadow-red-950/50'
        : 'bg-gradient-to-r from-emerald-950/50 via-slate-950 to-blue-950/40 border-slate-800/90'
    }`}>
      
      {/* Top micro-bar: Polling telemetry status */}
      <div className="bg-black/40 border-b border-white/5 px-4 py-1.5 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${
            loading ? 'bg-amber-400 animate-spin' : isHighPriority ? 'bg-red-500 animate-ping' : 'bg-emerald-400 animate-pulse'
          }`} />
          <span className="font-mono uppercase font-bold tracking-wider text-slate-300 truncate">
            Automated Climate Sentinel · {weatherData?.city || 'Local GPS Area'}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px]">
          <span className="hidden sm:inline text-slate-400">
            Next telemetry poll: <strong className="text-emerald-400">{secondsUntilNextPoll}s</strong>
          </span>
          <button
            onClick={pollWeatherData}
            disabled={loading}
            className="flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer"
            title="Poll weather immediately"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Poll Now</span>
          </button>
        </div>
      </div>

      {/* Main Alert Content Container */}
      <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left column: Warning description and telemetry */}
        <div className="flex items-start gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
            isHighPriority 
              ? 'bg-red-600 text-white shadow-red-600/50 animate-bounce' 
              : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
          }`}>
            {isHighPriority ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <ShieldCheck className="w-6 h-6" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider ${
                isHighPriority
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {isHighPriority ? '🚨 HIGH-PRIORITY CLIMATE WARNING' : 'NORMAL / MONITORING'}
              </span>

              {weatherData && (
                <span className="text-xs font-mono text-slate-300">
                  {weatherData.temperature}°C · Feels like {weatherData.apparentTemperature}°C · {weatherData.weatherDescription}
                </span>
              )}
            </div>

            <h3 className={`font-display font-black text-sm sm:text-base leading-tight ${
              isHighPriority ? 'text-white' : 'text-slate-100'
            }`}>
              {currentWarning || 'Atmospheric conditions stable. Continuous radar scanning active.'}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              {weatherData?.disasterAssessment.actionAdvice || 
                'Keep 72h emergency kits accessible. Monitor real-time local updates for sudden cloudburst or squall activity.'}
            </p>
          </div>
        </div>

        {/* Right column: Action buttons & Drill Simulator */}
        <div className="flex items-center gap-2 self-start lg:self-center shrink-0 flex-wrap">
          {isHighPriority && (
            <button
              onClick={handleShareAdvisory}
              className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Advisory</span>
            </button>
          )}

          <a
            href="tel:1070"
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="State Disaster Relief Helpline"
          >
            <Phone className="w-3.5 h-3.5 text-cyan-400" />
            <span>Disaster 1070</span>
          </a>

          {/* Quick Drill Simulator Dropdown / Buttons */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => handleSimulateWarning('heatwave')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                simulatedWarning?.includes('HEATWAVE')
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-amber-400 hover:bg-amber-950/40'
              }`}
              title="Test Automated Heatwave Alert"
            >
              🔥 Heatwave
            </button>
            <button
              onClick={() => handleSimulateWarning('heavy_rain')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                simulatedWarning?.includes('CLOUDBURST')
                  ? 'bg-cyan-500 text-slate-950 font-black'
                  : 'text-cyan-400 hover:bg-cyan-950/40'
              }`}
              title="Test Automated Heavy Rain Alert"
            >
              ⛈️ Heavy Rain
            </button>
            {simulatedWarning && (
              <button
                onClick={() => handleSimulateWarning('clear')}
                className="px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-white"
              >
                Reset
              </button>
            )}
          </div>

          {isHighPriority && (
            <button
              onClick={() => setIsDismissed(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
