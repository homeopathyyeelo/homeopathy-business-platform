'use client';

interface HomeopathyLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function HomeopathyLoader({ size = 'md', text = 'Loading...' }: HomeopathyLoaderProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Homeopathy Globules Animation */}
      <div className="relative">
        {/* Outer rotating circle */}
        <div className={`${sizeClasses[size]} relative`}>
          {/* Center globule */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-indigo-600 rounded-full animate-pulse" />
          </div>

          {/* Orbiting globules */}
          <div className="absolute inset-0 animate-spin">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-500 rounded-full" />
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDelay: '0.2s' }}>
            <div className="absolute top-1/4 right-0 w-3 h-3 bg-indigo-400 rounded-full" />
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDelay: '0.4s' }}>
            <div className="absolute bottom-1/4 right-0 w-3 h-3 bg-indigo-300 rounded-full" />
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDelay: '0.6s' }}>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-200 rounded-full" />
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDelay: '0.8s' }}>
            <div className="absolute bottom-1/4 left-0 w-3 h-3 bg-indigo-300 rounded-full" />
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDelay: '1s' }}>
            <div className="absolute top-1/4 left-0 w-3 h-3 bg-indigo-400 rounded-full" />
          </div>
        </div>

        {/* Pulsing ring */}
        <div className={`absolute inset-0 ${sizeClasses[size]} border-2 border-indigo-200 rounded-full animate-ping`} />
      </div>

      {/* Loading text */}
      {text && (
        <p className={`${textSizeClasses[size]} font-medium text-indigo-600 animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );
}
