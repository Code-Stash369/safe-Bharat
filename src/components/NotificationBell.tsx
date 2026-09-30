import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  BellOff, 
  Check, 
  AlertTriangle, 
  Sparkles, 
  X,
  Volume2
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { IncidentReport } from '../types';

interface NotificationBellProps {
  reports: IncidentReport[];
  onTriggerTestNotification: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  reports,
  onTriggerTestNotification,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (notificationService.isSupported()) {
      setPermission(notificationService.getPermission());
    }
  }, []);

  const handleEnableNotifications = async () => {
    const res = await notificationService.requestPermission();
    setPermission(res);
    if (res === 'granted') {
      setStatusMessage('Disaster notifications enabled successfully!');
      notificationService.sendNotification('🛡️ Safe Bharat Disaster Alerts Active', {
        body: 'You will now receive instant push alerts for critical flood warnings, civic incidents, and severe weather in your area.',
      });
    } else if (res === 'denied') {
      setStatusMessage('Permission was denied in browser settings.');
    }
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleTestAlert = () => {
    onTriggerTestNotification();
    setStatusMessage('Real-time test alert dispatched!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="relative">
      {/* Bell Button in Navbar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg border transition-all cursor-pointer ${
          permission === 'granted'
            ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700'
            : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
        }`}
        title="Disaster & Incident Notifications"
        aria-label="Disaster Notifications"
      >
        {permission === 'granted' ? (
          <BellRing className="w-4 h-4 text-amber-400 animate-wiggle" />
        ) : (
          <Bell className="w-4 h-4" />
        )}

        {/* Small live indicator dot */}
        <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
          permission === 'granted' ? 'bg-emerald-400' : 'bg-amber-400'
        }`} />
      </button>

      {/* Dropdown Drawer */}
      {isOpen && (
        <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-16 sm:top-auto sm:mt-2 w-auto sm:w-96 max-w-sm mx-auto sm:mx-0 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-amber-400" />
              <h3 className="font-display font-bold text-sm text-white">
                Disaster &amp; Incident Alerts
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status info */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Browser Push Status:</span>
              <span className={`font-mono font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                permission === 'granted'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : permission === 'denied'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {permission}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              {permission === 'granted'
                ? 'Desktop & mobile system notifications are active for flood alerts, underpass risks, and local incident updates.'
                : 'Enable browser notifications to receive immediate sound alerts when critical flood or safety incidents are reported.'}
            </p>
          </div>

          {statusMessage && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-700 text-xs text-emerald-200 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            {permission !== 'granted' ? (
              <button
                onClick={handleEnableNotifications}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
              >
                <BellRing className="w-4 h-4" />
                <span>Enable Browser Disaster Alerts</span>
              </button>
            ) : (
              <button
                onClick={handleTestAlert}
                className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700 transition-colors"
              >
                <Volume2 className="w-4 h-4" />
                <span>Test Real-Time Notification API</span>
              </button>
            )}
          </div>

          {/* Recent Incident Alerts preview */}
          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Recent In-App Incident Alerts ({reports.length})
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {reports.slice(0, 3).map((r) => (
                <div key={r.id} className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white truncate max-w-[180px]">{r.title}</span>
                    <span className="text-[9px] uppercase px-1 rounded bg-slate-800 text-amber-400 font-mono">
                      {r.severity}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{r.location.address}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
