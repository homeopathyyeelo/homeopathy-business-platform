'use client';

import { useState, useEffect } from 'react';
import SimpleLayout from './SimpleLayout';
import FullLayout from './FullLayout';

interface ERPLayoutProps {
  children: React.ReactNode;
}

export type LayoutMode = 'simple' | 'full';

interface LayoutPreferences {
  mode: LayoutMode;
  theme: 'light' | 'dark' | 'system';
}

const DEFAULT_PREFERENCES: LayoutPreferences = {
  mode: 'full',
  theme: 'system',
};

/**
 * ERP Layout - Main layout wrapper
 * Switches between Simple and Full layout based on user preferences
 */
export default function ERPLayout({ children }: ERPLayoutProps) {
  const [preferences, setPreferences] = useState<LayoutPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load preferences from localStorage
    const saved = localStorage.getItem('erp-layout-preferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences(parsed);
      } catch (e) {
        console.error('Failed to parse layout preferences:', e);
      }
    }
    setIsLoading(false);
  }, []);

  // Show loading state briefly
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Render based on selected layout mode
  if (preferences.mode === 'simple') {
    return <SimpleLayout>{children}</SimpleLayout>;
  }

  return <FullLayout>{children}</FullLayout>;
}

// Export helper function to update preferences
export function updateLayoutPreferences(newPreferences: Partial<LayoutPreferences>) {
  const saved = localStorage.getItem('erp-layout-preferences');
  const current = saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
  const updated = { ...current, ...newPreferences };
  localStorage.setItem('erp-layout-preferences', JSON.stringify(updated));
  
  // Trigger a page reload to apply changes
  window.location.reload();
}
