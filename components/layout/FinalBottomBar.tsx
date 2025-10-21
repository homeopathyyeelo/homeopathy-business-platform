'use client';

import { Wifi, Database, Activity, Clock, Zap, X, HardDrive, Cpu } from 'lucide-react';

interface FinalBottomBarProps {
  onClose: () => void;
}

export default function FinalBottomBar({ onClose }: FinalBottomBarProps) {
  return (
    <footer className="h-10 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-gray-300 text-xs flex items-center px-6 gap-6 border-t border-gray-700 shadow-2xl">
      {/* Left Section - System Status */}
      <div className="flex items-center gap-6">
        {/* Online Status */}
        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
          <Wifi className="h-3.5 w-3.5 text-green-400" />
          <span className="text-green-400 font-medium">Online</span>
        </div>

        <div className="h-4 w-px bg-gray-700" />

        {/* Database */}
        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
          <Database className="h-3.5 w-3.5 text-blue-400" />
          <span>DB: <span className="text-blue-400">Connected</span></span>
        </div>

        <div className="h-4 w-px bg-gray-700" />

        {/* Kafka */}
        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
          <Activity className="h-3.5 w-3.5 text-purple-400" />
          <span>Kafka: <span className="text-purple-400">Active</span></span>
        </div>

        <div className="h-4 w-px bg-gray-700" />

        {/* Last Sync */}
        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
          <Clock className="h-3.5 w-3.5 text-orange-400" />
          <span>Synced: <span className="text-orange-400">2m ago</span></span>
        </div>

        <div className="h-4 w-px bg-gray-700" />

        {/* Server Load */}
        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
          <Cpu className="h-3.5 w-3.5 text-cyan-400" />
          <span>CPU: <span className="text-cyan-400">45%</span></span>
        </div>

        <div className="h-4 w-px bg-gray-700" />

        {/* Storage */}
        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
          <HardDrive className="h-3.5 w-3.5 text-pink-400" />
          <span>Storage: <span className="text-pink-400">2.5GB / 10GB</span></span>
        </div>
      </div>

      {/* Center Section - Spacer */}
      <div className="flex-1" />

      {/* Right Section */}
      <div className="flex items-center gap-6">
        {/* Pending Jobs */}
        <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
          <Zap className="h-3.5 w-3.5 text-yellow-400" />
          <span><span className="text-yellow-400 font-medium">3</span> Jobs</span>
        </div>

        <div className="h-4 w-px bg-gray-700" />

        {/* Current User */}
        <span className="text-gray-400">Logged in as: <span className="text-white font-medium">Super Admin</span></span>

        <div className="h-4 w-px bg-gray-700" />

        {/* Version */}
        <span className="text-gray-400">HomeoERP v2.1.0</span>

        <div className="h-4 w-px bg-gray-700" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title="Hide Status Bar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </footer>
  );
}
