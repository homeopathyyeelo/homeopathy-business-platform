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
  Zap,
  FileText,
} from 'lucide-react';

interface BottomBarProps {
  onClose: () => void;
}

export default function BottomBar({ onClose }: BottomBarProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [openTabs] = useState([
    { id: 1, label: 'Dashboard', path: '/app/dashboard' },
    { id: 2, label: 'POS Billing', path: '/app/sales/pos' },
  ]);

  return (
    <footer className="h-10 bg-gray-800 dark:bg-gray-900 text-gray-300 text-xs flex items-center px-4 gap-4 border-t border-gray-700">
      {/* Left Section - System Status */}
      <div className="flex items-center gap-4">
        {/* Online Status */}
        <div className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
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

        <div className="h-4 w-px bg-gray-700" />

        {/* Database Status */}
        <div className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
          <Database className="h-3.5 w-3.5 text-green-400" />
          <span>DB: Connected</span>
        </div>

        <div className="h-4 w-px bg-gray-700" />

        {/* Kafka Status */}
        <div className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
          <Activity className="h-3.5 w-3.5 text-green-400" />
          <span>Kafka: Active</span>
        </div>

        <div className="h-4 w-px bg-gray-700" />

        {/* Last Sync */}
        <div className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
          <Clock className="h-3.5 w-3.5" />
          <span>Synced: 2m ago</span>
        </div>
      </div>

      {/* Center Section - Open Tabs */}
      <div className="flex-1 flex items-center gap-2 overflow-x-auto">
        {openTabs.map((tab) => (
          <div
            key={tab.id}
            className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors cursor-pointer"
          >
            <FileText className="h-3 w-3" />
            <span className="max-w-[120px] truncate">{tab.label}</span>
            <button
              className="hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                // Handle tab close
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Right Section - User & Actions */}
      <div className="flex items-center gap-4">
        {/* Pending Jobs */}
        <div className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
          <Zap className="h-3.5 w-3.5 text-yellow-400" />
          <span>3 Jobs</span>
        </div>

        <div className="h-4 w-px bg-gray-700" />

        {/* Pending Approvals */}
        <div className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
          <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />
          <span>2 Approvals</span>
        </div>

        <div className="h-4 w-px bg-gray-700" />

        {/* Current User */}
        <div className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
          <User className="h-3.5 w-3.5" />
          <span>Admin User</span>
          <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px]">
            SUPER_ADMIN
          </span>
        </div>

        <div className="h-4 w-px bg-gray-700" />

        {/* Keyboard Shortcuts */}
        <button className="flex items-center gap-1.5 hover:text-white transition-colors">
          <Keyboard className="h-3.5 w-3.5" />
          <span>Press ? for shortcuts</span>
        </button>

        <div className="h-4 w-px bg-gray-700" />

        {/* Version */}
        <span className="cursor-pointer hover:text-white transition-colors">
          v1.0.0 • Dev
        </span>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </footer>
  );
}
