'use client';

import { useState } from 'react';
import BeautifulTopBar from './BeautifulTopBar';
import BeautifulLeftSidebar from './BeautifulLeftSidebar';
import BeautifulRightPanel from './BeautifulRightPanel';
import BeautifulBottomBar from './BeautifulBottomBar';

interface BeautifulERPLayoutProps {
  children: React.ReactNode;
}

/**
 * Beautiful ERP Layout - Modern 4-Side Design
 * Inspired by modern dashboard aesthetics
 */
export default function BeautifulERPLayout({ children }: BeautifulERPLayoutProps) {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [bottomBarVisible, setBottomBarVisible] = useState(true);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50">
      {/* TOP BAR - Peach/Orange gradient */}
      <BeautifulTopBar
        onToggleLeftSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
        onToggleRightPanel={() => setRightPanelOpen(!rightPanelOpen)}
        showRightPanelToggle={true}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR - Blue gradient */}
        <BeautifulLeftSidebar
          isOpen={leftSidebarOpen}
          onClose={() => setLeftSidebarOpen(false)}
        />

        {/* CENTER CONTENT - Clean white */}
        <main className="flex-1 overflow-auto bg-white">
          <div className="h-full p-6 min-h-screen">
            {children}
          </div>
        </main>

        {/* RIGHT PANEL - Light blue */}
        <BeautifulRightPanel
          isOpen={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
        />
      </div>

      {/* BOTTOM BAR - Dark with accents */}
      {bottomBarVisible && (
        <BeautifulBottomBar onClose={() => setBottomBarVisible(false)} />
      )}
    </div>
  );
}
