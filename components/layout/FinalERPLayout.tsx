'use client';

import { useState } from 'react';
import FinalTopBar from './FinalTopBar';
import FinalLeftSidebar from './FinalLeftSidebar';
import FinalRightPanel from './FinalRightPanel';
import FinalBottomBar from './FinalBottomBar';

interface FinalERPLayoutProps {
  children: React.ReactNode;
}

/**
 * Final Complete ERP Layout - Enterprise Grade 4-Side Design
 * All menus, features, and components consolidated
 */
export default function FinalERPLayout({ children }: FinalERPLayoutProps) {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [bottomBarVisible, setBottomBarVisible] = useState(true);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50">
      {/* TOP BAR - Global Controls */}
      <FinalTopBar
        onToggleLeftSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
        onToggleRightPanel={() => setRightPanelOpen(!rightPanelOpen)}
      />

      {/* MAIN CONTENT AREA - 3 Columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR - Main Navigation */}
        <FinalLeftSidebar
          isOpen={leftSidebarOpen}
          onClose={() => setLeftSidebarOpen(false)}
        />

        {/* CENTER CONTENT - Main Workspace */}
        <main className="flex-1 overflow-auto bg-white">
          <div className="h-full p-6 min-h-screen">
            {children}
          </div>
        </main>

        {/* RIGHT PANEL - Quick Insights */}
        <FinalRightPanel
          isOpen={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
        />
      </div>

      {/* BOTTOM BAR - System Status */}
      {bottomBarVisible && (
        <FinalBottomBar onClose={() => setBottomBarVisible(false)} />
      )}
    </div>
  );
}
