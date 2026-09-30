import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageCode } from '../i18n/languages';

interface LanguageSwitcherProps {
  variant?: 'compact' | 'full' | 'pills';
  className?: string;
  onSelect?: () => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'compact',
  className = '',
  onSelect,
}) => {
  const { language, setLanguage, languages, currentLanguageMeta, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleChoose = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
    if (onSelect) onSelect();
  };

  // Variant: Pills row (useful for mobile drawer or footer)
  if (variant === 'pills') {
    return (
      <div className={`flex flex-wrap gap-1.5 ${className}`}>
        {languages.map((lang) => {
          const isSelected = lang.code === language;
          return (
            <button
              key={lang.code}
              onClick={() => handleChoose(lang.code)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span>{lang.nativeName}</span>
              <span className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                ({lang.englishName})
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Variant: Full grid (great for mobile drawer)
  if (variant === 'full') {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 ${className}`}>
        {languages.map((lang) => {
          const isSelected = lang.code === language;
          return (
            <button
              key={lang.code}
              onClick={() => handleChoose(lang.code)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-md ring-1 ring-emerald-500/40'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <div>
                <div className="font-bold text-xs">{lang.nativeName}</div>
                <div className="text-[10px] text-slate-400">{lang.englishName}</div>
              </div>
              {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />}
            </button>
          );
        })}
      </div>
    );
  }

  // Variant: Compact dropdown for navbar
  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
          isOpen
            ? 'bg-slate-800 text-emerald-300 border-emerald-500/50 shadow-sm'
            : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800'
        }`}
        title={t('switch_language')}
        aria-label={t('switch_language')}
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="font-medium text-[11px] uppercase tracking-wide">
          {currentLanguageMeta.code === 'en' ? 'EN' : currentLanguageMeta.nativeName}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
      </button>

      {isOpen && (
        <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-auto sm:mt-2 w-[calc(100vw-24px)] sm:w-72 max-w-sm rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('switch_language')}</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">10 Languages</span>
          </div>

          <div className="mt-2 max-h-72 overflow-y-auto pr-1 space-y-1">
            {languages.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleChoose(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 text-center text-xs font-mono opacity-60 uppercase">
                      {lang.code}
                    </span>
                    <div>
                      <div className="leading-snug">{lang.nativeName}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {lang.englishName} · {lang.region}
                      </div>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-white shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
