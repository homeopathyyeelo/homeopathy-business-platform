'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import LeftSidebar from './LeftSidebarNew';
import TopBar from './TopBarNew';
import RightSidebar from './RightSidebarNew';
import BottomBar from './BottomBarNew';
import AIChatPanel from './AIChatPanel';
import NotificationsPanel from './NotificationsPanel';
import FloatingActionButtons from './FloatingActionButtons';
import { cn } from '@/lib/utils';

interface FourSideLayoutProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
    loginTime?: Date;
  };
  currentBranch?: {
    id: string;
    name: string;
  };
  currentCompany?: {
    id: string;
    name: string;
  };
  userPermissions?: string[];
}

export default function FourSideLayout({
  children,
  user = {
    name: 'Admin User',
    email: 'admin@homeoerp.com',
    role: 'admin',
    loginTime: new Date()
  },
  currentBranch,
  currentCompany,
  userPermissions = []
}: FourSideLayoutProps) {
  const pathname = usePathname();
  
  // Layout state
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [aiMode, setAiMode] = useState<'business' | 'doctor' | 'marketing'>('business');
  
  // System status (mock - replace with real API)
  const [systemStatus, setSystemStatus] = useState({
    apiHealth: 'online' as const,
    kafkaStatus: 'connected' as const,
    lastSync: new Date(),
    backupStatus: 'success' as const
  });

  // Notification count (mock - replace with real API)
  const [notificationCount, setNotificationCount] = useState(5);

  // Close mobile sidebars on route change
  useEffect(() => {
    setLeftSidebarOpen(false);
    setRightSidebarOpen(false);
  }, [pathname]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1 - Quick POS
      if (e.key === 'F1') {
        e.preventDefault();
        window.location.href = '/sales/pos';
      }
      
      // Ctrl+K - Global Search
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        // Focus search input in TopBar
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      }
      
      // Ctrl+/ - AI Chat
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        setAiChatOpen(prev => !prev);
      }
      
      // Escape - Close all panels
      if (e.key === 'Escape') {
        setAiChatOpen(false);
        setNotificationsOpen(false);
        setLeftSidebarOpen(false);
        setRightSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-update system status
  useEffect(() => {
    const statusInterval = setInterval(() => {
      setSystemStatus(prev => ({
        ...prev,
        lastSync: new Date()
      }));
    }, 60000); // Update every minute

    return () => clearInterval(statusInterval);
  }, []);

  // Don't show layout on auth pages
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/';
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Left Sidebar */}
      <LeftSidebar
        isOpen={leftSidebarOpen}
        onClose={() => setLeftSidebarOpen(false)}
        isCollapsed={leftSidebarCollapsed}
        onToggleCollapse={() => setLeftSidebarCollapsed(prev => !prev)}
        userRole={user.role}
        userPermissions={userPermissions}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          'flex flex-col min-h-screen transition-all duration-300',
          leftSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-72',
          'lg:pr-80' // Right sidebar width
        )}
      >
        {/* Top Bar */}
        <TopBar
          onMenuClick={() => setLeftSidebarOpen(true)}
          onAIChatOpen={() => setAiChatOpen(true)}
          onNotificationsOpen={() => setNotificationsOpen(true)}
          user={user}
          currentBranch={currentBranch}
          currentCompany={currentCompany}
          notificationCount={notificationCount}
        />

        {/* Main Content */}
        <main className="flex-1 pb-8">
          {children}
        </main>

        {/* Bottom Bar */}
        <BottomBar
          systemStatus={systemStatus}
          currentUser={user}
          aiMode={aiMode}
          onAIModeChange={setAiMode}
        />
      </div>

      {/* Right Sidebar */}
      <RightSidebar
        isOpen={rightSidebarOpen}
        onClose={() => setRightSidebarOpen(false)}
      />

      {/* AI Chat Panel */}
      <AIChatPanel
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        mode={aiMode}
      />

      {/* Notifications Panel */}
      <NotificationsPanel
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onClearAll={() => setNotificationCount(0)}
      />

      {/* Floating Action Buttons */}
      <FloatingActionButtons
        onPOSClick={() => window.location.href = '/sales/pos'}
        onAIChatClick={() => setAiChatOpen(true)}
        onNewClick={() => {}}
        onAlertsClick={() => setNotificationsOpen(true)}
        onRightPanelClick={() => setRightSidebarOpen(prev => !prev)}
      />
    </div>
  );
}
