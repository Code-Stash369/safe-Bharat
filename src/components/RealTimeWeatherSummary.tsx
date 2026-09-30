import React, { useState, useEffect } from 'react';
import { 
  CloudRain, 
  Sun, 
  Wind, 
  Droplets, 
  AlertTriangle, 
  Compass, 
  MapPin, 
  RefreshCw, 
  Share2, 
  ShieldCheck, 
  Thermometer, 
  Umbrella, 
  Zap, 
  Eye, 
  ArrowUpRight,
  TrendingDown,
  Clock
} from 'lucide-react';
import { LocationInfo } from '../types';
import { LiveWeatherData, weatherService } from '../services/weatherService';
import { audioService } from '../services/audioService';
import { notificationService } from '../services/notificationService';
import { openExternalLink } from '../services/linkService';

interface RealTimeWeatherSummaryProps {
  location: LocationInfo | null;
  onRequestLocation: () => Promise<LocationInfo | null>;
  onTriggerSOS?: () => void;
}

const PRESET_LOCATIONS = [
  { name: 'Current GPS', lat: 0, lng: 0, isGps: true },
  { name: 'New Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Guwahati', lat: 26.1445, lng: 91.7362 },
];

export const RealTimeWeatherSummary: React.FC<RealTimeWeatherSummaryProps> = ({
  location,
  onRequestLocation,
  onTriggerSOS,
}) => {
  const [weatherData, setWeatherData] = useState<LiveWeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('Current GPS');

  const fetchWeatherForCoords = async (lat: number, lng: number, cityName?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await weatherService.fetchLiveWeather(lat, lng, cityName);
      setWeatherData(data);
    } catch (err: any) {
      console.error('Weather fetch error:', err);
      setError('Unable to reach meteorological station. Retrying...');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPreset === 'Current GPS') {
      if (location) {
        fetchWeatherForCoords(location.lat, location.lng);
      } else {
        // Fallback to New Delhi default until GPS is granted
        fetchWeatherForCoords(28.6139, 77.2090, 'New Delhi (Default)');
      }
    }
  }, [location, selectedPreset]);

  const handleSelectPreset = async (preset: typeof PRESET_LOCATIONS[0]) => {
    setSelectedPreset(preset.name);
    if (preset.isGps) {
      if (location) {
        fetchWeatherForCoords(location.lat, location.lng);
      } else {
        const loc = await onRequestLocation();
        if (loc) {
          fetchWeatherForCoords(loc.lat, loc.lng);
        } else {
          fetchWeatherForCoords(28.6139, 77.2090, 'New Delhi');
        }
      }
    } else {
      fetchWeatherForCoords(preset.lat, preset.lng, preset.name);
    }
  };

  const handleManualRefresh = () => {
    if (weatherData) {
      fetchWeatherForCoords(weatherData.latitude, weatherData.longitude, weatherData.city);
      audioService.playBeep(880, 0.08);
    }
  };

  const handleShareWeatherAdvisory = () => {
    if (!weatherData) return;
    const { city, temperature, weatherDescription, disasterAssessment } = weatherData;
    const warning = disasterAssessment.primaryWarning ? `\n⚠️ ALERT: ${disasterAssessment.primaryWarning}` : '';
    const text = encodeURIComponent(
      `🌦️ Safe Bharat Real-Time Climate Report for ${city}:\n` +
      `Temperature: ${temperature}°C · Condition: ${weatherDescription}\n` +
      `Disaster Risk: Flood [${disasterAssessment.floodRisk}] · Heat [${disasterAssessment.heatRisk}] · Wind [${disasterAssessment.stormRisk}]` +
      `${warning}\nGuidance: ${disasterAssessment.actionAdvice}\n` +
      `Stay alert and prepared with Safe Bharat National Disaster Command.`
    );
    openExternalLink(`https://wa.me/?text=${text}`);
  };

  const getWeatherIcon = (code: number) => {
    if (code >= 95) return <Zap className="w-8 h-8 text-amber-400 animate-bounce" />;
    if (code >= 61 || code >= 80) return <CloudRain className="w-8 h-8 text-blue-400" />;
    if (code >= 51) return <Umbrella className="w-8 h-8 text-cyan-400" />;
    if (code <= 1) return <Sun className="w-8 h-8 text-amber-400" />;
    return <Wind className="w-8 h-8 text-slate-300" />;
  };

  return (
    <section className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
      
      {/* Header & Location Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0">
            <CloudRain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-black text-lg sm:text-xl text-white">
                Live GPS Weather &amp; Disaster Index
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Real-Time Open-Meteo
              </span>
            </div>
            <p className="text-xs text-slate-400">
              High-resolution meteorological telemetry for flood, storm, and heatwave disaster readiness.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
            title="Refresh Live Weather"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={handleShareWeatherAdvisory}
            className="py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Advisory</span>
          </button>
        </div>
      </div>

      {/* Preset Location Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {PRESET_LOCATIONS.map((preset) => {
          const isSelected = selectedPreset === preset.name;
          return (
            <button
              key={preset.name}
              onClick={() => handleSelectPreset(preset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {preset.isGps && <MapPin className={`w-3 h-3 ${location ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />}
              <span>{preset.name}</span>
            </button>
          );
        })}
      </div>

      {loading && !weatherData ? (
        <div className="p-8 text-center space-y-2">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Locking GPS coordinates &amp; streaming meteorological data...</p>
        </div>
      ) : weatherData ? (
        <div className="space-y-4">
          
          {/* Main Weather Card */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 border border-slate-800 p-5 space-y-4">
            
            {/* Top row: City & Main Temp */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-white font-bold">{weatherData.city}</span>
                  <span className="font-mono text-[11px]">
                    ({weatherData.latitude.toFixed(3)}°N, {weatherData.longitude.toFixed(3)}°E)
                  </span>
                </div>

                <div className="flex items-baseline gap-3">
                  <div className="font-display font-black text-4xl sm:text-5xl text-white tracking-tight">
                    {weatherData.temperature}°C
                  </div>
                  <div className="text-xs text-slate-400">
                    Feels like <strong className="text-slate-200">{weatherData.apparentTemperature}°C</strong>
                  </div>
                </div>

                <div className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
                  <span>{weatherData.weatherDescription}</span>
                  <span className="text-xs text-slate-500">· Updated just now</span>
                </div>
              </div>

              {/* Weather icon & Quick Threat pill */}
              <div className="flex items-center gap-4 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 self-start sm:self-auto">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  {getWeatherIcon(weatherData.weatherCode)}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Disaster Risk
                  </span>
                  <span className={`text-sm font-black uppercase ${
                    weatherData.disasterAssessment.floodRisk === 'Critical' || weatherData.disasterAssessment.heatRisk === 'Severe'
                      ? 'text-red-400 animate-pulse'
                      : weatherData.disasterAssessment.floodRisk === 'High' || weatherData.disasterAssessment.heatRisk === 'High'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}>
                    {weatherData.disasterAssessment.primaryWarning ? 'ELEVATED HAZARD' : 'NORMAL / MONITORING'}
                  </span>
                </div>
              </div>
            </div>

            {/* Disaster Threat Alert Banner if active */}
            {weatherData.disasterAssessment.primaryWarning && (
              <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-600/60 text-xs text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <strong className="text-white block font-bold">
                      {weatherData.disasterAssessment.primaryWarning}
                    </strong>
                    <p className="text-red-200/90 leading-relaxed">
                      {weatherData.disasterAssessment.actionAdvice}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (weatherData && weatherData.disasterAssessment.primaryWarning) {
                      notificationService.sendNotification(`🚨 ${weatherData.disasterAssessment.primaryWarning}`, {
                        body: `${weatherData.city}: ${weatherData.disasterAssessment.actionAdvice}`,
                        tag: `warning-${weatherData.city}`,
                        requireInteraction: true,
                      });
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shrink-0 self-start sm:self-auto cursor-pointer shadow-md transition-colors"
                >
                  Push Alert to Device
                </button>
              </div>
            )}

            {/* Core Disaster Telemetry Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80 text-center">
              
              {/* Rain & Flood */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 space-y-1">
                <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase text-slate-400">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" />
                  <span>Rain Rate</span>
                </div>
                <div className="font-mono text-base font-bold text-white">
                  {weatherData.rain} <span className="text-[10px] font-normal text-slate-400">mm/h</span>
                </div>
                <div className="text-[10px] font-semibold text-blue-300">
                  Flood Risk: <strong>{weatherData.disasterAssessment.floodRisk}</strong>
                </div>
              </div>

              {/* Wind Gusts */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 space-y-1">
                <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase text-slate-400">
                  <Wind className="w-3.5 h-3.5 text-teal-400" />
                  <span>Wind Gusts</span>
                </div>
                <div className="font-mono text-base font-bold text-white">
                  {weatherData.windGusts} <span className="text-[10px] font-normal text-slate-400">km/h</span>
                </div>
                <div className="text-[10px] font-semibold text-teal-300">
                  Storm Risk: <strong>{weatherData.disasterAssessment.stormRisk}</strong>
                </div>
              </div>

              {/* Humidity & UV */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 space-y-1">
                <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase text-slate-400">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>UV Index Max</span>
                </div>
                <div className="font-mono text-base font-bold text-white">
                  {weatherData.uvIndex} <span className="text-[10px] font-normal text-slate-400">/ 11</span>
                </div>
                <div className="text-[10px] font-semibold text-amber-300">
                  Heat Stress: <strong>{weatherData.disasterAssessment.heatRisk}</strong>
                </div>
              </div>

              {/* Barometric Pressure */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 space-y-1">
                <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase text-slate-400">
                  <Compass className="w-3.5 h-3.5 text-purple-400" />
                  <span>Air Pressure</span>
                </div>
                <div className="font-mono text-base font-bold text-white">
                  {weatherData.surfacePressure} <span className="text-[10px] font-normal text-slate-400">hPa</span>
                </div>
                <div className="text-[10px] font-semibold text-purple-300">
                  {weatherData.surfacePressure < 1000 ? 'Low Pressure Watch' : 'Barometer Stable'}
                </div>
              </div>

            </div>

            {/* 12-Hour Hourly Trend Bar */}
            {weatherData.hourly && weatherData.hourly.time.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Next 12 Hours Forecast Trend</span>
                  </span>
                  <span>Temp &amp; Rain Probability</span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {weatherData.hourly.time.map((timeStr, idx) => {
                    const hour = new Date(timeStr).getHours();
                    const formattedHour = `${hour % 12 === 0 ? 12 : hour % 12} ${hour >= 12 ? 'PM' : 'AM'}`;
                    const temp = weatherData.hourly.temperature[idx];
                    const rainProb = weatherData.hourly.precipitationProbability[idx];

                    return (
                      <div 
                        key={idx}
                        className="flex-none p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-center min-w-[72px] space-y-1"
                      >
                        <div className="text-[10px] text-slate-400 font-mono">{formattedHour}</div>
                        <div className="font-mono text-xs font-bold text-white">{temp}°C</div>
                        <div className={`text-[10px] font-semibold flex items-center justify-center gap-0.5 ${
                          rainProb > 40 ? 'text-blue-400 font-bold' : 'text-slate-500'
                        }`}>
                          <Droplets className="w-2.5 h-2.5" />
                          <span>{rainProb}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Guidance Footnote */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-center justify-between gap-3">
              <div>
                <strong className="text-white">Live Preparedness Action: </strong>
                <span>{weatherData.disasterAssessment.actionAdvice}</span>
              </div>
              {weatherData.disasterAssessment.floodRisk === 'Critical' && onTriggerSOS && (
                <button
                  onClick={onTriggerSOS}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shrink-0 cursor-pointer"
                >
                  Trigger SOS
                </button>
              )}
            </div>

          </div>

        </div>
      ) : (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/40 text-xs text-red-300">
          {error || 'Unable to load real-time weather summary.'}
        </div>
      )}

    </section>
  );
};
