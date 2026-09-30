import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Wind, 
  Droplets, 
  Sun, 
  CheckCircle2, 
  Clock, 
  Flame, 
  ShieldAlert, 
  Compass, 
  ArrowUpRight,
  TrendingUp,
  MapPin,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { 
  CityEnvironmentData, 
  DailyMission, 
  HazardAlert, 
  LocationInfo,
  NavigationTab, 
  UserProfile 
} from '../types';
import { 
  CITIES_ENVIRONMENT, 
  CURRENT_HAZARD_ALERTS, 
  IKS_EXEMPLARS 
} from '../data/initialData';
import { audioService } from '../services/audioService';
import { RealTimeWeatherSummary } from './RealTimeWeatherSummary';
import confetti from 'canvas-confetti';

interface DailyUpdateSystemProps {
  user: UserProfile;
  missions: DailyMission[];
  onToggleMission: (id: string) => void;
  setActiveTab: (tab: NavigationTab) => void;
  onTriggerSOS: () => void;
  location: LocationInfo | null;
  onRequestLocation: () => Promise<LocationInfo | null>;
}

export const DailyUpdateSystem: React.FC<DailyUpdateSystemProps> = ({
  user,
  missions,
  onToggleMission,
  setActiveTab,
  onTriggerSOS,
  location,
  onRequestLocation,
}) => {
  const [selectedCity, setSelectedCity] = useState<CityEnvironmentData>(CITIES_ENVIRONMENT[0]);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'severe'>('all');
  const [dailyWisdom] = useState(IKS_EXEMPLARS[0]);

  // Keep live time clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setCurrentDateFormatted(
        now.toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMissionClick = (id: string, currentlyCompleted: boolean) => {
    if (!currentlyCompleted) {
      audioService.playSuccessChime();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10b981', '#3b82f6', '#f59e0b', '#22c55e'],
        });
      } catch {}
    }
    onToggleMission(id);
  };

  const filteredAlerts: HazardAlert[] = filterSeverity === 'all' 
    ? CURRENT_HAZARD_ALERTS 
    : CURRENT_HAZARD_ALERTS.filter(a => a.severity === 'severe' || a.severity === 'critical');

  const completedCount = missions.filter(m => m.completed).length;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Hero Daily Command Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border border-emerald-800/40 p-5 sm:p-7 shadow-2xl">
        {/* Ambient background glow & grid */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Daily Situation Report
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {currentDateFormatted}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight text-balance">
              Daily Bharat Command Center
            </h1>
            
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Nationwide civic safety briefings, environmental telemetries, real-time hazard alerts, and citizen sustainability missions updated daily.
            </p>
          </div>

          {/* Time & Streak Badge */}
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-700/60 rounded-2xl p-3 sm:p-4 backdrop-blur-md self-start md:self-auto">
            <div className="text-right">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Indian Standard Time
              </div>
              <div className="font-mono text-lg sm:text-xl font-bold text-white tracking-tight">
                {currentTime || '12:00:00 PM'}
              </div>
            </div>
            <div className="h-9 w-px bg-slate-700" />
            <div className="flex items-center gap-2 pl-1">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                  Daily Streak
                </div>
                <div className="font-display font-black text-lg text-white">
                  {user.streak} Days 🔥
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Jump Action Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
          <button
            onClick={onTriggerSOS}
            className="flex items-center justify-between p-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-700/50 text-red-200 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-xs font-bold text-white">Emergency SOS</div>
                <div className="text-[10px] text-red-300/80">Press &amp; Hold Alert</div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-red-400 opacity-60 group-hover:opacity-100" />
          </button>

          <button
            onClick={() => setActiveTab('women')}
            className="flex items-center justify-between p-3 rounded-xl bg-pink-950/40 hover:bg-pink-900/60 border border-pink-700/50 text-pink-200 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <Flame className="w-5 h-5 text-pink-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-xs font-bold text-white">Women Shield</div>
                <div className="text-[10px] text-pink-300/80">Escort &amp; Fake Call</div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-pink-400 opacity-60 group-hover:opacity-100" />
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className="flex items-center justify-between p-3 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-700/50 text-amber-200 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <Compass className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-xs font-bold text-white">Report Hazard</div>
                <div className="text-[10px] text-amber-300/80">Flood / Waste / Crime</div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-amber-400 opacity-60 group-hover:opacity-100" />
          </button>

          <button
            onClick={() => setActiveTab('green')}
            className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/50 text-emerald-200 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="text-xs font-bold text-white">Green Karma</div>
                <div className="text-[10px] text-emerald-300/80">Earn Points &amp; Ranks</div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-emerald-400 opacity-60 group-hover:opacity-100" />
          </button>
        </div>
      </section>

      {/* Real-Time Live GPS Weather & Disaster Preparedness Summary */}
      <RealTimeWeatherSummary
        location={location}
        onRequestLocation={onRequestLocation}
        onTriggerSOS={onTriggerSOS}
      />

      {/* Main Grid: City Environmental Telemetry + Daily Missions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* City Environment & AQI Telemetry (5 cols on lg) */}
        <section className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-emerald-400" />
              <h2 className="font-display font-bold text-lg text-white">
                Live City Environment &amp; AQI
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Daily Telemetry</span>
          </div>

          {/* City Selection Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CITIES_ENVIRONMENT.map((c) => {
              const isSelected = selectedCity.city === c.city;
              return (
                <button
                  key={c.city}
                  onClick={() => setSelectedCity(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {c.city}
                </button>
              );
            })}
          </div>

          {/* Selected City Metric Card */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{selectedCity.city}, {selectedCity.state}</span>
                </div>
                <div className="text-3xl font-display font-black text-white mt-1">
                  {selectedCity.temp}°C
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  {selectedCity.condition}
                </div>
              </div>

              {/* AQI Badge */}
              <div className="text-right">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Air Quality Index
                </div>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span className={`text-2xl font-mono font-black ${
                    selectedCity.aqi < 100 
                      ? 'text-emerald-400' 
                      : selectedCity.aqi < 200 
                      ? 'text-amber-400' 
                      : 'text-red-400'
                  }`}>
                    {selectedCity.aqi}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    selectedCity.aqiStatus === 'Good'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : selectedCity.aqiStatus === 'Moderate'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {selectedCity.aqiStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Parameter Rings */}
            <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/80 text-center">
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
                  <Wind className="w-3 h-3 text-cyan-400" /> PM2.5
                </div>
                <div className="text-sm font-mono font-bold text-white mt-0.5">
                  {selectedCity.pm25} <span className="text-[9px] text-slate-400 font-normal">µg/m³</span>
                </div>
              </div>

              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
                  <Droplets className="w-3 h-3 text-blue-400" /> Humidity
                </div>
                <div className="text-sm font-mono font-bold text-white mt-0.5">
                  {selectedCity.humidity}%
                </div>
              </div>

              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
                  <Sun className="w-3 h-3 text-amber-400" /> UV Index
                </div>
                <div className="text-sm font-mono font-bold text-white mt-0.5">
                  {selectedCity.uvIndex} <span className="text-[9px] text-amber-400 font-normal">High</span>
                </div>
              </div>
            </div>

            {/* Health Advisory */}
            <div className="bg-slate-900/80 p-3 rounded-xl border-l-4 border-emerald-500 text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-white block mb-0.5">Health Guidance:</span>
              {selectedCity.advisory}
            </div>
          </div>
        </section>

        {/* Daily Green & Safety Missions (7 cols on lg) */}
        <section className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="font-display font-bold text-lg text-white">
                  Today's Citizen Quests
                </h2>
                <p className="text-xs text-slate-400">
                  Complete daily action items to earn Green Karma and build your community shield.
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-emerald-400">
                {completedCount}/{missions.length} Done
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
              style={{ width: `${(completedCount / missions.length) * 100}%` }}
            />
          </div>

          {/* Missions List */}
          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {missions.map((mission) => {
              return (
                <div
                  key={mission.id}
                  onClick={() => handleMissionClick(mission.id, mission.completed)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                    mission.completed
                      ? 'bg-emerald-950/20 border-emerald-700/40 text-slate-300'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-white hover:bg-slate-950'
                  }`}
                >
                  <button
                    className={`mt-0.5 flex-none w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                      mission.completed
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'border-slate-600 hover:border-emerald-500 bg-slate-900'
                    }`}
                    aria-label={mission.completed ? 'Mark uncompleted' : 'Mark completed'}
                  >
                    {mission.completed && <CheckCircle2 className="w-4 h-4" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-sm font-bold truncate ${mission.completed ? 'line-through text-slate-400' : 'text-white'}`}>
                        {mission.title}
                      </h3>
                      <span className="flex-none px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        +{mission.points} Pts
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1 leading-normal">
                      {mission.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/90 mt-1.5 font-medium">
                      <Sparkles className="w-3 h-3" />
                      <span>{mission.impactMetrics}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Real-Time Hazard Advisories & Alerts Feed */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
            <div>
              <h2 className="font-display font-bold text-lg text-white">
                Active National Hazard Warnings &amp; Advisories
              </h2>
              <p className="text-xs text-slate-400">
                Synchronized disaster bulletins from IMD, NDMA, and verified field observer nodes.
              </p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setFilterSeverity('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterSeverity === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Alerts ({CURRENT_HAZARD_ALERTS.length})
            </button>
            <button
              onClick={() => setFilterSeverity('severe')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterSeverity === 'severe'
                  ? 'bg-red-900/60 text-red-200 border border-red-700/50'
                  : 'text-slate-400 hover:text-red-300'
              }`}
            >
              Severe / Critical
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredAlerts.map((alert) => {
            const isSevere = alert.severity === 'severe' || alert.severity === 'critical';
            return (
              <div 
                key={alert.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isSevere 
                    ? 'bg-red-950/20 border-red-800/60 shadow-md shadow-red-950/20' 
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      alert.severity === 'severe' 
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40' 
                        : alert.severity === 'warning'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {alert.region}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {alert.date}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-white mt-2 text-balance leading-snug">
                  {alert.title}
                </h3>

                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {alert.details}
                </p>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-start gap-2 text-xs font-medium text-amber-300/90">
                  <span className="font-bold text-white shrink-0">Guidance:</span>
                  <span>{alert.actionGuidance}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Daily IKS Ecological Wisdom Spotlight */}
      <section className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-800/30 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex-none flex items-center justify-center text-3xl">
          🏺
        </div>
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Indian Knowledge Systems (IKS) Daily Capsule
            </span>
            <span className="text-xs text-slate-400">
              {dailyWisdom.region}
            </span>
          </div>
          <h3 className="font-display font-bold text-lg text-white">
            {dailyWisdom.title} · {dailyWisdom.hindiTitle}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
            {dailyWisdom.quote}
          </p>
          <div className="pt-1 flex items-center gap-4">
            <button
              onClick={() => setActiveTab('iks')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Explore All Ancient Indian Eco-Techniques</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
