import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Flame, 
  Leaf, 
  Compass, 
  Radio, 
  User, 
  Volume2, 
  VolumeX, 
  MapPin, 
  BookOpen, 
  Waves, 
  Menu, 
  X, 
  Phone, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  AlertTriangle,
  Globe,
  Sparkles,
  Bot,
  MessageSquare,
  Wifi,
  WifiOff
} from 'lucide-react';
import { NavigationTab, UserProfile, IncidentReport } from '../types';
import { SafeBharatLogo } from './SafeBharatLogo';
import { NotificationBell } from './NotificationBell';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  user: UserProfile;
  isSirenPlaying: boolean;
  onToggleSiren: () => void;
  onOpenProfile: () => void;
  hasGPS: boolean;
  onQuickGPS: () => void;
  reports: IncidentReport[];
  onTriggerTestNotification: () => void;
  onOpenOfflineMonitor?: () => void;
  isOffline?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  isSirenPlaying,
  onToggleSiren,
  onOpenProfile,
  onQuickGPS,
  reports,
  onTriggerTestNotification,
  onOpenOfflineMonitor,
  isOffline = false,
}) => {
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMoreOpen, setIsDesktopMoreOpen] = useState(false);
  const desktopMoreRef = useRef<HTMLDivElement>(null);

  // Close mobile drawer on route/tab change
  const handleSelectTab = (tab: NavigationTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    setIsDesktopMoreOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Close desktop dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (desktopMoreRef.current && !desktopMoreRef.current.contains(e.target as Node)) {
        setIsDesktopMoreOpen(false);
      }
    };
    if (isDesktopMoreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDesktopMoreOpen]);

  // Prevent background scrolling when mobile menu drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Primary 5 navigation items (shown on desktop/laptop >= 1024px)
  const primaryNavItems: { 
    id: NavigationTab; 
    label: string; 
    shortLabel: string;
    description: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    { 
      id: 'daily', 
      label: t('nav_daily'), 
      shortLabel: t('nav_daily_short'),
      description: t('nav_daily_desc'),
      icon: <Radio className="w-4 h-4 text-emerald-400 shrink-0" /> 
    },
    { 
      id: 'radar', 
      label: t('nav_radar'), 
      shortLabel: t('nav_radar_short'),
      description: t('nav_radar_desc'),
      icon: <MapPin className="w-4 h-4 text-cyan-400 shrink-0" /> 
    },
    { 
      id: 'sos', 
      label: t('nav_sos'), 
      shortLabel: t('nav_sos_short'),
      description: t('nav_sos_desc'),
      badge: t('urgent'),
      icon: <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" /> 
    },
    { 
      id: 'women', 
      label: t('nav_women'), 
      shortLabel: t('nav_women_short'),
      description: t('nav_women_desc'),
      icon: <Flame className="w-4 h-4 text-pink-400 shrink-0" /> 
    },
    { 
      id: 'disaster', 
      label: t('nav_disaster'), 
      shortLabel: t('nav_disaster_short'),
      description: t('nav_disaster_desc'),
      badge: t('alert'),
      icon: <Waves className="w-4 h-4 text-blue-400 shrink-0" /> 
    },
  ];

  // Secondary items (shown directly on xl >= 1280px or in dropdown on lg 1024px-1279px)
  const secondaryNavItems: {
    id: NavigationTab;
    label: string;
    shortLabel: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    { 
      id: 'report', 
      label: t('nav_report'), 
      shortLabel: t('nav_report_short'),
      description: t('nav_report_desc'),
      icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" /> 
    },
    { 
      id: 'green', 
      label: t('nav_green'), 
      shortLabel: t('nav_green_short'),
      description: t('nav_green_desc'),
      icon: <Leaf className="w-4 h-4 text-emerald-400 shrink-0" /> 
    },
    { 
      id: 'iks', 
      label: t('nav_iks'), 
      shortLabel: t('nav_iks_short'),
      description: t('nav_iks_desc'),
      icon: <BookOpen className="w-4 h-4 text-orange-400 shrink-0" /> 
    },
  ];

  const isSecondaryActive = secondaryNavItems.some(item => item.id === activeTab);

  // Determine current active item for mobile Tab 5 indicator
  const getActiveHubIndicator = () => {
    switch (activeTab) {
      case 'women':
        return { label: 'Women', icon: <Flame className="w-5 h-5 text-pink-400" /> };
      case 'disaster':
        return { label: 'Disaster', icon: <Waves className="w-5 h-5 text-blue-400" /> };
      case 'report':
        return { label: 'Report', icon: <AlertTriangle className="w-5 h-5 text-amber-400" /> };
      case 'green':
        return { label: 'Green', icon: <Leaf className="w-5 h-5 text-emerald-400" /> };
      case 'iks':
        return { label: 'IKS', icon: <BookOpen className="w-5 h-5 text-orange-400" /> };
      default:
        return { label: t('nav_more'), icon: <Layers className="w-5 h-5" /> };
    }
  };

  const currentHub = getActiveHubIndicator();
  const isDrawerTabActive = ['women', 'disaster', 'report', 'green', 'iks'].includes(activeTab);

  return (
    <>
      {/* Top Header Sticky Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/92 backdrop-blur-xl border-b border-slate-800/80 px-2 sm:px-4 lg:px-6 py-2 sm:py-2.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 sm:gap-4">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
            <button
              onClick={() => handleSelectTab('daily')}
              className="flex items-center gap-1.5 sm:gap-2 cursor-pointer focus:outline-none shrink-0"
              title="Safe Bharat Dashboard"
              aria-label="Safe Bharat Home"
            >
              <SafeBharatLogo size={32} showText={true} />
            </button>
          </div>

          {/* Desktop Navigation Links (>= 1024px) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 py-0.5 shrink-0" aria-label="Desktop Navigation">
            
            {/* Primary 5 items */}
            {primaryNavItems.map((item) => {
              const isActive = activeTab === item.id;
              const isSOS = item.id === 'sos';
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-2 xl:px-3 py-1.5 xl:py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer select-none ${
                    isActive
                      ? isSOS
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : isSOS
                        ? 'text-red-400 hover:bg-red-950/50 hover:text-red-300 border border-red-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                  title={item.label}
                >
                  {item.icon}
                  <span className="xl:hidden">{item.shortLabel}</span>
                  <span className="hidden xl:inline">{item.label}</span>

                  {item.badge && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping absolute top-1.5 right-1.5" />
                  )}
                </button>
              );
            })}

            {/* On >= 1280px (xl): Show the 3 secondary items directly */}
            <div className="hidden xl:flex items-center gap-1 xl:gap-1.5">
              {secondaryNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`relative flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 xl:py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer select-none ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                    title={item.label}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* On 1024px to 1279px (lg): Show compact "More Hubs" Dropdown */}
            <div className="relative xl:hidden" ref={desktopMoreRef}>
              <button
                onClick={() => setIsDesktopMoreOpen(!isDesktopMoreOpen)}
                className={`flex items-center gap-1.5 px-2 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer select-none ${
                  isSecondaryActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
                aria-expanded={isDesktopMoreOpen}
                aria-label={t('nav_more')}
              >
                <Layers className="w-4 h-4 text-amber-400" />
                <span>{t('nav_more')}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDesktopMoreOpen ? 'rotate-180 text-emerald-400' : 'text-slate-400'}`} />
              </button>

              {isDesktopMoreOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider border-b border-slate-800">
                    {t('nav_civic_eco')}
                  </div>
                  {secondaryNavItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectTab(item.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                          isActive
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {item.icon}
                        <div className="leading-tight">
                          <div>{item.label}</div>
                          <div className="text-[10px] text-slate-400 font-normal truncate">{item.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </nav>

          {/* Right Action Utility Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            
            {/* Safe AI Assistant Quick Launch Button (Hidden on < 420px since it's Tab 4 in mobile bottom bar) */}
            <button
              onClick={() => handleSelectTab('safe_ai')}
              className={`hidden xs:flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm ${
                activeTab === 'safe_ai'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/40'
                  : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/40 hover:border-emerald-400'
              }`}
              title="Safe AI — 24x7 Safety & Emergency Assistant"
              aria-label="Safe AI Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
              <span className="font-display font-black tracking-tight text-[11px] sm:text-xs">
                <span className="hidden sm:inline">Safe </span>AI
              </span>
            </button>

            {/* Offline Connectivity Monitor Button */}
            <button
              onClick={onOpenOfflineMonitor}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer min-h-[36px] ${
                isOffline
                  ? 'bg-red-600 text-white border-red-400 animate-pulse shadow-md shadow-red-600/40'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title={isOffline ? 'No Cellular Signal! Click to open Offline Cached Map & Signaling' : 'Signal OK (Click for Offline Hub & Cached Map)'}
              aria-label="Offline Connectivity Monitor"
            >
              {isOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-white shrink-0" />
                  <span className="font-mono text-[10px] sm:text-[11px] font-bold">Offline</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-mono text-[10px] sm:text-[11px] font-medium hidden md:inline text-slate-300">Online</span>
                </>
              )}
            </button>

            {/* Siren Alert Drill Toggle */}
            <button
              onClick={onToggleSiren}
              className={`flex items-center justify-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer min-w-[36px] min-h-[36px] ${
                isSirenPlaying
                  ? 'bg-red-600 text-white border-red-400 animate-pulse shadow-lg shadow-red-600/50'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-red-300 hover:border-red-800/50'
              }`}
              title={isSirenPlaying ? t('stop_siren') : t('siren_drill')}
              aria-label="Siren Alarm Toggle"
            >
              {isSirenPlaying ? (
                <>
                  <Volume2 className="w-4 h-4 text-white animate-spin shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider hidden md:inline">{t('siren_on')}</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="hidden md:inline text-[11px]">{t('siren_off')}</span>
                </>
              )}
            </button>

            {/* Language Switcher Dropdown (Visible on >= sm, inside mobile drawer on < sm) */}
            <div className="hidden sm:block">
              <LanguageSwitcher variant="compact" />
            </div>

            {/* Real-Time Notification Bell */}
            <NotificationBell
              reports={reports}
              onTriggerTestNotification={onTriggerTestNotification}
            />

            {/* User Profile Button (Visible on >= sm, prominent at top of drawer on < sm) */}
            <button
              onClick={onOpenProfile}
              className="hidden sm:flex w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-slate-600/60 items-center justify-center text-white transition-all cursor-pointer shadow-sm focus:outline-none"
              title={t('user_profile')}
              aria-label={t('user_profile')}
            >
              <User className="w-4 h-4 text-emerald-300" />
            </button>

            {/* Mobile Menu Button (< 1024px) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 hover:text-white transition-colors cursor-pointer"
              aria-label="Toggle Mobile Navigation Drawer"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 text-red-400" />
              ) : (
                <Menu className="w-4 h-4 text-emerald-400" />
              )}
            </button>

          </div>
        </div>
      </header>

      {/* Mobile Full-Screen Navigation Drawer (< 1024px) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-slate-950/98 backdrop-blur-2xl animate-in fade-in slide-in-from-top-4 duration-200">
          
          {/* Drawer Top Header */}
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <SafeBharatLogo size={34} showText={true} />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
              aria-label="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick User Status Ribbon */}
          <div className="px-4 py-3 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-bold text-sm shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white leading-tight truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user.city || 'India'} · Blood: <strong className="text-red-400">{user.bloodGroup}</strong> · <strong className="text-emerald-400 font-mono">{user.points} pts</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenProfile();
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] border border-slate-700 cursor-pointer shrink-0"
            >
              {t('edit_profile')}
            </button>
          </div>

          {/* Scrollable Modules List */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            
            {/* Featured: Safe AI Safety Assistant Card */}
            <div 
              onClick={() => handleSelectTab('safe_ai')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                activeTab === 'safe_ai'
                  ? 'bg-gradient-to-r from-emerald-950 to-teal-950 border-emerald-400 shadow-lg'
                  : 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border-emerald-500/40 hover:border-emerald-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-black text-sm text-white">Safe AI Assistant</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                      24x7 AI
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">
                    Voice safety chatbot with emergency action dispatch in Hindi &amp; English.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
            </div>

            {/* Language Switcher in Mobile Drawer */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>{t('switch_language')}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">10 Indian Languages</span>
              </div>
              <LanguageSwitcher variant="pills" onSelect={() => setIsMobileMenuOpen(false)} />
            </div>

            {/* Offline Connectivity Survival Hub Banner in Drawer */}
            <div 
              onClick={() => {
                if (onOpenOfflineMonitor) onOpenOfflineMonitor();
                setIsMobileMenuOpen(false);
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-md ${
                isOffline
                  ? 'bg-gradient-to-r from-red-950/80 via-slate-900 to-amber-950/80 border-red-500 text-white animate-pulse'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border shrink-0 ${
                  isOffline ? 'bg-red-600/30 border-red-500 text-red-400' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                }`}>
                  {isOffline ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Offline Connectivity Monitor</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                      isOffline ? 'bg-red-600 text-white' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {isOffline ? 'No Signal' : 'Cached Ready'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    Cached GPS map, acoustic sirens &amp; manual optical signaling
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
            </div>

            {/* Category 1: Emergency & Civil Protection */}
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 mb-2 px-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />
                <span>{t('cat_emergency')}</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[primaryNavItems[2], primaryNavItems[3], primaryNavItems[4]].map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        isActive
                          ? 'bg-red-950/60 border-red-500 text-white shadow-md'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{item.label}</span>
                            {item.badge && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-600 text-white">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{item.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category 2: Surveillance, Mapping & Reporting */}
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 mb-2 px-1 flex items-center gap-1.5">
                <Compass className="w-3 h-3" />
                <span>{t('cat_surveillance')}</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[primaryNavItems[0], primaryNavItems[1], secondaryNavItems[0]].map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        isActive
                          ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-white">{item.label}</span>
                          <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{item.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category 3: Sustainability & Heritage */}
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 mb-2 px-1 flex items-center gap-1.5">
                <Leaf className="w-3 h-3" />
                <span>{t('cat_sustainability')}</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[secondaryNavItems[1], secondaryNavItems[2]].map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        isActive
                          ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-white">{item.label}</span>
                          <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{item.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direct National Helplines Bar in Mobile Drawer */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/50 via-slate-900 to-slate-950 border border-red-500/30 space-y-2">
              <span className="text-[11px] font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-red-400" />
                <span>{t('one_tap_helplines')}</span>
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                <a
                  href="tel:112"
                  className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-center text-xs flex flex-col items-center justify-center shadow-md transition-colors"
                >
                  <span className="font-mono text-xs sm:text-sm">112</span>
                  <span className="text-[8px] sm:text-[9px] font-normal leading-none mt-0.5">Police</span>
                </a>
                <a
                  href="tel:108"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-center text-xs flex flex-col items-center justify-center border border-slate-700 transition-colors"
                >
                  <span className="font-mono text-xs sm:text-sm text-emerald-400">108</span>
                  <span className="text-[8px] sm:text-[9px] font-normal leading-none mt-0.5">Medical</span>
                </a>
                <a
                  href="tel:181"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-center text-xs flex flex-col items-center justify-center border border-slate-700 transition-colors"
                >
                  <span className="font-mono text-xs sm:text-sm text-pink-400">181</span>
                  <span className="text-[8px] sm:text-[9px] font-normal leading-none mt-0.5">Women</span>
                </a>
                <a
                  href="tel:101"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-center text-xs flex flex-col items-center justify-center border border-slate-700 transition-colors"
                >
                  <span className="font-mono text-xs sm:text-sm text-amber-400">101</span>
                  <span className="text-[8px] sm:text-[9px] font-normal leading-none mt-0.5">Fire</span>
                </a>
              </div>
            </div>

          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between gap-3">
            <button
              onClick={() => {
                onToggleSiren();
                setIsMobileMenuOpen(false);
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSirenPlaying ? <Volume2 className="w-4 h-4 text-red-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span>{isSirenPlaying ? t('stop_siren') : t('siren_drill')}</span>
            </button>

            <button
              onClick={() => {
                onQuickGPS();
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>{t('update_gps')}</span>
            </button>
          </div>

        </div>
      )}

      {/* Mobile Fixed Bottom Navigation Bar (Thumb Zone) */}
      <nav 
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/96 backdrop-blur-2xl border-t border-slate-800/90 px-1 pt-1.5 shadow-2xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)' }}
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-5 items-end justify-items-center max-w-lg mx-auto w-full">
          
          {/* Tab 1: Daily Briefing */}
          <button
            onClick={() => handleSelectTab('daily')}
            className={`flex flex-col items-center justify-center min-h-[48px] w-full py-1 text-[10px] font-semibold transition-all cursor-pointer ${
              activeTab === 'daily' 
                ? 'text-emerald-400 font-bold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-5 h-5 mb-0.5" />
            <span className="truncate max-w-[58px] text-[10px] leading-tight">{t('nav_daily_short')}</span>
            {activeTab === 'daily' && (
              <span className="w-4 h-0.5 bg-emerald-400 rounded-full mt-0.5" />
            )}
          </button>

          {/* Tab 2: Geo-Radar Map */}
          <button
            onClick={() => handleSelectTab('radar')}
            className={`flex flex-col items-center justify-center min-h-[48px] w-full py-1 text-[10px] font-semibold transition-all cursor-pointer ${
              activeTab === 'radar' 
                ? 'text-cyan-400 font-bold' 
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <MapPin className="w-5 h-5 mb-0.5" />
            <span className="truncate max-w-[58px] text-[10px] leading-tight">{t('nav_radar_short')}</span>
            {activeTab === 'radar' && (
              <span className="w-4 h-0.5 bg-cyan-400 rounded-full mt-0.5" />
            )}
          </button>

          {/* Tab 3: Emergency SOS (Elevated Prominent Tactical Button) */}
          <button
            onClick={() => handleSelectTab('sos')}
            className="relative flex flex-col items-center justify-center -top-3 group cursor-pointer focus:outline-none w-full"
            aria-label={t('nav_sos_short')}
          >
            <div className={`relative w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 ${
              activeTab === 'sos'
                ? 'bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 ring-4 ring-red-500/50 scale-105 shadow-red-600/70'
                : 'bg-gradient-to-tr from-red-700 via-red-600 to-rose-600 ring-2 ring-red-400/40 hover:scale-105 active:scale-95 shadow-red-900/80'
            }`}>
              <span className="absolute -inset-1 rounded-full bg-red-500/40 animate-ping pointer-events-none" />
              <ShieldAlert className="w-6 h-6 text-white drop-shadow-md" />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-wider mt-0.5 ${
              activeTab === 'sos' ? 'text-red-400 font-extrabold' : 'text-red-300'
            }`}>
              {t('nav_sos_short')}
            </span>
          </button>

          {/* Tab 4: Safe AI Assistant (Dedicated High-Value AI Feature) */}
          <button
            onClick={() => handleSelectTab('safe_ai')}
            className={`flex flex-col items-center justify-center min-h-[48px] w-full py-1 text-[10px] font-semibold transition-all cursor-pointer relative ${
              activeTab === 'safe_ai' 
                ? 'text-emerald-300 font-bold' 
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <div className="relative">
              <Sparkles className="w-5 h-5 mb-0.5 text-emerald-400 animate-pulse" />
            </div>
            <span className="truncate max-w-[58px] text-[10px] leading-tight font-display font-bold">Safe AI</span>
            {activeTab === 'safe_ai' && (
              <span className="w-4 h-0.5 bg-emerald-400 rounded-full mt-0.5" />
            )}
          </button>

          {/* Tab 5: All Modules / More Hubs Menu */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className={`flex flex-col items-center justify-center min-h-[48px] w-full py-1 text-[10px] font-semibold transition-all cursor-pointer ${
              isMobileMenuOpen || isDrawerTabActive
                ? 'text-amber-400 font-bold' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-center">
              {currentHub.icon}
            </div>
            <span className="truncate max-w-[58px] text-[10px] leading-tight">{currentHub.label}</span>
            {isDrawerTabActive && (
              <span className="w-4 h-0.5 bg-amber-400 rounded-full mt-0.5" />
            )}
          </button>

        </div>
      </nav>
    </>
  );
};
