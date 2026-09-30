import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  hideTextOnMobile?: boolean;
}

export const SafeBharatLogo: React.FC<LogoProps> = ({
  className = '',
  size = 44,
  showText = false,
  hideTextOnMobile = false,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`inline-flex items-center gap-2 sm:gap-2.5 ${className}`}>
      <div 
        className="relative flex-none rounded-full overflow-hidden shadow-lg shadow-emerald-950/60 p-0.5 bg-gradient-to-tr from-amber-500 via-white to-emerald-600 shrink-0"
        style={{ width: size, height: size }}
      >
        {!imgError ? (
          <img
            src="/logo.jpg"
            alt="Safe Bharat Official Logo"
            className="w-full h-full object-cover rounded-full"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <svg 
            viewBox="0 0 100 100" 
            className="w-full h-full rounded-full"
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="50" cy="50" r="48" fill="#08281a" />
            <circle cx="50" cy="50" r="46" stroke="#128A4E" strokeWidth="2.5" />
            <path d="M 12 50 A 38 38 0 0 1 88 50" stroke="#FF9933" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
            <path d="M 88 50 A 38 38 0 0 1 12 50" stroke="#138808" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
            <circle cx="50" cy="38" r="14" stroke="#0284c7" strokeWidth="1.5" />
            <path 
              d="M 50 26 C 58 26, 62 30, 62 38 C 62 50, 50 56, 50 56 C 50 56, 38 50, 38 38 C 38 30, 42 26, 50 26 Z" 
              fill="#dc2626" 
              stroke="#ffffff" 
              strokeWidth="1.5" 
            />
            <text 
              x="50" 
              y="42" 
              textAnchor="middle" 
              fill="#ffffff" 
              fontSize="7" 
              fontWeight="900" 
              fontFamily="sans-serif"
            >
              SOS
            </text>
          </svg>
        )}
      </div>

      {showText && (
        <div className={`flex flex-col min-w-0 ${hideTextOnMobile ? 'hidden xs:flex' : 'flex'}`}>
          <div className="flex items-center gap-1.5">
            <span className="font-display font-extrabold text-white text-xs sm:text-base lg:text-lg tracking-tight leading-tight whitespace-nowrap">
              SAFE BHARAT
            </span>
            <span className="hidden sm:inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              NATIONAL
            </span>
          </div>
          <span className="hidden md:inline-block text-[10px] sm:text-[11px] font-medium text-emerald-400/90 leading-tight truncate">
            सेव भारत · Safety &amp; Resilience
          </span>
        </div>
      )}
    </div>
  );
};

