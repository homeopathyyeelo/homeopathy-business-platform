'use client';

import { useState } from 'react';
import TopBar from './TopBar';
import EnterpriseLeftSidebar from './EnterpriseLeftSidebar';
import RightPanel from './RightPanel';
import BottomBar from './BottomBar';

interface MainERPLayoutProps {
  children: React.ReactNode;
}

export default function MainERPLayout({ children }: MainERPLayoutProps) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [bottomOpen, setBottomOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50">
      <TopBar 
        onToggleLeft={() => setLeftOpen(!leftOpen)}
        onToggleRight={() => setRightOpen(!rightOpen)}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <EnterpriseLeftSidebar isOpen={leftOpen} onClose={() => setLeftOpen(false)} />
        
        <main className="flex-1 overflow-auto bg-white">
          <div className="p-6 min-h-screen">{children}</div>
        </main>
        
        <RightPanel isOpen={rightOpen} onClose={() => setRightOpen(false)} />
      </div>
      
      {bottomOpen && <BottomBar onClose={() => setBottomOpen(false)} />}
    </div>
  );
}
