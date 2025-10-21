'use client';

import { useState } from 'react';
import TopBar from './ERPTopBar';
import LeftSidebar from './ERPLeftSidebar';

interface SimpleLayoutProps {
  children: React.ReactNode;
}

/**
 * Simple Layout - Top Bar + Left Sidebar only
 * Clean, minimal layout for focused work
 */
export default function SimpleLayout({ children }: SimpleLayoutProps) {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* TOP BAR - Always visible */}
      <TopBar
        onToggleLeftSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
        showRightPanelToggle={false}
      />

      {/* MAIN CONTENT AREA - 2 columns (Left | Center) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR - Collapsible */}
        <LeftSidebar
          isOpen={leftSidebarOpen}
          onClose={() => setLeftSidebarOpen(false)}
        />

        {/* CENTER CONTENT - Main workspace */}
        <main className="flex-1 overflow-auto bg-white dark:bg-gray-800">
          <div className="h-full p-6 min-h-screen">{children}</div>
        </main>
      </div>
    </div>
  );
}
