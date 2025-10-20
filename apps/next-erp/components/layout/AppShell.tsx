'use client';

import { useState } from 'react';
import { TopBar } from './TopBar';
import { LeftSidebar } from './LeftSidebar';
import { RightPanel } from './RightPanel';
import { BottomBar } from './BottomBar';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [bottomBarVisible, setBottomBarVisible] = useState(true);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* TOP BAR - Always visible */}
      <TopBar
        onToggleLeftSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
        onToggleRightPanel={() => setRightPanelOpen(!rightPanelOpen)}
      />

      {/* MAIN CONTENT AREA - 3 columns (Left | Center | Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR - Collapsible */}
        <LeftSidebar
          isOpen={leftSidebarOpen}
          onClose={() => setLeftSidebarOpen(false)}
        />

        {/* CENTER CONTENT - Main workspace */}
        <main
          className={cn(
            'flex-1 overflow-auto transition-all duration-300',
            leftSidebarOpen ? 'ml-0' : 'ml-0',
            rightPanelOpen ? 'mr-0' : 'mr-0'
          )}
        >
          <div className="h-full p-6">{children}</div>
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
