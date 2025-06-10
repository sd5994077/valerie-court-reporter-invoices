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

  // Professional template logo design
  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center relative`}>
      <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-700 rounded-full shadow-lg">
        {/* Generic business/document symbol */}
        <div className="text-white">
          <svg 
            className={`${size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-10 h-10'}`} 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M21 7h-4l-2-2H9L7 7H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6h1a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1zM6 9h12v8H6V9zm4-4h4l1 1H9l1-1z"/>
            <path d="M8 12h8v2H8zM8 15h5v1H8z"/>
          </svg>
        </div>
        
        {/* Test Badge */}
        <div className={`absolute -bottom-1 -right-1 bg-white rounded-full ${size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-6 h-6' : 'w-7 h-7'} flex items-center justify-center shadow-md`}>
          <span className={`font-bold text-red-600 ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-xs' : 'text-sm'}`}>
            {branding.styling.logoText}
          </span>
        </div>
      </div>
    </div>
  );
} 