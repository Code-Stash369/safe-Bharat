import React, { useState } from 'react';
import { 
  Heart, 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  Phone, 
  Activity, 
  Flame, 
  Wind, 
  Waves, 
  HelpCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface FirstAidModalProps {
  onClose: () => void;
  onCallAmbulance: () => void;
}

type FirstAidCategory = 'cpr' | 'bleeding' | 'burns' | 'choking' | 'snakebite' | 'heatstroke' | 'heart_attack';

export const FirstAidModal: React.FC<FirstAidModalProps> = ({
  onClose,
  onCallAmbulance,
}) => {
  const [activeTab, setActiveTab] = useState<FirstAidCategory>('cpr');

  const topics: { id: FirstAidCategory; title: string; icon: string; urgency: string }[] = [
    { id: 'cpr', title: 'CPR (Cardiac Arrest)', icon: '🫀', urgency: 'CRITICAL' },
    { id: 'bleeding', title: 'Severe Bleeding', icon: '🩸', urgency: 'CRITICAL' },
    { id: 'choking', title: 'Choking (Heimlich)', icon: '😮‍💨', urgency: 'HIGH' },
    { id: 'burns', title: 'Burns & Scalds', icon: '🔥', urgency: 'MODERATE' },
    { id: 'snakebite', title: 'Snakebite Protocol', icon: '🐍', urgency: 'HIGH' },
    { id: 'heart_attack', title: 'Heart Attack (FAST)', icon: '⚡', urgency: 'CRITICAL' },
    { id: 'heatstroke', title: 'Heatstroke / Sun', icon: '☀️', urgency: 'HIGH' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-rose-950/90 via-slate-900 to-rose-950/90 border-b border-rose-500/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center font-bold text-lg">
              🩹
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-base text-white">Emergency First Aid Guide</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-600/30 text-rose-300 border border-rose-500/40">
                  LIFE SUPPORT
                </span>
              </div>
              <p className="text-xs text-slate-400">Step-by-step verified emergency trauma instructions</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCallAmbulance}
              className="py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow active:scale-95 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Dial 108</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories Tab Strip */}
        <div className="p-2 bg-slate-950/70 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === t.id
                  ? 'bg-rose-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.title}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm leading-relaxed">
          
          {activeTab === 'cpr' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-200">
                  <strong>When to perform CPR:</strong> Person is unresponsive and not breathing normally (gasping or no breath). Act immediately.
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                  <div>
                    <h4 className="font-bold text-white">Call 108 / 112 &amp; Check Safety</h4>
                    <p className="text-slate-300">Shout for help, tell a bystander to dial 108 and look for an AED if available in a public venue.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                  <div>
                    <h4 className="font-bold text-white">Hand Placement (Center of Chest)</h4>
                    <p className="text-slate-300">Place heel of one hand on the center of the breastbone (between nipples). Interlock your other hand on top. Lock your elbows straight.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                  <div>
                    <h4 className="font-bold text-white">Push Hard &amp; Fast (100–120 bpm)</h4>
                    <p className="text-slate-300">Compress at least 5 cm (2 inches) deep. Allow chest to fully recoil between pumps. Match the rhythm of the song <em>"Stayin' Alive"</em>.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">4</span>
                  <div>
                    <h4 className="font-bold text-white">Hands-Only CPR</h4>
                    <p className="text-slate-300">If untrained in rescue breathing, provide continuous unbroken chest compressions until medical paramedics arrive.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bleeding' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs">
                <strong>Goal:</strong> Stop loss of blood quickly. Direct pressure is the single most effective method.
              </div>

              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                  <div>
                    <h4 className="font-bold text-white">Apply Direct Firm Pressure</h4>
                    <p className="text-slate-300">Press firmly directly over the bleeding wound using a clean cloth, towel, or sterile gauze.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                  <div>
                    <h4 className="font-bold text-white">Do NOT Remove Soaked Cloth</h4>
                    <p className="text-slate-300">Removing it tears away forming blood clots. Layer more pads on top and maintain constant heavy downward pressure.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                  <div>
                    <h4 className="font-bold text-white">Elevate Above Heart (If No Fracture)</h4>
                    <p className="text-slate-300">If limb injury and bone is intact, elevate above heart level to decrease gravity pressure.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'choking' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                  <div>
                    <h4 className="font-bold text-white">Ask: "Are you choking?"</h4>
                    <p className="text-slate-300">If the person can cough or speak, encourage forceful coughing. If unable to make sound or gasping, act immediately.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                  <div>
                    <h4 className="font-bold text-white">5 Back Blows</h4>
                    <p className="text-slate-300">Stand behind and slightly to one side. Support chest and deliver 5 sharp blows between shoulder blades with heel of hand.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                  <div>
                    <h4 className="font-bold text-white">5 Abdominal Thrusts (Heimlich Maneuver)</h4>
                    <p className="text-slate-300">Wrap arms around waist. Place thumb side of your fist just above the navel. Grasp fist with other hand and pull sharply inward and upward.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'burns' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                  <div>
                    <h4 className="font-bold text-white">Cool Water for 10–20 Minutes</h4>
                    <p className="text-slate-300">Immediately place burn under gentle running cool tap water. Do NOT use ice, butter, toothpaste, or oil (they trap heat and cause tissue necrosis).</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                  <div>
                    <h4 className="font-bold text-white">Remove Constrictive Items</h4>
                    <p className="text-slate-300">Remove rings, bangles, watches, or tight clothes near burn before swelling starts. Do NOT pull away melted clothing stuck to flesh.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                  <div>
                    <h4 className="font-bold text-white">Cover Loosely</h4>
                    <p className="text-slate-300">Cover with sterile non-stick plastic wrap or clean dry lint-free cloth. Do NOT pop blisters.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'snakebite' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs font-semibold">
                ⚠️ CRITICAL: Never cut the bite wound, never suck venom, never apply ice, and never apply a tight tourniquet.
              </div>

              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-red-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                  <div>
                    <h4 className="font-bold text-white">Keep Patient Absolutely Calm &amp; Still</h4>
                    <p className="text-slate-300">Movement and high heart rate speed up venom spread. Reassure the victim. Most Indian snakebites are treatable with Polyvalent Anti-Snake Venom (ASV).</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-red-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                  <div>
                    <h4 className="font-bold text-white">Immobilize Limb Below Heart Level</h4>
                    <p className="text-slate-300">Splint the limb just like a bone fracture to prevent movement. Remove rings/anklets before edema begins.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-red-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                  <div>
                    <h4 className="font-bold text-white">Rush to Hospital with Anti-Venom</h4>
                    <p className="text-slate-300">Transport immediately by vehicle to the nearest government district hospital. Do not delay with traditional remedies.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'heart_attack' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                  <div>
                    <h4 className="font-bold text-white">Recognize Symptoms</h4>
                    <p className="text-slate-300">Crushing chest tightness/pain, radiating to left arm/neck/jaw, shortness of breath, cold sweat, nausea.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                  <div>
                    <h4 className="font-bold text-white">Call 108 / 112 Immediately</h4>
                    <p className="text-slate-300">Every minute counts. Sit patient in a comfortable half-sitting position on the floor supported by knees and back.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                  <div>
                    <h4 className="font-bold text-white">Chew Aspirin (300mg)</h4>
                    <p className="text-slate-300">If patient is not allergic and conscious, having them chew one un-coated 300mg Aspirin helps prevent platelet clumping.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'heatstroke' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">1</span>
                  <div>
                    <h4 className="font-bold text-white">Move to Shade &amp; Air Conditioning</h4>
                    <p className="text-slate-300">Get the person out of direct sun into a cool room or shaded area with airflow.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">2</span>
                  <div>
                    <h4 className="font-bold text-white">Active Rapid Cooling</h4>
                    <p className="text-slate-300">Sponge body with cool wet towels, especially on neck, armpits, and groin. Fan vigorously.</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-mono font-bold flex items-center justify-center shrink-0 text-xs">3</span>
                  <div>
                    <h4 className="font-bold text-white">Hydration (Only if Conscious)</h4>
                    <p className="text-slate-300">Give sips of ORS (Oral Rehydration Solution) or cool salted lemon water. Do NOT force liquids if disoriented or vomiting.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>First Aid guidelines strictly adhere to Red Cross &amp; WHO trauma protocols.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
