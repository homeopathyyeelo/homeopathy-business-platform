'use client';

import { Wifi, Database, Activity, Clock, Zap, X } from 'lucide-react';

interface BottomBarProps {
  onClose: () => void;
}

export default function BottomBar({ onClose }: BottomBarProps) {
  return (
    <footer className="h-10 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-gray-300 text-xs flex items-center px-6 gap-6 border-t border-gray-700 shadow-2xl">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Wifi className="h-3.5 w-3.5 text-green-400" />
          <span className="text-green-400 font-medium">Online</span>
        </div>
        <div className="h-4 w-px bg-gray-700" />
        <div className="flex items-center gap-2">
          <Database className="h-3.5 w-3.5 text-blue-400" />
          <span>DB: <span className="text-blue-400">Connected</span></span>
        </div>
        <div className="h-4 w-px bg-gray-700" />
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-purple-400" />
          <span>Kafka: <span className="text-purple-400">Active</span></span>
        </div>
        <div className="h-4 w-px bg-gray-700" />
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-orange-400" />
          <span>Synced: <span className="text-orange-400">2m ago</span></span>
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-yellow-400" />
          <span><span className="text-yellow-400 font-medium">3</span> Jobs</span>
        </div>
        <div className="h-4 w-px bg-gray-700" />
        <span className="text-gray-400">HomeoERP v2.1.0</span>
        <div className="h-4 w-px bg-gray-700" />
        <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </footer>
  );
}
