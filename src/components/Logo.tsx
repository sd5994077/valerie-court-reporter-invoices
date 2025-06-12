import React from 'react';
import { getBranding } from '../config/branding';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const branding = getBranding();
  
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16', 
    lg: 'w-20 h-20'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  // Professional CSR logo design
  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center relative`}>
      <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-500 to-purple-700 rounded-full shadow-lg">
        {/* Document/Court symbol */}
        <div className="text-white mb-1">
          <svg 
            className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'}`} 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
        </div>
        
        {/* Professional Text */}
        <div className="text-center">
          <div className={`font-bold text-white leading-none ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-xs' : 'text-sm'}`}>
            {branding.styling.logoText}
          </div>
        </div>
      </div>
    </div>
  );
} 