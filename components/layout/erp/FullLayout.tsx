'use client';

import { useState } from 'react';
import TopBar from './TopBar';
import LeftSidebar from './LeftSidebar';
import RightPanel from './RightPanel';
import BottomBar from './BottomBar';

interface FullLayoutProps {
  children: React.ReactNode;
}

/**
 * Full Layout - 4-Side Layout (Top + Left + Right + Bottom)
 * Enterprise-grade layout with all features
 */
export default function FullLayout({ children }: FullLayoutProps) {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [bottomBarVisible, setBottomBarVisible] = useState(true);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* TOP BAR - Always visible */}
      <TopBar
        onToggleLeftSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
        onToggleRightPanel={() => setRightPanelOpen(!rightPanelOpen)}
        showRightPanelToggle={true}
      />

      {/* MAIN CONTENT AREA - 3 columns (Left | Center | Right) */}
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

        {/* RIGHT PANEL - Contextual, collapsible */}
        <RightPanel
          isOpen={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
        />
      </div>

      {/* BOTTOM BAR - Utility & status */}
      {bottomBarVisible && (
        <BottomBar onClose={() => setBottomBarVisible(false)} />
      )}
    </div>
  );
}
