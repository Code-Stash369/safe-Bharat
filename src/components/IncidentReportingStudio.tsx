import React, { useState } from 'react';
import { 
  Camera, 
  MapPin, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Filter, 
  ThumbsUp, 
  Share2, 
  FileText, 
  Trash2, 
  Plus, 
  Compass, 
  Download, 
  ExternalLink,
  Map as MapIcon,
  List
} from 'lucide-react';
import { IncidentReport, LocationInfo, UserProfile } from '../types';
import { audioService } from '../services/audioService';
import { openExternalLink } from '../services/linkService';
import { hapticService } from '../services/hapticService';
import { OfflineLeafletMap } from './OfflineLeafletMap';

interface IncidentReportingStudioProps {
  user: UserProfile;
  reports: IncidentReport[];
  onSaveReport: (report: IncidentReport) => void;
  onDeleteReport: (id: string) => void;
  onUpvoteReport?: (id: string) => void;
  location: LocationInfo | null;
  onRequestLocation: () => Promise<LocationInfo | null>;
}

export const IncidentReportingStudio: React.FC<IncidentReportingStudioProps> = ({
  user,
  reports,
  onSaveReport,
  onDeleteReport,
  onUpvoteReport,
  location,
  onRequestLocation,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'crime' | 'flood' | 'garbage' | 'environment'>('all');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [newReportType, setNewReportType] = useState<'crime' | 'flood' | 'garbage' | 'environment'>('flood');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('Road Underpass Submersion');
  const [description, setDescription] = useState<string>('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'critical'>('medium');
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [addressInput, setAddressInput] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [successReceipt, setSuccessReceipt] = useState<IncidentReport | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 700;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL('image/jpeg', 0.75);
          setPhotoData(compressed);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFetchGPS = async () => {
    setIsLocating(true);
    const loc = await onRequestLocation();
    setIsLocating(false);
    if (loc && !addressInput) {
      setAddressInput(`GPS: ${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const newId = `SB-IND-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReport: IncidentReport = {
      id: newId,
      type: newReportType,
      title: title.trim(),
      category: category.trim(),
      description: description.trim(),
      severity,
      location: {
        lat: location?.lat || 28.6139,
        lng: location?.lng || 77.2090,
        address: addressInput.trim() || (location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : 'Location not specified'),
      },
      photoUrl: photoData || undefined,
      timestamp: Date.now(),
      status: 'Logged',
      upvotes: 1,
    };

    onSaveReport(newReport);
    audioService.playSuccessChime();
    hapticService.triggerActionConfirmed();
    setSuccessReceipt(newReport);
    setShowForm(false);
    // Reset form
    setTitle('');
    setDescription('');
    setPhotoData(null);
    setAddressInput('');
  };

  const filteredReports = activeFilter === 'all'
    ? reports
    : reports.filter((r) => r.type === activeFilter);

  const handleShareReport = (report: IncidentReport) => {
    hapticService.triggerActionConfirmed();
    const text = encodeURIComponent(
      `🚨 Safe Bharat Citizen Incident Report [${report.id}]\nType: ${report.type.toUpperCase()} · ${report.title}\nSeverity: ${report.severity.toUpperCase()}\nDetails: ${report.description}\nLocation: ${report.location.address}\nhttps://www.google.com/maps?q=${report.location.lat},${report.location.lng}`
    );
    openExternalLink(`https://wa.me/?text=${text}`);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Success Modal / Official Incident Receipt */}
      {successReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-emerald-500/40 p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h2 className="font-display font-black text-xl text-white">
                Incident Registered Successfully
              </h2>
              <p className="text-xs text-slate-400">
                Official Citizen Reference Document generated &amp; queued for verification.
              </p>
            </div>

            {/* Receipt Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">REFERENCE ID:</span>
                <span className="font-bold text-emerald-400">{successReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CATEGORY:</span>
                <span className="text-white uppercase">{successReceipt.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SEVERITY:</span>
                <span className={`font-bold ${successReceipt.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
                  {successReceipt.severity.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">STATUS:</span>
                <span className="text-blue-400 font-bold">{successReceipt.status}</span>
              </div>
              <div className="pt-2 text-[11px] text-slate-400 truncate">
                LOCATION: {successReceipt.location.address}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleShareReport(successReceipt)}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share WhatsApp</span>
              </button>
              <button
                onClick={() => setSuccessReceipt(null)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <section className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-900/40 rounded-3xl p-6 sm:p-7 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Civic Watchdog Node
              </span>
              <span className="text-xs text-slate-400">Geo-Tagged Community Reports</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
              Incident &amp; Hazard Reporting Studio
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Report flooded roads, illegal garbage dumps, dark unsafe streets, and environmental hazards with photo evidence and GPS verification.
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="py-3 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-5 h-5" />
            <span>{showForm ? 'Cancel Report' : 'File New Incident Report'}</span>
          </button>
        </div>
      </section>

      {/* New Report Form Drawer */}
      {showForm && (
        <form 
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-amber-600/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="font-display font-bold text-lg text-white">
              File Citizen Incident Report
            </h2>
            <span className="text-xs text-slate-400">Step 1 of 1</span>
          </div>

          {/* Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Incident Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'flood', label: 'Waterlogging & Flood', icon: '🌊' },
                { type: 'garbage', label: 'Garbage & Burning', icon: '🗑️' },
                { type: 'crime', label: 'Public Safety & Dark Alley', icon: '🚨' },
                { type: 'environment', label: 'Tree / Eco Hazard', icon: '🌳' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => {
                    setNewReportType(item.type as any);
                    if (item.type === 'flood') setCategory('Road Underpass Submersion');
                    else if (item.type === 'garbage') setCategory('Illegal Plastic Dump');
                    else if (item.type === 'crime') setCategory('Dark / Unlit Street');
                    else setCategory('Tree Cutting / Pollution');
                  }}
                  className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    newReportType === item.type
                      ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title & Specific Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Incident Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep Waterlogging near Metro Pillar 18"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Severity Level</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'low', label: 'Low', color: 'border-emerald-600/50 text-emerald-400' },
                  { id: 'medium', label: 'Medium', color: 'border-amber-600/50 text-amber-400' },
                  { id: 'critical', label: 'Critical', color: 'border-red-600/50 text-red-400' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSeverity(s.id as any)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      severity === s.id
                        ? `bg-slate-800 ${s.color} border-2`
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Detailed Description &amp; Landmark</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State exact landmark, water depth or pile size, who is impacted, since when, and emergency assistance required..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Photo and Location Attachments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Photo Proof (Optional)</label>
              <label className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-slate-700 bg-slate-950/80 hover:bg-slate-950 hover:border-amber-500 text-xs text-slate-300 cursor-pointer transition-colors">
                <Camera className="w-4 h-4 text-amber-400" />
                <span>{photoData ? 'Change Captured Photo' : 'Upload or Snap Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {photoData && (
                <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-700 max-h-36">
                  <img src={photoData} alt="Preview" className="w-full h-36 object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoData(null)}
                    className="absolute top-2 right-2 p-1 rounded-lg bg-black/70 text-white hover:bg-red-600 text-xs"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Location / Address</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  placeholder="Street / Colony / Landmark"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleFetchGPS}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <MapPin className="w-4 h-4" />
                  <span>{isLocating ? 'Locating...' : 'GPS'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Auto-stamped with your current coordinates for civic verification.
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all mt-4"
          >
            <Send className="w-4 h-4" />
            <span>Submit Citizen Incident Report</span>
          </button>
        </form>
      )}

      {/* Community Reports Feed & Filter */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <h2 className="font-display font-bold text-lg text-white">
              Public Incident Feed ({filteredReports.length})
            </h2>
          </div>

          {/* View Mode & Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                  viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                  viewMode === 'map' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Map Radar</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto scrollbar-none">
              {[
                { id: 'all', label: 'All Incidents' },
                { id: 'flood', label: '🌊 Flood' },
                { id: 'garbage', label: '🗑️ Garbage' },
                { id: 'crime', label: '🚨 Safety' },
                { id: 'environment', label: '🌳 Eco' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id as any)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    activeFilter === f.id
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* View Mode Conditional: Map or Cards List */}
        {viewMode === 'map' ? (
          <div className="pt-2">
            <OfflineLeafletMap
              location={location}
              onRequestLocation={onRequestLocation}
              reports={filteredReports}
            />
          </div>
        ) : (
          /* Reports List */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all p-4 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      report.severity === 'critical'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : report.severity === 'medium'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {report.severity}
                    </span>

                    <span className="font-mono text-[11px] text-slate-500">
                      {report.id}
                    </span>
                  </div>

                  {report.photoUrl && (
                    <div className="rounded-xl overflow-hidden border border-slate-800 max-h-40">
                      <img 
                        src={report.photoUrl} 
                        alt="Incident proof" 
                        className="w-full h-40 object-cover"
                      />
                    </div>
                  )}

                  <h3 className="font-bold text-sm text-white leading-snug">
                    {report.title}
                  </h3>

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {report.description}
                  </p>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{report.location.address}</span>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/60">
                      {report.status}
                    </span>
                    
                    {onUpvoteReport && (
                      <button
                        onClick={() => onUpvoteReport(report.id)}
                        className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors border border-slate-800"
                        title="Verify / Upvote report"
                      >
                        <ThumbsUp className="w-3 h-3 text-amber-400" />
                        <span>{report.upvotes || 1}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleShareReport(report)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 text-xs cursor-pointer"
                      title="Share to WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteReport(report.id)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400 text-xs cursor-pointer"
                      title="Delete local report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};
