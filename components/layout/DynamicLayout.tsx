'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { DEFAULT_LAYOUT_PREFERENCES, type LayoutPreferences } from '@/lib/layout-config';

// Import all layout components
import EcommerceMegaMenu from './EcommerceMegaMenu';
import ThreePanelLayout from './ThreePanelLayout';
import CompleteMegaMenuNew from './CompleteMegaMenuNew';
import HybridMegaThreeLayout from './HybridMegaThreeLayout';

interface DynamicLayoutProps {
  children: React.ReactNode;
}

export default function DynamicLayout({ children }: DynamicLayoutProps) {
  const [preferences, setPreferences] = useState<LayoutPreferences>(DEFAULT_LAYOUT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Load preferences from localStorage
    const saved = localStorage.getItem('layout-preferences');
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

  // Skip layout for login/home
  if (pathname === '/login' || pathname === '/') {
    return <>{children}</>;
  }

  // Show loading state briefly
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render based on selected layout
  switch (preferences.layoutType) {
    case 'ecommerce-mega':
      return <EcommerceMegaMenu>{children}</EcommerceMegaMenu>;
    
    case 'three-panel':
      return <ThreePanelLayout>{children}</ThreePanelLayout>;
    
    case 'mega-menu':
      return <CompleteMegaMenuNew>{children}</CompleteMegaMenuNew>;
    
    case 'hybrid-mega-three':
      return <HybridMegaThreeLayout>{children}</HybridMegaThreeLayout>;
    
    case 'classic-sidebar':
      return <ThreePanelLayout>{children}</ThreePanelLayout>;
    
    case 'minimal-top':
      return <CompleteMegaMenuNew>{children}</CompleteMegaMenuNew>;
    
    default:
      return <EcommerceMegaMenu>{children}</EcommerceMegaMenu>;
  }
}
