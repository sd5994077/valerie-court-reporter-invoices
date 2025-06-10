import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
  show: boolean;
}

export function Toast({ message, type = 'success', show, onClose }: ToastProps) {
  const isError = type === 'error';
  
  // Auto-hide after 5 seconds
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const bgColor = type === 'success' ? 'bg-gradient-to-r from-purple-600 to-purple-700' : 
                  type === 'error' ? 'bg-gradient-to-r from-red-600 to-red-700' : 
                  'bg-gradient-to-r from-blue-600 to-blue-700';

  return (
    <>
      {show && (
        <div className={`fixed bottom-4 left-4 z-50 transform transition-all duration-500 ease-out ${
          show ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full opacity-0 scale-95'
        }`}>
          <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-2xl max-w-md border-l-4 ${
            type === 'error' ? 'border-red-300' : type === 'success' ? 'border-purple-300' : 'border-blue-300'
          } hover:shadow-3xl hover:scale-[1.02] transition-all duration-200`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {/* Success/Error Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {isError ? (
                    <svg className="w-6 h-6 text-red-200 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-green-200 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  )}
                </div>
                
                {/* Message */}
                <div className="flex-1 text-sm font-medium">
                  {message}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className={`flex-shrink-0 ml-4 p-1 transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 rounded-full ${
                  type === 'error' 
                    ? 'text-red-200 hover:text-white hover:bg-red-800 focus:ring-red-300' 
                    : type === 'success' 
                    ? 'text-purple-200 hover:text-white hover:bg-purple-800 focus:ring-purple-300'
                    : 'text-blue-200 hover:text-white hover:bg-blue-800 focus:ring-blue-300'
                }`}
                aria-label="Close notification"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 