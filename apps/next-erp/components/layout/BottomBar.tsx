'use client';

import { useState } from 'react';
import {
  X,
  Keyboard,
  User,
  Database,
  Wifi,
  WifiOff,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  Zap,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface BottomBarProps {
  onClose: () => void;
}

export function BottomBar({ onClose }: BottomBarProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [openTabs, setOpenTabs] = useState([
    { id: 1, label: 'Dashboard', path: '/app/dashboard' },
    { id: 2, label: 'POS Billing', path: '/app/sales/pos' },
  ]);

  const closeTab = (tabId: number) => {
    setOpenTabs(openTabs.filter((tab) => tab.id !== tabId));
  };

  return (
    <footer className="h-10 bg-gray-800 dark:bg-gray-900 text-gray-300 text-xs flex items-center px-4 gap-4 border-t border-gray-700">
      <TooltipProvider>
        {/* Left Section - System Status */}
        <div className="flex items-center gap-4">
          {/* Online Status */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 cursor-pointer">
                {isOnline ? (
                  <>
                    <Wifi className="h-3.5 w-3.5 text-green-400" />
                    <span className="text-green-400">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3.5 w-3.5 text-red-400" />
                    <span className="text-red-400">Offline</span>
                  </>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Connection Status</p>
            </TooltipContent>
          </Tooltip>

          <div className="h-4 w-px bg-gray-700" />

          {/* Database Status */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 cursor-pointer">
                <Database className="h-3.5 w-3.5 text-green-400" />
                <span>DB: Connected</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Database Connection</p>
            </TooltipContent>
          </Tooltip>

          <div className="h-4 w-px bg-gray-700" />

          {/* Kafka Status */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 cursor-pointer">
                <Activity className="h-3.5 w-3.5 text-green-400" />
                <span>Kafka: Active</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Message Broker Status</p>
            </TooltipContent>
          </Tooltip>

          <div className="h-4 w-px bg-gray-700" />

          {/* Last Sync */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 cursor-pointer">
                <Clock className="h-3.5 w-3.5" />
                <span>Synced: 2m ago</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Last Data Sync</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Center Section - Open Tabs */}
        <div className="flex-1 flex items-center gap-2 overflow-x-auto">
          {openTabs.map((tab) => (
            <div
              key={tab.id}
              className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
            >
              <FileText className="h-3 w-3" />
              <span className="max-w-[120px] truncate">{tab.label}</span>
              <button
                onClick={() => closeTab(tab.id)}
                className="hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Right Section - User & Actions */}
        <div className="flex items-center gap-4">
          {/* Pending Jobs */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 cursor-pointer">
                <Zap className="h-3.5 w-3.5 text-yellow-400" />
                <span>3 Jobs</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Background Jobs Running</p>
            </TooltipContent>
          </Tooltip>

          <div className="h-4 w-px bg-gray-700" />

          {/* Pending Approvals */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 cursor-pointer">
                <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />
                <span>2 Approvals</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Pending Approvals</p>
            </TooltipContent>
          </Tooltip>

          <div className="h-4 w-px bg-gray-700" />

          {/* Current User */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 cursor-pointer">
                <User className="h-3.5 w-3.5" />
                <span>Admin User</span>
                <Badge variant="secondary" className="h-4 text-[10px] px-1">
                  SUPER_ADMIN
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Current User & Role</p>
            </TooltipContent>
          </Tooltip>

          <div className="h-4 w-px bg-gray-700" />

          {/* Keyboard Shortcuts */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs hover:bg-gray-700"
              >
                <Keyboard className="h-3.5 w-3.5 mr-1" />
                Press ? for shortcuts
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p>Ctrl+K: Quick Search</p>
                <p>Ctrl+N: New Invoice</p>
                <p>Ctrl+P: Print</p>
                <p>?: Show all shortcuts</p>
              </div>
            </TooltipContent>
          </Tooltip>

          <div className="h-4 w-px bg-gray-700" />

          {/* Version */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-pointer">v1.0.0 • Dev</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Application Version & Environment</p>
            </TooltipContent>
          </Tooltip>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TooltipProvider>
    </footer>
  );
}
