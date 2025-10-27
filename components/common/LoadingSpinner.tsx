'use client';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ 
  fullScreen = false, 
  text = 'Loading...', 
  size = 'md' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Medicine Bottle SVG Animation */}
      <div className="relative">
        <svg
          className={`${sizeClasses[size]} animate-bounce`}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Bottle Cap */}
          <rect x="35" y="10" width="30" height="8" rx="2" fill="#4F46E5" className="animate-pulse" />
          
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
          <div className={`${sizeClasses[size]} border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin`} 
               style={{ width: size === 'sm' ? '40px' : size === 'md' ? '80px' : '120px', 
                        height: size === 'sm' ? '40px' : size === 'md' ? '80px' : '120px' }} />
        </div>
      </div>

      {/* Loading Text */}
      {text && (
        <div className="text-center">
          <p className={`${size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'} font-semibold text-indigo-600 animate-pulse`}>
            {text}
          </p>
        </div>
      )}

      {/* Dots Animation */}
      <div className="flex space-x-2">
        <div className={`${dotSizeClasses[size]} bg-indigo-600 rounded-full animate-bounce`} style={{ animationDelay: '0s' }} />
        <div className={`${dotSizeClasses[size]} bg-indigo-600 rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }} />
        <div className={`${dotSizeClasses[size]} bg-indigo-600 rounded-full animate-bounce`} style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}

// Simple spinner variant
export function SimpleSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className={`${sizeClasses[size]} border-indigo-200 border-t-indigo-600 rounded-full animate-spin`} />
  );
}
