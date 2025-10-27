'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-4">
        {/* Homeopathy Medicine Bottle Animation */}
        <div className="relative">
          {/* Medicine Bottle */}
          <svg
            className="w-24 h-24 animate-bounce"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Bottle Cap */}
            <rect x="35" y="10" width="30" height="8" rx="2" fill="#4F46E5" />
            
            {/* Bottle Neck */}
            <rect x="38" y="18" width="24" height="12" fill="#6366F1" />
            
            {/* Bottle Body */}
            <rect x="25" y="30" width="50" height="55" rx="4" fill="#818CF8" />
            
            {/* Label */}
            <rect x="30" y="45" width="40" height="25" rx="2" fill="white" fillOpacity="0.9" />
            
            {/* Label Text Lines */}
            <line x1="35" y1="52" x2="65" y2="52" stroke="#4F46E5" strokeWidth="2" />
            <line x1="35" y1="58" x2="60" y2="58" stroke="#4F46E5" strokeWidth="1.5" />
            <line x1="35" y1="63" x2="55" y2="63" stroke="#4F46E5" strokeWidth="1.5" />
            
            {/* Globules/Pills inside bottle */}
            <circle cx="40" cy="75" r="3" fill="white" fillOpacity="0.8" className="animate-pulse" />
            <circle cx="50" cy="78" r="3" fill="white" fillOpacity="0.8" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
            <circle cx="60" cy="75" r="3" fill="white" fillOpacity="0.8" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
          </svg>

          {/* Rotating Ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <p className="text-lg font-semibold text-indigo-600 animate-pulse">
            Loading...
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Please wait
          </p>
        </div>

        {/* Dots Animation */}
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
}
