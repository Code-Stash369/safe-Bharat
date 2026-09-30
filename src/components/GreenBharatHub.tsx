import React, { useState } from 'react';
import { 
  Leaf, 
  Trees, 
  Sparkles, 
  Droplets, 
  ShoppingBag, 
  Zap, 
  Sprout, 
  Bus, 
  Feather, 
  Award, 
  Trophy, 
  Flame, 
  TrendingUp,
  Plus,
  CheckCircle2,
  Calendar,
  Camera,
  Share2,
  X
} from 'lucide-react';
import { ActivityLog, GreenActivity, UserProfile } from '../types';
import { GREEN_ACTIVITIES_CATALOG } from '../data/initialData';
import { audioService } from '../services/audioService';
import confetti from 'canvas-confetti';

interface GreenBharatHubProps {
  user: UserProfile;
  activityLogs: ActivityLog[];
  onLogActivity: (log: ActivityLog) => void;
}

export const GreenBharatHub: React.FC<GreenBharatHubProps> = ({
  user,
  activityLogs,
  onLogActivity,
}) => {
  const [selectedActivity, setSelectedActivity] = useState<GreenActivity | null>(null);
  const [activityNote, setActivityNote] = useState<string>('');
  const [activityPhoto, setActivityPhoto] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Compute total impacts
  const totalTrees = activityLogs.filter(a => a.activityId === 'act-tree').length;
  const totalClean = activityLogs.filter(a => a.activityId === 'act-clean').length;
  const totalWater = activityLogs.filter(a => a.activityId === 'act-water').length;

  const estimatedCO2 = (user.points * 0.42).toFixed(1);
  const estimatedWater = (user.points * 4.8).toFixed(0);
  const estimatedPlastic = (user.points * 0.08).toFixed(1);

  // Level computation
  const getRankInfo = (pts: number) => {
    if (pts >= 600) return { title: 'Bharat Ratna Defender 🏆', tier: 'Diamond Tier', nextGoal: 1000, pct: 100 };
    if (pts >= 300) return { title: 'Paryavaran Rakshak 🌳', tier: 'Gold Tier', nextGoal: 600, pct: Math.round((pts / 600) * 100) };
    if (pts >= 100) return { title: 'Harit Sathi 🌿', tier: 'Silver Tier', nextGoal: 300, pct: Math.round((pts / 300) * 100) };
    return { title: 'Bhoomi Mitra 🌱', tier: 'Bronze Tier', nextGoal: 100, pct: Math.round((pts / 100) * 100) };
  };

  const rank = getRankInfo(user.points);

  const handleOpenLogModal = (act: GreenActivity) => {
    setSelectedActivity(act);
    setActivityNote(`Completed ${act.name} in my local area.`);
    setActivityPhoto(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setActivityPhoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;

    const newLog: ActivityLog = {
      id: `act-log-${Date.now()}`,
      activityId: selectedActivity.id,
      activityName: selectedActivity.name,
      pointsEarned: selectedActivity.points,
      note: activityNote.trim(),
      photoUrl: activityPhoto || undefined,
      timestamp: Date.now(),
    };

    onLogActivity(newLog);
    audioService.playSuccessChime();

    try {
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#10b981', '#fbbf24', '#38bdf8'],
      });
    } catch {}

    setSelectedActivity(null);
  };

  const getActivityIcon = (iconName: string) => {
    switch (iconName) {
      case 'Trees': return <Trees className="w-5 h-5 text-emerald-400" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-teal-400" />;
      case 'Droplets': return <Droplets className="w-5 h-5 text-blue-400" />;
      case 'ShoppingBag': return <ShoppingBag className="w-5 h-5 text-purple-400" />;
      case 'Zap': return <Zap className="w-5 h-5 text-amber-400" />;
      case 'Sprout': return <Sprout className="w-5 h-5 text-lime-400" />;
      case 'Bus': return <Bus className="w-5 h-5 text-cyan-400" />;
      case 'Feather': return <Feather className="w-5 h-5 text-pink-400" />;
      default: return <Leaf className="w-5 h-5 text-emerald-400" />;
    }
  };

  const BADGES = [
    { id: 'b1', name: 'First Green Step', icon: '🌱', unlocked: activityLogs.length >= 1 },
    { id: 'b2', name: 'Tree Guardian', icon: '🌳', unlocked: totalTrees >= 1 },
    { id: 'b3', name: 'Cleanliness Crusader', icon: '🧹', unlocked: totalClean >= 1 },
    { id: 'b4', name: 'Water Sentinel', icon: '💧', unlocked: totalWater >= 1 },
    { id: 'b5', name: 'Century Club (100 Pts)', icon: '🏅', unlocked: user.points >= 100 },
    { id: 'b6', name: 'Bharat Eco-Champion', icon: '🏆', unlocked: user.points >= 300 },
    { id: 'b7', name: 'Daily Streak Keeper', icon: '🔥', unlocked: user.streak >= 5 },
    { id: 'b8', name: 'Zero Waste Pioneer', icon: '🛍️', unlocked: activityLogs.some(a => a.activityId === 'act-plastic') },
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Log Activity Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form 
            onSubmit={handleConfirmLog}
            className="max-w-md w-full rounded-3xl bg-slate-900 border border-emerald-500/40 p-6 space-y-4 shadow-2xl animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {getActivityIcon(selectedActivity.icon)}
                <h2 className="font-display font-bold text-base text-white">
                  Log {selectedActivity.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedActivity(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-700/40 text-xs text-emerald-200">
              <span className="font-bold block text-emerald-400">Earn +{selectedActivity.points} Green Karma Points</span>
              {selectedActivity.description}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Action Notes / Brief</label>
              <textarea
                required
                rows={2}
                value={activityNote}
                onChange={(e) => setActivityNote(e.target.value)}
                placeholder="e.g. Planted 2 Neem saplings along society boundary wall."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Photo Proof (Optional)</label>
              <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-700 bg-slate-950 text-xs text-slate-300 cursor-pointer hover:border-emerald-500">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>{activityPhoto ? 'Change Photo' : 'Attach Photo Proof'}</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
              {activityPhoto && (
                <div className="mt-2 rounded-xl overflow-hidden max-h-32 border border-slate-700">
                  <img src={activityPhoto} alt="Proof" className="w-full h-32 object-cover" />
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm &amp; Award Points</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedActivity(null)}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Hero Points & Rank Card */}
      <section className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border border-emerald-800/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Mission LiFE &amp; Harit Bharat
              </span>
              <span className="text-xs text-slate-400">Citizen Sustainability Ledger</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
              Green Bharat &amp; Karma Hub
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Turn everyday environmental care into tangible civic karma. Log tree planting, zero plastic days, and energy audits.
            </p>
          </div>

          {/* Points Pill Display */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-700/50 backdrop-blur-md text-right self-start sm:self-auto min-w-[160px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
              Total Green Karma
            </span>
            <div className="font-mono text-3xl sm:text-4xl font-black text-white mt-0.5">
              {user.points}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Rank: <strong className="text-emerald-300">{rank.title}</strong>
            </span>
          </div>
        </div>

        {/* Progress to next tier */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs text-slate-300 font-medium">
            <span>Tier Progress ({rank.tier})</span>
            <span className="font-mono font-bold text-emerald-400">{user.points}/{rank.nextGoal} Pts</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, rank.pct)}%` }}
            />
          </div>
        </div>

        {/* Impact Counters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Trees className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">CO₂ Absorbed</span>
              <span className="font-mono text-lg font-bold text-white">~{estimatedCO2} kg</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Water Conserved</span>
              <span className="font-mono text-lg font-bold text-white">~{estimatedWater} Liters</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Plastic Diverted</span>
              <span className="font-mono text-lg font-bold text-white">~{estimatedPlastic} kg</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sustainability Actions Catalog */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-white">
              Verified Sustainability Actions Catalog
            </h2>
            <p className="text-xs text-slate-400">
              Choose an action, record your contribution, and earn immediate Green Karma points.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {GREEN_ACTIVITIES_CATALOG.map((act) => (
            <div
              key={act.id}
              className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-emerald-600/60 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                    {getActivityIcon(act.icon)}
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                    +{act.points} Pts
                  </span>
                </div>

                <h3 className="font-bold text-sm text-white">{act.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{act.description}</p>
              </div>

              <button
                onClick={() => handleOpenLogModal(act)}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Action</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Unlockable Badges Gallery */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <h2 className="font-display font-bold text-lg text-white">
            Citizen Achievement Badges
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BADGES.map((b) => (
            <div
              key={b.id}
              className={`p-3.5 rounded-2xl border text-center transition-all ${
                b.unlocked
                  ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                  : 'bg-slate-950/40 border-slate-800/80 opacity-40 grayscale'
              }`}
            >
              <div className="text-3xl mb-1">{b.icon}</div>
              <div className="font-bold text-xs text-white truncate">{b.name}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {b.unlocked ? 'Unlocked' : 'Locked'}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity Log History */}
      {activityLogs.length > 0 && (
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            <h2 className="font-display font-bold text-lg text-white">
              My Recent Sustainability Logs ({activityLogs.length})
            </h2>
          </div>

          <div className="space-y-2.5">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{log.activityName}</span>
                    <span className="font-mono text-xs text-emerald-400">+{log.pointsEarned} Pts</span>
                  </div>
                  <p className="text-xs text-slate-400">{log.note}</p>
                </div>
                <span className="text-[11px] text-slate-500 font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
};
