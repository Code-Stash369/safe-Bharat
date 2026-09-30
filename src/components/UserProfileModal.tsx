import React, { useState } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Heart, 
  ShieldCheck, 
  Download, 
  Upload, 
  Trash2, 
  Plus, 
  Check, 
  QrCode,
  MapPin,
  Save,
  AlertTriangle,
  MessageSquare,
  Share2,
  Activity,
  Zap
} from 'lucide-react';
import { EmergencyContact, UserProfile } from '../types';
import { storageService } from '../services/storageService';
import { SafeBharatLogo } from './SafeBharatLogo';
import { useLanguage } from '../context/LanguageContext';
import { smsDispatchService } from '../services/smsDispatchService';
import { hapticService } from '../services/hapticService';

interface UserProfileModalProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  onUpdateUser,
  onClose,
}) => {
  const { language, setLanguage, languages, t } = useLanguage();
  const [formData, setFormData] = useState<UserProfile>({ ...user });
  const [newContactName, setNewContactName] = useState<string>('');
  const [newContactPhone, setNewContactPhone] = useState<string>('');
  const [newContactRelation, setNewContactRelation] = useState<string>('Family');
  const [showAddContact, setShowAddContact] = useState<boolean>(false);
  const [savedStatus, setSavedStatus] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [autoDispatch, setAutoDispatch] = useState<boolean>(smsDispatchService.isAutoDispatchEnabled());
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(hapticService.isEnabled());
  const [isVibratingTest, setIsVibratingTest] = useState<boolean>(false);

  const handleToggleAutoDispatch = () => {
    const next = !autoDispatch;
    setAutoDispatch(next);
    smsDispatchService.setAutoDispatchEnabled(next);
  };

  const handleToggleHaptics = () => {
    const next = !hapticsEnabled;
    setHapticsEnabled(next);
    hapticService.setEnabled(next);
  };

  const handleTestHapticPattern = () => {
    if (!hapticsEnabled) {
      hapticService.setEnabled(true);
      setHapticsEnabled(true);
    }
    setIsVibratingTest(true);
    hapticService.triggerSOS();
    setTimeout(() => {
      setIsVibratingTest(false);
    }, 2800);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(formData);
    storageService.saveUserProfile(formData);
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2000);
  };

  const handleAddContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    const newContact: EmergencyContact = {
      id: `c-${Date.now()}`,
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      relation: newContactRelation,
    };
    const updated = {
      ...formData,
      contacts: [...formData.contacts, newContact],
    };
    setFormData(updated);
    onUpdateUser(updated);
    storageService.saveUserProfile(updated);
    setNewContactName('');
    setNewContactPhone('');
    setShowAddContact(false);
  };

  const handleDeleteContact = (id: string) => {
    const updated = {
      ...formData,
      contacts: formData.contacts.filter((c) => c.id !== id),
    };
    setFormData(updated);
    onUpdateUser(updated);
    storageService.saveUserProfile(updated);
  };

  const handleExportData = () => {
    const jsonStr = storageService.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SafeBharat_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = storageService.importData(content);
      if (success) {
        window.location.reload();
      } else {
        setImportError('Invalid backup file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('Reset all demo data and restore defaults?')) {
      storageService.resetAllData();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="max-w-2xl w-full rounded-3xl bg-slate-900 border border-slate-800 p-4 sm:p-7 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4">
          <div className="flex items-center gap-2.5">
            <SafeBharatLogo size={32} />
            <div>
              <h2 className="font-display font-black text-lg sm:text-xl text-white">
                Citizen Identity &amp; Emergency Profile
              </h2>
              <span className="text-[11px] sm:text-xs text-slate-400">100% On-Device Data Sovereignty</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Emergency Medical ID Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-slate-950 to-slate-950 border border-red-800/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" /> Emergency Medical ID
            </span>
            <span className="text-xs font-mono font-bold text-white bg-red-600/30 px-2 py-0.5 rounded border border-red-500/40">
              Blood Group: {formData.bloodGroup}
            </span>
          </div>

          <div className="text-xs text-slate-300">
            <strong className="text-white">{formData.name}</strong> · +91 {formData.phone}
          </div>
          <div className="text-[11px] text-slate-400 italic">
            Medical Note: {formData.emergencyNote || 'None specified.'}
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">10-Digit Mobile Number</label>
              <input
                type="tel"
                required
                maxLength={10}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">City &amp; State</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Blood Group</label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300">{t('switch_language')} (Preferred Language)</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 font-medium"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName} ({l.englishName}) — {l.region}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Emergency Medical Note / Allergies</label>
            <input
              type="text"
              value={formData.emergencyNote}
              onChange={(e) => setFormData({ ...formData, emergencyNote: e.target.value })}
              placeholder="e.g. Penicillin allergy, diabetic, carries inhaler"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {savedStatus ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{savedStatus ? 'Saved to Local Device!' : 'Update Profile Details'}</span>
          </button>
        </form>

        {/* Emergency Contacts Section */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-sm text-white">
                Saved Emergency Contacts ({formData.contacts.length})
              </h3>
              <p className="text-[11px] text-slate-400">
                These contacts receive automated GPS SOS broadcasts.
              </p>
            </div>
            <button
              onClick={() => setShowAddContact(!showAddContact)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Contact</span>
            </button>
          </div>

          {/* Automated SMS Dispatch Setting Toggle */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${autoDispatch ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">Auto-Prompt SMS on SOS Events</span>
                <span className="text-[10px] text-slate-400">
                  Pre-fills native SMS to all saved contacts when voice or panic beacon triggers.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleAutoDispatch}
              className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold border transition-colors cursor-pointer shrink-0 ${
                autoDispatch
                  ? 'bg-rose-950/70 border-rose-500/50 text-rose-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {autoDispatch ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>

          {/* Haptic Feedback (Vibrate API) Safety Setting */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${hapticsEnabled ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white block">Tactile Haptic Feedback (Vibrate API)</span>
                  {hapticService.isSupported() ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                      SUPPORTED
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-400 bg-slate-900 border border-slate-800">
                      NO VIB MOTOR / DESKTOP
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400">
                  Tactile pulsing during emergency SOS hold, siren drills, and speed hazard alerts.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleTestHapticPattern}
                disabled={isVibratingTest}
                className="px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/40 text-amber-300 text-[10px] font-bold font-mono transition-all flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
                title="Test SOS vibrating pulse sequence"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>{isVibratingTest ? 'PULSING...' : 'TEST SOS PULSE'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleHaptics}
                className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold border transition-colors cursor-pointer ${
                  hapticsEnabled
                    ? 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {hapticsEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>

          {showAddContact && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Contact Name (e.g. Sister)"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                />
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit Phone"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono"
                />
                <select
                  value={newContactRelation}
                  onChange={(e) => setNewContactRelation(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                >
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Friend">Friend</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Neighbor">Neighbor</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddContact}
                className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
              >
                Save Emergency Contact
              </button>
            </div>
          )}

          <div className="space-y-2">
            {formData.contacts.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-xs text-white flex items-center gap-1.5">
                    <span>{c.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({c.relation})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">+91 {c.phone}</div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${c.phone}`}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-emerald-950 text-emerald-400 text-xs"
                    title="Call"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => handleDeleteContact(c.id)}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400 text-xs cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Sovereignty & Backup */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Data Sovereignty &amp; Offline Backup
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={handleExportData}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Backup JSON</span>
            </button>

            <label className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import Backup JSON</span>
              <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
            </label>

            <button
              onClick={handleReset}
              className="py-2.5 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Demo State</span>
            </button>
          </div>

          {importError && (
            <p className="text-xs text-red-400">{importError}</p>
          )}
        </div>

      </div>
    </div>
  );
};
