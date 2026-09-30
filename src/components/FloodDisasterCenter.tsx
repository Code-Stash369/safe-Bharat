import React, { useState, useEffect } from 'react';
import { 
  Waves, 
  Volume2, 
  VolumeX, 
  CheckSquare, 
  Square, 
  Share2, 
  AlertTriangle, 
  ShieldCheck, 
  Send, 
  MapPin, 
  Flame, 
  Activity,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { LocationInfo } from '../types';
import { DISASTER_PREPAREDNESS_ITEMS } from '../data/initialData';
import { audioService } from '../services/audioService';
import { storageService } from '../services/storageService';
import { openExternalLink } from '../services/linkService';
import { RealTimeWeatherSummary } from './RealTimeWeatherSummary';

interface FloodDisasterCenterProps {
  location: LocationInfo | null;
  onRequestLocation: () => Promise<LocationInfo | null>;
  isSirenActive: boolean;
  onToggleSiren: () => void;
  onTriggerSOS?: () => void;
}

export const FloodDisasterCenter: React.FC<FloodDisasterCenterProps> = ({
  location,
  onRequestLocation,
  isSirenActive,
  onToggleSiren,
  onTriggerSOS,
}) => {
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [roadName, setRoadName] = useState<string>('SV Road Underpass');
  const [waterDepth, setWaterDepth] = useState<string>('2.5 Feet (Vehicles Submerged)');
  const [customRoadNote, setCustomRoadNote] = useState<string>('Traffic diversion toward Flyover. Do not attempt crossing.');
  const [activeGuide, setActiveGuide] = useState<'flood' | 'earthquake' | 'cyclone' | 'fire'>('flood');

  useEffect(() => {
    setChecklist(storageService.getChecklistState());
  }, []);

  const handleToggleCheckItem = (id: string) => {
    const updated = { ...checklist, [id]: !checklist[id] };
    setChecklist(updated);
    storageService.saveChecklistState(updated);
    audioService.playBeep(720, 0.08);
  };

  const checkedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = DISASTER_PREPAREDNESS_ITEMS.length;
  const readinessPct = Math.round((checkedCount / totalCount) * 100);

  const handleShareRoadWarning = () => {
    const coords = location 
      ? `\n📍 Coordinates: https://www.google.com/maps?q=${location.lat.toFixed(6)},${location.lng.toFixed(6)}`
      : '';
    const text = encodeURIComponent(
      `⚠️ URGENT ROAD HAZARD: FLOODED / IMPASSABLE STRETCH ⚠️\nLocation: ${roadName}\nWater Depth: ${waterDepth}\nAdvisory: ${customRoadNote}${coords}\nGenerated via Safe Bharat Community Warning Network. Avoid this route!`
    );
    openExternalLink(`https://wa.me/?text=${text}`);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Banner */}
      <section className="bg-gradient-to-br from-cyan-950 via-slate-900 to-slate-950 border border-cyan-800/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Disaster &amp; Monsoon Command
              </span>
              <span className="text-xs text-slate-400">NDRF &amp; Civil Defense Alignment</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
              Flood Safety &amp; Disaster Resilience
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Audible flood siren drills, community waterlogging warning builder, emergency go-bag checklist, and survival protocols.
            </p>
          </div>

          <button
            onClick={onToggleSiren}
            className={`w-full sm:w-auto py-3 px-5 rounded-2xl font-display font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
              isSirenActive
                ? 'bg-red-600 text-white animate-pulse shadow-red-600/50'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
            }`}
          >
            {isSirenActive ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            <span>{isSirenActive ? 'STOP SIREN ALARM' : 'START SIREN DRILL'}</span>
          </button>
        </div>
      </section>

      {/* Real-time Local GPS Climate & Disaster Telemetry */}
      <RealTimeWeatherSummary
        location={location}
        onRequestLocation={onRequestLocation}
        onTriggerSOS={onTriggerSOS}
      />

      {/* Flooded Road Warning Builder Card */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
          <div>
            <h2 className="font-display font-bold text-lg text-white">
              Flooded Road Hazard Warning Builder
            </h2>
            <p className="text-xs text-slate-400">
              Generate an immediate, verified warning text to alert your colony, society, and commuters via WhatsApp.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Flooded Location / Underpass</label>
              <input
                type="text"
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                placeholder="e.g. Minto Bridge Subway / Connaught Place Outer"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Estimated Water Depth</label>
              <input
                type="text"
                value={waterDepth}
                onChange={(e) => setWaterDepth(e.target.value)}
                placeholder="e.g. 2.5 Feet / Wheel level"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Guidance &amp; Diversion Note</label>
              <input
                type="text"
                value={customRoadNote}
                onChange={(e) => setCustomRoadNote(e.target.value)}
                placeholder="e.g. Route blocked. Take eastern flyover instead."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Preview Box */}
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-600/40 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5 font-mono text-xs text-amber-200">
              <div className="font-bold text-amber-400">⚠️ PREVIEW MESSAGE:</div>
              <div className="p-3 bg-black/40 rounded-xl border border-amber-800/40 whitespace-pre-wrap leading-relaxed">
                ⚠️ URGENT ROAD HAZARD: FLOODED / IMPASSABLE STRETCH ⚠️{'\n'}
                Location: {roadName}{'\n'}
                Water Depth: {waterDepth}{'\n'}
                Advisory: {customRoadNote}
              </div>
            </div>

            <button
              onClick={handleShareRoadWarning}
              className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast Warning to WhatsApp Groups</span>
            </button>
          </div>
        </div>
      </section>

      {/* 12-Item Emergency Go-Bag Preparedness Checklist */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <div>
              <h2 className="font-display font-bold text-lg text-white">
                Disaster Emergency Go-Bag Kit (72-Hour Survival)
              </h2>
              <p className="text-xs text-slate-400">
                Essential supplies to pack in a waterproof bag during flood, cyclone, or earthquake warnings.
              </p>
            </div>
          </div>

          {/* Readiness Percentage Badge */}
          <div className="flex items-center gap-2.5 bg-slate-950 px-3.5 py-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Kit Readiness</span>
              <span className="font-mono text-sm font-bold text-emerald-400">{readinessPct}% Complete</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-white">
              {checkedCount}/{totalCount}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
          {DISASTER_PREPAREDNESS_ITEMS.map((item) => {
            const isChecked = !!checklist[item.id];
            return (
              <div
                key={item.id}
                onClick={() => handleToggleCheckItem(item.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 select-none ${
                  isChecked
                    ? 'bg-emerald-950/20 border-emerald-600/50 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                  isChecked ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-600 bg-slate-900'
                }`}>
                  {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <div className="text-xs font-medium leading-snug">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-bold">{item.category}</span>
                  <span className={isChecked ? 'line-through text-slate-400' : 'text-white'}>{item.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Emergency Action Protocols (Tabs) */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="font-display font-bold text-lg text-white">
              Emergency Action Protocols (What To Do)
            </h2>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto scrollbar-none">
            {[
              { id: 'flood', label: '🌊 Flood & Rain' },
              { id: 'earthquake', label: '🌋 Earthquake' },
              { id: 'fire', label: '🔥 Urban Fire' },
              { id: 'cyclone', label: '🌀 Cyclone' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveGuide(tab.id as any)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  activeGuide === tab.id
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content for selected guide */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {activeGuide === 'flood' && (
            <>
              <h3 className="font-bold text-base text-cyan-300">Monsoon Floods &amp; Cloudburst Safety:</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-white">Switch off Main Breaker &amp; Gas:</strong> If flood waters enter your ground floor, shut off electricity at the main board immediately to prevent electrocution.</li>
                <li><strong className="text-white">Never Walk Through Flowing Water:</strong> Just 15 cm (6 inches) of moving water can knock an adult off their feet; 30 cm can float small cars.</li>
                <li><strong className="text-white">Water Purification:</strong> Boil drinking water for at least 3 minutes or use halogen chlorine tablets; urban flood water carries sewage and leptospirosis bacteria.</li>
                <li><strong className="text-white">Vertical Evacuation:</strong> Move to upper floors (pucca concrete structures) with your emergency go-bag and power bank.</li>
              </ul>
            </>
          )}

          {activeGuide === 'earthquake' && (
            <>
              <h3 className="font-bold text-base text-amber-300">Earthquake Defense (Drop, Cover, Hold):</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-white">DROP, COVER, HOLD:</strong> Drop to your hands and knees under a sturdy dining table or desk. Cover your head and neck. Hold on until shaking stops.</li>
                <li><strong className="text-white">Do Not Use Elevators:</strong> Power failure could trap you between floors. Use stairs only after ground movement ceases.</li>
                <li><strong className="text-white">Stay Away from Glass &amp; Facades:</strong> Falling bricks, parapets, and window shards cause majority of urban injuries.</li>
              </ul>
            </>
          )}

          {activeGuide === 'fire' && (
            <>
              <h3 className="font-bold text-base text-red-400">Urban Fire &amp; Smoke Inhalation Protocol:</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-white">Crawl Low Below Smoke:</strong> Smoke and toxic carbon monoxide rise to the ceiling; breathable clean air is in the bottom 12 inches above the floor.</li>
                <li><strong className="text-white">Test Doors with Back of Hand:</strong> Feel door handles before opening; if hot, do not open—fire is on the other side.</li>
                <li><strong className="text-white">STOP, DROP, and ROLL:</strong> If clothes catch fire, do not run; immediately drop to the ground and roll to extinguish flames.</li>
              </ul>
            </>
          )}

          {activeGuide === 'cyclone' && (
            <>
              <h3 className="font-bold text-base text-blue-300">Coastal Cyclone &amp; Gale Warning:</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-white">Board Up Windows:</strong> Tape large glass panes in an 'X' pattern or close cyclone shutters to prevent flying debris punctures.</li>
                <li><strong className="text-white">Beware the 'Eye of the Cyclone':</strong> A sudden calm does not mean the storm is over; violent gale winds will resume from the reverse direction in minutes.</li>
              </ul>
            </>
          )}
        </div>
      </section>

    </div>
  );
};
